import { useState, useMemo } from 'react'
import { m } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'
import BrutalModal from '@/components/ui/BrutalModal'
import { usePageTitle } from '@/hooks/usePageTitle'
import { HiOutlineChat, HiOutlineChevronUp } from 'react-icons/hi'
import toast from 'react-hot-toast'

/* ── Constants ──────────────────────────────────────── */

const POLL_CATEGORIES = ['feature', 'opinion', 'feedback', 'general'] as const
const POST_CATEGORIES = ['discussion', 'idea', 'bug', 'showcase'] as const

const CATEGORY_COLORS: Record<string, string> = {
  feature: '#6366F1',
  opinion: '#8B5CF6',
  feedback: '#F59E0B',
  general: '#6B7280',
  discussion: '#6366F1',
  idea: '#22C55E',
  bug: '#EF4444',
  showcase: '#06B6D4',
}

const DURATION_OPTIONS = [
  { label: '1 DAY', value: 1 },
  { label: '3 DAYS', value: 3 },
  { label: '1 WEEK', value: 7 },
  { label: 'NO LIMIT', value: 0 },
]

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

/* ── Helpers ────────────────────────────────────────── */

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function timeRemaining(endsAt: number): string {
  const diff = endsAt - Date.now()
  if (diff <= 0) return 'Ended'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) return `${hours}h left`
  const days = Math.floor(hours / 24)
  return `${days}d left`
}

/* ── Poll Card ──────────────────────────────────────── */

function PollCard({ poll, isSignedIn }: {
  poll: {
    _id: Id<"communityPolls">
    _creationTime: number
    title: string
    description?: string
    options: Array<{ id: string; text: string; voteCount: number }>
    category: string
    createdBy: { name: string }
    status: string
    endsAt?: number
    totalVotes: number
    userVotedOptionId?: string
  }
  isSignedIn: boolean
}) {
  const votePoll = useMutation(api.community.mutations.votePoll)
  const [voting, setVoting] = useState(false)
  const catColor = CATEGORY_COLORS[poll.category] ?? '#6B7280'

  const handleVote = async (optionId: string) => {
    if (!isSignedIn) {
      toast.error('Sign in to vote')
      return
    }
    if (poll.userVotedOptionId) return
    setVoting(true)
    try {
      await votePoll({ pollId: poll._id, optionId })
      toast.success('Vote cast')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to vote')
    } finally {
      setVoting(false)
    }
  }

  return (
    <m.div {...fadeUp}>
      <BrutalCard variant="default" padding="lg">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-[#F9FAFB] font-bold text-base leading-snug">{poll.title}</h3>
          <span
            className="shrink-0 font-mono text-[10px] tracking-widest px-2 py-0.5 border uppercase"
            style={{ color: catColor, borderColor: catColor, backgroundColor: `${catColor}15` }}
          >
            {poll.category}
          </span>
        </div>

        {poll.description && (
          <p className="text-[#9CA3AF] text-sm mb-4 leading-relaxed">{poll.description}</p>
        )}

        <div className="flex flex-col gap-2 mb-4">
          {poll.options.map((opt) => {
            const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0
            const isVoted = poll.userVotedOptionId === opt.id
            const hasVoted = !!poll.userVotedOptionId

            return (
              <button
                key={opt.id}
                onClick={() => handleVote(opt.id)}
                disabled={voting || hasVoted || poll.status === 'closed'}
                className="relative w-full text-left group"
              >
                <div className="relative border-2 border-[#2E2E35] bg-[#0A0A0A] overflow-hidden">
                  {/* Fill bar */}
                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isVoted ? catColor : `${catColor}30`,
                    }}
                  />
                  <div className="relative px-3 py-2 flex items-center justify-between">
                    <span className={`text-sm font-medium ${isVoted ? 'text-[#F9FAFB]' : 'text-[#9CA3AF]'}`}>
                      {opt.text}
                      {isVoted && (
                        <span className="ml-2 text-[10px] font-mono tracking-wider opacity-70">VOTED</span>
                      )}
                    </span>
                    <span className="text-[#6B7280] text-xs font-mono">{pct}%</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between text-[#6B7280] text-xs font-mono">
          <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-3">
            <span>{poll.createdBy.name}</span>
            {poll.endsAt && poll.status === 'active' && (
              <span>{timeRemaining(poll.endsAt)}</span>
            )}
          </div>
        </div>
      </BrutalCard>
    </m.div>
  )
}

/* ── Post Card ──────────────────────────────────────── */

function PostCard({ post, isSignedIn }: {
  post: {
    _id: Id<"communityPosts">
    _creationTime: number
    title: string
    content: string
    category: string
    createdBy: { name: string }
    upvotes: number
    commentCount: number
    userUpvoted: boolean
  }
  isSignedIn: boolean
}) {
  const upvotePost = useMutation(api.community.mutations.upvotePost)
  const [toggling, setToggling] = useState(false)
  const catColor = CATEGORY_COLORS[post.category] ?? '#6B7280'

  const handleUpvote = async () => {
    if (!isSignedIn) {
      toast.error('Sign in to upvote')
      return
    }
    setToggling(true)
    try {
      await upvotePost({ postId: post._id })
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to upvote')
    } finally {
      setToggling(false)
    }
  }

  const preview = post.content.length > 160 ? post.content.slice(0, 160) + '...' : post.content

  return (
    <m.div {...fadeUp}>
      <BrutalCard variant="default" padding="none">
        <div className="flex">
          {/* Upvote column */}
          <button
            onClick={handleUpvote}
            disabled={toggling}
            className="flex flex-col items-center justify-center px-4 py-4 border-r-2 border-[#2E2E35] min-w-[60px] hover:bg-[#0A0A0A] transition-colors"
          >
            <HiOutlineChevronUp
              className="w-5 h-5 mb-0.5"
              style={{ color: post.userUpvoted ? '#6366F1' : '#6B7280' }}
            />
            <span
              className="text-sm font-mono font-bold"
              style={{ color: post.userUpvoted ? '#6366F1' : '#9CA3AF' }}
            >
              {post.upvotes}
            </span>
          </button>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start gap-2 mb-2">
              <h3 className="text-[#F9FAFB] font-bold text-sm leading-snug flex-1">{post.title}</h3>
              <span
                className="shrink-0 font-mono text-[10px] tracking-widest px-1.5 py-0.5 border uppercase"
                style={{ color: catColor, borderColor: catColor, backgroundColor: `${catColor}15` }}
              >
                {post.category}
              </span>
            </div>
            <p className="text-[#9CA3AF] text-sm leading-relaxed mb-3 line-clamp-2">{preview}</p>
            <div className="flex items-center gap-4 text-[#6B7280] text-xs font-mono">
              <span className="flex items-center gap-1">
                <HiOutlineChat className="w-3.5 h-3.5" />
                {post.commentCount}
              </span>
              <span>{post.createdBy.name}</span>
              <span>{timeAgo(post._creationTime)}</span>
            </div>
          </div>
        </div>
      </BrutalCard>
    </m.div>
  )
}

/* ── Create Poll Modal ──────────────────────────────── */

function CreatePollModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createPoll = useMutation(api.community.mutations.createPoll)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<typeof POLL_CATEGORIES[number]>('feature')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [duration, setDuration] = useState(3)
  const [submitting, setSubmitting] = useState(false)

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ''])
  }
  const removeOption = (idx: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx))
  }
  const updateOption = (idx: number, value: string) => {
    const updated = [...options]
    updated[idx] = value
    setOptions(updated)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    const validOptions = options.filter((o) => o.trim())
    if (validOptions.length < 2) {
      toast.error('At least 2 options are required')
      return
    }

    setSubmitting(true)
    try {
      await createPoll({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        options: validOptions.map((text, i) => ({ id: `opt_${i}`, text: text.trim() })),
        endsAt: duration > 0 ? Date.now() + duration * 24 * 60 * 60 * 1000 : undefined,
      })
      toast.success('Poll created')
      onClose()
      setTitle('')
      setDescription('')
      setOptions(['', ''])
      setCategory('feature')
      setDuration(3)
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create poll')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrutalModal isOpen={isOpen} onClose={onClose} title="Create Poll" size="md">
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6B7280] mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What should we build next?"
            className="w-full bg-[#0A0A0A] border-2 border-[#2E2E35] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6366F1]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6B7280] mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context for voters..."
            rows={2}
            className="w-full bg-[#0A0A0A] border-2 border-[#2E2E35] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6366F1] resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6B7280] mb-1">Category</label>
          <div className="flex gap-2 flex-wrap">
            {POLL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="font-mono text-[11px] tracking-wider px-2.5 py-1 border-2 uppercase transition-colors"
                style={{
                  color: category === cat ? CATEGORY_COLORS[cat] : '#6B7280',
                  borderColor: category === cat ? CATEGORY_COLORS[cat] : '#2E2E35',
                  backgroundColor: category === cat ? `${CATEGORY_COLORS[cat]}15` : 'transparent',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6B7280] mb-1">
            Options ({options.length}/6)
          </label>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 bg-[#0A0A0A] border-2 border-[#2E2E35] px-3 py-1.5 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6366F1]"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(i)}
                    className="px-2 text-[#6B7280] hover:text-[#EF4444] font-mono text-xs border-2 border-[#2E2E35] hover:border-[#EF4444] transition-colors"
                  >
                    X
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button
                onClick={addOption}
                className="text-[#6B7280] hover:text-[#6366F1] font-mono text-xs py-1 border-2 border-dashed border-[#2E2E35] hover:border-[#6366F1] transition-colors"
              >
                + ADD OPTION
              </button>
            )}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6B7280] mb-1">Duration</label>
          <div className="flex gap-2 flex-wrap">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className="font-mono text-[11px] tracking-wider px-2.5 py-1 border-2 uppercase transition-colors"
                style={{
                  color: duration === d.value ? '#6366F1' : '#6B7280',
                  borderColor: duration === d.value ? '#6366F1' : '#2E2E35',
                  backgroundColor: duration === d.value ? '#6366F115' : 'transparent',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <BrutalButton
          variant="primary"
          size="md"
          fullWidth
          loading={submitting}
          onClick={handleSubmit}
        >
          CREATE POLL
        </BrutalButton>
      </div>
    </BrutalModal>
  )
}

/* ── Create Post Modal ──────────────────────────────── */

function CreatePostModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createPost = useMutation(api.community.mutations.createPost)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<typeof POST_CATEGORIES[number]>('discussion')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!content.trim()) {
      toast.error('Content is required')
      return
    }

    setSubmitting(true)
    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        category,
      })
      toast.success('Post created')
      onClose()
      setTitle('')
      setContent('')
      setCategory('discussion')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrutalModal isOpen={isOpen} onClose={onClose} title="New Post" size="md">
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6B7280] mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your post title"
            className="w-full bg-[#0A0A0A] border-2 border-[#2E2E35] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6366F1]"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6B7280] mb-1">Category</label>
          <div className="flex gap-2 flex-wrap">
            {POST_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="font-mono text-[11px] tracking-wider px-2.5 py-1 border-2 uppercase transition-colors"
                style={{
                  color: category === cat ? CATEGORY_COLORS[cat] : '#6B7280',
                  borderColor: category === cat ? CATEGORY_COLORS[cat] : '#2E2E35',
                  backgroundColor: category === cat ? `${CATEGORY_COLORS[cat]}15` : 'transparent',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#6B7280] mb-1">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={5}
            className="w-full bg-[#0A0A0A] border-2 border-[#2E2E35] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] outline-none focus:border-[#6366F1] resize-none"
          />
        </div>

        <BrutalButton
          variant="primary"
          size="md"
          fullWidth
          loading={submitting}
          onClick={handleSubmit}
        >
          PUBLISH POST
        </BrutalButton>
      </div>
    </BrutalModal>
  )
}

/* ── Main Page ──────────────────────────────────────── */

export default function CommunityPage() {
  usePageTitle('Community')
  const { isSignedIn } = useAuth()
  const [activeTab, setActiveTab] = useState<'polls' | 'discussions'>('polls')
  const [showCreatePoll, setShowCreatePoll] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [postCategoryFilter, setPostCategoryFilter] = useState<string | null>(null)

  const activePolls = useQuery(api.community.queries.getActivePolls)
  const closedPolls = useQuery(api.community.queries.getClosedPolls, { limit: 5 })
  const posts = useQuery(
    api.community.queries.getPosts,
    postCategoryFilter
      ? { category: postCategoryFilter as any }
      : {}
  )

  return (
    <div className="min-h-full bg-[#050505]">
      {/* Header */}
      <div className="border-b-2 border-[#2E2E35] bg-[#0A0A0A] px-6 py-6">
        <m.div {...fadeUp}>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-[#F9FAFB] uppercase mb-1">
            Community
          </h1>
          <p className="text-[#6B7280] text-sm font-mono">
            Vote on features, share ideas, discuss
          </p>
        </m.div>

        {/* Tabs */}
        <div className="flex items-center gap-0 mt-5">
          {(['polls', 'discussions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="font-mono text-xs tracking-widest uppercase px-4 py-2 border-2 transition-colors -mr-[2px]"
              style={{
                color: activeTab === tab ? '#F9FAFB' : '#6B7280',
                borderColor: activeTab === tab ? '#6366F1' : '#2E2E35',
                backgroundColor: activeTab === tab ? '#6366F115' : 'transparent',
              }}
            >
              {tab}
            </button>
          ))}

          <div className="ml-auto">
            {activeTab === 'polls' && (
              <BrutalButton
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!isSignedIn) {
                    toast.error('Sign in to create a poll')
                    return
                  }
                  setShowCreatePoll(true)
                }}
              >
                CREATE POLL
              </BrutalButton>
            )}
            {activeTab === 'discussions' && (
              <BrutalButton
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!isSignedIn) {
                    toast.error('Sign in to create a post')
                    return
                  }
                  setShowCreatePost(true)
                }}
              >
                NEW POST
              </BrutalButton>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* POLLS TAB */}
        {activeTab === 'polls' && (
          <div>
            {/* Active Polls */}
            <div className="mb-8">
              <h2 className="font-mono text-[10px] tracking-widest uppercase text-[#6B7280] mb-4 flex items-center gap-2">
                ACTIVE POLLS
                <div className="flex-1 h-px bg-[#1F1F23]" />
              </h2>

              {!activePolls && (
                <div className="flex items-center justify-center py-12">
                  <span className="font-mono text-xs text-[#6B7280] animate-pulse">LOADING...</span>
                </div>
              )}

              {activePolls && activePolls.length === 0 && (
                <BrutalCard variant="default" padding="lg">
                  <p className="text-center text-[#6B7280] text-sm font-mono">
                    No active polls. Be the first to create one.
                  </p>
                </BrutalCard>
              )}

              <div className="flex flex-col gap-4">
                {activePolls?.map((poll) => (
                  <PollCard key={poll._id} poll={poll} isSignedIn={!!isSignedIn} />
                ))}
              </div>
            </div>

            {/* Closed Polls */}
            {closedPolls && closedPolls.length > 0 && (
              <div>
                <h2 className="font-mono text-[10px] tracking-widest uppercase text-[#6B7280] mb-4 flex items-center gap-2">
                  RECENT RESULTS
                  <div className="flex-1 h-px bg-[#1F1F23]" />
                </h2>
                <div className="flex flex-col gap-4">
                  {closedPolls.map((poll) => (
                    <PollCard key={poll._id} poll={{...poll, userVotedOptionId: undefined}} isSignedIn={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DISCUSSIONS TAB */}
        {activeTab === 'discussions' && (
          <div>
            {/* Category Filter */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setPostCategoryFilter(null)}
                className="font-mono text-[11px] tracking-wider px-2.5 py-1 border-2 uppercase transition-colors"
                style={{
                  color: postCategoryFilter === null ? '#F9FAFB' : '#6B7280',
                  borderColor: postCategoryFilter === null ? '#6366F1' : '#2E2E35',
                  backgroundColor: postCategoryFilter === null ? '#6366F115' : 'transparent',
                }}
              >
                ALL
              </button>
              {POST_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPostCategoryFilter(cat)}
                  className="font-mono text-[11px] tracking-wider px-2.5 py-1 border-2 uppercase transition-colors"
                  style={{
                    color: postCategoryFilter === cat ? CATEGORY_COLORS[cat] : '#6B7280',
                    borderColor: postCategoryFilter === cat ? CATEGORY_COLORS[cat] : '#2E2E35',
                    backgroundColor: postCategoryFilter === cat ? `${CATEGORY_COLORS[cat]}15` : 'transparent',
                  }}
                >
                  {cat === 'idea' ? 'IDEAS' : cat === 'bug' ? 'BUGS' : cat + 'S'}
                </button>
              ))}
            </div>

            {!posts && (
              <div className="flex items-center justify-center py-12">
                <span className="font-mono text-xs text-[#6B7280] animate-pulse">LOADING...</span>
              </div>
            )}

            {posts && posts.length === 0 && (
              <BrutalCard variant="default" padding="lg">
                <p className="text-center text-[#6B7280] text-sm font-mono">
                  No posts yet. Start a discussion.
                </p>
              </BrutalCard>
            )}

            <div className="flex flex-col gap-3">
              {posts?.map((post) => (
                <PostCard key={post._id} post={post} isSignedIn={!!isSignedIn} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreatePollModal isOpen={showCreatePoll} onClose={() => setShowCreatePoll(false)} />
      <CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} />
    </div>
  )
}
