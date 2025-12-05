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
  HiOutlineExternalLink,
  HiOutlineLightningBolt
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import SettingsSection from './SettingsSection'
import { BrutalCard, BrutalButton, BrutalBadge } from '@/components/ui'
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
      toast.error('ENTER_API_KEY')
      return
    }

    setIsValidating(true)
    try {
      // First validate the API key
      const validationResult = await validateApiKey({ apiKey })
      if (!validationResult.isValid) {
        toast.error(validationResult.error || 'INVALID_KEY')
        setIsValidating(false)
        return
      }

      // Then save it if valid
      await saveApiKey({ apiKey })
      toast.success('KEY_SAVED')
      setApiKey('')
    } catch (error) {
      toast.error('SAVE_FAILED')
      console.error(error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveApiKey = async () => {
    try {
      await removeApiKey()
      toast.success('KEY_REMOVED')
      setShowRemoveModal(false)
    } catch (error) {
      toast.error('REMOVE_FAILED')
      console.error(error)
    }
  }

  const handleActivateFreeCredits = async () => {
    try {
      await setupAICredits({
        tier: 'free',
        setupType: 'free_credits'
      })
      toast.success('FREE_CREDITS_ACTIVE')
    } catch (error) {
      toast.error('ACTIVATION_FAILED')
      console.error(error)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num))
  }

  return (
    <div className="space-y-8">
      {/* AI Configuration Status */}
      <SettingsSection
        title="AI Configuration"
        description="Manage your AI features and API key settings."
      >
        <div className="space-y-6">
          {/* Current Status */}
          <BrutalCard className="p-6 border-l-4 border-l-[var(--theme-primary)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--theme-primary)]/10 border-2 border-[var(--theme-primary)] text-[var(--theme-primary)]">
                  <HiOutlineSparkles className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold uppercase">
                    STATUS: {userCredits?.hasOwnKey ? 'BYOK_ACTIVE' :
                      userCredits?.hasSetup ? `${userCredits.subscriptionTier}_TIER` :
                        'NOT_CONFIGURED'}
                  </h4>
                  {userCredits?.hasOwnKey && (
                    <BrutalBadge variant="success" className="mt-1">
                      USING_YOUR_KEY
                    </BrutalBadge>
                  )}
                </div>
              </div>
            </div>

            {userCredits && (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] text-center">
                  <div className="text-xs uppercase font-bold text-[var(--theme-foreground)]/60 mb-1">CREDITS_REMAINING</div>
                  <div className="text-2xl font-bold">
                    {userCredits.hasOwnKey ? '∞' : formatNumber(userCredits.creditsRemaining)}
                  </div>
                </div>
                <div className="p-4 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] text-center">
                  <div className="text-xs uppercase font-bold text-[var(--theme-foreground)]/60 mb-1">MONTHLY_USAGE</div>
                  <div className="text-2xl font-bold">
                    {formatNumber(userCredits.monthlyCreditsUsed)}
                  </div>
                </div>
                <div className="p-4 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] text-center">
                  <div className="text-xs uppercase font-bold text-[var(--theme-foreground)]/60 mb-1">TOTAL_REQUESTS</div>
                  <div className="text-2xl font-bold">
                    {formatNumber(userCredits.totalRequests)}
                  </div>
                </div>
              </div>
            )}
          </BrutalCard>

          {/* Setup Options for New Users */}
          {!userCredits?.hasSetup && (
            <BrutalCard className="p-6 border-brutal-warning bg-brutal-warning/5">
              <div className="flex items-start gap-4 mb-6">
                <HiOutlineLightningBolt className="w-6 h-6 text-brutal-warning flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold uppercase mb-2">AI_NOT_CONFIGURED</h3>
                  <p className="text-sm font-mono">Activate free credits to start using AI features.</p>
                </div>
              </div>

              <BrutalButton
                onClick={handleActivateFreeCredits}
                className="w-full flex items-center justify-center gap-2 py-4"
              >
                <HiOutlineCreditCard className="w-5 h-5" />
                ACTIVATE_FREE_CREDITS
              </BrutalButton>

              <div className="mt-4 text-xs font-mono text-[var(--theme-foreground)]/60 space-y-1 pl-4 border-l-2 border-[var(--theme-foreground)]/20">
                <p>• 100 CREDITS/MONTH (RENEWS MONTHLY)</p>
                <p>• ~50 GENERATIONS OR REVIEWS</p>
                <p>• RATE LIMIT: 10 REQ/HOUR</p>
              </div>
            </BrutalCard>
          )}

          {/* API Key Management */}
          {userCredits?.hasOwnKey ? (
            <BrutalCard className="p-6 border-brutal-success/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold uppercase mb-1">GEMINI_API_KEY_ACTIVE</div>
                  <div className="text-xs text-[var(--theme-foreground)]/60 font-mono">
                    ADDED: {userCredits.keyAddedAt ? new Date(userCredits.keyAddedAt).toLocaleDateString() : 'UNKNOWN'}
                  </div>
                </div>
                <BrutalButton
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRemoveModal(true)}
                  className="flex items-center gap-2"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                  REMOVE_KEY
                </BrutalButton>
              </div>
            </BrutalCard>
          ) : (
            <BrutalCard className="p-6">
              <h3 className="text-sm font-bold uppercase mb-4">ADD_GEMINI_API_KEY (BYOK)</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full p-3 pr-12 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)]"
                  >
                    {showApiKey ? (
                      <HiOutlineEyeOff className="w-5 h-5" />
                    ) : (
                      <HiOutlineEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <BrutalButton
                  onClick={handleValidateAndSave}
                  disabled={!apiKey || isValidating}
                  className="flex items-center justify-center gap-2 min-w-[160px]"
                >
                  {isValidating ? 'VALIDATING...' : 'VALIDATE_&_SAVE'}
                </BrutalButton>
              </div>
              <div className="mt-3 text-xs font-mono text-[var(--theme-foreground)]/60">
                GET_KEY_FROM{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--theme-primary)] hover:underline inline-flex items-center gap-1 font-bold"
                >
                  GOOGLE_AI_STUDIO
                  <HiOutlineExternalLink className="w-3 h-3" />
                </a>
              </div>
            </BrutalCard>
          )}
        </div>
      </SettingsSection>

      {/* Usage Statistics */}
      {monthlyStats && (
        <SettingsSection
          title="Monthly Usage Statistics"
          description="Your AI usage for the current month."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'TOTAL_REQUESTS', value: monthlyStats.totalRequests, color: 'text-[var(--theme-primary)]' },
              { label: 'SUCCESSFUL', value: monthlyStats.successfulRequests, color: 'text-brutal-success' },
              { label: 'TOKENS_USED', value: formatNumber(monthlyStats.totalTokensUsed), color: 'text-brutal-info' },
              { label: 'AVG_RESPONSE', value: `${Math.round(monthlyStats.averageResponseTime)}ms`, color: 'text-brutal-warning' }
            ].map((stat, i) => (
              <BrutalCard key={i} className="p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs uppercase font-bold text-[var(--theme-foreground)]/60 mt-1">{stat.label}</div>
              </BrutalCard>
            ))}
          </div>

          {/* Usage by Type */}
          {Object.keys(monthlyStats.requestsByType).length > 0 && (
            <BrutalCard className="mt-6 p-6">
              <h4 className="text-sm font-bold uppercase mb-4">USAGE_BY_FEATURE</h4>
              <div className="space-y-2">
                {Object.entries(monthlyStats.requestsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-[var(--theme-background)] border border-[var(--theme-border)]">
                    <span className="text-xs font-bold uppercase">{type.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-sm font-bold">{count as number}</span>
                  </div>
                ))}
              </div>
            </BrutalCard>
          )}
        </SettingsSection>
      )}

      {/* Pricing Tiers */}
      <SettingsSection
        title="Pricing & Plans"
        description="Available plans and their features."
      >
        <div className="grid gap-4">
          {pricingTiers?.map((tier) => (
            <BrutalCard
              key={tier.tier}
              className={`p-6 transition-all ${userCredits?.subscriptionTier === tier.tier
                  ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/5'
                  : ''
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold uppercase flex items-center gap-2">
                    {tier.tier}_PLAN
                    {userCredits?.subscriptionTier === tier.tier && (
                      <BrutalBadge variant="primary">CURRENT</BrutalBadge>
                    )}
                  </h3>
                  <div className="text-sm font-mono text-[var(--theme-foreground)]/80 mt-1">
                    {formatNumber(tier.monthlyFreeCredits)} CREDITS/MONTH
                    {tier.creditPrice > 0 && ` • $${tier.creditPrice}/CREDIT AFTER`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase font-bold text-[var(--theme-foreground)]/60">RATE_LIMITS</div>
                  <div className="text-sm font-mono font-bold">
                    {tier.requestsPerMinute}/MIN • {tier.requestsPerDay === -1 ? '∞' : tier.requestsPerDay}/DAY
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 pt-4 border-t border-[var(--theme-border)]">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="text-xs font-mono uppercase flex items-center gap-2">
                    <span className="text-brutal-success font-bold">✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </BrutalCard>
          ))}
        </div>
      </SettingsSection>

      {/* Remove API Key Confirmation Modal */}
      {showRemoveModal && (
        <BrutalModal
          isOpen={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          title="REMOVE_API_KEY?"
        >
          <div className="space-y-6">
            <p className="font-mono text-sm">
              Are you sure you want to remove your API key? You'll switch back to using credits.
            </p>
            <div className="flex gap-4">
              <BrutalButton
                variant="secondary"
                onClick={() => setShowRemoveModal(false)}
                className="flex-1"
              >
                CANCEL
              </BrutalButton>
              <BrutalButton
                variant="destructive"
                onClick={handleRemoveApiKey}
                className="flex-1"
              >
                CONFIRM_REMOVE
              </BrutalButton>
            </div>
          </div>
        </BrutalModal>
      )}
    </div>
  )
}