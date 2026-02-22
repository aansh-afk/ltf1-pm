import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  HiOutlineVideoCamera,
  HiOutlineMicrophone,
  HiOutlineDesktopComputer,
  HiOutlinePhone,
  HiOutlineUsers,
  HiOutlineDotsVertical,
  HiOutlineStop,
  HiOutlineCog,
  HiOutlineLink,
  HiOutlineX,
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUserRemove,
  HiOutlineVolumeOff,
  HiOutlineChat,
  HiOutlineHand
} from 'react-icons/hi'
import { HiVideoCamera } from 'react-icons/hi2'

// Video camera slash icon component (since HiOutlineVideoCameraSlash doesn't exist in hi package)
const VideoCameraSlashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    <line x1="4" y1="4" x2="20" y2="20" strokeWidth={2} strokeLinecap="round" />
  </svg>
)

// Microphone off icon component (since HiOutlineMicrophoneOff doesn't exist in hi package)
const MicrophoneOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    <line x1="4" y1="4" x2="20" y2="20" strokeWidth={2} strokeLinecap="round" />
  </svg>
)

// Record icon component (since HiOutlineRecord doesn't exist in hi package)
const RecordIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="8" fill="currentColor" strokeWidth="2" />
  </svg>
)

interface VideoRoomsProps {
  workspaceId: Id<'workspaces'>
  meetingId?: Id<'meetings'>
}

interface Participant {
  userId: Id<'users'>
  joinedAt: number
  leftAt?: number
  role: 'host' | 'participant'
  audio: boolean
  video: boolean
  screen: boolean
  user?: {
    _id: Id<'users'>
    name: string
    avatarUrl?: string
  }
}

interface VideoRoom {
  _id: Id<'videoRooms'>
  name: string
  type: 'meeting' | 'instant' | 'persistent'
  hostId: Id<'users'>
  participants: Participant[]
  settings: {
    maxParticipants: number
    allowGuests: boolean
    recordingEnabled: boolean
    waitingRoomEnabled: boolean
    muteOnEntry: boolean
    videoOnEntry: boolean
    chatEnabled: boolean
    screenShareEnabled: boolean
  }
  status: 'scheduled' | 'active' | 'ended'
  startedAt?: number
  endedAt?: number
  recordingUrl?: string
  host?: {
    _id: Id<'users'>
    name: string
    avatarUrl?: string
  }
}

export default function VideoRooms({ workspaceId, meetingId }: VideoRoomsProps) {
  const [activeRoomId, setActiveRoomId] = useState<Id<'videoRooms'> | null>(null)
  const [showNewRoom, setShowNewRoom] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [newRoomSettings, setNewRoomSettings] = useState({
    name: '',
    type: 'instant' as const,
    maxParticipants: 100,
    allowGuests: false,
    recordingEnabled: false,
    waitingRoomEnabled: false,
    muteOnEntry: false,
    videoOnEntry: true,
    chatEnabled: true,
    screenShareEnabled: true,
  })

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  // Queries
  const activeRooms = useQuery(api.video.getActiveRooms, { workspaceId })
  const currentRoom = useQuery(
    api.video.getRoom,
    activeRoomId ? { roomId: activeRoomId } : 'skip'
  )
  const recordings = useQuery(api.video.getRoomRecordings, { workspaceId, limit: 10 })

  // Mutations
  const createRoom = useMutation(api.video.createRoom)
  const joinRoom = useMutation(api.video.joinRoom)
  const leaveRoom = useMutation(api.video.leaveRoom)
  const updateMediaState = useMutation(api.video.updateMediaState)
  const muteParticipant = useMutation(api.video.muteParticipant)
  const removeParticipant = useMutation(api.video.removeParticipant)
  const startRecording = useMutation(api.video.startRecording)
  const stopRecording = useMutation(api.video.stopRecording)
  const getInstantMeetingLink = useMutation(api.video.getInstantMeetingLink)
  const scheduleMeeting = useMutation(api.video.scheduleMeeting)

  // Initialize media stream
  useEffect(() => {
    if (activeRoomId && !localStream) {
      navigator.mediaDevices.getUserMedia({ 
        video: isVideoOn, 
        audio: isAudioOn 
      }).then(stream => {
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      }).catch(err => {
        console.error('Failed to get media stream:', err)
      })
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [activeRoomId, isVideoOn, isAudioOn])

  // Handle create instant meeting
  const handleCreateInstantMeeting = async () => {
    const result = await getInstantMeetingLink({ workspaceId })
    setActiveRoomId(result.roomId)
    await joinRoom({ 
      roomId: result.roomId, 
      audio: isAudioOn, 
      video: isVideoOn 
    })
    
    // Copy link to clipboard
    navigator.clipboard.writeText(result.link)
  }

  // Handle create room
  const handleCreateRoom = async () => {
    const roomId = await createRoom({
      workspaceId,
      name: newRoomSettings.name,
      type: newRoomSettings.type,
      meetingId,
      settings: {
        maxParticipants: newRoomSettings.maxParticipants,
        allowGuests: newRoomSettings.allowGuests,
        recordingEnabled: newRoomSettings.recordingEnabled,
        waitingRoomEnabled: newRoomSettings.waitingRoomEnabled,
        muteOnEntry: newRoomSettings.muteOnEntry,
        videoOnEntry: newRoomSettings.videoOnEntry,
        chatEnabled: newRoomSettings.chatEnabled,
        screenShareEnabled: newRoomSettings.screenShareEnabled,
      }
    })
    
    setActiveRoomId(roomId)
    setShowNewRoom(false)
    
    // Auto-join the room
    await joinRoom({ roomId, audio: isAudioOn, video: isVideoOn })
  }

  // Handle join room
  const handleJoinRoom = async (roomId: Id<'videoRooms'>) => {
    setActiveRoomId(roomId)
    await joinRoom({ roomId, audio: isAudioOn, video: isVideoOn })
  }

  // Handle leave room
  const handleLeaveRoom = async () => {
    if (!activeRoomId) return
    
    await leaveRoom({ roomId: activeRoomId })
    setActiveRoomId(null)
    
    // Stop media stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
  }

  // Toggle audio
  const toggleAudio = async () => {
    if (!activeRoomId || !localStream) return
    
    const audioTrack = localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setIsAudioOn(audioTrack.enabled)
      await updateMediaState({ 
        roomId: activeRoomId, 
        audio: audioTrack.enabled 
      })
    }
  }

  // Toggle video
  const toggleVideo = async () => {
    if (!activeRoomId || !localStream) return
    
    const videoTrack = localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      setIsVideoOn(videoTrack.enabled)
      await updateMediaState({ 
        roomId: activeRoomId, 
        video: videoTrack.enabled 
      })
    }
  }

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (!activeRoomId) return
    
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })
        
        // Replace video track with screen share
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }
        
        setIsScreenSharing(true)
        await updateMediaState({ 
          roomId: activeRoomId, 
          screen: true 
        })
        
        // Listen for screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream
          }
          updateMediaState({ 
            roomId: activeRoomId, 
            screen: false 
          })
        }
      } catch (err) {
        console.error('Failed to share screen:', err)
      }
    } else {
      setIsScreenSharing(false)
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream
      }
      await updateMediaState({ 
        roomId: activeRoomId, 
        screen: false 
      })
    }
  }

  // Handle recording
  const handleToggleRecording = async () => {
    if (!activeRoomId || !currentRoom) return
    
    if (isRecording) {
      await stopRecording({ roomId: activeRoomId })
      setIsRecording(false)
    } else {
      await startRecording({ roomId: activeRoomId })
      setIsRecording(true)
    }
  }

  // Mute participant (host only)
  const handleMuteParticipant = async (participantId: Id<'users'>) => {
    if (!activeRoomId) return
    await muteParticipant({ 
      roomId: activeRoomId, 
      participantId, 
      mute: true 
    })
  }

  // Remove participant (host only)
  const handleRemoveParticipant = async (participantId: Id<'users'>) => {
    if (!activeRoomId) return
    await removeParticipant({ roomId: activeRoomId, participantId })
  }

  const isHost = currentRoom?.hostId === currentRoom?.host?._id

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar - Room List */}
      <div className="w-80 border-r-2 border-white bg-black p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-white font-bold text-xl mb-4">Video Rooms</h2>
          
          {/* Quick Actions */}
          <div className="space-y-2">
            <button
              onClick={handleCreateInstantMeeting}
              className="w-full p-3 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300"
            >
              <HiOutlineVideoCamera className="inline mr-2" />
              Start Instant Meeting
            </button>
            
            <button
              onClick={() => setShowNewRoom(true)}
              className="w-full p-3 bg-black text-white font-bold border-2 border-white hover:bg-white/10"
            >
              <HiOutlinePlus className="inline mr-2" />
              Schedule Meeting
            </button>
          </div>
        </div>

        {/* Active Rooms */}
        <div className="mb-6">
          <h3 className="text-white font-bold mb-2 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            Active Rooms ({activeRooms?.length || 0})
          </h3>
          <div className="space-y-2">
            {activeRooms?.map(room => (
              <div
                key={room._id}
                className={`p-3 border-2 ${activeRoomId === room._id ? 'border-cyan-400 bg-cyan-400/10' : 'border-white'} hover:bg-white/10 cursor-pointer`}
                onClick={() => handleJoinRoom(room._id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-mono text-sm">{room.name}</p>
                    <p className="text-gray-400 text-xs">
                      {room.participants.length} participants
                    </p>
                  </div>
                  {room.type === 'meeting' && (
                    <HiOutlineCalendar className="text-cyan-400" />
                  )}
                  {room.type === 'instant' && (
                    <HiOutlineClock className="text-yellow-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Recordings */}
        <div>
          <h3 className="text-white font-bold mb-2">Recent Recordings</h3>
          <div className="space-y-2">
            {recordings?.map(recording => (
              <div
                key={recording._id}
                className="p-2 border-2 border-white/50 hover:border-white cursor-pointer"
              >
                <p className="text-white text-sm truncate">{recording.name}</p>
                <p className="text-gray-400 text-xs">
                  {recording.duration ? `${Math.round(recording.duration / 60000)} min` : 'N/A'} · 
                  {recording.participantCount} participants
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {activeRoomId && currentRoom ? (
          <>
            {/* Video Grid */}
            <div className="flex-1 p-4 grid grid-cols-2 gap-4">
              {/* Local Video */}
              <div className="relative bg-gray-900 border-2 border-white">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded">
                  <p className="text-white text-sm">You {isHost && '(Host)'}</p>
                </div>
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <VideoCameraSlashIcon className="w-16 h-16 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Remote Videos */}
              {currentRoom.participants.filter(p => !p.leftAt && p.user?._id !== currentRoom.host?._id).map(participant => (
                <div key={participant.userId} className="relative bg-gray-900 border-2 border-white">
                  <video
                    ref={el => {
                      if (el) remoteVideoRefs.current[participant.userId] = el
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded">
                    <p className="text-white text-sm">{participant.user?.name}</p>
                  </div>
                  {!participant.video && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      {participant.user?.avatarUrl ? (
                        <img 
                          src={participant.user.avatarUrl} 
                          alt={participant.user.name}
                          className="w-24 h-24 rounded-full"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl">
                            {participant.user?.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Host Controls */}
                  {isHost && (
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button
                        onClick={() => handleMuteParticipant(participant.userId)}
                        className="p-1 bg-black/70 rounded hover:bg-black"
                        title="Mute Participant"
                      >
                        <HiOutlineVolumeOff className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => handleRemoveParticipant(participant.userId)}
                        className="p-1 bg-red-500/70 rounded hover:bg-red-500"
                        title="Remove Participant"
                      >
                        <HiOutlineUserRemove className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Controls Bar */}
            <div className="h-20 bg-black border-t-2 border-white flex items-center justify-center px-8">
              <div className="flex items-center space-x-4">
                {/* Audio Toggle */}
                <button
                  onClick={toggleAudio}
                  className={`p-3 border-2 ${isAudioOn ? 'border-white bg-black' : 'border-red-500 bg-red-500/20'} hover:bg-white/10`}
                  title={isAudioOn ? 'Mute' : 'Unmute'}
                >
                  {isAudioOn ? (
                    <HiOutlineMicrophone className="w-6 h-6 text-white" />
                  ) : (
                    <MicrophoneOffIcon className="w-6 h-6 text-red-500" />
                  )}
                </button>

                {/* Video Toggle */}
                <button
                  onClick={toggleVideo}
                  className={`p-3 border-2 ${isVideoOn ? 'border-white bg-black' : 'border-red-500 bg-red-500/20'} hover:bg-white/10`}
                  title={isVideoOn ? 'Stop Video' : 'Start Video'}
                >
                  {isVideoOn ? (
                    <HiOutlineVideoCamera className="w-6 h-6 text-white" />
                  ) : (
                    <VideoCameraSlashIcon className="w-6 h-6 text-red-500" />
                  )}
                </button>

                {/* Screen Share */}
                {currentRoom.settings.screenShareEnabled && (
                  <button
                    onClick={toggleScreenShare}
                    className={`p-3 border-2 ${isScreenSharing ? 'border-cyan-400 bg-cyan-400/20' : 'border-white bg-black'} hover:bg-white/10`}
                    title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                  >
                    <HiOutlineDesktopComputer className={`w-6 h-6 ${isScreenSharing ? 'text-cyan-400' : 'text-white'}`} />
                  </button>
                )}

                {/* Recording (Host Only) */}
                {isHost && currentRoom.settings.recordingEnabled && (
                  <button
                    onClick={handleToggleRecording}
                    className={`p-3 border-2 ${isRecording ? 'border-red-500 bg-red-500/20' : 'border-white bg-black'} hover:bg-white/10`}
                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                  >
                    {isRecording ? (
                      <HiOutlineStop className="w-6 h-6 text-red-500" />
                    ) : (
                      <RecordIcon className="w-6 h-6 text-white" />
                    )}
                  </button>
                )}

                {/* Chat */}
                {currentRoom.settings.chatEnabled && (
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className={`p-3 border-2 ${showChat ? 'border-cyan-400 bg-cyan-400/20' : 'border-white bg-black'} hover:bg-white/10`}
                    title="Chat"
                  >
                    <HiOutlineChat className={`w-6 h-6 ${showChat ? 'text-cyan-400' : 'text-white'}`} />
                  </button>
                )}

                {/* Participants */}
                <button
                  className="p-3 border-2 border-white bg-black hover:bg-white/10"
                  title="Participants"
                >
                  <div className="flex items-center">
                    <HiOutlineUsers className="w-6 h-6 text-white mr-2" />
                    <span className="text-white">{currentRoom.participants.filter(p => !p.leftAt).length}</span>
                  </div>
                </button>

                {/* Settings */}
                {isHost && (
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-3 border-2 border-white bg-black hover:bg-white/10"
                    title="Settings"
                  >
                    <HiOutlineCog className="w-6 h-6 text-white" />
                  </button>
                )}

                {/* Leave Call */}
                <button
                  onClick={handleLeaveRoom}
                  className="p-3 bg-red-500 border-2 border-white hover:bg-red-600"
                  title="Leave Call"
                >
                  <HiOutlinePhone className="w-6 h-6 text-white transform rotate-135" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <HiVideoCamera className="w-24 h-24 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white text-xl mb-2">No Active Call</h3>
              <p className="text-gray-400 mb-4">Start an instant meeting or join an active room</p>
              <button
                onClick={handleCreateInstantMeeting}
                className="px-6 py-3 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300"
              >
                Start Instant Meeting
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Room Modal */}
      {showNewRoom && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black border-2 border-white p-6 w-full max-w-md">
            <h3 className="text-white text-xl font-bold mb-4">Create New Room</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm">Room Name</label>
                <input
                  type="text"
                  value={newRoomSettings.name}
                  onChange={(e) => setNewRoomSettings(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 bg-black text-white border-2 border-white font-mono"
                  placeholder="Enter room name"
                />
              </div>

              <div>
                <label className="text-white text-sm">Room Type</label>
                <select
                  value={newRoomSettings.type}
                  onChange={(e) => setNewRoomSettings(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 bg-black text-white border-2 border-white font-mono"
                >
                  <option value="instant">Instant</option>
                  <option value="meeting">Meeting</option>
                  <option value="persistent">Persistent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={newRoomSettings.recordingEnabled}
                    onChange={(e) => setNewRoomSettings(prev => ({ ...prev, recordingEnabled: e.target.checked }))}
                    className="mr-2"
                  />
                  Enable Recording
                </label>
                
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={newRoomSettings.waitingRoomEnabled}
                    onChange={(e) => setNewRoomSettings(prev => ({ ...prev, waitingRoomEnabled: e.target.checked }))}
                    className="mr-2"
                  />
                  Enable Waiting Room
                </label>
                
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={newRoomSettings.muteOnEntry}
                    onChange={(e) => setNewRoomSettings(prev => ({ ...prev, muteOnEntry: e.target.checked }))}
                    className="mr-2"
                  />
                  Mute on Entry
                </label>
              </div>
            </div>

            <div className="mt-6 flex space-x-2">
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomSettings.name}
                className="flex-1 p-2 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300 disabled:opacity-50"
              >
                Create Room
              </button>
              <button
                onClick={() => setShowNewRoom(false)}
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