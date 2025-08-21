import { useState } from 'react'
import BrutalModal from '../ui/BrutalModal'
import ThemeSwitcher from '../theme/ThemeSwitcher'
import { useTheme } from '../../contexts/ThemeContext'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import toast from 'react-hot-toast'
import { 
  HiOutlineColorSwatch, 
  HiOutlineSparkles, 
  HiOutlineCheck, 
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineX,
  HiOutlineKey,
  HiOutlineCreditCard,
  HiOutlineInformationCircle
} from 'react-icons/hi'

interface OnboardingFlowProps {
  isOpen: boolean
  onComplete: () => void
}

type OnboardingStep = 'theme' | 'ai' | 'complete'

export default function OnboardingFlow({ isOpen, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('theme')
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const { themeName, themeDescription } = useTheme()
  
  // AI Setup state
  const [aiSetupChoice, setAiSetupChoice] = useState<'free' | 'byok' | 'skip'>('')
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  
  const setupAICredits = useMutation(api.aiCredits.mutations.setupUserAI)
  const validateApiKey = useAction(api.aiCredits.actions.validateApiKey)
  const saveApiKey = useMutation(api.aiCredits.mutations.saveApiKey)

  const handleThemeComplete = () => {
    setCurrentStep('ai')
  }

  const handleBack = () => {
    if (currentStep === 'ai') {
      setCurrentStep('theme')
      setAiSetupChoice('') // Reset AI choice when going back
    }
  }

  const handleAIComplete = async () => {
    if (aiSetupChoice === 'skip') {
      setCurrentStep('complete')
      setTimeout(() => {
        onComplete()
      }, 1500)
      return
    }

    if (aiSetupChoice === 'byok' && !apiKey) {
      toast.error('Please enter your Gemini API key')
      return
    }

    setIsValidating(true)
    try {
      if (aiSetupChoice === 'byok') {
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
      } else if (aiSetupChoice === 'free') {
        // Setup free tier credits
        await setupAICredits({ 
          tier: 'free',
          setupType: 'free_credits' 
        })
        toast.success('Free AI credits activated! You have 100 credits to start.')
      }
      
      setCurrentStep('complete')
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (error) {
      toast.error('Setup failed. Please try again.')
      console.error(error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleSkipOnboarding = () => {
    // Close immediately without waiting for async operations
    onComplete()
  }

  const handleSkipWithConfirmation = () => {
    if (showSkipConfirm) {
      // User confirmed skip - close immediately
      onComplete()
    } else {
      // Show confirmation
      setShowSkipConfirm(true)
      setTimeout(() => setShowSkipConfirm(false), 3000) // Reset after 3 seconds
    }
  }

  // Progress indicator component
  const ProgressIndicator = () => (
    <div className="flex items-center gap-16px mb-32px">
      <div className="flex items-center gap-8px">
        <div 
          className="w-32px h-32px border-2 flex items-center justify-center cursor-pointer"
          style={{ 
            backgroundColor: currentStep === 'theme' || currentStep === 'ai' || currentStep === 'complete' 
              ? 'var(--theme-primary)' : 'var(--theme-background)',
            borderColor: 'var(--theme-primary)'
          }}
          onClick={() => currentStep !== 'theme' && setCurrentStep('theme')}
        >
          <span style={{ color: currentStep === 'theme' || currentStep === 'ai' || currentStep === 'complete' 
            ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)' }}>1</span>
        </div>
        <span 
          className="text-brutal-sm uppercase"
          style={{ color: currentStep === 'theme' || currentStep === 'ai' || currentStep === 'complete'
            ? 'var(--theme-foreground)' : 'var(--theme-foreground-tertiary)' }}
        >
          Theme
        </span>
      </div>
      <div 
        className="flex-1 h-2px"
        style={{ backgroundColor: currentStep === 'ai' || currentStep === 'complete' 
          ? 'var(--theme-primary)' : 'var(--theme-border)' }}
      />
      <div className="flex items-center gap-8px">
        <div 
          className="w-32px h-32px border-2 flex items-center justify-center"
          style={{ 
            backgroundColor: currentStep === 'ai' || currentStep === 'complete' 
              ? 'var(--theme-primary)' : 'var(--theme-background)',
            borderColor: currentStep === 'ai' || currentStep === 'complete' 
              ? 'var(--theme-primary)' : 'var(--theme-border)'
          }}
        >
          <span style={{ color: currentStep === 'ai' || currentStep === 'complete'
            ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)' }}>2</span>
        </div>
        <span 
          className="text-brutal-sm uppercase"
          style={{ color: currentStep === 'ai' || currentStep === 'complete'
            ? 'var(--theme-foreground)' : 'var(--theme-foreground-tertiary)' }}
        >
          AI Setup
        </span>
      </div>
    </div>
  )

  if (currentStep === 'complete') {
    return (
      <BrutalModal
        isOpen={isOpen}
        onClose={onComplete}
        title="Welcome to LTF1!"
        size="sm"
        showCloseButton={true}
      >
        <div className="text-center py-32px">
          <div 
            className="w-64px h-64px mx-auto mb-24px border-2 flex items-center justify-center"
            style={{ 
              borderColor: 'var(--theme-success)',
              backgroundColor: 'var(--theme-success)'
            }}
          >
            <HiOutlineCheck 
              className="w-32px h-32px"
              style={{ color: 'var(--theme-background)' }}
            />
          </div>
          <h2 
            className="text-brutal-lg uppercase mb-16px"
            style={{ color: 'var(--theme-foreground)' }}
          >
            Setup Complete!
          </h2>
          <p 
            className="text-brutal-sm"
            style={{ color: 'var(--theme-foreground-secondary)' }}
          >
            Launching your command center...
          </p>
        </div>
      </BrutalModal>
    )
  }

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={handleSkipOnboarding}
      title={currentStep === 'theme' ? "Welcome to LTF1 - Choose Your Theme" : "AI Configuration Setup"}
      size="lg"
      showCloseButton={true}
    >
      <div className="space-y-24px">
        {/* Progress Indicator - Always visible */}
        <ProgressIndicator />

        {/* Theme Selection Step */}
        {currentStep === 'theme' && (
          <>
            {/* Theme Selection Header */}
            <div 
              className="p-16px border-2"
              style={{ 
                backgroundColor: 'var(--theme-background-secondary)',
                borderColor: 'var(--theme-info)'
              }}
            >
              <div className="flex items-start gap-12px">
                <HiOutlineColorSwatch 
                  className="w-24px h-24px flex-shrink-0" 
                  style={{ color: 'var(--theme-info)' }}
                />
                <div>
                  <h3 
                    className="text-brutal-md uppercase mb-8px"
                    style={{ color: 'var(--theme-foreground)' }}
                  >
                    Personalize Your Command Center
                  </h3>
                </div>
              </div>
            </div>

            {/* Theme Switcher */}
            <div className="py-24px">
              <ThemeSwitcher size="xl" variant="grid" showLabel={true} />
            </div>

            {/* Current Theme Info */}
            <div 
              className="p-16px border-2"
              style={{ 
                backgroundColor: 'var(--theme-background-tertiary)',
                borderColor: 'var(--theme-border)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p 
                    className="text-brutal-xs uppercase mb-4px"
                    style={{ color: 'var(--theme-foreground-secondary)' }}
                  >
                    Current Selection
                  </p>
                  <h4 
                    className="text-brutal-md uppercase"
                    style={{ color: 'var(--theme-primary)' }}
                  >
                    {themeName}
                  </h4>
                  <p 
                    className="text-brutal-sm mt-4px"
                    style={{ color: 'var(--theme-foreground-secondary)' }}
                  >
                    {themeDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-8px">
              <p 
                className="text-brutal-xs flex items-center gap-8px"
                style={{ color: 'var(--theme-foreground-secondary)' }}
              >
                <span style={{ color: 'var(--theme-info)' }}>💡</span>
                Press Ctrl+Shift+T to quickly cycle through themes
              </p>
              <p 
                className="text-brutal-xs flex items-center gap-8px"
                style={{ color: 'var(--theme-foreground-secondary)' }}
              >
                <span style={{ color: 'var(--theme-info)' }}>💡</span>
                Type 'theme' in the terminal to change themes anytime
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-16px">
              <button
                onClick={handleSkipWithConfirmation}
                className="px-24px py-12px border-2 font-mono text-brutal-sm uppercase"
                style={{
                  backgroundColor: showSkipConfirm ? 'var(--theme-warning)' : 'var(--theme-background)',
                  borderColor: 'var(--theme-border)',
                  color: showSkipConfirm ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)'
                }}
              >
                {showSkipConfirm ? 'Click again to confirm skip' : 'Skip Onboarding'}
              </button>
              <button
                onClick={handleThemeComplete}
                className="px-32px py-16px border-2 font-mono text-brutal-md uppercase flex items-center gap-12px"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-background)',
                  boxShadow: '4px 4px 0 var(--theme-shadow)'
                }}
              >
                Continue to AI Setup
                <HiOutlineArrowRight className="w-20px h-20px" />
              </button>
            </div>
          </>
        )}

        {/* AI Setup Step */}
        {currentStep === 'ai' && (
          <>
            {/* AI Setup Header */}
            <div 
              className="p-16px border-2"
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

            {/* Option 1: Free Credits */}
            <button
              onClick={() => setAiSetupChoice('free')}
              className={`w-full p-20px border-2 text-left transition-all ${
                aiSetupChoice === 'free' ? 'translate-x-[-2px] translate-y-[-2px]' : ''
              }`}
              style={{
                backgroundColor: aiSetupChoice === 'free' 
                  ? 'var(--theme-primary)' 
                  : 'var(--theme-background)',
                borderColor: 'var(--theme-border)',
                color: aiSetupChoice === 'free' 
                  ? 'var(--theme-background)' 
                  : 'var(--theme-foreground)',
                boxShadow: aiSetupChoice === 'free' 
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
              onClick={() => setAiSetupChoice('byok')}
              className={`w-full p-20px border-2 text-left transition-all ${
                aiSetupChoice === 'byok' ? 'translate-x-[-2px] translate-y-[-2px]' : ''
              }`}
              style={{
                backgroundColor: aiSetupChoice === 'byok' 
                  ? 'var(--theme-primary)' 
                  : 'var(--theme-background)',
                borderColor: 'var(--theme-border)',
                color: aiSetupChoice === 'byok' 
                  ? 'var(--theme-background)' 
                  : 'var(--theme-foreground)',
                boxShadow: aiSetupChoice === 'byok' 
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
            {aiSetupChoice === 'byok' && (
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

            {/* Option 3: Skip */}
            <button
              onClick={() => setAiSetupChoice('skip')}
              className={`w-full p-20px border-2 text-center transition-all ${
                aiSetupChoice === 'skip' ? 'translate-x-[-2px] translate-y-[-2px]' : ''
              }`}
              style={{
                backgroundColor: 'var(--theme-background)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-foreground-tertiary)',
                boxShadow: aiSetupChoice === 'skip' 
                  ? '4px 4px 0 var(--theme-shadow)' 
                  : 'none'
              }}
            >
              <p className="text-brutal-sm">
                Skip for now (you can set this up later in Settings)
              </p>
            </button>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-16px">
              <button
                onClick={handleBack}
                className="px-24px py-12px border-2 font-mono text-brutal-sm uppercase flex items-center gap-8px"
                style={{
                  backgroundColor: 'var(--theme-background)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-foreground)'
                }}
              >
                <HiOutlineArrowLeft className="w-16px h-16px" />
                Back to Theme
              </button>
              <button
                onClick={handleAIComplete}
                disabled={!aiSetupChoice || (aiSetupChoice === 'byok' && !apiKey) || isValidating}
                className="px-32px py-16px border-2 font-mono text-brutal-md uppercase disabled:opacity-50"
                style={{
                  backgroundColor: aiSetupChoice ? 'var(--theme-success)' : 'var(--theme-background-secondary)',
                  borderColor: 'var(--theme-border)',
                  color: aiSetupChoice ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)',
                  boxShadow: aiSetupChoice ? '4px 4px 0 var(--theme-shadow)' : 'none'
                }}
              >
                {isValidating ? 'VALIDATING...' : 
                 aiSetupChoice === 'skip' ? 'Skip AI Setup' :
                 aiSetupChoice === 'byok' ? 'Validate & Save Key' :
                 aiSetupChoice === 'free' ? 'Activate Free Credits' :
                 'Select an Option'}
              </button>
            </div>
          </>
        )}
      </div>
    </BrutalModal>
  )
}