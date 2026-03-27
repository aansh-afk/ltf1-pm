import React, { useState, useEffect, useReducer } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  HiOutlineChat,
  HiOutlineBell,
  HiOutlineLink,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineHashtag,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineCog,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineDocumentText,
  HiOutlinePaperClip,
  HiOutlineUserGroup,
  HiOutlineVolumeUp,
  HiOutlineOfficeBuilding,
  HiOutlineLightningBolt,
  HiOutlineInformationCircle,
  HiOutlineTerminal
} from 'react-icons/hi'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'
import BrutalSelect from '@/components/ui/BrutalSelect'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface SlackIntegrationProps {
  workspaceId: Id<'workspaces'>
}

interface SlackChannel {
  _id: Id<'slackChannels'>
  channelId: string
  channelName: string
  channelType: 'project' | 'general' | 'alerts'
  projectId?: Id<'projects'>
  syncEvents: string[]
  active: boolean
}

interface NotificationSettings {
  taskCreated: boolean
  taskCompleted: boolean
  taskAssigned: boolean
  sprintStarted: boolean
  sprintCompleted: boolean
  meetingReminder: boolean
  dailyStandup: boolean
}

const SYNC_EVENTS = [
  { id: 'task_created', label: 'TASK_CREATED', icon: <HiOutlinePlus /> },
  { id: 'task_completed', label: 'TASK_COMPLETED', icon: <HiOutlineCheckCircle /> },
  { id: 'task_assigned', label: 'TASK_ASSIGNED', icon: <HiOutlineUsers /> },
  { id: 'comment_added', label: 'COMMENT_ADDED', icon: <HiOutlineChat /> },
  { id: 'sprint_started', label: 'SPRINT_STARTED', icon: <HiOutlineLightningBolt /> },
  { id: 'sprint_completed', label: 'SPRINT_COMPLETED', icon: <HiOutlineCheckCircle /> },
  { id: 'meeting_scheduled', label: 'MEETING_SCHEDULED', icon: <HiOutlineCalendar /> },
  { id: 'file_uploaded', label: 'FILE_UPLOADED', icon: <HiOutlinePaperClip /> },
]

type SlackIntegrationState = {
  activeTab: 'overview' | 'channels' | 'notifications' | 'standup' | 'settings'
  showAddChannel: boolean
  selectedChannel: SlackChannel | null
  notificationSettings: NotificationSettings
  standupSettings: {
    enabled: boolean
    time: string
    channel: string
    remindAt: string
    questions: string[]
  }
  newChannel: {
    channelId: string
    channelName: string
    channelType: 'general' | 'project' | 'alerts'
    projectId: Id<'projects'> | undefined
    syncEvents: string[]
  }
}

const slackInitialState: SlackIntegrationState = {
  activeTab: 'overview',
  showAddChannel: false,
  selectedChannel: null,
  notificationSettings: {
    taskCreated: true,
    taskCompleted: true,
    taskAssigned: true,
    sprintStarted: true,
    sprintCompleted: false,
    meetingReminder: true,
    dailyStandup: true,
  },
  standupSettings: {
    enabled: false,
    time: '09:00',
    channel: '',
    remindAt: '08:45',
    questions: [
      'What did you work on yesterday?',
      'What are you working on today?',
      'Any blockers?'
    ]
  },
  newChannel: {
    channelId: '',
    channelName: '',
    channelType: 'general',
    projectId: undefined,
    syncEvents: [],
  },
}

type SlackIntegrationAction =
  | { type: 'UPDATE'; field: keyof SlackIntegrationState; value: unknown }
  | { type: 'RESET_NEW_CHANNEL' }

function slackIntegrationReducer(state: SlackIntegrationState, action: SlackIntegrationAction): SlackIntegrationState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'RESET_NEW_CHANNEL':
      return { ...state, newChannel: slackInitialState.newChannel }
    default:
      return state
  }
}

// --- Sub-components ---

interface SlackOverviewTabProps {
  slackChannels: SlackChannel[] | undefined
  standups: any[] | undefined
  onSendTestMessage: () => void
  onSyncUsers: () => void
  onAddChannel: () => void
}

function SlackOverviewTab({ slackChannels, standups, onSendTestMessage, onSyncUsers, onAddChannel }: SlackOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CONNECTED_CHANNELS', value: slackChannels?.filter(c => c.active).length || 0 },
          { label: 'ACTIVE_PROJECTS', value: slackChannels?.filter(c => c.projectId && c.active).length || 0 },
          { label: 'STANDUPS_TODAY', value: standups?.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length || 0 },
          { label: 'PACKETS_SENT', value: '0' }
        ].map((stat) => (
          <BrutalCard key={stat.label} className="p-4">
            <p className="text-[var(--theme-foreground)]/60 text-[10px] uppercase mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </BrutalCard>
        ))}
      </div>

      <BrutalCard className="p-6">
        <h3 className="text-lg font-bold uppercase mb-4 flex items-center gap-2">
          <HiOutlineLightningBolt className="w-5 h-5 text-brutal-warning" />
          QUICK_ACTIONS
        </h3>
        <div className="flex flex-wrap gap-3">
          <BrutalButton variant="secondary" onClick={onSendTestMessage} className="flex items-center gap-2">
            <HiOutlineVolumeUp className="w-4 h-4" />
            PING_TEST
          </BrutalButton>
          <BrutalButton variant="secondary" onClick={onSyncUsers} className="flex items-center gap-2">
            <HiOutlineRefresh className="w-4 h-4" />
            SYNC_USERS
          </BrutalButton>
          <BrutalButton variant="primary" onClick={onAddChannel} className="flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" />
            ADD_CHANNEL
          </BrutalButton>
        </div>
      </BrutalCard>

      <BrutalCard className="p-6">
        <h3 className="text-lg font-bold uppercase mb-4">RECENT_STANDUPS_LOG</h3>
        <div className="space-y-2">
          {standups?.slice(0, 5).map(standup => (
            <div key={standup._id} className="p-3 border border-[var(--theme-border)] bg-[var(--theme-background-secondary)] font-mono text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[var(--theme-primary)]">@{standup.user?.name}</span>
                <span className="text-[var(--theme-foreground)]/40">
                  {new Date(standup.date).toLocaleDateString()}
                </span>
              </div>
              {standup.blockers && (
                <div className="flex items-center gap-2 text-brutal-error mt-1">
                  <HiOutlineExclamationCircle className="w-3 h-3" />
                  <span>BLOCKER_DETECTED</span>
                </div>
              )}
            </div>
          ))}
          {(!standups || standups.length === 0) && (
            <div className="text-[var(--theme-foreground)]/40 text-xs uppercase italic">NO_DATA_FOUND</div>
          )}
        </div>
      </BrutalCard>
    </div>
  )
}

interface SlackChannelsTabProps {
  slackChannels: SlackChannel[] | undefined
  projects: any[] | undefined
  onAddChannel: () => void
  onEditChannel: (channel: SlackChannel) => void
  onDisconnectChannel: (channelId: string) => void
}

function SlackChannelsTab({ slackChannels, projects, onAddChannel, onEditChannel, onDisconnectChannel }: SlackChannelsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold uppercase">CHANNEL_MATRIX</h3>
        <BrutalButton variant="primary" onClick={onAddChannel} className="flex items-center gap-2">
          <HiOutlinePlus className="w-4 h-4" />
          ADD_CHANNEL
        </BrutalButton>
      </div>

      <div className="space-y-3">
        {slackChannels?.map(channel => (
          <BrutalCard
            key={channel._id}
            className={clsx(
              "p-4 transition-all hover:border-[var(--theme-primary)]",
              !channel.active && "opacity-60 border-dashed"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
                  <HiOutlineHashtag className="w-5 h-5 text-[var(--theme-foreground)]/60" />
                </div>
                <div>
                  <p className="font-bold uppercase text-sm">{channel.channelName}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <BrutalBadge variant="outline" className={clsx(
                      "text-[10px]",
                      channel.channelType === 'project' ? 'text-brutal-info border-brutal-info' :
                        channel.channelType === 'alerts' ? 'text-brutal-error border-brutal-error' :
                          'text-[var(--theme-foreground)]/60 border-[var(--theme-foreground)]/60'
                    )}>
                      {channel.channelType.toUpperCase()}
                    </BrutalBadge>
                    {channel.projectId && (
                      <span className="text-[10px] text-[var(--theme-foreground)]/60 uppercase">
                        PROJ: {projects?.find(p => p._id === channel.projectId)?.name}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--theme-foreground)]/60 uppercase">
                      SYNC: {channel.syncEvents.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <BrutalButton size="sm" variant="secondary" onClick={() => onEditChannel(channel)}>
                  <HiOutlineCog className="w-4 h-4" />
                </BrutalButton>
                <BrutalButton size="sm" variant="destructive" onClick={() => onDisconnectChannel(channel.channelId)}>
                  <HiOutlineTrash className="w-4 h-4" />
                </BrutalButton>
              </div>
            </div>
          </BrutalCard>
        ))}
      </div>
    </div>
  )
}

interface SlackNotificationsTabProps {
  notificationSettings: NotificationSettings
  onSettingsChange: (settings: NotificationSettings) => void
  onSave: () => void
}

function SlackNotificationsTab({ notificationSettings, onSettingsChange, onSave }: SlackNotificationsTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold uppercase mb-4">ALERT_PROTOCOLS</h3>

      <BrutalCard className="p-6">
        <div className="space-y-4">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <label key={key} className="flex items-center justify-between p-3 border border-[var(--theme-border)] hover:bg-[var(--theme-background-secondary)] cursor-pointer transition-colors">
              <span className="uppercase text-sm font-bold">
                {key.replace(/([A-Z])/g, '_$1').toUpperCase()}
              </span>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onSettingsChange({ ...notificationSettings, [key]: e.target.checked })}
                className="w-5 h-5 border-2 border-[var(--theme-foreground)] bg-transparent checked:bg-[var(--theme-primary)]"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <BrutalButton variant="primary" onClick={onSave}>
            SAVE_PROTOCOLS
          </BrutalButton>
        </div>
      </BrutalCard>
    </div>
  )
}

interface SlackStandupConfigTabProps {
  standupSettings: SlackIntegrationState['standupSettings']
  onSettingsChange: (settings: SlackIntegrationState['standupSettings']) => void
  slackChannels: SlackChannel[] | undefined
  onSave: () => void
}

function SlackStandupConfigTab({ standupSettings, onSettingsChange, slackChannels, onSave }: SlackStandupConfigTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold uppercase mb-4">STANDUP_BOT_CONFIG</h3>

      <BrutalCard className="p-6">
        <div className="space-y-6">
          <label className="flex items-center justify-between p-4 border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
            <span className="font-bold uppercase">ENABLE_DAILY_STANDUP</span>
            <input
              type="checkbox"
              checked={standupSettings.enabled}
              onChange={(e) => onSettingsChange({ ...standupSettings, enabled: e.target.checked })}
              className="w-6 h-6 border-2 border-[var(--theme-foreground)] bg-transparent checked:bg-[var(--theme-primary)]"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="standup-time" className="text-xs font-bold uppercase mb-2 block text-[var(--theme-foreground)]/60">Standup Time</label>
              <input
                id="standup-time"
                type="time"
                value={standupSettings.time}
                onChange={(e) => onSettingsChange({ ...standupSettings, time: e.target.value })}
                className="w-full p-3 bg-[var(--theme-background)] text-[var(--theme-foreground)] border-2 border-[var(--theme-border)] font-mono focus:border-[var(--theme-primary)] outline-none"
              />
            </div>

            <div>
              <label htmlFor="standup-reminder-time" className="text-xs font-bold uppercase mb-2 block text-[var(--theme-foreground)]/60">Reminder Time</label>
              <input
                id="standup-reminder-time"
                type="time"
                value={standupSettings.remindAt}
                onChange={(e) => onSettingsChange({ ...standupSettings, remindAt: e.target.value })}
                className="w-full p-3 bg-[var(--theme-background)] text-[var(--theme-foreground)] border-2 border-[var(--theme-border)] font-mono focus:border-[var(--theme-primary)] outline-none"
              />
            </div>
          </div>

          <div>
            <BrutalSelect
              id="standup-target-channel"
              label="Target Channel"
              value={standupSettings.channel}
              onChange={(v) => onSettingsChange({ ...standupSettings, channel: v })}
              placeholder="SELECT_CHANNEL"
              options={slackChannels?.map(channel => ({
                value: channel.channelId,
                label: `#${channel.channelName}`,
              })) || []}
              fullWidth
            />
          </div>

          <div>
            <span className="text-xs font-bold uppercase mb-2 block text-[var(--theme-foreground)]/60">Questions Protocol</span>
            <div className="space-y-3">
              {standupSettings.questions.map((q, index) => (
                <div key={`question-${q || 'empty'}`} className="flex items-center gap-3">
                  <span className="text-[var(--theme-foreground)]/40 font-bold">0{index + 1}</span>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => {
                      const newQuestions = [...standupSettings.questions]
                      newQuestions[index] = e.target.value
                      onSettingsChange({ ...standupSettings, questions: newQuestions })
                    }}
                    aria-label={`Standup question ${index + 1}`}
                    className="flex-1 p-2 bg-[var(--theme-background)] text-[var(--theme-foreground)] border-b-2 border-[var(--theme-border)] font-mono focus:border-[var(--theme-primary)] outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <BrutalButton variant="primary" onClick={onSave}>
            UPDATE_CONFIG
          </BrutalButton>
        </div>
      </BrutalCard>
    </div>
  )
}

interface SlackAddChannelModalProps {
  newChannel: SlackIntegrationState['newChannel']
  onNewChannelChange: (channel: SlackIntegrationState['newChannel']) => void
  projects: any[] | undefined
  onAdd: () => void
  onClose: () => void
}

function SlackAddChannelModal({ newChannel, onNewChannelChange, projects, onAdd, onClose }: SlackAddChannelModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <BrutalCard className="w-full max-w-md p-6 border-2 border-[var(--theme-primary)] shadow-brutal-lg">
        <h3 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5 text-[var(--theme-primary)]" />
          ADD_CHANNEL
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="new-channel-id" className="text-xs font-bold uppercase mb-1 block">Channel ID</label>
            <input
              id="new-channel-id"
              type="text"
              value={newChannel.channelId}
              onChange={(e) => onNewChannelChange({ ...newChannel, channelId: e.target.value })}
              className="w-full p-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
              placeholder="C1234567890"
            />
          </div>

          <div>
            <label htmlFor="new-channel-name" className="text-xs font-bold uppercase mb-1 block">Channel Name</label>
            <input
              id="new-channel-name"
              type="text"
              value={newChannel.channelName}
              onChange={(e) => onNewChannelChange({ ...newChannel, channelName: e.target.value })}
              className="w-full p-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
              placeholder="general"
            />
          </div>

          <div>
            <BrutalSelect
              id="new-channel-type"
              label="Channel Type"
              value={newChannel.channelType}
              onChange={(v) => onNewChannelChange({ ...newChannel, channelType: v as 'general' | 'project' | 'alerts' })}
              options={[
                { value: 'general', label: 'GENERAL' },
                { value: 'project', label: 'PROJECT' },
                { value: 'alerts', label: 'ALERTS' },
              ]}
              fullWidth
            />
          </div>

          {newChannel.channelType === 'project' && (
            <div>
              <BrutalSelect
                id="new-channel-project"
                label="Project Link"
                value={newChannel.projectId || ''}
                onChange={(v) => onNewChannelChange({ ...newChannel, projectId: v as Id<'projects'> })}
                placeholder="SELECT_PROJECT"
                options={projects?.map(project => ({
                  value: project._id,
                  label: project.name,
                })) || []}
                fullWidth
              />
            </div>
          )}

          <div>
            <span className="text-xs font-bold uppercase mb-2 block">Sync Protocols</span>
            <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-[var(--theme-border)] p-2 bg-[var(--theme-background-secondary)]">
              {SYNC_EVENTS.map(event => (
                <label key={event.id} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--theme-background)] p-1">
                  <input
                    type="checkbox"
                    checked={newChannel.syncEvents.includes(event.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onNewChannelChange({ ...newChannel, syncEvents: [...newChannel.syncEvents, event.id] })
                      } else {
                        onNewChannelChange({ ...newChannel, syncEvents: newChannel.syncEvents.filter((id: string) => id !== event.id) })
                      }
                    }}
                    className="w-4 h-4 border-2 border-[var(--theme-foreground)] bg-transparent checked:bg-[var(--theme-primary)]"
                  />
                  <span className="text-[10px] uppercase font-bold">{event.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <BrutalButton
            variant="primary"
            onClick={onAdd}
            disabled={!newChannel.channelId || !newChannel.channelName}
            className="flex-1"
          >
            CONFIRM
          </BrutalButton>
          <BrutalButton variant="secondary" onClick={onClose} className="flex-1">
            CANCEL
          </BrutalButton>
        </div>
      </BrutalCard>
    </div>
  )
}

interface SlackSettingsTabProps {
  slackIntegration: {
    teamName: string
    teamId: string
    botUserId: string
    createdAt: number
    scopes: string[]
  }
}

function SlackSettingsTab({ slackIntegration }: SlackSettingsTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold uppercase mb-4">SYSTEM_INFO</h3>

      <BrutalCard className="p-6 mb-4">
        <h4 className="text-sm font-bold uppercase mb-4 border-b-2 border-[var(--theme-border)] pb-2">Workspace Data</h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--theme-foreground)]/60">TEAM_NAME</span>
            <span className="font-bold">{slackIntegration.teamName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--theme-foreground)]/60">TEAM_ID</span>
            <span className="font-mono">{slackIntegration.teamId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--theme-foreground)]/60">BOT_ID</span>
            <span className="font-mono">{slackIntegration.botUserId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--theme-foreground)]/60">ESTABLISHED</span>
            <span>
              {new Date(slackIntegration.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </BrutalCard>

      <BrutalCard className="p-6">
        <h4 className="text-sm font-bold uppercase mb-4 border-b-2 border-[var(--theme-border)] pb-2">Scope Permissions</h4>
        <div className="flex flex-wrap gap-2">
          {slackIntegration.scopes.map(scope => (
            <span
              key={scope}
              className="px-2 py-1 bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-[10px] font-mono uppercase"
            >
              {scope}
            </span>
          ))}
        </div>
      </BrutalCard>
    </div>
  )
}

interface SlackEditChannelModalProps {
  selectedChannel: SlackChannel
  onSyncEventToggle: (eventId: string, checked: boolean) => void
  onSave: () => void
  onClose: () => void
}

function SlackEditChannelModal({ selectedChannel, onSyncEventToggle, onSave, onClose }: SlackEditChannelModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <BrutalCard className="w-full max-w-md p-6 border-2 border-[var(--theme-primary)] shadow-brutal-lg">
        <h3 className="text-xl font-bold uppercase mb-6">
          EDIT_CHANNEL: #{selectedChannel.channelName}
        </h3>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase mb-2 block">Sync Protocols</span>
            <div className="space-y-2 max-h-64 overflow-y-auto border-2 border-[var(--theme-border)] p-2 bg-[var(--theme-background-secondary)]">
              {SYNC_EVENTS.map(event => (
                <label key={event.id} className="flex items-center gap-2 cursor-pointer hover:bg-[var(--theme-background)] p-1">
                  <input
                    type="checkbox"
                    checked={selectedChannel.syncEvents.includes(event.id)}
                    onChange={(e) => onSyncEventToggle(event.id, e.target.checked)}
                    className="w-4 h-4 border-2 border-[var(--theme-foreground)] bg-transparent checked:bg-[var(--theme-primary)]"
                  />
                  <span className="text-[10px] uppercase font-bold">{event.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <BrutalButton
            variant="primary"
            onClick={onSave}
            className="flex-1"
          >
            UPDATE
          </BrutalButton>
          <BrutalButton
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            CANCEL
          </BrutalButton>
        </div>
      </BrutalCard>
    </div>
  )
}

// --- Main Component ---

export default function SlackIntegration({ workspaceId }: SlackIntegrationProps) {
  const [state, dispatch] = useReducer(slackIntegrationReducer, slackInitialState)
  const { activeTab, showAddChannel, selectedChannel, notificationSettings, standupSettings, newChannel } = state

  // Queries
  const slackIntegration = useQuery(api.integrations.slack.queries.getSlackIntegration, { workspaceId })
  const slackChannels = useQuery(api.integrations.slack.queries.getSlackChannels, { workspaceId })
  const projects = useQuery(api.projects.queries.getWorkspaceProjects, { workspaceId })
  const standups = useQuery(api.integrations.slack.queries.getRecentStandups, {
    workspaceId,
    limit: 10
  })

  // Mutations
  const connectChannel = useMutation(api.integrations.slack.mutations.connectChannel)
  const disconnectChannel = useMutation(api.integrations.slack.mutations.disconnectChannel)
  const disconnectSlack = useMutation(api.integrations.slack.mutations.disconnectSlack)
  const updateChannelSettings = useMutation(api.integrations.slack.mutations.updateChannelSettings)
  const updateSlackIntegrationSettings = useMutation(api.integrations.slack.mutations.updateSlackIntegrationSettings)
  const sendTestMessage = useAction(api.integrations.slack.actions.sendTestMessage)
  const syncSlackUsers = useAction(api.integrations.slack.actions.syncSlackUsers)

  // OAuth flow
  const handleConnectSlack = () => {
    const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/slack/callback`
    const scope = 'channels:read,channels:write,chat:write,commands,files:read,files:write,groups:read,groups:write,im:read,im:write,incoming-webhook,team:read,users:read,users:read.email'

    const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${workspaceId}`
    window.location.href = authUrl
  }

  // Handle add channel
  const handleAddChannel = async () => {
    if (!newChannel.channelId || !newChannel.channelName) return

    await connectChannel({
      workspaceId,
      channelId: newChannel.channelId,
      channelName: newChannel.channelName,
      channelType: newChannel.channelType,
      projectId: newChannel.projectId,
      syncEvents: newChannel.syncEvents,
    })

    dispatch({ type: 'UPDATE', field: 'showAddChannel', value: false })
    dispatch({ type: 'RESET_NEW_CHANNEL' })
    toast.success('CHANNEL_CONNECTED')
  }

  // Handle disconnect channel
  const handleDisconnectChannel = async (channelId: string) => {
    if (confirm('DISCONNECT CHANNEL?')) {
      await disconnectChannel({ workspaceId, channelId })
      toast.success('CHANNEL_DISCONNECTED')
    }
  }

  // Handle disconnect Slack
  const handleDisconnectSlack = async () => {
    if (confirm('TERMINATE SLACK CONNECTION? ALL CHANNELS WILL BE LOST.')) {
      await disconnectSlack({ workspaceId })
      toast.success('CONNECTION_TERMINATED')
    }
  }

  // Handle update channel settings
  const handleUpdateChannelSettings = async (channel: SlackChannel) => {
    await updateChannelSettings({
      workspaceId,
      channelId: channel.channelId,
      syncEvents: channel.syncEvents,
      active: channel.active,
    })
    dispatch({ type: 'UPDATE', field: 'selectedChannel', value: null })
    toast.success('SETTINGS_UPDATED')
  }

  // Handle save notification settings
  const handleSaveNotificationSettings = async () => {
    await updateSlackIntegrationSettings({
      workspaceId,
      settings: {
        notifications: notificationSettings,
      }
    })
    toast.success('NOTIFICATIONS_UPDATED')
  }

  // Handle save standup settings
  const handleSaveStandupSettings = async () => {
    await updateSlackIntegrationSettings({
      workspaceId,
      settings: {
        standupTime: standupSettings.time,
        standupChannel: standupSettings.channel,
        dailyStandup: standupSettings.enabled,
      }
    })
    toast.success('STANDUP_CONFIG_SAVED')
  }

  // Handle test message
  const handleSendTestMessage = async () => {
    if (!slackIntegration?.incomingWebhookChannel) return

    await sendTestMessage({
      workspaceId,
      channel: slackIntegration.incomingWebhookChannel,
      message: 'SYSTEM TEST: CONNECTION ESTABLISHED.'
    })
    toast.success('TEST_PACKET_SENT')
  }

  // Handle sync users
  const handleSyncUsers = async () => {
    await syncSlackUsers({ workspaceId })
    toast.success('USER_DB_SYNCED')
  }

  const isConnected = slackIntegration?.active === true

  return (
    <div className="max-w-6xl mx-auto font-mono">
      {/* Header */}
      <BrutalCard className="mb-6 p-6 border-l-4 border-l-[#36C5F0]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#36C5F0]/10 border-2 border-[#36C5F0] text-[#36C5F0]">
              <HiOutlineTerminal className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-wider">Slack Terminal</h2>
              <div className="text-xs uppercase mt-1 flex items-center gap-2">
                <span className="text-[var(--theme-foreground)]/60">STATUS:</span>
                {isConnected ? (
                  <span className="text-brutal-success font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-brutal-success animate-pulse"></span>
                    ONLINE :: {slackIntegration.teamName}
                  </span>
                ) : (
                  <span className="text-[var(--theme-foreground)]/40 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-[var(--theme-foreground)]/40"></span>
                    OFFLINE
                  </span>
                )}
              </div>
            </div>
          </div>

          {isConnected ? (
            <BrutalButton
              variant="destructive"
              onClick={handleDisconnectSlack}
              className="flex items-center gap-2"
            >
              <HiOutlineTrash className="w-4 h-4" />
              TERMINATE
            </BrutalButton>
          ) : (
            <BrutalButton
              variant="primary"
              onClick={handleConnectSlack}
              className="flex items-center gap-2 bg-[#36C5F0] border-[#36C5F0] text-black hover:bg-[#36C5F0]/80"
            >
              <HiOutlineLink className="w-4 h-4" />
              INITIALIZE CONNECTION
            </BrutalButton>
          )}
        </div>

        {/* Tabs */}
        {isConnected && (
          <div className="flex flex-wrap gap-2 border-t-2 border-[var(--theme-border)] pt-4">
            {[
              { id: 'overview', label: 'SYS_OVERVIEW', icon: <HiOutlineInformationCircle /> },
              { id: 'channels', label: 'CHANNELS', icon: <HiOutlineHashtag /> },
              { id: 'notifications', label: 'ALERTS', icon: <HiOutlineBell /> },
              { id: 'standup', label: 'STANDUP_BOT', icon: <HiOutlineCalendar /> },
              { id: 'settings', label: 'CONFIG', icon: <HiOutlineCog /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => dispatch({ type: 'UPDATE', field: 'activeTab', value: tab.id })}
                className={clsx(
                  "px-4 py-2 border-2 flex items-center gap-2 text-xs font-bold uppercase transition-all",
                  activeTab === tab.id
                    ? "bg-[var(--theme-foreground)] text-[var(--theme-background)] border-[var(--theme-foreground)]"
                    : "bg-transparent border-[var(--theme-border)] hover:border-[var(--theme-foreground)] text-[var(--theme-foreground)]"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </BrutalCard>

      {/* Content */}
      {isConnected ? (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <SlackOverviewTab
              slackChannels={slackChannels}
              standups={standups}
              onSendTestMessage={handleSendTestMessage}
              onSyncUsers={handleSyncUsers}
              onAddChannel={() => dispatch({ type: 'UPDATE', field: 'showAddChannel', value: true })}
            />
          )}

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <SlackChannelsTab
              slackChannels={slackChannels}
              projects={projects}
              onAddChannel={() => dispatch({ type: 'UPDATE', field: 'showAddChannel', value: true })}
              onEditChannel={(channel) => dispatch({ type: 'UPDATE', field: 'selectedChannel', value: channel })}
              onDisconnectChannel={handleDisconnectChannel}
            />
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <SlackNotificationsTab
              notificationSettings={notificationSettings}
              onSettingsChange={(settings) => dispatch({ type: 'UPDATE', field: 'notificationSettings', value: settings })}
              onSave={handleSaveNotificationSettings}
            />
          )}

          {/* Standup Tab */}
          {activeTab === 'standup' && (
            <SlackStandupConfigTab
              standupSettings={standupSettings}
              onSettingsChange={(settings) => dispatch({ type: 'UPDATE', field: 'standupSettings', value: settings })}
              slackChannels={slackChannels}
              onSave={handleSaveStandupSettings}
            />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <SlackSettingsTab slackIntegration={slackIntegration} />
          )}
        </>
      ) : (
        <BrutalCard className="text-center py-16 border-dashed">
          <div className="w-20 h-20 bg-[var(--theme-background-secondary)] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[var(--theme-border)]">
            <HiOutlineChat className="w-10 h-10 text-[var(--theme-foreground)]/40" />
          </div>
          <h3 className="text-2xl font-bold uppercase mb-2">Connection Required</h3>
          <p className="text-[var(--theme-foreground)]/60 mb-8 max-w-md mx-auto font-mono text-sm">
            Initialize Slack integration to enable real-time packet transmission, task syncing, and automated standup protocols.
          </p>
          <BrutalButton
            variant="primary"
            onClick={handleConnectSlack}
            className="flex items-center gap-2 mx-auto bg-[#36C5F0] border-[#36C5F0] text-black hover:bg-[#36C5F0]/80"
          >
            <HiOutlineLink className="w-4 h-4" />
            INITIALIZE_CONNECTION
          </BrutalButton>
        </BrutalCard>
      )}

      {/* Add Channel Modal */}
      {showAddChannel && (
        <SlackAddChannelModal
          newChannel={newChannel}
          onNewChannelChange={(channel) => dispatch({ type: 'UPDATE', field: 'newChannel', value: channel })}
          projects={projects}
          onAdd={handleAddChannel}
          onClose={() => dispatch({ type: 'UPDATE', field: 'showAddChannel', value: false })}
        />
      )}

      {/* Edit Channel Modal */}
      {selectedChannel && (
        <SlackEditChannelModal
          selectedChannel={selectedChannel}
          onSyncEventToggle={(eventId, checked) => {
            if (checked) {
              dispatch({ type: 'UPDATE', field: 'selectedChannel', value: { ...selectedChannel, syncEvents: [...selectedChannel.syncEvents, eventId] } })
            } else {
              dispatch({ type: 'UPDATE', field: 'selectedChannel', value: { ...selectedChannel, syncEvents: selectedChannel.syncEvents.filter((id: string) => id !== eventId) } })
            }
          }}
          onSave={() => handleUpdateChannelSettings(selectedChannel)}
          onClose={() => dispatch({ type: 'UPDATE', field: 'selectedChannel', value: null })}
        />
      )}
    </div>
  )
}