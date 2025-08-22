export interface GitLabUser {
  id: number
  username: string
  name: string
  email: string
  avatar_url: string
  web_url: string
  state: string
  created_at: string
}

export interface GitLabProject {
  id: number
  name: string
  name_with_namespace: string
  path: string
  path_with_namespace: string
  description: string | null
  default_branch: string
  visibility: 'private' | 'internal' | 'public'
  web_url: string
  http_url_to_repo: string
  ssh_url_to_repo: string
  created_at: string
  last_activity_at: string
  star_count: number
  forks_count: number
  open_issues_count: number
  archived: boolean
  owner?: GitLabUser
  namespace: {
    id: number
    name: string
    path: string
    kind: string
    full_path: string
  }
}

export interface GitLabIssue {
  id: number
  iid: number
  project_id: number
  title: string
  description: string | null
  state: 'opened' | 'closed'
  created_at: string
  updated_at: string
  closed_at: string | null
  closed_by: GitLabUser | null
  labels: string[]
  milestone: GitLabMilestone | null
  assignees: GitLabUser[]
  author: GitLabUser
  type: 'issue' | 'incident' | 'test_case' | 'requirement'
  assignee: GitLabUser | null
  user_notes_count: number
  merge_requests_count: number
  upvotes: number
  downvotes: number
  due_date: string | null
  confidential: boolean
  discussion_locked: boolean | null
  issue_type: string
  web_url: string
  time_stats: {
    time_estimate: number
    total_time_spent: number
    human_time_estimate: string | null
    human_total_time_spent: string | null
  }
  task_completion_status: {
    count: number
    completed_count: number
  }
  weight: number | null
  has_tasks: boolean
}

export interface GitLabMergeRequest {
  id: number
  iid: number
  project_id: number
  title: string
  description: string | null
  state: 'opened' | 'closed' | 'locked' | 'merged'
  created_at: string
  updated_at: string
  merged_by: GitLabUser | null
  merged_at: string | null
  closed_by: GitLabUser | null
  closed_at: string | null
  target_branch: string
  source_branch: string
  user_notes_count: number
  upvotes: number
  downvotes: number
  author: GitLabUser
  assignees: GitLabUser[]
  assignee: GitLabUser | null
  reviewers: GitLabUser[]
  source_project_id: number
  target_project_id: number
  labels: string[]
  draft: boolean
  work_in_progress: boolean
  milestone: GitLabMilestone | null
  merge_when_pipeline_succeeds: boolean
  merge_status: string
  sha: string
  merge_commit_sha: string | null
  squash_commit_sha: string | null
  discussion_locked: boolean | null
  should_remove_source_branch: boolean | null
  force_remove_source_branch: boolean
  reference: string
  references: {
    short: string
    relative: string
    full: string
  }
  web_url: string
  time_stats: {
    time_estimate: number
    total_time_spent: number
    human_time_estimate: string | null
    human_total_time_spent: string | null
  }
  squash: boolean
  task_completion_status: {
    count: number
    completed_count: number
  }
  has_conflicts: boolean
  blocking_discussions_resolved: boolean
  approvals_before_merge: number | null
}

export interface GitLabMilestone {
  id: number
  iid: number
  project_id: number
  title: string
  description: string
  state: 'active' | 'closed'
  created_at: string
  updated_at: string
  due_date: string | null
  start_date: string | null
  expired: boolean
  web_url: string
}

export interface GitLabCommit {
  id: string
  short_id: string
  created_at: string
  parent_ids: string[]
  title: string
  message: string
  author_name: string
  author_email: string
  authored_date: string
  committer_name: string
  committer_email: string
  committed_date: string
  web_url: string
}

export interface GitLabPipeline {
  id: number
  iid: number
  project_id: number
  sha: string
  ref: string
  status: 'created' | 'waiting_for_resource' | 'preparing' | 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual' | 'scheduled'
  source: string
  created_at: string
  updated_at: string
  started_at: string | null
  finished_at: string | null
  web_url: string
  before_sha: string
  tag: boolean
  yaml_errors: string | null
  user: GitLabUser
  duration: number | null
  queued_duration: number | null
  coverage: string | null
  detailed_status: {
    icon: string
    text: string
    label: string
    group: string
    tooltip: string
    has_details: boolean
    details_path: string
    illustration: string | null
    favicon: string
  }
}

export interface GitLabWebhookEvent {
  object_kind: 'push' | 'issue' | 'merge_request' | 'wiki_page' | 'pipeline' | 'job' | 'deployment' | 'release'
  event_name: string
  before?: string
  after?: string
  ref?: string
  checkout_sha?: string
  user_id?: number
  user_name?: string
  user_username?: string
  user_email?: string
  user_avatar?: string
  project_id: number
  project: {
    id: number
    name: string
    description: string
    web_url: string
    avatar_url: string | null
    git_ssh_url: string
    git_http_url: string
    namespace: string
    visibility_level: number
    path_with_namespace: string
    default_branch: string
    homepage: string
    url: string
    ssh_url: string
    http_url: string
  }
  repository?: {
    name: string
    url: string
    description: string
    homepage: string
    git_http_url: string
    git_ssh_url: string
    visibility_level: number
  }
  commits?: GitLabCommit[]
  total_commits_count?: number
}

export interface GitLabAccessToken {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  created_at: number
  scope?: string
}