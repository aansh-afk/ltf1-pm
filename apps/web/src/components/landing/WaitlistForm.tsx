import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { toast } from 'react-hot-toast'

interface WaitlistFormProps {
  source?: 'landing' | 'coming_soon' | 'blog'
  compact?: boolean
}

export default function WaitlistForm({ source = 'landing', compact = false }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const subscribe = useMutation(api.waitlist.subscribeToNewsletter)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isSubmitting) return

    setIsSubmitting(true)
    try {
      await subscribe({ email, source })
      setIsSuccess(true)
      setEmail('')
      toast.success('YOU\'RE ON THE LIST.')
      setTimeout(() => setIsSuccess(false), 4000)
    } catch {
      toast.error('SOMETHING WENT WRONG. TRY AGAIN.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex w-full max-w-md">
        <input
          type="email"
          placeholder="YOUR@EMAIL.COM"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 px-16px py-12px bg-event-horizon border-2 border-basalt-border border-r-0 text-cathode-white focus:border-brutal-info outline-none uppercase text-sm"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-24px py-12px font-bold uppercase text-sm border-2 ${
            isSuccess
              ? 'bg-brutal-success text-event-horizon border-brutal-success'
              : 'bg-brutal-info text-event-horizon border-brutal-info hover:bg-transparent hover:text-brutal-info'
          } ${isSubmitting ? 'opacity-50' : ''}`}
        >
          {isSubmitting ? '...' : isSuccess ? 'DONE' : 'JOIN'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row gap-0">
        <input
          type="email"
          placeholder="YOUR@EMAIL.COM"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 px-24px py-16px bg-event-horizon border-2 border-basalt-border sm:border-r-0 text-cathode-white focus:border-brutal-info outline-none uppercase text-sm"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`marketing-cta whitespace-nowrap ${
            isSuccess
              ? 'bg-brutal-success border-brutal-success'
              : ''
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'JOINING...' : isSuccess ? 'YOU\'RE IN!' : 'JOIN THE WAITLIST'}
        </button>
      </div>
      <p className="text-xs text-cathode-white/40 mt-8px uppercase tracking-wider text-center sm:text-left">
        NO SPAM. JUST LAUNCH UPDATES.
      </p>
    </form>
  )
}
