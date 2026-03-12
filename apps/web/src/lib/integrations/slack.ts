import type { Id } from "../../../../convex/_generated/dataModel";

// Slack OAuth configuration
export const SLACK_CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID || "";
export const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || "";
// Redirect URI - falls back to localhost for development
export const SLACK_REDIRECT_URI =
  process.env.NEXT_PUBLIC_SLACK_REDIRECT_URI ||
  (typeof window !== "undefined" && window.location.origin
    ? `${window.location.origin}/api/slack/callback`
    : "http://localhost:3000/api/slack/callback");
export const SLACK_SCOPES = [
  "channels:read",
  "channels:write",
  "chat:write",
  "commands",
  "files:read",
  "files:write",
  "groups:read",
  "im:read",
  "im:write",
  "incoming-webhook",
  "team:read",
  "users:read",
  "users:read.email",
].join(",");

// Slack API endpoints
export const SLACK_API_BASE = "https://slack.com/api";
export const SLACK_OAUTH_URL = "https://slack.com/oauth/v2/authorize";
export const SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";

// Slack API response types
interface SlackApiResponse {
  ok: boolean
  error?: string
  [key: string]: unknown
}

interface SlackMessageResponse extends SlackApiResponse {
  channel?: string
  ts?: string
  message?: {
    text?: string
    ts?: string
  }
}

interface SlackUserInfoResponse extends SlackApiResponse {
  user?: {
    id: string
    name: string
    real_name?: string
    profile?: {
      email?: string
      display_name?: string
      image_48?: string
    }
  }
}

interface SlackChannelInfoResponse extends SlackApiResponse {
  channel?: {
    id: string
    name: string
    is_private?: boolean
    topic?: { value: string }
    purpose?: { value: string }
    num_members?: number
  }
}

interface SlackChannelListResponse extends SlackApiResponse {
  channels?: Array<{
    id: string
    name: string
    is_private?: boolean
    num_members?: number
  }>
}

interface SlackFileUploadResponse extends SlackApiResponse {
  file?: {
    id: string
    name: string
    url_private?: string
  }
}

interface SlackConversationOpenResponse extends SlackApiResponse {
  channel?: {
    id: string
  }
}

interface SlackOAuthTokenResponse extends SlackApiResponse {
  access_token?: string
  token_type?: string
  scope?: string
  team?: {
    id: string
    name: string
  }
  authed_user?: {
    id: string
    access_token?: string
  }
}

// Slack block element types
interface SlackBlockElement {
  type: string
  text?: {
    type: "plain_text" | "mrkdwn"
    text: string
    emoji?: boolean
  }
  action_id?: string
  url?: string
  style?: "primary" | "danger"
  multiline?: boolean
  [key: string]: unknown
}

// Slack message formatting
export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  thread_ts?: string;
  reply_broadcast?: boolean;
}

export interface SlackBlock {
  type: "section" | "divider" | "header" | "actions" | "context" | "input";
  text?: {
    type: "plain_text" | "mrkdwn";
    text: string;
    emoji?: boolean;
  };
  block_id?: string;
  accessory?: SlackBlockElement;
  elements?: SlackBlockElement[];
  fields?: Array<{
    type: "plain_text" | "mrkdwn";
    text: string;
  }>;
  label?: {
    type: "plain_text" | "mrkdwn";
    text: string;
  };
  element?: SlackBlockElement;
}

export interface SlackAttachment {
  fallback: string;
  color?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
  mrkdwn_in?: string[];
}

// Slack event types
export interface SlackEvent {
  type: string;
  user?: string;
  channel?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
  team?: string;
  event_ts?: string;
  [key: string]: unknown;
}

// Slack slash command
export interface SlackCommand {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

// Task shape used in Slack message builders
interface SlackTaskData {
  _id?: string;
  title: string;
  description?: string;
  priority?: string;
  timeSpent?: number;
}

// Sprint shape used in Slack message builders
interface SlackSprintData {
  name: string;
  startDate: number | string;
  endDate: number | string;
  goals?: string[];
}

// Meeting shape used in Slack message builders
interface SlackMeetingData {
  title: string;
  startTime: number | string;
  duration: number;
  location?: string;
  agenda?: string;
  meetingUrl?: string;
}

// Slack client class
export class SlackClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Send a message to Slack
   */
  async sendMessage(message: SlackMessage): Promise<SlackMessageResponse> {
    const response = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return response.json() as Promise<SlackMessageResponse>;
  }

  /**
   * Update a Slack message
   */
  async updateMessage(
    channel: string,
    ts: string,
    message: Partial<SlackMessage>,
  ): Promise<SlackMessageResponse> {
    const response = await fetch(`${SLACK_API_BASE}/chat.update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel,
        ts,
        ...message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return response.json() as Promise<SlackMessageResponse>;
  }

  /**
   * Delete a Slack message
   */
  async deleteMessage(channel: string, ts: string): Promise<SlackApiResponse> {
    const response = await fetch(`${SLACK_API_BASE}/chat.delete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel, ts }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return response.json() as Promise<SlackApiResponse>;
  }

  /**
   * Get Slack user info
   */
  async getUserInfo(userId: string): Promise<SlackUserInfoResponse> {
    const response = await fetch(
      `${SLACK_API_BASE}/users.info?user=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return response.json() as Promise<SlackUserInfoResponse>;
  }

  /**
   * Get Slack channel info
   */
  async getChannelInfo(channelId: string): Promise<SlackChannelInfoResponse> {
    const response = await fetch(
      `${SLACK_API_BASE}/conversations.info?channel=${channelId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return response.json() as Promise<SlackChannelInfoResponse>;
  }

  /**
   * List Slack channels
   */
  async listChannels(): Promise<SlackChannelListResponse> {
    const response = await fetch(
      `${SLACK_API_BASE}/conversations.list?types=public_channel,private_channel`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return response.json() as Promise<SlackChannelListResponse>;
  }

  /**
   * Create a Slack channel
   */
  async createChannel(name: string, isPrivate: boolean = false): Promise<SlackChannelInfoResponse> {
    const response = await fetch(`${SLACK_API_BASE}/conversations.create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        is_private: isPrivate,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return response.json() as Promise<SlackChannelInfoResponse>;
  }

  /**
   * Invite users to a channel
   */
  async inviteToChannel(channelId: string, userIds: string[]): Promise<SlackApiResponse> {
    const response = await fetch(`${SLACK_API_BASE}/conversations.invite`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: channelId,
        users: userIds.join(","),
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return response.json() as Promise<SlackApiResponse>;
  }

  /**
   * Upload a file to Slack
   */
  async uploadFile(
    channels: string[],
    file: File,
    title?: string,
    comment?: string,
  ): Promise<SlackFileUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("channels", channels.join(","));
    if (title) formData.append("title", title);
    if (comment) formData.append("initial_comment", comment);

    const response = await fetch(`${SLACK_API_BASE}/files.upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return response.json() as Promise<SlackFileUploadResponse>;
  }

  /**
   * Open a direct message channel
   */
  async openDM(userId: string): Promise<SlackConversationOpenResponse> {
    const response = await fetch(`${SLACK_API_BASE}/conversations.open`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        users: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return response.json() as Promise<SlackConversationOpenResponse>;
  }
}

// Message builders for common notifications
export class SlackMessageBuilder {
  /**
   * Build a task created notification
   */
  static taskCreated(
    task: SlackTaskData,
    projectName: string,
    creator: string,
  ): SlackMessage {
    return {
      channel: "#general",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "New Task Created",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Task:*\n${task.title}`,
            },
            {
              type: "mrkdwn",
              text: `*Project:*\n${projectName}`,
            },
            {
              type: "mrkdwn",
              text: `*Priority:*\n${task.priority}`,
            },
            {
              type: "mrkdwn",
              text: `*Created by:*\n${creator}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: task.description || "_No description provided_",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Task",
                emoji: true,
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL}/tasks/${task._id}`,
              action_id: "view_task",
            },
          ],
        },
      ],
    };
  }

  /**
   * Build a task completed notification
   */
  static taskCompleted(
    task: SlackTaskData,
    projectName: string,
    completedBy: string,
  ): SlackMessage {
    return {
      channel: "#general",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Task Completed",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Task:*\n${task.title}`,
            },
            {
              type: "mrkdwn",
              text: `*Project:*\n${projectName}`,
            },
            {
              type: "mrkdwn",
              text: `*Completed by:*\n${completedBy}`,
            },
            {
              type: "mrkdwn",
              text: `*Time Spent:*\n${task.timeSpent || 0}h`,
            },
          ],
        },
      ],
    };
  }

  /**
   * Build a sprint started notification
   */
  static sprintStarted(
    sprint: SlackSprintData,
    projectName: string,
    taskCount: number,
  ): SlackMessage {
    return {
      channel: "#general",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Sprint Started",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Sprint:*\n${sprint.name}`,
            },
            {
              type: "mrkdwn",
              text: `*Project:*\n${projectName}`,
            },
            {
              type: "mrkdwn",
              text: `*Duration:*\n${new Date(sprint.startDate).toLocaleDateString()} - ${new Date(sprint.endDate).toLocaleDateString()}`,
            },
            {
              type: "mrkdwn",
              text: `*Tasks:*\n${taskCount}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Goals:*\n${sprint.goals?.join("\n") || "_No goals set_"}`,
          },
        },
      ],
    };
  }

  /**
   * Build a meeting reminder notification
   */
  static meetingReminder(meeting: SlackMeetingData, attendees: string[]): SlackMessage {
    return {
      channel: "#general",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Meeting Reminder",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Meeting:*\n${meeting.title}`,
            },
            {
              type: "mrkdwn",
              text: `*Time:*\n${new Date(meeting.startTime).toLocaleString()}`,
            },
            {
              type: "mrkdwn",
              text: `*Duration:*\n${meeting.duration} minutes`,
            },
            {
              type: "mrkdwn",
              text: `*Location:*\n${meeting.location || "Online"}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Attendees:*\n${attendees.join(", ")}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Agenda:*\n${meeting.agenda || "_No agenda provided_"}`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Join Meeting",
                emoji: true,
              },
              url: meeting.meetingUrl,
              action_id: "join_meeting",
              style: "primary",
            },
          ],
        },
      ],
    };
  }

  /**
   * Build a daily standup request
   */
  static dailyStandup(userId: string): SlackMessage {
    return {
      channel: userId,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Daily Standup",
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Time for your daily standup! Please answer the following questions:",
          },
        },
        {
          type: "input",
          block_id: "yesterday_block",
          label: {
            type: "plain_text",
            text: "What did you accomplish yesterday?",
          },
          element: {
            type: "plain_text_input",
            action_id: "yesterday_input",
            multiline: true,
          },
        },
        {
          type: "input",
          block_id: "today_block",
          label: {
            type: "plain_text",
            text: "What will you work on today?",
          },
          element: {
            type: "plain_text_input",
            action_id: "today_input",
            multiline: true,
          },
        },
        {
          type: "input",
          block_id: "blockers_block",
          label: {
            type: "plain_text",
            text: "Any blockers or concerns?",
          },
          element: {
            type: "plain_text_input",
            action_id: "blockers_input",
            multiline: true,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Submit Standup",
                emoji: true,
              },
              action_id: "submit_standup",
              style: "primary",
            },
          ],
        },
      ],
    };
  }
}

// Slack OAuth helper
export function getSlackOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: SLACK_CLIENT_ID,
    scope: SLACK_SCOPES,
    redirect_uri: SLACK_REDIRECT_URI,
    state,
  });

  return `${SLACK_OAUTH_URL}?${params.toString()}`;
}

// Exchange OAuth code for access token
export async function exchangeSlackCode(code: string): Promise<SlackOAuthTokenResponse> {
  const response = await fetch(SLACK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code,
      redirect_uri: SLACK_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack OAuth error: ${response.statusText}`);
  }

  return response.json() as Promise<SlackOAuthTokenResponse>;
}