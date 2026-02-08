import { useState } from 'react'
import { useMutation } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { api } from '../../../../../../convex/_generated/api'
import { HiOutlineAnnotation } from 'react-icons/hi'
import toast from 'react-hot-toast'
import posthog from 'posthog-js'

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user: clerkUser } = useUser()
  const submitFeedback = useMutation(api.feedback.submitFeedback)

  const handleSubmit = async () => {
    if (!message.trim()) return
    setSubmitting(true)
    try {
      await submitFeedback({
        message: message.trim(),
        email: email.trim() || undefined,
        page: window.location.pathname,
      })
      posthog.capture('feedback_submitted')
      toast.success('Feedback sent — thank you!')
      setMessage('')
      setEmail('')
      setIsOpen(false)
    } catch {
      toast.error('Failed to send feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-2 w-80 bg-[#111111] border-2 border-[#2E2E35] p-4 shadow-[4px_4px_0px_#000]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-[#9CA3AF] uppercase tracking-wider">
              Feedback
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#6B7280] hover:text-[#F9FAFB] text-sm font-mono"
            >
              X
            </button>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's broken or missing?"
            rows={3}
            className="w-full bg-[#0A0A0A] border-2 border-[#2E2E35] focus:border-[#6366F1] text-[#F9FAFB] text-sm font-mono p-2 resize-none outline-none placeholder:text-[#6B7280]"
          />

          {!clerkUser?.primaryEmailAddress && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full mt-2 bg-[#0A0A0A] border-2 border-[#2E2E35] focus:border-[#6366F1] text-[#F9FAFB] text-sm font-mono p-2 outline-none placeholder:text-[#6B7280]"
            />
          )}

          <button
            onClick={handleSubmit}
            disabled={!message.trim() || submitting}
            className="mt-3 w-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 text-white text-xs font-mono uppercase tracking-wider py-2 px-4 border-0 cursor-pointer transition-colors"
          >
            {submitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ml-auto flex items-center justify-center w-10 h-10 bg-[#111111] border-2 border-[#2E2E35] hover:border-[#6366F1] text-[#9CA3AF] hover:text-[#6366F1] shadow-[4px_4px_0px_#000] transition-colors cursor-pointer"
        title="Send feedback"
      >
        <HiOutlineAnnotation size={20} />
      </button>
    </div>
  )
}
