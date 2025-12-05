import { v } from "convex/values";
import { action } from "../../_generated/server";
import { api, internal } from "../../_generated/api";

export const handleOAuthCallback = action({
  args: {
    code: v.string(),
    state: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    githubUsername: v.string(),
    returnUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the OAuth state from database
    const oauthStates: Array<any> = await ctx.runQuery(api.integrations.github.oauth.getOAuthState, { 
      state: args.state 
    });
    
    if (!oauthStates || oauthStates.length === 0) {
      throw new Error("Invalid OAuth state");
    }
    
    const oauthState = oauthStates[0];
    
    if (oauthState.expiresAt < Date.now()) {
      throw new Error("OAuth state expired");
    }

    // Exchange code for access token
    const clientId = process.env.VITE_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error("GitHub OAuth credentials not configured");
    }

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: args.code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || "OAuth error");
    }

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch GitHub user");
    }

    const githubUser = await userResponse.json();
    
    // Get user's emails
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    
    let primaryEmail = githubUser.email;
    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      const primary = emails.find((e: any) => e.primary);
      if (primary) {
        primaryEmail = primary.email;
      }
    }

    // Store the connection in database
    const result = await ctx.runMutation(api.integrations.github.oauth.storeGitHubConnection, {
      state: args.state,
      githubId: githubUser.id,
      githubUsername: githubUser.login,
      githubEmail: primaryEmail,
      accessToken: tokenData.access_token,
      scope: tokenData.scope,
      tokenType: tokenData.token_type,
      githubProfile: {
        name: githubUser.name,
        bio: githubUser.bio,
        company: githubUser.company,
        location: githubUser.location,
        blog: githubUser.blog,
        twitter_username: githubUser.twitter_username,
        public_repos: githubUser.public_repos,
        public_gists: githubUser.public_gists,
        followers: githubUser.followers,
        following: githubUser.following,
        created_at: githubUser.created_at,
        avatar_url: githubUser.avatar_url,
        html_url: githubUser.html_url,
      }
    });

    return {
      success: true,
      githubUsername: githubUser.login,
      returnUrl: oauthState.returnUrl || "/profile",
    };
  },
});

export const fetchGitHubRepositories = action({
  args: {},
  returns: v.array(v.object({
    id: v.number(),
    name: v.string(),
    fullName: v.string(),
    description: v.union(v.string(), v.null()),
    private: v.boolean(),
    htmlUrl: v.string(),
    language: v.union(v.string(), v.null()),
    stargazersCount: v.number(),
    forksCount: v.number(),
    openIssuesCount: v.number(),
    updatedAt: v.string(),
    defaultBranch: v.string(),
  })),
  handler: async (ctx) => {
    // Get the current user's GitHub connection
    const connection: any = await ctx.runQuery(api.integrations.github.oauth.getGitHubConnection);
    
    if (!connection || !connection.accessToken) {
      throw new Error("No GitHub connection found");
    }

    // Fetch repositories from GitHub
    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const repos = await response.json();
    
    return repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      htmlUrl: repo.html_url,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      openIssuesCount: repo.open_issues_count,
      updatedAt: repo.updated_at,
      defaultBranch: repo.default_branch,
    }));
  },
});

export const fetchGitHubActivity = action({
  args: {
    username: v.string(),
  },
  returns: v.array(v.object({
    id: v.string(),
    type: v.string(),
    repo: v.string(),
    createdAt: v.string(),
    payload: v.any(),
  })),
  handler: async (ctx, args) => {
    // Get the current user's GitHub connection
    const connection: any = await ctx.runQuery(api.integrations.github.oauth.getGitHubConnection);

    const headers: any = {
      Accept: "application/vnd.github.v3+json",
    };

    if (connection?.accessToken) {
      headers.Authorization = `Bearer ${connection.accessToken}`;
    }

    // Fetch recent events
    const response = await fetch(`https://api.github.com/users/${args.username}/events/public?per_page=30`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch activity");
    }

    const events = await response.json();

    return events.map((event: any) => ({
      id: event.id,
      type: event.type,
      repo: event.repo.name,
      createdAt: event.created_at,
      payload: event.payload,
    }));
  },
});

// Repository type for available repositories
const repositoryValidator = v.object({
  id: v.number(),
  name: v.string(),
  fullName: v.string(),
  description: v.union(v.string(), v.null()),
  private: v.boolean(),
  htmlUrl: v.string(),
  language: v.union(v.string(), v.null()),
  stargazersCount: v.number(),
  forksCount: v.number(),
  openIssuesCount: v.number(),
  updatedAt: v.string(),
  defaultBranch: v.string(),
  source: v.union(v.literal("oauth"), v.literal("installation")),
  installationId: v.optional(v.number()),
});

// Fetch all available repositories from both user OAuth and workspace installations
export const fetchAvailableRepositories = action({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
  },
  returns: v.object({
    repositories: v.array(repositoryValidator),
    sources: v.object({
      hasOAuth: v.boolean(),
      hasInstallation: v.boolean(),
      installationName: v.optional(v.string()),
    }),
  }),
  handler: async (ctx, args) => {
    const repositories: Array<{
      id: number;
      name: string;
      fullName: string;
      description: string | null;
      private: boolean;
      htmlUrl: string;
      language: string | null;
      stargazersCount: number;
      forksCount: number;
      openIssuesCount: number;
      updatedAt: string;
      defaultBranch: string;
      source: "oauth" | "installation";
      installationId?: number;
    }> = [];
    const seenRepos = new Set<string>();
    let hasOAuth = false;
    let hasInstallation = false;
    let installationName: string | undefined;

    // 1. Try to fetch from user's OAuth connection (personal repos)
    try {
      const connection: any = await ctx.runQuery(api.integrations.github.oauth.getGitHubConnection);

      if (connection?.accessToken) {
        hasOAuth = true;

        // Fetch user's repos from GitHub
        const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member", {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (response.ok) {
          const repos = await response.json();

          for (const repo of repos) {
            if (!seenRepos.has(repo.full_name)) {
              seenRepos.add(repo.full_name);
              repositories.push({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                private: repo.private,
                htmlUrl: repo.html_url,
                language: repo.language,
                stargazersCount: repo.stargazers_count,
                forksCount: repo.forks_count,
                openIssuesCount: repo.open_issues_count,
                updatedAt: repo.updated_at,
                defaultBranch: repo.default_branch,
                source: "oauth" as const,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch OAuth repos:", error);
    }

    // 2. Try to fetch from workspace's GitHub App installation
    if (args.workspaceId) {
      try {
        // Get workspace installation
        const installations: any = await ctx.runQuery(api.integrations.github.queries.getWorkspaceInstallations, {
          workspaceId: args.workspaceId,
        });

        if (installations && installations.length > 0) {
          const installation = installations[0];
          hasInstallation = true;
          installationName = installation.accountLogin;

          // Generate installation access token
          const appId = process.env.GITHUB_APP_ID;
          const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

          if (appId && privateKey) {
            // Generate JWT for app authentication
            const now = Math.floor(Date.now() / 1000);

            // Use the internal action for proper JWT generation (Node.js runtime required for crypto)
            const tokenResult: any = await ctx.runAction(internal.integrations.github.nodeActions.generateInstallationToken, {
              appId,
              privateKey,
              installationId: installation.installationId,
            });

            if (tokenResult?.token) {
              // Fetch installation repos from GitHub
              const response = await fetch("https://api.github.com/installation/repositories?per_page=100", {
                headers: {
                  Authorization: `Bearer ${tokenResult.token}`,
                  Accept: "application/vnd.github.v3+json",
                },
              });

              if (response.ok) {
                const data = await response.json();
                const repos = data.repositories || [];

                for (const repo of repos) {
                  if (!seenRepos.has(repo.full_name)) {
                    seenRepos.add(repo.full_name);
                    repositories.push({
                      id: repo.id,
                      name: repo.name,
                      fullName: repo.full_name,
                      description: repo.description,
                      private: repo.private,
                      htmlUrl: repo.html_url,
                      language: repo.language,
                      stargazersCount: repo.stargazers_count,
                      forksCount: repo.forks_count,
                      openIssuesCount: repo.open_issues_count,
                      updatedAt: repo.updated_at,
                      defaultBranch: repo.default_branch,
                      source: "installation" as const,
                      installationId: installation.installationId,
                    });
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch installation repos:", error);
      }
    }

    // Sort by most recently updated
    repositories.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return {
      repositories,
      sources: {
        hasOAuth,
        hasInstallation,
        installationName,
      },
    };
  },
});

// Manual repository sync action - callable from UI
export const syncRepositories = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    syncedInstallations: v.number(),
  }),
  handler: async (ctx) => {
    // Get user's identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        message: "Not authenticated",
        syncedInstallations: 0,
      };
    }

    // Get all active installations to sync
    const installations: Array<{
      installationId: number;
      accountName: string;
      repositorySelection: string;
    }> = await ctx.runQuery(internal.integrations.github.sync.getInstallationsToSync, {});

    if (installations.length === 0) {
      return {
        success: false,
        message: "No GitHub installations found. Install the GitHub App first.",
        syncedInstallations: 0,
      };
    }

    let syncedCount = 0;
    const errors: Array<string> = [];

    // Sync each installation
    for (const installation of installations) {
      try {
        await ctx.runAction(internal.integrations.github.syncActions.syncInstallationRepositories, {
          installationId: installation.installationId,
        });
        syncedCount++;
        console.log(`[Manual Sync] Synced installation ${installation.accountName}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push(`${installation.accountName}: ${errorMessage}`);
        console.error(`[Manual Sync] Error syncing ${installation.accountName}:`, error);
      }
    }

    if (syncedCount === 0) {
      return {
        success: false,
        message: `Failed to sync: ${errors.join(", ")}`,
        syncedInstallations: 0,
      };
    }

    return {
      success: true,
      message: syncedCount === installations.length
        ? `Successfully synced ${syncedCount} installation(s)`
        : `Synced ${syncedCount}/${installations.length} installations. Errors: ${errors.join(", ")}`,
      syncedInstallations: syncedCount,
    };
  },
});