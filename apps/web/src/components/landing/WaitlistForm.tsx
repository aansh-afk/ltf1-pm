import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'

interface WaitlistFormProps {
  source?: 'landing' | 'coming_soon' | 'blog'
  compact?: boolean
}

export default function WaitlistForm({ source = 'landing', compact = false }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const subscribe = useMutation(api.waitlist.subscribeToNewsletter)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isSubmitting) return

    setIsSubmitting(true)
    setError('')
    try {
      await subscribe({ email, source })
      setIsSuccess(true)
      setEmail('')
      setTimeout(() => setIsSuccess(false), 4000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={`flex items-center gap-3 ${compact ? '' : 'justify-center'}`}>
        <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-['Inter',sans-serif] font-medium text-[#10B981]">
          You're on the list!
        </span>
      </div>
    )
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="flex">
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-3 bg-[#111111] border-2 border-[#2E2E35] border-r-0 rounded-l-lg text-[#F9FAFB] placeholder-[#6B7280] text-sm font-['Inter',sans-serif] focus:border-[#6366F1] focus:outline-none transition-colors duration-200"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 font-['Inter',sans-serif] font-semibold text-sm text-white bg-[#6366F1] hover:bg-[#4F46E5] border-2 border-[#4F46E5] rounded-r-lg transition-all duration-300 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? '...' : 'Join'}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs font-['Inter',sans-serif] text-red-400">{error}</p>
        )}
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row">
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 px-4 py-3 bg-[#111111] border-2 border-[#2E2E35] sm:border-r-0 rounded-lg sm:rounded-r-none text-[#F9FAFB] placeholder-[#6B7280] text-sm font-['Inter',sans-serif] focus:border-[#6366F1] focus:outline-none transition-colors duration-200"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-3 font-['Inter',sans-serif] font-semibold text-sm text-white bg-[#6366F1] hover:bg-[#4F46E5] border-2 border-[#4F46E5] rounded-lg sm:rounded-l-none shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-300 ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs font-['Inter',sans-serif] text-red-400">{error}</p>
      )}
      <p className="text-xs text-[#6B7280] mt-2 font-['Inter',sans-serif] text-center sm:text-left">
        No spam. Just launch updates.
      </p>
    </form>
  )
}
