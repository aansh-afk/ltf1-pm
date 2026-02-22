import { useReducer } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { useUser } from '@clerk/clerk-react'
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
import BrutalCard from '@/components/ui/BrutalCard'
import BrutalButton from '@/components/ui/BrutalButton'
import BrutalBadge from '@/components/ui/BrutalBadge'
import BrutalModal from '../../ui/BrutalModal'

type AIProvider = 'cerebras' | 'groq'

const PROVIDER_INFO: Record<AIProvider, { label: string; color: string; placeholder: string; helpUrl: string; helpLabel: string }> = {
  cerebras: {
    label: 'Cerebras',
    color: '#6366F1',
    placeholder: 'csk-...',
    helpUrl: 'https://cloud.cerebras.ai',
    helpLabel: 'Cerebras Cloud',
  },
  groq: {
    label: 'Groq',
    color: '#F59E0B',
    placeholder: 'gsk_...',
    helpUrl: 'https://console.groq.com/keys',
    helpLabel: 'Groq Console',
  },
}

type AISettingsState = {
  selectedProvider: AIProvider
  apiKey: string
  showApiKey: boolean
  isValidating: boolean
  removeKeyId: string | null
}

const aiSettingsInitialState: AISettingsState = {
  selectedProvider: 'cerebras',
  apiKey: '',
  showApiKey: false,
  isValidating: false,
  removeKeyId: null,
}

type AISettingsAction =
  | { type: 'UPDATE'; field: keyof AISettingsState; value: AISettingsState[keyof AISettingsState] }
  | { type: 'RESET' }

function aiSettingsReducer(state: AISettingsState, action: AISettingsAction): AISettingsState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return aiSettingsInitialState
    default:
      return state
  }
}

// --- Sub-components ---

interface AIStatusCardProps {
  activeKeys: Array<{ _id: string; provider: string }>;
  userCredits: { hasSetup: boolean; subscriptionTier: string; creditsRemaining: number; monthlyCreditsUsed: number } | null | undefined;
  formatNumber: (num: number) => string;
}

function AIStatusCard({ activeKeys, userCredits, formatNumber }: AIStatusCardProps) {
  return (
    <BrutalCard className="p-6 border-l-4 border-l-[var(--theme-primary)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--theme-primary)]/10 border-2 border-[var(--theme-primary)] text-[var(--theme-primary)]">
            <HiOutlineSparkles className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold uppercase">
              STATUS: {activeKeys.length > 0 ? 'BYOK_ACTIVE' :
                userCredits?.hasSetup ? `${userCredits.subscriptionTier}_TIER` :
                  'NOT_CONFIGURED'}
            </h4>
            {activeKeys.length > 0 && (
              <div className="flex gap-2 mt-1">
                {activeKeys.map(k => (
                  <BrutalBadge key={k._id} variant="success">
                    {k.provider.toUpperCase()}
                  </BrutalBadge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {userCredits && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] text-center">
            <div className="text-xs uppercase font-bold text-[var(--theme-foreground)]/60 mb-1">CREDITS</div>
            <div className="text-2xl font-bold">
              {activeKeys.length > 0 ? '∞' : formatNumber(userCredits.creditsRemaining)}
            </div>
          </div>
          <div className="p-4 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] text-center">
            <div className="text-xs uppercase font-bold text-[var(--theme-foreground)]/60 mb-1">MONTHLY USAGE</div>
            <div className="text-2xl font-bold">
              {formatNumber(userCredits.monthlyCreditsUsed)}
            </div>
          </div>
          <div className="p-4 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] text-center">
            <div className="text-xs uppercase font-bold text-[var(--theme-foreground)]/60 mb-1">PROVIDERS</div>
            <div className="text-2xl font-bold">
              {activeKeys.length}
            </div>
          </div>
        </div>
      )}
    </BrutalCard>
  )
}

interface SavedKeysSectionProps {
  providerKeys: Array<{ _id: string; provider: AIProvider; isActive: boolean; maskedKey: string; displayName?: string }>;
  onToggleActive: (keyId: string, currentActive: boolean) => void;
  onRemoveKey: (keyId: string) => void;
}

function SavedKeysSection({ providerKeys, onToggleActive, onRemoveKey }: SavedKeysSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase">SAVED API KEYS</h3>
      {providerKeys.map(key => {
        const info = PROVIDER_INFO[key.provider]
        return (
          <BrutalCard key={key._id} className={`p-4 ${key.isActive ? 'border-l-4' : 'opacity-60'}`} style={key.isActive ? { borderLeftColor: info.color } : undefined}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }} />
                <div>
                  <div className="text-sm font-bold uppercase">{info.label}</div>
                  <div className="text-xs font-mono text-[var(--theme-foreground)]/60">
                    {key.maskedKey} {key.displayName ? `(${key.displayName})` : ''}
                  </div>
                </div>
                {key.isActive && (
                  <BrutalBadge variant="success">ACTIVE</BrutalBadge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <BrutalButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onToggleActive(key._id, key.isActive)}
                >
                  {key.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                </BrutalButton>
                <BrutalButton
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveKey(key._id)}
                  className="flex items-center gap-1"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </BrutalButton>
              </div>
            </div>
          </BrutalCard>
        )
      })}
    </div>
  )
}

interface AddApiKeyFormProps {
  selectedProvider: AIProvider;
  apiKey: string;
  showApiKey: boolean;
  isValidating: boolean;
  onProviderChange: (provider: AIProvider) => void;
  onApiKeyChange: (value: string) => void;
  onToggleShowKey: () => void;
  onValidateAndSave: () => void;
}

function AddApiKeyForm({ selectedProvider, apiKey, showApiKey, isValidating, onProviderChange, onApiKeyChange, onToggleShowKey, onValidateAndSave }: AddApiKeyFormProps) {
  return (
    <BrutalCard className="p-6">
      <h3 className="text-sm font-bold uppercase mb-4">ADD API KEY (BYOK)</h3>

      {/* Provider Selector */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(PROVIDER_INFO) as AIProvider[]).map(provider => {
          const info = PROVIDER_INFO[provider]
          const isSelected = selectedProvider === provider
          return (
            <button
              key={provider}
              onClick={() => onProviderChange(provider)}
              className={`flex items-center gap-2 px-4 py-2 border-2 font-bold text-xs uppercase transition-all ${
                isSelected
                  ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 text-[var(--theme-foreground)]'
                  : 'border-[var(--theme-border)] text-[var(--theme-foreground)]/60 hover:border-[var(--theme-foreground)]/40'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
              {info.label}
            </button>
          )
        })}
      </div>

      {/* Key Input */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={PROVIDER_INFO[selectedProvider].placeholder}
            aria-label={`${PROVIDER_INFO[selectedProvider].label} API key`}
            className="w-full p-3 pr-12 bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-sm focus:border-[var(--theme-primary)] outline-none"
          />
          <button
            type="button"
            onClick={onToggleShowKey}
            aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
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
          onClick={onValidateAndSave}
          disabled={!apiKey || isValidating}
          className="flex items-center justify-center gap-2 min-w-[160px]"
        >
          {isValidating ? 'VALIDATING...' : 'VALIDATE & SAVE'}
        </BrutalButton>
      </div>
      <div className="mt-3 text-xs font-mono text-[var(--theme-foreground)]/60">
        Get key from{' '}
        <a
          href={PROVIDER_INFO[selectedProvider].helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--theme-primary)] hover:underline inline-flex items-center gap-1 font-bold"
        >
          {PROVIDER_INFO[selectedProvider].helpLabel}
          <HiOutlineExternalLink className="w-3 h-3" />
        </a>
      </div>
    </BrutalCard>
  )
}

interface UsageStatsSectionProps {
  monthlyStats: {
    totalRequests: number;
    successfulRequests: number;
    totalTokensUsed: number;
    averageResponseTime: number;
    requestsByType: Record<string, number>;
  };
  formatNumber: (num: number) => string;
}

function UsageStatsSection({ monthlyStats, formatNumber }: UsageStatsSectionProps) {
  return (
    <SettingsSection
      title="Monthly Usage Statistics"
      description="Your AI usage for the current month."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL REQUESTS', value: monthlyStats.totalRequests, color: 'text-[var(--theme-primary)]' },
          { label: 'SUCCESSFUL', value: monthlyStats.successfulRequests, color: 'text-brutal-success' },
          { label: 'TOKENS USED', value: formatNumber(monthlyStats.totalTokensUsed), color: 'text-brutal-info' },
          { label: 'AVG RESPONSE', value: `${Math.round(monthlyStats.averageResponseTime)}ms`, color: 'text-brutal-warning' }
        ].map((stat) => (
          <BrutalCard key={stat.label} className="p-4 text-center">
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
          <h4 className="text-sm font-bold uppercase mb-4">USAGE BY FEATURE</h4>
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
  )
}

// --- Main Component ---

export default function AISettingsTab() {
  const { user } = useUser()
  const [state, dispatch] = useReducer(aiSettingsReducer, aiSettingsInitialState)
  const { selectedProvider, apiKey, showApiKey, isValidating, removeKeyId } = state

  // Legacy queries (keep for backward compat display)
  const userCredits = useQuery(api.aiCredits.queries.getUserAICredits)
  const monthlyStats = useQuery(api.aiCredits.queries.getMonthlyUsageStats)

  // New multi-provider queries
  const providerKeys = useQuery(
    api.ai.keyManagement.getMyProviderKeys
  )

  // Actions & Mutations
  const saveProviderKey = useAction(api.ai.keyManagement.saveProviderKey)
  const removeProviderKey = useMutation(api.ai.keyManagement.removeProviderKey)
  const updateProviderKey = useMutation(api.ai.keyManagement.updateProviderKey)

  // Legacy mutations (keep for backward compat)
  const setupAICredits = useMutation(api.aiCredits.mutations.setupUserAI)

  const handleValidateAndSave = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key')
      return
    }
    if (!user) {
      toast.error('Not authenticated')
      return
    }

    dispatch({ type: 'UPDATE', field: 'isValidating', value: true })
    try {
      const result = await saveProviderKey({
        scope: 'user',
        scopeId: user.id,
        provider: selectedProvider,
        apiKey,
        displayName: `My ${PROVIDER_INFO[selectedProvider].label} Key`,
      })

      if (!result.success) {
        toast.error(result.error || 'Invalid API key')
        return
      }

      toast.success(`${PROVIDER_INFO[selectedProvider].label} key saved`)
      dispatch({ type: 'UPDATE', field: 'apiKey', value: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to save key')
      console.error(error)
    } finally {
      dispatch({ type: 'UPDATE', field: 'isValidating', value: false })
    }
  }

  const handleRemoveKey = async () => {
    if (!removeKeyId) return
    try {
      await removeProviderKey({ keyId: removeKeyId as any })
      toast.success('API key removed')
      dispatch({ type: 'UPDATE', field: 'removeKeyId', value: null })
    } catch (error) {
      toast.error('Failed to remove key')
      console.error(error)
    }
  }

  const handleToggleActive = async (keyId: string, currentActive: boolean) => {
    try {
      await updateProviderKey({ keyId: keyId as any, isActive: !currentActive })
      toast.success(currentActive ? 'Key deactivated' : 'Key activated')
    } catch (error) {
      toast.error('Failed to update key')
      console.error(error)
    }
  }

  const handleActivateFreeCredits = async () => {
    try {
      await setupAICredits({
        tier: 'free',
        setupType: 'free_credits'
      })
      toast.success('Free credits activated')
    } catch (error) {
      toast.error('Activation failed')
      console.error(error)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num))
  }

  const activeKeys = providerKeys?.filter(k => k.isActive) || []

  return (
    <div className="space-y-8">
      {/* AI Configuration Status */}
      <SettingsSection
        title="AI Configuration"
        description="Manage your AI providers and API keys. Add keys for Cerebras or Groq."
      >
        <div className="space-y-6">
          {/* Current Status */}
          <AIStatusCard activeKeys={activeKeys} userCredits={userCredits} formatNumber={formatNumber} />

          {/* Setup Options for New Users */}
          {!userCredits?.hasSetup && activeKeys.length === 0 && (
            <BrutalCard className="p-6 border-brutal-warning bg-brutal-warning/5">
              <div className="flex items-start gap-4 mb-6">
                <HiOutlineLightningBolt className="w-6 h-6 text-brutal-warning flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold uppercase mb-2">AI NOT CONFIGURED</h3>
                  <p className="text-sm font-mono">Add an API key below or activate free credits to start using AI features.</p>
                </div>
              </div>

              <BrutalButton
                onClick={handleActivateFreeCredits}
                className="w-full flex items-center justify-center gap-2 py-4"
              >
                <HiOutlineCreditCard className="w-5 h-5" />
                ACTIVATE FREE CREDITS
              </BrutalButton>

              <div className="mt-4 text-xs font-mono text-[var(--theme-foreground)]/60 space-y-1 pl-4 border-l-2 border-[var(--theme-foreground)]/20">
                <p>100 CREDITS/MONTH (RENEWS MONTHLY)</p>
                <p>~50 GENERATIONS OR REVIEWS</p>
                <p>RATE LIMIT: 10 REQ/HOUR</p>
              </div>
            </BrutalCard>
          )}

          {/* Saved Provider Keys */}
          {providerKeys && providerKeys.length > 0 && (
            <SavedKeysSection
              providerKeys={providerKeys}
              onToggleActive={handleToggleActive}
              onRemoveKey={(keyId) => dispatch({ type: 'UPDATE', field: 'removeKeyId', value: keyId })}
            />
          )}

          {/* Add New API Key */}
          <AddApiKeyForm
            selectedProvider={selectedProvider}
            apiKey={apiKey}
            showApiKey={showApiKey}
            isValidating={isValidating}
            onProviderChange={(provider) => dispatch({ type: 'UPDATE', field: 'selectedProvider', value: provider })}
            onApiKeyChange={(value) => dispatch({ type: 'UPDATE', field: 'apiKey', value })}
            onToggleShowKey={() => dispatch({ type: 'UPDATE', field: 'showApiKey', value: !showApiKey })}
            onValidateAndSave={handleValidateAndSave}
          />
        </div>
      </SettingsSection>

      {/* Usage Statistics */}
      {monthlyStats && (
        <UsageStatsSection monthlyStats={monthlyStats} formatNumber={formatNumber} />
      )}

      {/* Remove API Key Confirmation Modal */}
      {removeKeyId && (
        <BrutalModal
          isOpen={!!removeKeyId}
          onClose={() => dispatch({ type: 'UPDATE', field: 'removeKeyId', value: null })}
          title="REMOVE API KEY?"
        >
          <div className="space-y-6">
            <p className="font-mono text-sm">
              Are you sure you want to remove this API key? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <BrutalButton
                variant="secondary"
                onClick={() => dispatch({ type: 'UPDATE', field: 'removeKeyId', value: null })}
                className="flex-1"
              >
                CANCEL
              </BrutalButton>
              <BrutalButton
                variant="destructive"
                onClick={handleRemoveKey}
                className="flex-1"
              >
                CONFIRM REMOVE
              </BrutalButton>
            </div>
          </div>
        </BrutalModal>
      )}
    </div>
  )
}
