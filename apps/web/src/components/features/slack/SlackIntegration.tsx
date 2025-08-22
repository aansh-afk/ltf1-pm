import React, { useState, useEffect } from 'react'
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
  HiOutlineInformationCircle
} from 'react-icons/hi'

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
  { id: 'task_created', label: 'Task Created', icon: <HiOutlinePlus /> },
  { id: 'task_completed', label: 'Task Completed', icon: <HiOutlineCheckCircle /> },
  { id: 'task_assigned', label: 'Task Assigned', icon: <HiOutlineUsers /> },
  { id: 'comment_added', label: 'Comment Added', icon: <HiOutlineChat /> },
  { id: 'sprint_started', label: 'Sprint Started', icon: <HiOutlineLightningBolt /> },
  { id: 'sprint_completed', label: 'Sprint Completed', icon: <HiOutlineCheckCircle /> },
  { id: 'meeting_scheduled', label: 'Meeting Scheduled', icon: <HiOutlineCalendar /> },
  { id: 'file_uploaded', label: 'File Uploaded', icon: <HiOutlinePaperClip /> },
]

export default function SlackIntegration({ workspaceId }: SlackIntegrationProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'notifications' | 'standup' | 'settings'>('overview')
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<SlackChannel | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    taskCreated: true,
    taskCompleted: true,
    taskAssigned: true,
    sprintStarted: true,
    sprintCompleted: false,
    meetingReminder: true,
    dailyStandup: true,
  })
  const [standupSettings, setStandupSettings] = useState({
    enabled: false,
    time: '09:00',
    channel: '',
    remindAt: '08:45',
    questions: [
      'What did you work on yesterday?',
      'What are you working on today?',
      'Any blockers?'
    ]
  })
  const [newChannel, setNewChannel] = useState({
    channelId: '',
    channelName: '',
    channelType: 'general' as const,
    projectId: undefined as Id<'projects'> | undefined,
    syncEvents: [] as string[],
  })

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

    setShowAddChannel(false)
    setNewChannel({
      channelId: '',
      channelName: '',
      channelType: 'general',
      projectId: undefined,
      syncEvents: [],
    })
  }

  // Handle disconnect channel
  const handleDisconnectChannel = async (channelId: string) => {
    if (confirm('Are you sure you want to disconnect this channel?')) {
      await disconnectChannel({ workspaceId, channelId })
    }
  }

  // Handle disconnect Slack
  const handleDisconnectSlack = async () => {
    if (confirm('Are you sure you want to disconnect Slack integration? All channels will be disconnected.')) {
      await disconnectSlack({ workspaceId })
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
    setSelectedChannel(null)
  }

  // Handle save notification settings
  const handleSaveNotificationSettings = async () => {
    await updateSlackIntegrationSettings({
      workspaceId,
      settings: {
        notifications: notificationSettings,
      }
    })
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
  }

  // Handle test message
  const handleSendTestMessage = async () => {
    if (!slackIntegration?.incomingWebhookChannel) return
    
    await sendTestMessage({
      workspaceId,
      channel: slackIntegration.incomingWebhookChannel,
      message: 'Test message from LTF1 workspace!'
    })
  }

  // Handle sync users
  const handleSyncUsers = async () => {
    await syncSlackUsers({ workspaceId })
  }

  const isConnected = slackIntegration?.active === true

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 border-2 border-purple-500 rounded">
              <HiOutlineChat className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold">Slack Integration</h2>
              <p className="text-gray-400">
                {isConnected ? (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Connected to {slackIntegration.teamName}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                    Not connected
                  </span>
                )}
              </p>
            </div>
          </div>

          {isConnected ? (
            <button
              onClick={handleDisconnectSlack}
              className="px-4 py-2 bg-red-500/20 text-red-500 font-bold border-2 border-red-500 hover:bg-red-500/30"
            >
              <HiOutlineTrash className="inline mr-2" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnectSlack}
              className="px-4 py-2 bg-purple-500 text-white font-bold border-2 border-white hover:bg-purple-600"
            >
              <HiOutlineLink className="inline mr-2" />
              Connect to Slack
            </button>
          )}
        </div>

        {/* Tabs */}
        {isConnected && (
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: 'Overview', icon: <HiOutlineInformationCircle /> },
              { id: 'channels', label: 'Channels', icon: <HiOutlineHashtag /> },
              { id: 'notifications', label: 'Notifications', icon: <HiOutlineBell /> },
              { id: 'standup', label: 'Standups', icon: <HiOutlineCalendar /> },
              { id: 'settings', label: 'Settings', icon: <HiOutlineCog /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 border-2 ${activeTab === tab.id ? 'border-cyan-400 bg-cyan-400/20' : 'border-white'} hover:bg-white/10 flex items-center space-x-2`}
              >
                {tab.icon}
                <span className="text-white font-mono">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isConnected ? (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-black border-2 border-white">
                  <p className="text-gray-400 text-sm">Connected Channels</p>
                  <p className="text-white text-2xl font-bold">{slackChannels?.filter(c => c.active).length || 0}</p>
                </div>
                <div className="p-4 bg-black border-2 border-white">
                  <p className="text-gray-400 text-sm">Active Projects</p>
                  <p className="text-white text-2xl font-bold">
                    {slackChannels?.filter(c => c.projectId && c.active).length || 0}
                  </p>
                </div>
                <div className="p-4 bg-black border-2 border-white">
                  <p className="text-gray-400 text-sm">Today's Standups</p>
                  <p className="text-white text-2xl font-bold">
                    {standups?.filter(s => 
                      new Date(s.date).toDateString() === new Date().toDateString()
                    ).length || 0}
                  </p>
                </div>
                <div className="p-4 bg-black border-2 border-white">
                  <p className="text-gray-400 text-sm">Notifications Sent</p>
                  <p className="text-white text-2xl font-bold">0</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 bg-black border-2 border-white">
                <h3 className="text-white font-bold mb-4">Quick Actions</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSendTestMessage}
                    className="px-4 py-2 bg-black text-white border-2 border-white hover:bg-white/10"
                  >
                    <HiOutlineVolumeUp className="inline mr-2" />
                    Send Test Message
                  </button>
                  <button
                    onClick={handleSyncUsers}
                    className="px-4 py-2 bg-black text-white border-2 border-white hover:bg-white/10"
                  >
                    <HiOutlineRefresh className="inline mr-2" />
                    Sync Users
                  </button>
                  <button
                    onClick={() => setShowAddChannel(true)}
                    className="px-4 py-2 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300"
                  >
                    <HiOutlinePlus className="inline mr-2" />
                    Add Channel
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-4 bg-black border-2 border-white">
                <h3 className="text-white font-bold mb-4">Recent Standups</h3>
                <div className="space-y-2">
                  {standups?.slice(0, 5).map(standup => (
                    <div key={standup._id} className="p-2 border-2 border-white/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-mono text-sm">{standup.user?.name}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(standup.date).toLocaleDateString()}
                          </p>
                        </div>
                        {standup.blockers && (
                          <HiOutlineExclamationCircle className="text-yellow-400" title="Has blockers" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-lg font-bold">Connected Channels</h3>
                <button
                  onClick={() => setShowAddChannel(true)}
                  className="px-4 py-2 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300"
                >
                  <HiOutlinePlus className="inline mr-2" />
                  Add Channel
                </button>
              </div>

              <div className="space-y-2">
                {slackChannels?.map(channel => (
                  <div
                    key={channel._id}
                    className={`p-4 border-2 ${channel.active ? 'border-white' : 'border-gray-600'} bg-black`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <HiOutlineHashtag className="text-gray-400" />
                        <div>
                          <p className="text-white font-mono">{channel.channelName}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-1 border ${
                              channel.channelType === 'project' ? 'border-blue-500 text-blue-500' :
                              channel.channelType === 'alerts' ? 'border-red-500 text-red-500' :
                              'border-gray-500 text-gray-500'
                            }`}>
                              {channel.channelType}
                            </span>
                            {channel.projectId && (
                              <span className="text-gray-400 text-xs">
                                {projects?.find(p => p._id === channel.projectId)?.name}
                              </span>
                            )}
                            <span className="text-gray-400 text-xs">
                              {channel.syncEvents.length} events synced
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedChannel(channel)}
                          className="p-2 text-white hover:text-cyan-400"
                        >
                          <HiOutlineCog />
                        </button>
                        <button
                          onClick={() => handleDisconnectChannel(channel.channelId)}
                          className="p-2 text-white hover:text-red-500"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-white text-lg font-bold mb-4">Notification Settings</h3>
              
              <div className="p-4 bg-black border-2 border-white">
                <div className="space-y-3">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between">
                      <span className="text-white">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                        className="w-5 h-5"
                      />
                    </label>
                  ))}
                </div>
                
                <button
                  onClick={handleSaveNotificationSettings}
                  className="mt-4 px-4 py-2 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Standup Tab */}
          {activeTab === 'standup' && (
            <div className="space-y-4">
              <h3 className="text-white text-lg font-bold mb-4">Daily Standup Configuration</h3>
              
              <div className="p-4 bg-black border-2 border-white">
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span className="text-white">Enable Daily Standup</span>
                    <input
                      type="checkbox"
                      checked={standupSettings.enabled}
                      onChange={(e) => setStandupSettings(prev => ({
                        ...prev,
                        enabled: e.target.checked
                      }))}
                      className="w-5 h-5"
                    />
                  </label>
                  
                  <div>
                    <label className="text-white text-sm">Standup Time</label>
                    <input
                      type="time"
                      value={standupSettings.time}
                      onChange={(e) => setStandupSettings(prev => ({
                        ...prev,
                        time: e.target.value
                      }))}
                      className="w-full p-2 bg-black text-white border-2 border-white font-mono"
                    />
                  </div>
                  
                  <div>
                    <label className="text-white text-sm">Standup Channel</label>
                    <select
                      value={standupSettings.channel}
                      onChange={(e) => setStandupSettings(prev => ({
                        ...prev,
                        channel: e.target.value
                      }))}
                      className="w-full p-2 bg-black text-white border-2 border-white font-mono"
                    >
                      <option value="">Select Channel</option>
                      {slackChannels?.map(channel => (
                        <option key={channel.channelId} value={channel.channelId}>
                          #{channel.channelName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-white text-sm">Reminder Time</label>
                    <input
                      type="time"
                      value={standupSettings.remindAt}
                      onChange={(e) => setStandupSettings(prev => ({
                        ...prev,
                        remindAt: e.target.value
                      }))}
                      className="w-full p-2 bg-black text-white border-2 border-white font-mono"
                    />
                  </div>
                  
                  <div>
                    <label className="text-white text-sm mb-2">Standup Questions</label>
                    <div className="space-y-2">
                      {standupSettings.questions.map((q, index) => (
                        <input
                          key={index}
                          type="text"
                          value={q}
                          onChange={(e) => {
                            const newQuestions = [...standupSettings.questions]
                            newQuestions[index] = e.target.value
                            setStandupSettings(prev => ({
                              ...prev,
                              questions: newQuestions
                            }))
                          }}
                          className="w-full p-2 bg-black text-white border-2 border-white font-mono"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleSaveStandupSettings}
                  className="mt-4 px-4 py-2 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300"
                >
                  Save Standup Settings
                </button>
              </div>

              {/* Recent Standups */}
              <div className="p-4 bg-black border-2 border-white">
                <h3 className="text-white font-bold mb-4">Recent Standups</h3>
                <div className="space-y-2">
                  {standups?.map(standup => (
                    <div key={standup._id} className="p-3 border-2 border-white/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-mono">{standup.user?.name}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(standup.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-400">
                          <span className="text-cyan-400">Yesterday:</span> {standup.yesterday}
                        </p>
                        <p className="text-gray-400">
                          <span className="text-cyan-400">Today:</span> {standup.today}
                        </p>
                        {standup.blockers && (
                          <p className="text-gray-400">
                            <span className="text-red-400">Blockers:</span> {standup.blockers}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h3 className="text-white text-lg font-bold mb-4">Integration Settings</h3>
              
              <div className="p-4 bg-black border-2 border-white">
                <h4 className="text-white font-bold mb-3">Workspace Info</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Team Name</span>
                    <span className="text-white font-mono">{slackIntegration.teamName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Team ID</span>
                    <span className="text-white font-mono text-sm">{slackIntegration.teamId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bot User ID</span>
                    <span className="text-white font-mono text-sm">{slackIntegration.botUserId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Connected Since</span>
                    <span className="text-white">
                      {new Date(slackIntegration.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-black border-2 border-white">
                <h4 className="text-white font-bold mb-3">Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  {slackIntegration.scopes.map(scope => (
                    <span
                      key={scope}
                      className="px-2 py-1 bg-cyan-400/20 border border-cyan-400 text-cyan-400 text-xs font-mono"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <HiOutlineChat className="w-24 h-24 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-xl mb-2">Connect Your Slack Workspace</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Integrate Slack to receive notifications, sync tasks, run standups, and collaborate seamlessly.
          </p>
          <button
            onClick={handleConnectSlack}
            className="px-6 py-3 bg-purple-500 text-white font-bold border-2 border-white hover:bg-purple-600"
          >
            <HiOutlineLink className="inline mr-2" />
            Connect to Slack
          </button>
        </div>
      )}

      {/* Add Channel Modal */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border-2 border-white p-6 w-full max-w-md">
            <h3 className="text-white text-xl font-bold mb-4">Add Slack Channel</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm">Channel ID</label>
                <input
                  type="text"
                  value={newChannel.channelId}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, channelId: e.target.value }))}
                  className="w-full p-2 bg-black text-white border-2 border-white font-mono"
                  placeholder="C1234567890"
                />
              </div>
              
              <div>
                <label className="text-white text-sm">Channel Name</label>
                <input
                  type="text"
                  value={newChannel.channelName}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, channelName: e.target.value }))}
                  className="w-full p-2 bg-black text-white border-2 border-white font-mono"
                  placeholder="general"
                />
              </div>
              
              <div>
                <label className="text-white text-sm">Channel Type</label>
                <select
                  value={newChannel.channelType}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, channelType: e.target.value as any }))}
                  className="w-full p-2 bg-black text-white border-2 border-white font-mono"
                >
                  <option value="general">General</option>
                  <option value="project">Project</option>
                  <option value="alerts">Alerts</option>
                </select>
              </div>
              
              {newChannel.channelType === 'project' && (
                <div>
                  <label className="text-white text-sm">Project</label>
                  <select
                    value={newChannel.projectId || ''}
                    onChange={(e) => setNewChannel(prev => ({ 
                      ...prev, 
                      projectId: e.target.value as Id<'projects'> 
                    }))}
                    className="w-full p-2 bg-black text-white border-2 border-white font-mono"
                  >
                    <option value="">Select Project</option>
                    {projects?.map(project => (
                      <option key={project._id} value={project._id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="text-white text-sm mb-2">Sync Events</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {SYNC_EVENTS.map(event => (
                    <label key={event.id} className="flex items-center text-white">
                      <input
                        type="checkbox"
                        checked={newChannel.syncEvents.includes(event.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewChannel(prev => ({
                              ...prev,
                              syncEvents: [...prev.syncEvents, event.id]
                            }))
                          } else {
                            setNewChannel(prev => ({
                              ...prev,
                              syncEvents: prev.syncEvents.filter(id => id !== event.id)
                            }))
                          }
                        }}
                        className="mr-2"
                      />
                      {event.icon}
                      <span className="ml-2">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-2">
              <button
                onClick={handleAddChannel}
                disabled={!newChannel.channelId || !newChannel.channelName}
                className="flex-1 p-2 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300 disabled:opacity-50"
              >
                Add Channel
              </button>
              <button
                onClick={() => setShowAddChannel(false)}
                className="flex-1 p-2 bg-black text-white font-bold border-2 border-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Channel Modal */}
      {selectedChannel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border-2 border-white p-6 w-full max-w-md">
            <h3 className="text-white text-xl font-bold mb-4">
              Edit Channel: #{selectedChannel.channelName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2">Sync Events</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {SYNC_EVENTS.map(event => (
                    <label key={event.id} className="flex items-center text-white">
                      <input
                        type="checkbox"
                        checked={selectedChannel.syncEvents.includes(event.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChannel(prev => ({
                              ...prev!,
                              syncEvents: [...prev!.syncEvents, event.id]
                            }))
                          } else {
                            setSelectedChannel(prev => ({
                              ...prev!,
                              syncEvents: prev!.syncEvents.filter(id => id !== event.id)
                            }))
                          }
                        }}
                        className="mr-2"
                      />
                      {event.icon}
                      <span className="ml-2">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={selectedChannel.active}
                  onChange={(e) => setSelectedChannel(prev => ({
                    ...prev!,
                    active: e.target.checked
                  }))}
                  className="mr-2"
                />
                Channel Active
              </label>
            </div>
            
            <div className="mt-6 flex space-x-2">
              <button
                onClick={() => handleUpdateChannelSettings(selectedChannel)}
                className="flex-1 p-2 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300"
              >
                Save Changes
              </button>
              <button
                onClick={() => setSelectedChannel(null)}
                className="flex-1 p-2 bg-black text-white font-bold border-2 border-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}