import { useProfileCompletion } from '@/hooks/useProfileCompletion'
import { useNavigate } from 'react-router-dom'
import { HiOutlineX } from 'react-icons/hi'
import clsx from 'clsx'

export default function ProfileCompletionBanner() {
  const { shouldShowPrompt, completeness, dismissPrompt } = useProfileCompletion()
  const navigate = useNavigate()

  if (!shouldShowPrompt) return null

  return (
    <div className="bg-[var(--theme-background)] border-2 border-primary-brutalist p-16px mb-24px">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-16px flex-1">
          {/* Progress indicator */}
          <div className="hidden sm:block">
            <div className="w-80px h-8px bg-basalt-border">
              <div 
                className="h-full bg-primary-brutalist transition-all duration-300"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <div className="text-brutal-xs font-mono mt-4px">{completeness}%</div>
          </div>
          
          {/* Message */}
          <div className="text-brutal-sm">
            <span className="font-bold uppercase">COMPLETE YOUR DEVELOPER PROFILE</span>
            <span className="hidden md:inline text-[var(--theme-foreground)]/60 ml-8px">
              TO UNLOCK TEAM FEATURES AND IMPROVE COLLABORATION
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-8px">
          <button
            onClick={() => dismissPrompt('session')}
            className="text-brutal-xs uppercase hover:text-primary-brutalist transition-colors"
          >
            LATER
          </button>
          <button
            onClick={() => navigate('/settings?tab=profile')}
            className="brutal-btn-sm"
          >
            COMPLETE
          </button>
          <button
            onClick={() => dismissPrompt('week')}
            className="p-4px hover:bg-basalt-border/20 transition-colors"
            title="Dismiss for a week"
          >
            <HiOutlineX className="w-16px h-16px" />
          </button>
        </div>
      </div>
    </div>
  )
}