import { useState } from 'react'
import { HiOutlineSparkles, HiOutlineKey, HiOutlineCreditCard, HiOutlineInformationCircle } from 'react-icons/hi'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import BrutalModal from '@/components/ui/BrutalModal'

// --- Sub-components ---

interface SetupOptionCardProps {
  isSelected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
  bulletPoints: string[]
}

function SetupOptionCard({ isSelected, onClick, icon, title, description, bulletPoints }: SetupOptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-20px border-2 text-left transition-all ${
        isSelected ? 'translate-x-[-2px] translate-y-[-2px]' : ''
      }`}
      style={{
        backgroundColor: isSelected
          ? 'var(--theme-primary)'
          : 'var(--theme-background)',
        borderColor: 'var(--theme-border)',
        color: isSelected
          ? 'var(--theme-background)'
          : 'var(--theme-foreground)',
        boxShadow: isSelected
          ? '4px 4px 0 var(--theme-shadow)'
          : 'none'
      }}
    >
      <div className="flex items-start gap-[10px]">
        <div className="w-4 h-4 flex-shrink-0 mt-2px">{icon}</div>
        <div className="flex-1">
          <h3 className="text-brutal-md uppercase mb-[8px]">
            {title}
          </h3>
          <p className="text-brutal-sm mb-[8px] opacity-90">
            {description}
          </p>
          <ul className="text-brutal-xs space-y-4px opacity-75">
            {bulletPoints.map((point) => (
              <li key={point}>• {point}</li>
            ))}
          </ul>
        </div>
      </div>
    </button>
  )
}

interface ApiKeyInputSectionProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
}

function ApiKeyInputSection({ apiKey, onApiKeyChange }: ApiKeyInputSectionProps) {
  return (
    <div className="space-y-[6px] animate-fadeIn">
      <label
        htmlFor="ai-setup-api-key"
        className="block text-brutal-sm uppercase"
        style={{ color: 'var(--theme-foreground)' }}
      >
        Enter Your Gemini API Key
      </label>
      <input
        id="ai-setup-api-key"
        type="password"
        value={apiKey}
        onChange={(e) => onApiKeyChange(e.target.value)}
        placeholder="AIza..."
        className="w-full px-[10px] py-[8px] border-2 font-mono text-brutal-sm"
        style={{
          backgroundColor: 'var(--theme-background)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-foreground)'
        }}
      />
      <div className="flex items-start gap-[8px]">
        <HiOutlineInformationCircle
          className="w-4 h-4 flex-shrink-0 mt-1px"
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
  )
}

function ProPlanInfo() {
  return (
    <div
      className="p-[10px] border-2"
      style={{
        backgroundColor: 'var(--theme-background-tertiary)',
        borderColor: 'var(--theme-border)'
      }}
    >
      <h4
        className="text-brutal-sm uppercase mb-[8px]"
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
  )
}

// --- Main Component ---

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
      <div className="space-y-[12px]">
        {/* Welcome message for first-time users */}
        {isFirstTimeUser && (
          <div 
            className="p-[10px] border-2 mb-[12px]"
            style={{ 
              backgroundColor: 'var(--theme-background-secondary)',
              borderColor: 'var(--theme-info)'
            }}
          >
            <div className="flex items-start gap-[6px]">
              <HiOutlineSparkles 
                className="w-4 h-4 flex-shrink-0" 
                style={{ color: 'var(--theme-info)' }}
              />
              <div>
                <h3 
                  className="text-brutal-md uppercase mb-[8px]"
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
        <SetupOptionCard
          isSelected={setupChoice === 'free'}
          onClick={() => setSetupChoice('free')}
          icon={<HiOutlineCreditCard className="w-4 h-4" />}
          title="Start with Free Credits"
          description="Get 100 free AI credits per month. Perfect for trying out AI features."
          bulletPoints={[
            '100 credits/month (renews monthly)',
            '~50 task generations or code reviews',
            'Rate limited to 10 requests/hour',
            'Upgrade anytime for more credits'
          ]}
        />

        {/* Option 2: BYOK */}
        <SetupOptionCard
          isSelected={setupChoice === 'byok'}
          onClick={() => setSetupChoice('byok')}
          icon={<HiOutlineKey className="w-4 h-4" />}
          title="Bring Your Own API Key (BYOK)"
          description="Use your own Google Gemini API key for unlimited AI features."
          bulletPoints={[
            'No credit limits',
            'No rate limiting from LTF1',
            'Direct billing from Google',
            'Your key is encrypted and secure'
          ]}
        />

        {/* API Key Input (shown when BYOK is selected) */}
        {setupChoice === 'byok' && (
          <ApiKeyInputSection
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
          />
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
        <ProPlanInfo />

        {/* Action Buttons */}
        <div className="flex gap-[10px] pt-[8px]">
          {!isFirstTimeUser && (
            <button
              onClick={onClose}
              className="flex-1 px-[12px] py-[8px] border-2 font-mono text-brutal-sm uppercase"
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
            className="flex-1 px-[12px] py-[8px] border-2 font-mono text-brutal-sm uppercase disabled:opacity-50"
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