import { useState, useEffect } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { 
  HiOutlineSparkles, 
  HiOutlineKey, 
  HiOutlineCreditCard, 
  HiOutlineChartBar,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineExternalLink
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import SettingsSection from './SettingsSection'
import BrutalModal from '../../ui/BrutalModal'

export default function AISettingsTab() {
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  
  // Queries
  const userCredits = useQuery(api.aiCredits.queries.getUserAICredits)
  const monthlyStats = useQuery(api.aiCredits.queries.getMonthlyUsageStats)
  const pricingTiers = useQuery(api.aiCredits.queries.getPricingTiers)
  
  // Actions & Mutations
  const validateApiKey = useAction(api.aiCredits.actions.validateApiKey)
  const saveApiKey = useMutation(api.aiCredits.mutations.saveApiKey)
  const removeApiKey = useMutation(api.aiCredits.mutations.removeApiKey)
  const setupAICredits = useMutation(api.aiCredits.mutations.setupUserAI)

  const handleValidateAndSave = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key')
      return
    }

    setIsValidating(true)
    try {
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
      setApiKey('')
    } catch (error) {
      toast.error('Failed to save API key')
      console.error(error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveApiKey = async () => {
    try {
      await removeApiKey()
      toast.success('API key removed successfully')
      setShowRemoveModal(false)
    } catch (error) {
      toast.error('Failed to remove API key')
      console.error(error)
    }
  }

  const handleActivateFreeCredits = async () => {
    try {
      await setupAICredits({ 
        tier: 'free',
        setupType: 'free_credits' 
      })
      toast.success('Free AI credits activated! You have 100 credits to start.')
    } catch (error) {
      toast.error('Failed to activate free credits')
      console.error(error)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num))
  }

  return (
    <>
      {/* AI Configuration Status */}
      <SettingsSection
        title="AI Configuration"
        description="Manage your AI features and API key settings."
      >
        <div className="space-y-16px">
          {/* Current Status */}
          <div className="p-16px border-2" style={{ 
            backgroundColor: 'var(--theme-background-secondary)',
            borderColor: 'var(--theme-border)'
          }}>
            <div className="flex items-center justify-between mb-12px">
              <div className="flex items-center gap-12px">
                <HiOutlineSparkles className="w-24px h-24px" style={{ color: 'var(--theme-primary)' }} />
                <span className="text-brutal-md uppercase font-bold">
                  Status: {userCredits?.hasOwnKey ? 'BYOK Active' : 
                          userCredits?.hasSetup ? `${userCredits.subscriptionTier} Tier` : 
                          'Not Configured'}
                </span>
              </div>
              {userCredits?.hasOwnKey && (
                <span className="px-12px py-6px text-brutal-xs uppercase" style={{
                  backgroundColor: 'var(--theme-success)',
                  color: 'var(--theme-background)'
                }}>
                  Using Your Key
                </span>
              )}
            </div>
            
            {userCredits && (
              <div className="grid grid-cols-3 gap-16px mt-16px">
                <div>
                  <div className="text-brutal-xs uppercase opacity-70">Credits Remaining</div>
                  <div className="text-brutal-lg font-bold">
                    {userCredits.hasOwnKey ? '∞' : formatNumber(userCredits.creditsRemaining)}
                  </div>
                </div>
                <div>
                  <div className="text-brutal-xs uppercase opacity-70">Monthly Usage</div>
                  <div className="text-brutal-lg font-bold">
                    {formatNumber(userCredits.monthlyCreditsUsed)}
                  </div>
                </div>
                <div>
                  <div className="text-brutal-xs uppercase opacity-70">Total Requests</div>
                  <div className="text-brutal-lg font-bold">
                    {formatNumber(userCredits.totalRequests)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Setup Options for New Users */}
          {!userCredits?.hasSetup && (
            <div className="space-y-16px">
              <div className="text-brutal-sm uppercase" style={{ color: 'var(--theme-warning)' }}>
                ⚠️ AI features are not configured. Choose an option below:
              </div>
              
              {/* Free Credits Option */}
              <button
                onClick={handleActivateFreeCredits}
                className="w-full p-20px border-2 text-left hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                style={{
                  backgroundColor: 'var(--theme-background)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-foreground)',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '4px 4px 0 var(--theme-shadow)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div className="flex items-start gap-16px">
                  <HiOutlineCreditCard className="w-24px h-24px flex-shrink-0 mt-2px" />
                  <div className="flex-1">
                    <h3 className="text-brutal-md uppercase mb-8px">
                      Activate Free Credits
                    </h3>
                    <p className="text-brutal-sm mb-8px opacity-90">
                      Get 100 free AI credits per month to try out AI features.
                    </p>
                    <ul className="text-brutal-xs space-y-4px opacity-75">
                      <li>• 100 credits/month (renews monthly)</li>
                      <li>• ~50 task generations or code reviews</li>
                      <li>• Rate limited to 10 requests/hour</li>
                    </ul>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* API Key Management */}
          {userCredits?.hasOwnKey ? (
            <div className="space-y-16px">
              <div className="p-16px border-2" style={{
                backgroundColor: 'var(--theme-success)' + '20',
                borderColor: 'var(--theme-success)'
              }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-brutal-sm uppercase mb-4px">Gemini API Key Active</div>
                    <div className="text-brutal-xs opacity-70">
                      Added on {userCredits.keyAddedAt ? new Date(userCredits.keyAddedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRemoveModal(true)}
                    className="px-16px py-8px border-2 font-mono text-brutal-sm uppercase hover:bg-opacity-20 transition-colors"
                    style={{
                      borderColor: 'var(--theme-error)',
                      color: 'var(--theme-error)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <HiOutlineTrash className="inline-block w-16px h-16px mr-8px" />
                    Remove Key
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-16px">
              <div>
                <label className="block text-brutal-sm uppercase mb-8px">
                  Add Your Gemini API Key (BYOK)
                </label>
                <div className="flex gap-8px">
                  <div className="flex-1 relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIza..."
                      className="w-full px-16px py-12px pr-48px border-2 font-mono text-brutal-sm"
                      style={{
                        backgroundColor: 'var(--theme-background)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-foreground)'
                      }}
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-12px top-1/2 transform -translate-y-1/2"
                      style={{ color: 'var(--theme-foreground-secondary)' }}
                    >
                      {showApiKey ? (
                        <HiOutlineEyeOff className="w-20px h-20px" />
                      ) : (
                        <HiOutlineEye className="w-20px h-20px" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={handleValidateAndSave}
                    disabled={!apiKey || isValidating}
                    className="px-24px py-12px border-2 font-mono text-brutal-sm uppercase disabled:opacity-50"
                    style={{
                      backgroundColor: apiKey ? 'var(--theme-primary)' : 'var(--theme-background-secondary)',
                      borderColor: 'var(--theme-border)',
                      color: apiKey ? 'var(--theme-background)' : 'var(--theme-foreground-tertiary)'
                    }}
                  >
                    {isValidating ? 'Validating...' : 'Validate & Save'}
                  </button>
                </div>
                <div className="mt-8px text-brutal-xs" style={{ color: 'var(--theme-foreground-secondary)' }}>
                  Get your API key from{' '}
                  <a 
                    href="https://aistudio.google.com/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-4px"
                    style={{ color: 'var(--theme-info)' }}
                  >
                    Google AI Studio
                    <HiOutlineExternalLink className="w-12px h-12px" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Usage Statistics */}
      {monthlyStats && (
        <SettingsSection
          title="Monthly Usage Statistics"
          description="Your AI usage for the current month."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16px">
            <div className="p-16px border-2 text-center" style={{
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-border)'
            }}>
              <div className="text-brutal-2xl font-bold" style={{ color: 'var(--theme-primary)' }}>
                {monthlyStats.totalRequests}
              </div>
              <div className="text-brutal-xs uppercase">Total Requests</div>
            </div>
            
            <div className="p-16px border-2 text-center" style={{
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-border)'
            }}>
              <div className="text-brutal-2xl font-bold" style={{ color: 'var(--theme-success)' }}>
                {monthlyStats.successfulRequests}
              </div>
              <div className="text-brutal-xs uppercase">Successful</div>
            </div>
            
            <div className="p-16px border-2 text-center" style={{
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-border)'
            }}>
              <div className="text-brutal-2xl font-bold" style={{ color: 'var(--theme-info)' }}>
                {formatNumber(monthlyStats.totalTokensUsed)}
              </div>
              <div className="text-brutal-xs uppercase">Tokens Used</div>
            </div>
            
            <div className="p-16px border-2 text-center" style={{
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-border)'
            }}>
              <div className="text-brutal-2xl font-bold" style={{ color: 'var(--theme-warning)' }}>
                {Math.round(monthlyStats.averageResponseTime)}ms
              </div>
              <div className="text-brutal-xs uppercase">Avg Response</div>
            </div>
          </div>

          {/* Usage by Type */}
          {Object.keys(monthlyStats.requestsByType).length > 0 && (
            <div className="mt-24px">
              <h4 className="text-brutal-sm uppercase mb-12px">Usage by Feature</h4>
              <div className="space-y-8px">
                {Object.entries(monthlyStats.requestsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-8px border" style={{
                    backgroundColor: 'var(--theme-background-secondary)',
                    borderColor: 'var(--theme-border)'
                  }}>
                    <span className="text-brutal-sm uppercase">{type.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-brutal-sm">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SettingsSection>
      )}

      {/* Pricing Tiers */}
      <SettingsSection
        title="Pricing & Plans"
        description="Available plans and their features."
      >
        <div className="grid gap-16px">
          {pricingTiers?.map((tier) => (
            <div 
              key={tier.tier}
              className="p-16px border-2"
              style={{
                backgroundColor: userCredits?.subscriptionTier === tier.tier 
                  ? 'var(--theme-primary)' + '10'
                  : 'var(--theme-background)',
                borderColor: userCredits?.subscriptionTier === tier.tier 
                  ? 'var(--theme-primary)'
                  : 'var(--theme-border)'
              }}
            >
              <div className="flex items-start justify-between mb-12px">
                <div>
                  <h3 className="text-brutal-md uppercase mb-4px">
                    {tier.tier} Plan
                    {userCredits?.subscriptionTier === tier.tier && (
                      <span className="ml-8px px-8px py-2px text-brutal-xs" style={{
                        backgroundColor: 'var(--theme-primary)',
                        color: 'var(--theme-background)'
                      }}>
                        CURRENT
                      </span>
                    )}
                  </h3>
                  <div className="text-brutal-sm opacity-90">
                    {formatNumber(tier.monthlyFreeCredits)} credits/month
                    {tier.creditPrice > 0 && ` • $${tier.creditPrice}/credit after`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-brutal-xs uppercase opacity-70">Rate Limits</div>
                  <div className="text-brutal-sm">
                    {tier.requestsPerMinute}/min • {tier.requestsPerDay === -1 ? '∞' : tier.requestsPerDay}/day
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8px">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="text-brutal-xs flex items-center gap-4px">
                    <span style={{ color: 'var(--theme-success)' }}>✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Remove API Key Confirmation Modal */}
      {showRemoveModal && (
        <BrutalModal
          isOpen={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          title="Remove API Key?"
          size="sm"
        >
          <div className="space-y-16px">
            <p className="text-brutal-md">
              Are you sure you want to remove your API key? You'll switch back to using credits.
            </p>
            <div className="flex gap-16px">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="flex-1 px-24px py-12px border-2 font-mono text-brutal-sm uppercase"
                style={{
                  backgroundColor: 'var(--theme-background)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-foreground)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveApiKey}
                className="flex-1 px-24px py-12px border-2 font-mono text-brutal-sm uppercase"
                style={{
                  backgroundColor: 'var(--theme-error)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-background)'
                }}
              >
                Remove Key
              </button>
            </div>
          </div>
        </BrutalModal>
      )}
    </>
  )
}