// Jira Cloud REST v3 response shapes — only the fields we use during import.
// See https://developer.atlassian.com/cloud/jira/platform/rest/v3/

export type JiraMyself = {
  accountId: string;
  displayName: string;
  emailAddress?: string;
};

export type JiraProject = {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  description?: string;
};

export type JiraStatusCategory = {
  // key is one of: "new" | "indeterminate" | "done" | "undefined"
  key: string;
  name: string;
};

export type JiraStatus = {
  id: string;
  name: string;
  statusCategory: JiraStatusCategory;
};

export type JiraPriority = {
  id: string;
  name: string;
};

export type JiraIssueType = {
  id: string;
  name: string;
  subtask: boolean;
};

export type JiraSprint = {
  id: number;
  name: string;
  state: string; // "active" | "closed" | "future"
  startDate?: string;
  endDate?: string;
  goal?: string;
};

export type JiraIssueFields = {
  summary: string;
  description?: unknown; // ADF document — we serialize to plain text only.
  status: JiraStatus;
  priority?: JiraPriority;
  issuetype: JiraIssueType;
  labels: Array<string>;
  duedate?: string;
  created: string;
  updated: string;
  resolutiondate?: string;
  customfield_10016?: number; // story points (default field id)
  customfield_10020?: Array<JiraSprint> | JiraSprint; // sprint (default field id)
};

export type JiraIssue = {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
};

export type JiraSearchResult = {
  issues: Array<JiraIssue>;
  total: number;
  startAt: number;
  maxResults: number;
};
