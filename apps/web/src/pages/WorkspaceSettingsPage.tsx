import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
  HiOutlineCog,
  HiOutlinePuzzle,
  HiOutlineCreditCard,
  HiOutlineExclamation,
} from "react-icons/hi";
import clsx from "clsx";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import SettingsSection from "@/components/features/settings/SettingsSection";
import MemberManagement from "@/components/features/workspace/MemberManagement";
import { useSettingsState } from "../hooks/useSettingsState";
import BrutalButton from "@/components/ui/BrutalButton";
import BrutalCard from "@/components/ui/BrutalCard";
import BrutalBadge from "@/components/ui/BrutalBadge";

const tabs = [
  { id: "general", label: "GENERAL", icon: HiOutlineOfficeBuilding },
  { id: "members", label: "MEMBERS", icon: HiOutlineUserGroup },
  { id: "features", label: "FEATURES", icon: HiOutlineCog },
  { id: "integrations", label: "INTEGRATIONS", icon: HiOutlinePuzzle },
  { id: "billing", label: "BILLING", icon: HiOutlineCreditCard },
];

// ── Sub-components ──

interface DangerZoneProps {
  workspace: any;
  showDeleteConfirm: boolean;
  deleteConfirmText: string;
  onShowDelete: () => void;
  onHideDelete: () => void;
  onDeleteConfirmTextChange: (text: string) => void;
  onDelete: () => void;
}

function DangerZone({
  workspace,
  showDeleteConfirm,
  deleteConfirmText,
  onShowDelete,
  onHideDelete,
  onDeleteConfirmTextChange,
  onDelete,
}: DangerZoneProps) {
  return (
    <BrutalCard
      variant="default"
      className="border-[var(--theme-error)] mt-6 bg-[var(--theme-error)]/5"
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3 text-[var(--theme-error)]">
          <HiOutlineExclamation className="w-5 h-5" />
          <h3 className="text-lg font-bold uppercase">DANGER ZONE</h3>
        </div>
        <p className="text-sm font-mono text-[var(--theme-foreground)]/80 mb-3">
          Irreversible and destructive actions. Deleting a workspace will
          permanently remove all projects, tasks, and data.
        </p>

        {!showDeleteConfirm ? (
          <BrutalButton
            onClick={onShowDelete}
            className="bg-[var(--theme-error)] border-[var(--theme-error)] text-white hover:bg-[var(--theme-error)]/90"
          >
            DELETE WORKSPACE
          </BrutalButton>
        ) : (
          <div className="space-y-2 p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-error)]">
            <p className="text-sm font-mono">
              Type <span className="font-bold">{workspace.name}</span> to
              confirm deletion:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => onDeleteConfirmTextChange(e.target.value)}
              aria-label="Type workspace name to confirm deletion"
              className="w-full px-4 py-2 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-sm placeholder:text-neutral-600
                       focus:border-[var(--theme-error)] focus:outline-none transition-colors"
            />
            <div className="flex gap-4">
              <BrutalButton
                onClick={onDelete}
                disabled={deleteConfirmText !== workspace.name}
                className="bg-[var(--theme-error)] border-[var(--theme-error)] text-white hover:bg-[var(--theme-error)]/90"
              >
                CONFIRM DELETE
              </BrutalButton>
              <BrutalButton onClick={onHideDelete} variant="ghost">
                CANCEL
              </BrutalButton>
            </div>
          </div>
        )}
      </div>
    </BrutalCard>
  );
}

interface FeaturesTabProps {
  featureSettings: Record<string, boolean>;
  canEdit: boolean;
  onToggleFeature: (key: string, checked: boolean) => void;
}

function FeaturesTab({
  featureSettings,
  canEdit,
  onToggleFeature,
}: FeaturesTabProps) {
  const coreFeatures = [
    { label: "PROJECTS", desc: "Organize work into projects" },
    { label: "TASKS", desc: "Track work items and issues" },
    { label: "SPRINTS", desc: "Agile sprint planning and tracking" },
  ];

  const configurableFeatures = [
    {
      key: "meetings",
      label: "MEETINGS",
      desc: "Schedule and manage meetings",
    },
    {
      key: "timeTracking",
      label: "TIME TRACKING",
      desc: "Track time spent on tasks",
    },
    {
      key: "gitIntegration",
      label: "GIT INTEGRATION",
      desc: "Connect repositories and sync development activity",
    },
    {
      key: "aiFeatures",
      label: "AI FEATURES",
      desc: "Enable AI assistance and automation features",
    },
  ];

  return (
    <SettingsSection
      title="WORKSPACE FEATURES"
      description="Enable or disable features for this workspace"
    >
      <div className="mb-4">
        <p className="text-[10px] font-mono font-bold uppercase text-[var(--theme-foreground)]/50 mb-2">
          CORE FEATURES (ALWAYS ENABLED)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {coreFeatures.map(({ label, desc }) => (
            <div
              key={label}
              className="p-3 border-2 border-[var(--theme-border)]/60 bg-[var(--theme-background-secondary)]/20"
            >
              <div className="font-mono font-bold text-xs uppercase">
                {label}
              </div>
              <div className="text-[11px] font-mono text-[var(--theme-foreground)]/60 mt-1">
                {desc}
              </div>
              <div className="mt-2 text-[10px] font-mono uppercase text-[var(--theme-primary)]">
                Always on
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] font-mono font-bold uppercase text-[var(--theme-foreground)]/50 mb-2">
        CONFIGURABLE FEATURES
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configurableFeatures.map(({ key, label, desc }) => (
          <label
            key={key}
            htmlFor={`workspace-feature-${key}`}
            aria-label={label}
            className="flex items-start gap-4 p-4 border-2 border-[var(--theme-border)] bg-[var(--theme-background)] hover:border-[var(--theme-primary)] transition-colors cursor-pointer group"
          >
            <input
              id={`workspace-feature-${key}`}
              type="checkbox"
              checked={
                featureSettings[key as keyof typeof featureSettings] ?? false
              }
              onChange={(e) => onToggleFeature(key, e.target.checked)}
              disabled={!canEdit}
              className="w-5 h-5 mt-1 border-2 border-[var(--theme-border)] bg-[var(--theme-background)] checked:bg-[var(--theme-primary)] cursor-pointer"
            />
            <div>
              <div className="font-mono font-bold text-sm uppercase group-hover:text-[var(--theme-primary)] transition-colors">
                {label}
              </div>
              <div className="text-xs font-mono text-[var(--theme-foreground)]/60">
                {desc}
              </div>
            </div>
          </label>
        ))}
      </div>
    </SettingsSection>
  );
}

interface GeneralTabProps {
  generalSettings: {
    name: string;
    slug: string;
    description: string;
    logoUrl: string;
  };
  canEdit: boolean;
  canDelete: boolean;
  workspace: any;
  showDeleteConfirm: boolean;
  deleteConfirmText: string;
  onGeneralChange: (settings: any) => void;
  onShowDelete: () => void;
  onHideDelete: () => void;
  onDeleteConfirmTextChange: (text: string) => void;
  onDelete: () => void;
}

function GeneralTab({
  generalSettings,
  canEdit,
  canDelete,
  workspace,
  showDeleteConfirm,
  deleteConfirmText,
  onGeneralChange,
  onShowDelete,
  onHideDelete,
  onDeleteConfirmTextChange,
  onDelete,
}: GeneralTabProps) {
  return (
    <>
      <SettingsSection
        title="WORKSPACE INFORMATION"
        description="Basic information about your workspace"
      >
        <div className="space-y-3">
          <div>
            <label
              htmlFor="ws-settings-name"
              className="block text-xs font-bold uppercase font-mono mb-2"
            >
              WORKSPACE NAME
            </label>
            <input
              id="ws-settings-name"
              type="text"
              value={generalSettings.name}
              onChange={(e) =>
                onGeneralChange({ ...generalSettings, name: e.target.value })
              }
              disabled={!canEdit}
              className="w-full px-4 py-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-sm placeholder:text-neutral-600
                       focus:border-[var(--theme-primary)] focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed uppercase"
            />
          </div>

          <div>
            <label
              htmlFor="ws-settings-slug"
              className="block text-xs font-bold uppercase font-mono mb-2"
            >
              WORKSPACE SLUG
            </label>
            <input
              id="ws-settings-slug"
              type="text"
              value={generalSettings.slug}
              onChange={(e) =>
                onGeneralChange({ ...generalSettings, slug: e.target.value })
              }
              disabled={!canEdit}
              pattern="[a-z0-9-]+"
              className="w-full px-4 py-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-sm placeholder:text-neutral-600
                       focus:border-[var(--theme-primary)] focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed lowercase"
            />
            <p className="text-xs font-mono text-[var(--theme-foreground)]/40 mt-1">
              Used in URLs. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div>
            <label
              htmlFor="ws-settings-description"
              className="block text-xs font-bold uppercase font-mono mb-2"
            >
              DESCRIPTION
            </label>
            <textarea
              id="ws-settings-description"
              value={generalSettings.description}
              onChange={(e) =>
                onGeneralChange({
                  ...generalSettings,
                  description: e.target.value,
                })
              }
              disabled={!canEdit}
              rows={4}
              className="w-full px-4 py-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-sm placeholder:text-neutral-600
                       focus:border-[var(--theme-primary)] focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed resize-none uppercase"
            />
          </div>

          <div>
            <label
              htmlFor="ws-settings-logo"
              className="block text-xs font-bold uppercase font-mono mb-2"
            >
              LOGO URL
            </label>
            <input
              id="ws-settings-logo"
              type="url"
              value={generalSettings.logoUrl}
              onChange={(e) =>
                onGeneralChange({ ...generalSettings, logoUrl: e.target.value })
              }
              disabled={!canEdit}
              placeholder="HTTPS://EXAMPLE.COM/LOGO.PNG"
              className="w-full px-4 py-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                       font-mono text-sm placeholder:text-neutral-600
                       focus:border-[var(--theme-primary)] focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </SettingsSection>

      {canDelete && (
        <DangerZone
          workspace={workspace}
          showDeleteConfirm={showDeleteConfirm}
          deleteConfirmText={deleteConfirmText}
          onShowDelete={onShowDelete}
          onHideDelete={onHideDelete}
          onDeleteConfirmTextChange={onDeleteConfirmTextChange}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

interface IntegrationsTabProps {
  canEdit: boolean;
}

function IntegrationsTab({ canEdit }: IntegrationsTabProps) {
  return (
    <SettingsSection
      title="EXTERNAL INTEGRATIONS"
      description="Connect your workspace with external services"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <BrutalCard className="p-4">
          <h3 className="font-mono font-bold text-sm uppercase mb-2">
            GITHUB INTEGRATION
          </h3>
          <p className="text-xs font-mono text-[var(--theme-foreground)]/60 mb-3 min-h-[40px]">
            Connect GitHub repositories to sync issues and pull requests
          </p>
          <BrutalButton
            disabled={!canEdit}
            size="sm"
            variant="secondary"
            className="w-full"
          >
            CONFIGURE GITHUB
          </BrutalButton>
        </BrutalCard>

        <BrutalCard className="p-4">
          <h3 className="font-mono font-bold text-sm uppercase mb-2">
            GOOGLE CALENDAR
          </h3>
          <p className="text-xs font-mono text-[var(--theme-foreground)]/60 mb-3 min-h-[40px]">
            Sync meetings with Google Calendar
          </p>
          <BrutalButton
            disabled={!canEdit}
            size="sm"
            variant="secondary"
            className="w-full"
          >
            CONNECT CALENDAR
          </BrutalButton>
        </BrutalCard>

        <BrutalCard className="p-4">
          <h3 className="font-mono font-bold text-sm uppercase mb-2">SLACK</h3>
          <p className="text-xs font-mono text-[var(--theme-foreground)]/60 mb-3 min-h-[40px]">
            Send notifications to Slack channels
          </p>
          <BrutalButton
            disabled={!canEdit}
            size="sm"
            variant="secondary"
            className="w-full"
          >
            ADD TO SLACK
          </BrutalButton>
        </BrutalCard>
      </div>
    </SettingsSection>
  );
}

interface BillingTabProps {}

function BillingTab(_props: BillingTabProps) {
  return (
    <SettingsSection
      title="SUBSCRIPTION & BILLING"
      description="Manage your workspace subscription"
    >
      {/* Beta notice */}
      <BrutalCard
        variant="neon"
        className="p-5 mb-4 border-[var(--theme-primary)]/40"
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="text-[10px] font-mono text-[var(--theme-primary)] uppercase tracking-widest border border-[var(--theme-primary)]/30 px-2 py-1 shrink-0 mt-0.5">
            Beta
          </span>
          <div>
            <p className="text-sm font-bold uppercase mb-1 text-[var(--theme-foreground)]">
              EVERYTHING IS FREE RIGHT NOW
            </p>
            <p className="text-xs font-mono text-[var(--theme-foreground)]/60 leading-relaxed">
              We're actively building LTF1 and shipping in public. While we're
              in beta, all Pro &amp; Enterprise features are unlocked for your
              workspace at no cost. Billing will start when the app officially
              launches.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {[
            "Unlimited team members",
            "Unlimited AI credits",
            "Advanced analytics",
            "SSO / SAML",
            "Audit logs",
            "BYOK (Bring Your Own Key)",
            "Custom webhooks",
            "Priority support",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 text-xs font-mono"
            >
              <span className="text-[var(--theme-primary)]">+</span>
              <span className="text-[var(--theme-foreground)]/70">
                {feature}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--theme-border)] pt-3">
          <p className="text-[10px] font-mono text-[var(--theme-foreground)]/40 leading-relaxed">
            Your workspace is on the{" "}
            <span className="text-[var(--theme-primary)] font-bold">
              BETA PLAN
            </span>
            . No credit card required. No surprise charges. We'll notify you
            well in advance before any billing goes live.
          </p>
        </div>
      </BrutalCard>

      {/* What's coming */}
      <BrutalCard className="p-4">
        <p className="text-[10px] font-mono text-[var(--theme-foreground)]/40 uppercase tracking-widest mb-3">
          Coming at Launch
        </p>
        <div className="space-y-2">
          {[
            {
              tier: "Open Source",
              price: "$0",
              note: "Free forever — up to 5 members, 100 AI credits/month",
            },
            {
              tier: "Pro",
              price: "$12/user/mo",
              note: "Unlimited members, unlimited AI, advanced features",
            },
            {
              tier: "Enterprise",
              price: "Custom",
              note: "On-premise, custom SLA, dedicated support",
            },
          ].map((item) => (
            <div
              key={item.tier}
              className="flex items-start justify-between gap-4 text-xs font-mono"
            >
              <div>
                <span className="text-[var(--theme-foreground)] font-bold">
                  {item.tier}
                </span>
                <span className="text-[var(--theme-foreground)]/40 ml-2">
                  — {item.note}
                </span>
              </div>
              <span className="text-[var(--theme-foreground)]/60 shrink-0">
                {item.price}
              </span>
            </div>
          ))}
        </div>
      </BrutalCard>
    </SettingsSection>
  );
}

interface SaveIndicatorProps {
  hasUnsavedGeneral: boolean;
  hasUnsavedFeatures: boolean;
  isSavingGeneral: boolean;
  isSavingFeatures: boolean;
  onSave: () => void;
}

function SaveIndicator({
  hasUnsavedGeneral,
  hasUnsavedFeatures,
  isSavingGeneral,
  isSavingFeatures,
  onSave,
}: SaveIndicatorProps) {
  if (!hasUnsavedGeneral && !hasUnsavedFeatures) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce">
      <BrutalCard
        variant="elevated"
        className="p-3 border-[var(--theme-primary)] flex items-center gap-3 bg-[var(--theme-background)]"
      >
        <div>
          <p className="text-xs font-bold uppercase text-[var(--theme-primary)] mb-1">
            UNSAVED CHANGES
          </p>
          <p className="text-[10px] font-mono text-[var(--theme-foreground)]/60">
            {isSavingGeneral || isSavingFeatures
              ? "SAVING..."
              : "CHANGES PENDING"}
          </p>
        </div>
        <div className="flex gap-2">
          <BrutalButton
            size="sm"
            variant="primary"
            onClick={onSave}
            disabled={isSavingGeneral || isSavingFeatures}
          >
            SAVE NOW
          </BrutalButton>
        </div>
      </BrutalCard>
    </div>
  );
}

interface WorkspaceSettingsContentProps {
  workspace: any;
  workspaceId: string;
  currentUser: any;
  memberRole: string | undefined;
}

function WorkspaceSettingsContent({
  workspace,
  workspaceId,
  currentUser,
  memberRole,
}: WorkspaceSettingsContentProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Mutations
  const updateWorkspace = useMutation(api.workspaces.mutations.updateWorkspace);
  const deleteWorkspace = useMutation(api.workspaces.mutations.deleteWorkspace);

  // Settings state — initialized directly from workspace data
  const {
    value: generalSettings,
    setValue: setGeneralSettings,
    isSaving: isSavingGeneral,
    hasUnsavedChanges: hasUnsavedGeneral,
    forceSave: forceSaveGeneral,
  } = useSettingsState({
    defaultValue: {
      name: workspace.name || "",
      slug: workspace.slug || "",
      description: workspace.description || "",
      logoUrl: workspace.logoUrl || "",
    },
    onSave: async (data) => {
      if (!workspaceId) return;
      await updateWorkspace({
        workspaceId: workspaceId as any,
        ...data,
      });
    },
  });

  const {
    value: featureSettings,
    setValue: setFeatureSettings,
    isSaving: isSavingFeatures,
    hasUnsavedChanges: hasUnsavedFeatures,
    forceSave: forceSaveFeatures,
  } = useSettingsState({
    defaultValue: {
      meetings: workspace.settings?.features?.meetings ?? true,
      timeTracking: workspace.settings?.features?.timeTracking ?? false,
      gitIntegration: workspace.settings?.features?.gitIntegration ?? false,
      aiFeatures: workspace.settings?.features?.aiFeatures ?? false,
    },
    onSave: async (data) => {
      if (!workspaceId) return;
      await updateWorkspace({
        workspaceId: workspaceId as any,
        settings: {
          ...workspace?.settings,
          features: {
            meetings: data.meetings,
            timeTracking: data.timeTracking,
            gitIntegration: data.gitIntegration,
            aiFeatures: data.aiFeatures,
          },
        },
      });
    },
  });

  const handleDeleteWorkspace = async () => {
    if (!workspaceId || !workspace) return;
    if (deleteConfirmText !== workspace.name) {
      toast.error("Workspace name does not match");
      return;
    }

    try {
      await deleteWorkspace({ workspaceId: workspaceId as any });
      toast.success("Workspace deleted successfully");
      navigate("/workspaces");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete workspace");
    }
  };

  const canEdit = memberRole === "owner" || memberRole === "admin";
  const canDelete = memberRole === "owner";

  return (
    <div className="p-4 md:p-5 bg-[var(--theme-background)] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <HiOutlineOfficeBuilding className="w-6 h-6 text-[var(--theme-primary)]" />
            <h1 className="text-2xl font-bold uppercase tracking-tight">
              WORKSPACE SETTINGS
            </h1>
          </div>
          <p className="font-mono text-sm text-[var(--theme-foreground)]/60 uppercase tracking-wide border-l-2 border-[var(--theme-border)] pl-3">
            {workspace.name} • {memberRole}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-4 border-b-2 border-[var(--theme-border)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "px-4 py-3 flex items-center gap-2 font-mono text-sm font-bold uppercase transition-all duration-200",
                  "border-b-4 -mb-1",
                  activeTab === tab.id
                    ? "border-[var(--theme-primary)] bg-[var(--theme-background-secondary)] text-[var(--theme-primary)]"
                    : "border-transparent text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]/20",
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === "general" && (
            <GeneralTab
              generalSettings={generalSettings}
              canEdit={canEdit}
              canDelete={canDelete}
              workspace={workspace}
              showDeleteConfirm={showDeleteConfirm}
              deleteConfirmText={deleteConfirmText}
              onGeneralChange={setGeneralSettings}
              onShowDelete={() => setShowDeleteConfirm(true)}
              onHideDelete={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmText("");
              }}
              onDeleteConfirmTextChange={setDeleteConfirmText}
              onDelete={handleDeleteWorkspace}
            />
          )}

          {activeTab === "members" && (
            <MemberManagement
              workspace={workspace}
              currentUserRole={memberRole}
              canManageMembers={canEdit}
            />
          )}

          {activeTab === "features" && (
            <FeaturesTab
              featureSettings={featureSettings}
              canEdit={canEdit}
              onToggleFeature={(key, checked) =>
                setFeatureSettings({ ...featureSettings, [key]: checked })
              }
            />
          )}

          {activeTab === "integrations" && (
            <IntegrationsTab canEdit={canEdit} />
          )}

          {activeTab === "billing" && <BillingTab />}
        </div>

        <SaveIndicator
          hasUnsavedGeneral={hasUnsavedGeneral}
          hasUnsavedFeatures={hasUnsavedFeatures}
          isSavingGeneral={isSavingGeneral}
          isSavingFeatures={isSavingFeatures}
          onSave={() => {
            if (hasUnsavedGeneral) forceSaveGeneral();
            if (hasUnsavedFeatures) forceSaveFeatures();
          }}
        />
      </div>
    </div>
  );
}

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();

  // Queries
  const workspace = useQuery(
    api.workspaces.queries.getWorkspaceById,
    workspaceId ? { workspaceId: workspaceId as any } : "skip",
  );
  const currentUser = useQuery(api.auth.users.getOrCreateCurrentUser);
  const memberRole = workspace?.currentUserRole;

  if (!workspace || !currentUser) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <WorkspaceSettingsContent
      key={workspace._id}
      workspace={workspace}
      workspaceId={workspaceId!}
      currentUser={currentUser}
      memberRole={memberRole}
    />
  );
}
