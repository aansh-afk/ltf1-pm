import { action } from "../../_generated/server"
import { v } from "convex/values"
import { api } from "../../_generated/api"

const GITLAB_API_URL = "https://gitlab.com/api/v4"

export const syncProjectData = action({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.object({
    success: v.boolean(),
    projectName: v.string(),
    issueCount: v.number(),
    mergeRequestCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get GitLab integration
    const integration: any = await ctx.runQuery(api.integrations.gitlab.queries.getGitLabIntegration, {})
    if (!integration || integration.isExpired) {
      throw new Error("GitLab integration not found or expired")
    }
    
    // Get project connection
    const connection: any = await ctx.runQuery(api.integrations.gitlab.queries.getProjectGitLabConnection, {
      projectId: args.projectId,
    })
    
    if (!connection) {
      throw new Error("Project not connected to GitLab")
    }
    
    // Fetch project details
    const projectResponse: any = await fetch(
      `${GITLAB_API_URL}/projects/${connection.gitlabProjectId}`,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      }
    )
    
    if (!projectResponse.ok) {
      throw new Error("Failed to fetch GitLab project")
    }
    
    const projectData: any = await projectResponse.json()
    
    // Fetch issues
    const issuesResponse = await fetch(
      `${GITLAB_API_URL}/projects/${connection.gitlabProjectId}/issues?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      }
    )
    
    if (issuesResponse.ok) {
      const issues = await issuesResponse.json()
      
      // Sync issues to tasks
      await ctx.runMutation(api.integrations.gitlab.mutations.syncGitLabIssues, {
        projectId: args.projectId,
        issues: issues.map((issue: any) => ({
          id: issue.id,
          iid: issue.iid,
          title: issue.title,
          description: issue.description,
          state: issue.state,
          labels: issue.labels,
          assignees: issue.assignees || [],
          author: issue.author,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          due_date: issue.due_date,
          web_url: issue.web_url,
        })),
      })
    }
    
    // Fetch merge requests
    const mergeRequestsResponse = await fetch(
      `${GITLAB_API_URL}/projects/${connection.gitlabProjectId}/merge_requests?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      }
    )
    
    if (mergeRequestsResponse.ok) {
      const mergeRequests = await mergeRequestsResponse.json()
      
      // Sync merge requests
      await ctx.runMutation(api.integrations.gitlab.mutations.syncGitLabMergeRequests, {
        projectId: args.projectId,
        mergeRequests: mergeRequests.map((mr: any) => ({
          id: mr.id,
          iid: mr.iid,
          title: mr.title,
          description: mr.description,
          state: mr.state,
          source_branch: mr.source_branch,
          target_branch: mr.target_branch,
          author: mr.author,
          assignees: mr.assignees || [],
          labels: mr.labels,
          created_at: mr.created_at,
          updated_at: mr.updated_at,
          merged_at: mr.merged_at,
          closed_at: mr.closed_at,
          web_url: mr.web_url,
        })),
      })
    }
    
    return {
      success: true,
      projectName: projectData.name,
      issueCount: issuesResponse.ok ? (await issuesResponse.json()).length : 0,
      mergeRequestCount: mergeRequestsResponse.ok ? (await mergeRequestsResponse.json()).length : 0,
    }
  },
})

export const fetchGitLabProjects = action({
  args: {},
  returns: v.array(v.object({
    id: v.number(),
    name: v.string(),
    nameWithNamespace: v.string(),
    path: v.string(),
    pathWithNamespace: v.string(),
    description: v.union(v.string(), v.null()),
    defaultBranch: v.string(),
    visibility: v.string(),
    webUrl: v.string(),
    httpUrlToRepo: v.string(),
    sshUrlToRepo: v.string(),
    createdAt: v.string(),
    lastActivityAt: v.string(),
    starCount: v.number(),
    forksCount: v.number(),
    openIssuesCount: v.number(),
    archived: v.boolean(),
  })),
  handler: async (ctx) => {
    // Get GitLab integration
    const integration: any = await ctx.runQuery(api.integrations.gitlab.queries.getGitLabIntegration, {})
    if (!integration || integration.isExpired) {
      throw new Error("GitLab integration not found or expired")
    }
    
    // Fetch user's projects from GitLab
    const response: any = await fetch(
      `${GITLAB_API_URL}/projects?membership=true&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      }
    )
    
    if (!response.ok) {
      throw new Error("Failed to fetch GitLab projects")
    }
    
    const projects: any = await response.json()
    
    return projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      nameWithNamespace: project.name_with_namespace,
      path: project.path,
      pathWithNamespace: project.path_with_namespace,
      description: project.description,
      defaultBranch: project.default_branch,
      visibility: project.visibility,
      webUrl: project.web_url,
      httpUrlToRepo: project.http_url_to_repo,
      sshUrlToRepo: project.ssh_url_to_repo,
      createdAt: project.created_at,
      lastActivityAt: project.last_activity_at,
      starCount: project.star_count,
      forksCount: project.forks_count,
      openIssuesCount: project.open_issues_count,
      archived: project.archived,
    }))
  },
})

export const createGitLabIssue = action({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    assigneeIds: v.optional(v.array(v.number())),
    dueDate: v.optional(v.string()),
  },
  returns: v.object({
    id: v.number(),
    iid: v.number(),
    title: v.string(),
    webUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get GitLab integration
    const integration: any = await ctx.runQuery(api.integrations.gitlab.queries.getGitLabIntegration, {})
    if (!integration || integration.isExpired) {
      throw new Error("GitLab integration not found or expired")
    }
    
    // Get project connection
    const connection: any = await ctx.runQuery(api.integrations.gitlab.queries.getProjectGitLabConnection, {
      projectId: args.projectId,
    })
    
    if (!connection) {
      throw new Error("Project not connected to GitLab")
    }
    
    // Create issue in GitLab
    const body: any = {
      title: args.title,
      description: args.description,
    }
    
    if (args.labels && args.labels.length > 0) {
      body.labels = args.labels.join(",")
    }
    
    if (args.assigneeIds && args.assigneeIds.length > 0) {
      body.assignee_ids = args.assigneeIds
    }
    
    if (args.dueDate) {
      body.due_date = args.dueDate
    }
    
    const response: any = await fetch(
      `${GITLAB_API_URL}/projects/${connection.gitlabProjectId}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create GitLab issue: ${error}`)
    }
    
    const issue: any = await response.json()
    
    return {
      id: issue.id,
      iid: issue.iid,
      title: issue.title,
      webUrl: issue.web_url,
    }
  },
})

export const createGitLabMergeRequest = action({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    sourceBranch: v.string(),
    targetBranch: v.string(),
    assigneeId: v.optional(v.number()),
    labels: v.optional(v.array(v.string())),
  },
  returns: v.object({
    id: v.number(),
    iid: v.number(),
    title: v.string(),
    webUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get GitLab integration
    const integration: any = await ctx.runQuery(api.integrations.gitlab.queries.getGitLabIntegration, {})
    if (!integration || integration.isExpired) {
      throw new Error("GitLab integration not found or expired")
    }
    
    // Get project connection
    const connection: any = await ctx.runQuery(api.integrations.gitlab.queries.getProjectGitLabConnection, {
      projectId: args.projectId,
    })
    
    if (!connection) {
      throw new Error("Project not connected to GitLab")
    }
    
    // Create merge request in GitLab
    const body: any = {
      title: args.title,
      description: args.description,
      source_branch: args.sourceBranch,
      target_branch: args.targetBranch,
    }
    
    if (args.assigneeId) {
      body.assignee_id = args.assigneeId
    }
    
    if (args.labels && args.labels.length > 0) {
      body.labels = args.labels.join(",")
    }
    
    const response: any = await fetch(
      `${GITLAB_API_URL}/projects/${connection.gitlabProjectId}/merge_requests`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create GitLab merge request: ${error}`)
    }
    
    const mergeRequest: any = await response.json()
    
    return {
      id: mergeRequest.id,
      iid: mergeRequest.iid,
      title: mergeRequest.title,
      webUrl: mergeRequest.web_url,
    }
  },
})