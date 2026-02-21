import { useEffect, useReducer } from "react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import toast from "react-hot-toast";
import BrutalModal from "../../ui/BrutalModal";
import {
  HiOutlineSearch,
  HiOutlineLockClosed,
  HiOutlineGlobeAlt,
  HiOutlineRefresh,
} from "react-icons/hi";
import { VscGithub } from "react-icons/vsc";

interface ConnectRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  workspaceId?: string;
  onSuccess?: () => void;
}

interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  htmlUrl: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  updatedAt: string;
  defaultBranch: string;
  source: "oauth" | "installation";
  installationId?: number;
}

type ConnectRepoState = {
  mode: "picker" | "manual";
  url: string;
  provider: "github" | "gitlab" | "bitbucket";
  isConnecting: boolean;
  searchQuery: string;
  isLoading: boolean;
  repositories: Repository[];
  hasOAuth: boolean;
};

const connectRepoInitialState: ConnectRepoState = {
  mode: "picker",
  url: "",
  provider: "github",
  isConnecting: false,
  searchQuery: "",
  isLoading: false,
  repositories: [],
  hasOAuth: true,
};

type ConnectRepoAction =
  | { type: "UPDATE"; field: keyof ConnectRepoState; value: unknown }
  | { type: "RESET_MANUAL" };

function connectRepoReducer(
  state: ConnectRepoState,
  action: ConnectRepoAction,
): ConnectRepoState {
  switch (action.type) {
    case "UPDATE":
      return { ...state, [action.field]: action.value };
    case "RESET_MANUAL":
      return { ...state, url: "", provider: "github" };
    default:
      return state;
  }
}

export default function ConnectRepositoryModal({
  isOpen,
  onClose,
  projectId,
  workspaceId,
  onSuccess,
}: ConnectRepositoryModalProps) {
  return (
    <BrutalModal isOpen={isOpen} onClose={onClose} title="IMPORT GIT REPOSITORY" size="xl">
      <ConnectRepositoryContent
        key={workspaceId}
        onClose={onClose}
        projectId={projectId}
        workspaceId={workspaceId}
        onSuccess={onSuccess}
      />
    </BrutalModal>
  );
}

interface ConnectRepositoryContentProps {
  onClose: () => void;
  projectId: string;
  workspaceId?: string;
  onSuccess?: () => void;
}

function ConnectRepositoryContent({
  onClose,
  projectId,
  workspaceId,
  onSuccess,
}: ConnectRepositoryContentProps) {
  const [state, dispatch] = useReducer(
    connectRepoReducer,
    connectRepoInitialState,
  );
  const {
    mode,
    url,
    provider,
    isConnecting,
    searchQuery,
    isLoading,
    repositories,
    hasOAuth,
  } = state;

  const connectRepository = useMutation(
    api.projects.mutations.connectRepository,
  );
  const fetchAvailableRepositories = useAction(
    api.integrations.github.actions.fetchAvailableRepositories,
  );

  // Fetch repositories on mount (component remounts via key when workspaceId changes)
  useEffect(() => {
    loadRepositories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRepositories = async () => {
    dispatch({ type: "UPDATE", field: "isLoading", value: true });
    try {
      const result = await fetchAvailableRepositories({
        workspaceId: workspaceId as Id<"workspaces"> | undefined,
      });
      dispatch({
        type: "UPDATE",
        field: "repositories",
        value: result.repositories,
      });
      dispatch({
        type: "UPDATE",
        field: "hasOAuth",
        value: result.sources.hasOAuth,
      });
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
    } finally {
      dispatch({ type: "UPDATE", field: "isLoading", value: false });
    }
  };

  const handleConnectRepo = async (repo: Repository) => {
    dispatch({ type: "UPDATE", field: "isConnecting", value: true });
    try {
      await connectRepository({
        projectId: projectId as Id<"projects">,
        repositoryUrl: repo.htmlUrl,
        provider: "github",
      });
      toast.success("Repository connected successfully");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to connect repository:", error);
      toast.error(error.message || "Failed to connect repository");
    } finally {
      dispatch({ type: "UPDATE", field: "isConnecting", value: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "manual") {
      if (!url.trim()) {
        toast.error("Repository URL is required");
        return;
      }

      const urlPattern =
        /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[\w\-\.]+\/[\w\-\.]+\/?$/;
      if (!urlPattern.test(url.trim())) {
        toast.error("Please enter a valid repository URL");
        return;
      }

      dispatch({ type: "UPDATE", field: "isConnecting", value: true });

      try {
        await connectRepository({
          projectId: projectId as Id<"projects">,
          repositoryUrl: url.trim(),
          provider: provider,
        });

        toast.success("Repository connected successfully");
        onSuccess?.();
        onClose();

        // Reset form
        dispatch({ type: "RESET_MANUAL" });
      } catch (error: any) {
        toast.error(error.message || "Failed to connect repository");
      } finally {
        dispatch({ type: "UPDATE", field: "isConnecting", value: false });
      }
    }
  };

  const filteredRepos = repositories.filter((repo) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.fullName.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query) ||
      false
    );
  });

  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      TypeScript: "bg-[var(--theme-info)]",
      JavaScript: "bg-[var(--theme-warning)]",
      Python: "bg-[var(--theme-success)]",
      Rust: "bg-[var(--theme-error)]",
      Go: "bg-[var(--theme-primary)]",
      Java: "bg-[var(--theme-error)]",
      "C++": "bg-[var(--theme-warning)]",
      C: "bg-[var(--theme-foreground-secondary)]",
      Ruby: "bg-[var(--theme-error)]",
      PHP: "bg-[var(--theme-primary)]",
    };
    return colors[language || ""] || "bg-[var(--theme-foreground-tertiary)]";
  };

  return (
    <div className="flex flex-col h-[70vh]">
      {/* Mode Switcher — sits directly below BrutalModal's built-in header */}
      <div className="px-[16px] py-[10px] border-b-2 border-[var(--theme-border)] bg-[var(--theme-background)] flex items-center justify-between shrink-0">
        <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
          Select a repository to link to your project.
        </p>
        <div className="flex bg-[var(--theme-background-secondary)] p-4px border-2 border-[var(--theme-border)]">
          <button
            type="button"
            onClick={() =>
              dispatch({ type: "UPDATE", field: "mode", value: "picker" })
            }
            className={`px-[10px] py-6px text-brutal-xs font-bold uppercase transition-all ${
              mode === "picker"
                ? "bg-[var(--theme-foreground)] text-[var(--theme-background)]"
                : "text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)]"
            }`}
          >
            Select
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch({ type: "UPDATE", field: "mode", value: "manual" })
            }
            className={`px-[10px] py-6px text-brutal-xs font-bold uppercase transition-all ${
              mode === "manual"
                ? "bg-[var(--theme-foreground)] text-[var(--theme-background)]"
                : "text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)]"
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-[var(--theme-background-secondary)]/30 relative">
        {mode === "picker" ? (
          <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
            {/* Search Bar - Sticky */}
            <div className="p-[16px] pb-12px shrink-0">
              <div className="relative group">
                <HiOutlineSearch className="absolute left-[10px] top-1/2 -translate-y-1/2 w-20px h-20px text-[var(--theme-foreground)]/40 group-focus-within:text-[var(--theme-foreground)] transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE",
                      field: "searchQuery",
                      value: e.target.value,
                    })
                  }
                  placeholder="Search..."
                  className="w-full pl-[24px] pr-[10px] py-[8px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)]
                            font-sans text-brutal-md placeholder:text-[var(--theme-foreground)]/30
                            focus:border-[var(--theme-foreground)] focus:outline-none transition-all"
                  aria-label="Search repositories"
                />
                {isLoading && (
                  <div className="absolute right-[10px] top-1/2 -translate-y-1/2">
                    <HiOutlineRefresh className="w-20px h-20px animate-spin text-[var(--theme-foreground)]/40" />
                  </div>
                )}
              </div>
            </div>

            {/* OAuth hint */}
            {!isLoading && !hasOAuth && (
              <div className="mx-[16px] mb-[8px] px-[10px] py-[6px] bg-[var(--theme-warning)]/10 border border-[var(--theme-warning)]/20 text-brutal-xs font-mono text-[var(--theme-warning)]">
                Your personal repos aren't shown — connect GitHub in your
                profile settings to see them.
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto px-[12px] pb-[12px] scrollbar-thin scrollbar-thumb-[var(--theme-border)]">
              {isLoading && filteredRepos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--theme-foreground)]/60 space-y-[8px]">
                  <div className="w-6 h-6 border-4 border-[var(--theme-border)] border-t-[var(--theme-primary)] rounded-full animate-spin" />
                  <p className="text-brutal-sm font-mono animate-pulse">
                    FETCHING REPOSITORIES...
                  </p>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                  <VscGithub className="w-6 h-6 mb-[8px]" />
                  <p className="font-bold">No repositories found.</p>
                </div>
              ) : (
                <div className="border-2 border-[var(--theme-border)] bg-[var(--theme-background)] overflow-hidden">
                  {filteredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-20px border-b-2 border-[var(--theme-border)] last:border-b-0 hover:bg-[var(--theme-background-secondary)]/50 transition-colors group"
                    >
                      <div className="flex items-center gap-[8px] min-w-0">
                        <div className="w-40px h-40px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] flex items-center justify-center shrink-0">
                          {repo.private ? (
                            <HiOutlineLockClosed className="text-[var(--theme-foreground)]/60" />
                          ) : (
                            <HiOutlineGlobeAlt className="text-[var(--theme-foreground)]/60" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-8px">
                            <span className="font-bold text-brutal-md truncate block">
                              {repo.name}
                            </span>
                            {repo.source === "installation" && (
                              <span className="bg-[var(--theme-border)] px-6px py-2px text-[10px] uppercase font-bold rounded-sm text-[var(--theme-foreground)]/60">
                                ORG
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-[6px] text-brutal-xs text-[var(--theme-foreground)]/50 mt-2px font-mono">
                            <span className="truncate">{repo.fullName}</span>
                            {repo.language && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-4px">
                                  <span
                                    className={`w-6px h-6px rounded-full ${getLanguageColor(repo.language)}`}
                                  />
                                  {repo.language}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(repo.updatedAt))}{" "}
                              ago
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConnectRepo(repo)}
                        disabled={isConnecting}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 px-[12px] py-10px bg-[var(--theme-foreground)] text-[var(--theme-background)] font-bold uppercase text-brutal-sm hover:opacity-90 disabled:opacity-50 transition-all transform translate-x-4 group-hover:translate-x-0"
                      >
                        {isConnecting ? "Connecting..." : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto pt-[24px] px-[12px]">
            <form
              onSubmit={handleSubmit}
              className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[20px]"
            >
              <h3 className="text-[14px] font-semibold mb-[12px]">
                Link External Repository
              </h3>

              <div className="space-y-[12px]">
                <div>
                  <span className="block text-brutal-xs font-bold uppercase mb-8px text-[var(--theme-foreground)]/60">
                    Git Provider
                  </span>
                  <div className="flex gap-[6px]">
                    {(["github", "gitlab", "bitbucket"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "UPDATE",
                            field: "provider",
                            value: p,
                          })
                        }
                        className={`flex-1 py-12px border-2 font-bold uppercase text-brutal-xs transition-colors ${
                          provider === p
                            ? "border-[var(--theme-foreground)] bg-[var(--theme-foreground)] text-[var(--theme-background)]"
                            : "border-[var(--theme-border)] hover:border-[var(--theme-foreground)]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="repo-url"
                    className="block text-brutal-xs font-bold uppercase mb-8px text-[var(--theme-foreground)]/60"
                  >
                    Repository URL
                  </label>
                  <input
                    id="repo-url"
                    type="url"
                    value={url}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE",
                        field: "url",
                        value: e.target.value,
                      })
                    }
                    className="w-full px-[10px] py-12px bg-[var(--theme-background)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm focus:border-[var(--theme-foreground)] focus:outline-none"
                    placeholder="https://github.com/username/repo"
                    required
                  />
                </div>
              </div>

              <div className="mt-[16px] flex justify-end gap-[8px]">
                <button
                  onClick={onClose}
                  type="button"
                  className="text-brutal-sm font-bold uppercase text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="px-[12px] py-12px bg-[var(--theme-foreground)] text-[var(--theme-background)] font-bold uppercase text-brutal-sm hover:opacity-90 disabled:opacity-50"
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
