import { useState } from 'react'
import { HiOutlineSparkles, HiOutlineKey, HiOutlineCreditCard, HiOutlineInformationCircle } from 'react-icons/hi'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import BrutalModal from '../ui/BrutalModal'

interface AISetupModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  isFirstTimeUser?: boolean
}

export default function AISetupModal({ 
  isOpen, 
  onClose, 
  onComplete,
  isFirstTimeUser = false 
}: AISetupModalProps) {
  const [setupChoice, setSetupChoice] = useState<'free' | 'byok' | 'skip'>('')
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  
  const setupAICredits = useMutation(api.aiCredits.mutations.setupUserAI)
  const validateApiKey = useAction(api.aiCredits.actions.validateApiKey)
  const saveApiKey = useMutation(api.aiCredits.mutations.saveApiKey)

  const handleSetup = async () => {
    if (setupChoice === 'skip' && !isFirstTimeUser) {
      onComplete()
      return
    }

    if (setupChoice === 'byok' && !apiKey) {
      toast.error('Please enter your Gemini API key')
      return
    }

    setIsValidating(true)
    try {
      if (setupChoice === 'byok') {
        // First validate the API key
        const validationResult = await validateApiKey({ apiKey })
        if (!validationResult.isValid) {
          toast.error(validationResult.error || 'Invalid API key')
          setIsValidating(false)
          return
        }
        
        // Then save it if valid
        await saveApiKey({ apiKey })
        toast.success('API key validated and saved successfully!')
      } else if (setupChoice === 'free') {
        // Setup free tier credits
        await setupAICredits({ 
          tier: 'free',
          setupType: 'free_credits' 
        })
        toast.success('Free AI credits activated! You have 100 credits to start.')
      }
      
      onComplete()
    } catch (error) {
      toast.error('Setup failed. Please try again.')
      console.error(error)
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={!isFirstTimeUser ? onClose : undefined}
      title={isFirstTimeUser ? "Welcome! Let's Set Up AI Features" : "AI Configuration"}
      size="lg"
    >
      <div className="space-y-24px">
        {/* Welcome message for first-time users */}
        {isFirstTimeUser && (
          <div 
            className="p-16px border-2 mb-24px"
            style={{ 
              backgroundColor: 'var(--theme-background-secondary)',
              borderColor: 'var(--theme-info)'
            }}
          >
            <div className="flex items-start gap-12px">
              <HiOutlineSparkles 
                className="w-24px h-24px flex-shrink-0" 
                style={{ color: 'var(--theme-info)' }}
              />
              <div>
                <h3 
                  className="text-brutal-md uppercase mb-8px"
                  style={{ color: 'var(--theme-foreground)' }}
                >
                  AI-Powered Features Available
                </h3>
                <p 
                  className="text-brutal-sm"
                  style={{ color: 'var(--theme-foreground-secondary)' }}
                >
                  LTF1 includes AI features for task generation, code reviews, meeting summaries, and more. 
                  Choose how you'd like to use these features:
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Option 1: Free Credits */}
        <button
          onClick={() => setSetupChoice('free')}
          className={`w-full p-20px border-2 text-left transition-all ${
            setupChoice === 'free' ? 'translate-x-[-2px] translate-y-[-2px]' : ''
          }`}
          style={{
            backgroundColor: setupChoice === 'free' 
              ? 'var(--theme-primary)' 
              : 'var(--theme-background)',
            borderColor: 'var(--theme-border)',
            color: setupChoice === 'free' 
              ? 'var(--theme-background)' 
              : 'var(--theme-foreground)',
            boxShadow: setupChoice === 'free' 
              ? '4px 4px 0 var(--theme-shadow)' 
              : 'none'
          }}
        >
          <div className="flex items-start gap-16px">
            <HiOutlineCreditCard className="w-24px h-24px flex-shrink-0 mt-2px" />
            <div className="flex-1">
              <h3 className="text-brutal-md uppercase mb-8px">
                Start with Free Credits
              </h3>
              <p className="text-brutal-sm mb-8px opacity-90">
                Get 100 free AI credits per month. Perfect for trying out AI features.
              </p>
              <ul className="text-brutal-xs space-y-4px opacity-75">
                <li>• 100 credits/month (renews monthly)</li>
                <li>• ~50 task generations or code reviews</li>
                <li>• Rate limited to 10 requests/hour</li>
                <li>• Upgrade anytime for more credits</li>
              </ul>
            </div>
          </div>
        </button>

        {/* Option 2: BYOK */}
        <button
          onClick={() => setSetupChoice('byok')}
          className={`w-full p-20px border-2 text-left transition-all ${
            setupChoice === 'byok' ? 'translate-x-[-2px] translate-y-[-2px]' : ''
          }`}
          style={{
            backgroundColor: setupChoice === 'byok' 
              ? 'var(--theme-primary)' 
              : 'var(--theme-background)',
            borderColor: 'var(--theme-border)',
            color: setupChoice === 'byok' 
              ? 'var(--theme-background)' 
              : 'var(--theme-foreground)',
            boxShadow: setupChoice === 'byok' 
              ? '4px 4px 0 var(--theme-shadow)' 
              : 'none'
          }}
        >
          <div className="flex items-start gap-16px">
            <HiOutlineKey className="w-24px h-24px flex-shrink-0 mt-2px" />
            <div className="flex-1">
              <h3 className="text-brutal-md uppercase mb-8px">
                Bring Your Own API Key (BYOK)
              </h3>
              <p className="text-brutal-sm mb-8px opacity-90">
                Use your own Google Gemini API key for unlimited AI features.
              </p>
              <ul className="text-brutal-xs space-y-4px opacity-75">
                <li>• No credit limits</li>
                <li>• No rate limiting from LTF1</li>
                <li>• Direct billing from Google</li>
                <li>• Your key is encrypted and secure</li>
              </ul>
            </div>
          </div>
        </button>

        {/* API Key Input (shown when BYOK is selected) */}
        {setupChoice === 'byok' && (
          <div className="space-y-12px animate-fadeIn">
            <label 
              className="block text-brutal-sm uppercase"
              style={{ color: 'var(--theme-foreground)' }}
            >
              Enter Your Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-16px py-12px border-2 font-mono text-brutal-sm"
              style={{
                backgroundColor: 'var(--theme-background)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-foreground)'
              }}
            />
            <div className="flex items-start gap-8px">
              <HiOutlineInformationCircle 
                className="w-16px h-16px flex-shrink-0 mt-1px"
                style={{ color: 'var(--theme-info)' }}
              />
              <p 
                className="text-brutal-xs"
                style={{ color: 'var(--theme-foreground-secondary)' }}
              >
                Get your API key from{' '}
                <a 
                  href="https://aistudio.google.com/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: 'var(--theme-info)' }}
                >
                  Google AI Studio
                </a>
                . Your key will be encrypted and stored securely.
              </p>
            </div>
          </div>
        )}

        {/* Option 3: Skip (only for non-first-time users) */}
        {!isFirstTimeUser && (
          <button
            onClick={() => setSetupChoice('skip')}
            className={`w-full p-20px border-2 text-left transition-all ${
              setupChoice === 'skip' ? 'translate-x-[-2px] translate-y-[-2px]' : ''
            }`}
            style={{
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-foreground-tertiary)',
              boxShadow: setupChoice === 'skip' 
                ? '4px 4px 0 var(--theme-shadow)' 
                : 'none'
            }}
          >
            <div className="text-center">
              <p className="text-brutal-sm">
                Skip for now (you can set this up later in Settings)
              </p>
            </div>
          </button>
        )}

        {/* Pro Plan Info */}
        <div 
          className="p-16px border-2"
          style={{ 
            backgroundColor: 'var(--theme-background-tertiary)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <h4 
            className="text-brutal-sm uppercase mb-8px"
            style={{ color: 'var(--theme-warning)' }}
          >
            ⭐ Pro Plan Available
          </h4>
          <p 
            className="text-brutal-xs"
            style={{ color: 'var(--theme-foreground-secondary)' }}
          >
            Upgrade to Pro for 10,000 credits/month using our infrastructure. 
            No API key needed, faster response times, and priority support.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-16px pt-16px">
          {!isFirstTimeUser && (
            <button
              onClick={onClose}
              className="flex-1 px-24px py-12px border-2 font-mono text-brutal-sm uppercase"
              style={{
                backgroundColor: 'var(--theme-background)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-foreground)'
              }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSetup}
            disabled={!setupChoice || (setupChoice === 'byok' && !apiKey) || isValidating}
            className="flex-1 px-24px py-12px border-2 font-mono text-brutal-sm uppercase disabled:opacity-50"
            style={{
              backgroundColor: setupChoice ? 'var(--theme-success)' : 'var(--theme-background-secondary)',
              borderColor: 'var(--theme-border)',
              color: setupChoice ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)'
            }}
          >
            {isValidating ? 'VALIDATING...' : 
             setupChoice === 'skip' ? 'SKIP' :
             setupChoice === 'byok' ? 'VALIDATE & SAVE KEY' :
             setupChoice === 'free' ? 'ACTIVATE FREE CREDITS' :
             'SELECT AN OPTION'}
          </button>
        </div>
      </div>
    </BrutalModal>
  )
}