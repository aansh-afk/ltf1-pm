// Linear GraphQL response types — only the fields we use during import.
// See https://developers.linear.app/docs/graphql/working-with-the-graphql-api

export type LinearViewer = {
  id: string;
  name: string;
  email: string;
};

export type LinearTeam = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  issueCount: number;
};

export type LinearState = {
  id: string;
  name: string;
  type: string;
};

export type LinearCycle = {
  id: string;
  number: number;
  name: string | null;
  startsAt: string;
  endsAt: string;
  completedAt: string | null;
};

export type LinearLabel = {
  id: string;
  name: string;
};

export type LinearIssue = {
  id: string;
  identifier: string;
  number: number;
  title: string;
  description: string | null;
  url: string;
  priority: number;
  estimate: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  dueDate: string | null;
  startedAt: string | null;
  state: LinearState;
  labels: { nodes: Array<LinearLabel> };
  cycle: { id: string } | null;
  parent: { id: string } | null;
};

export type LinearPageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};
