import { v } from "convex/values";
import { action, internalMutation, query } from "../../_generated/server";
import { api, internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

// Get cached repo docs for a project
export const getRepoDocs = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.array(
    v.object({
      _id: v.id("repoDocs"),
      _creationTime: v.number(),
      projectId: v.id("projects"),
      path: v.string(),
      name: v.string(),
      content: v.string(),
      sha: v.string(),
      size: v.number(),
      lastFetchedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const docs = await ctx.db
      .query("repoDocs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return docs;
  },
});

// Store/update fetched docs (internal - called from action)
export const upsertRepoDocs = internalMutation({
  args: {
    projectId: v.id("projects"),
    docs: v.array(
      v.object({
        path: v.string(),
        name: v.string(),
        content: v.string(),
        sha: v.string(),
        size: v.number(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const doc of args.docs) {
      // Check if doc already exists for this project + path
      const existing = await ctx.db
        .query("repoDocs")
        .withIndex("by_project_and_path", (q) =>
          q.eq("projectId", args.projectId).eq("path", doc.path)
        )
        .first();

      if (existing) {
        // Only update if SHA changed (content actually changed)
        if (existing.sha !== doc.sha) {
          await ctx.db.patch(existing._id, {
            content: doc.content,
            sha: doc.sha,
            size: doc.size,
            name: doc.name,
            lastFetchedAt: now,
          });
        } else {
          // Just update fetch timestamp
          await ctx.db.patch(existing._id, { lastFetchedAt: now });
        }
      } else {
        await ctx.db.insert("repoDocs", {
          projectId: args.projectId,
          path: doc.path,
          name: doc.name,
          content: doc.content,
          sha: doc.sha,
          size: doc.size,
          lastFetchedAt: now,
        });
      }
    }

    return null;
  },
});

// Remove docs that no longer exist in the repo
export const removeStaleRepoDocs = internalMutation({
  args: {
    projectId: v.id("projects"),
    currentPaths: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const allDocs = await ctx.db
      .query("repoDocs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const currentPathSet = new Set(args.currentPaths);
    for (const doc of allDocs) {
      if (!currentPathSet.has(doc.path)) {
        await ctx.db.delete(doc._id);
      }
    }

    return null;
  },
});

// Fetch markdown files from a GitHub repo and store them
export const fetchRepoDocs = action({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    docsCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, message: "Not authenticated", docsCount: 0 };
    }

    // Get the project to find the connected repo
    const project: any = await ctx.runQuery(api.projects.queries.getProject, {
      projectId: args.projectId,
    });

    if (!project?.repository) {
      return {
        success: false,
        message: "No repository connected to this project",
        docsCount: 0,
      };
    }

    const { owner, name: repoName, defaultBranch } = project.repository;

    // Get user's GitHub connection for auth
    const connection: any = await ctx.runQuery(
      api.integrations.github.oauth.getGitHubConnection
    );

    if (!connection?.accessToken) {
      return {
        success: false,
        message: "No GitHub connection found. Please connect GitHub first.",
        docsCount: 0,
      };
    }

    const headers = {
      Authorization: `Bearer ${connection.accessToken}`,
      Accept: "application/vnd.github.v3+json",
    };

    const fetchedDocs: Array<{
      path: string;
      name: string;
      content: string;
      sha: string;
      size: number;
    }> = [];

    // Helper: fetch contents of a directory
    async function fetchDirectory(dirPath: string) {
      const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${dirPath}?ref=${defaultBranch}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        // 404 means directory doesn't exist - that's fine
        if (response.status === 404) return;
        console.error(`GitHub API error for ${dirPath}: ${response.status}`);
        return;
      }

      const items = await response.json();
      if (!Array.isArray(items)) return;

      for (const item of items) {
        if (
          item.type === "file" &&
          (item.name.endsWith(".md") || item.name.endsWith(".mdx"))
        ) {
          // Fetch file content
          const fileUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${item.path}?ref=${defaultBranch}`;
          const fileResponse = await fetch(fileUrl, { headers });

          if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            if (fileData.content && fileData.encoding === "base64") {
              const content = atob(fileData.content.replace(/\n/g, ""));
              fetchedDocs.push({
                path: item.path,
                name: item.name,
                content,
                sha: fileData.sha,
                size: fileData.size,
              });
            }
          }
        } else if (item.type === "dir") {
          // Recurse into subdirectories (max 1 level deep within docs)
          await fetchDirectory(item.path);
        }
      }
    }

    try {
      // 1. Fetch root-level markdown files (README, CONTRIBUTING, etc.)
      const rootUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/?ref=${defaultBranch}`;
      const rootResponse = await fetch(rootUrl, { headers });

      if (rootResponse.ok) {
        const rootItems = await rootResponse.json();
        if (Array.isArray(rootItems)) {
          for (const item of rootItems) {
            if (
              item.type === "file" &&
              (item.name.endsWith(".md") || item.name.endsWith(".mdx"))
            ) {
              const fileUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${item.path}?ref=${defaultBranch}`;
              const fileResponse = await fetch(fileUrl, { headers });

              if (fileResponse.ok) {
                const fileData = await fileResponse.json();
                if (fileData.content && fileData.encoding === "base64") {
                  const content = atob(fileData.content.replace(/\n/g, ""));
                  fetchedDocs.push({
                    path: item.path,
                    name: item.name,
                    content,
                    sha: fileData.sha,
                    size: fileData.size,
                  });
                }
              }
            }
          }
        }
      }

      // 2. Fetch /docs folder recursively
      await fetchDirectory("docs");

      // 3. Also check /documentation folder (some repos use this)
      await fetchDirectory("documentation");

      if (fetchedDocs.length === 0) {
        return {
          success: true,
          message: "No markdown files found in the repository",
          docsCount: 0,
        };
      }

      // Store docs in batches (Convex mutation size limit)
      const BATCH_SIZE = 20;
      for (let i = 0; i < fetchedDocs.length; i += BATCH_SIZE) {
        const batch = fetchedDocs.slice(i, i + BATCH_SIZE);
        await ctx.runMutation(
          internal.integrations.github.docs.upsertRepoDocs,
          {
            projectId: args.projectId,
            docs: batch,
          }
        );
      }

      // Remove docs that no longer exist
      const currentPaths = fetchedDocs.map((d) => d.path);
      await ctx.runMutation(
        internal.integrations.github.docs.removeStaleRepoDocs,
        {
          projectId: args.projectId,
          currentPaths,
        }
      );

      return {
        success: true,
        message: `Fetched ${fetchedDocs.length} markdown file(s) from repository`,
        docsCount: fetchedDocs.length,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to fetch docs: ${message}`,
        docsCount: 0,
      };
    }
  },
});
