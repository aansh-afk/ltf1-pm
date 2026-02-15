import BrutalButton from "@/components/ui/BrutalButton";
import { Github } from "lucide-react";
import posthog from "posthog-js";

interface GitHubInstallationButtonProps {
  workspaceId: string;
  onInstallComplete?: () => void;
}

export function GitHubInstallationButton({
  workspaceId,
  onInstallComplete
}: GitHubInstallationButtonProps) {
  const handleInstall = () => {
    // GitHub App installation URL
    // Replace 'ltf1-integration' with your actual GitHub App slug
    const rawSlug = import.meta.env.VITE_GITHUB_APP_SLUG || 'ltf1-github';
    const appSlug = rawSlug.replace('https://github.com/apps/', '');
    const installUrl = `https://github.com/apps/${appSlug}/installations/new`;

    // Store workspace ID in session storage for post-install redirect
    sessionStorage.setItem('github_install_workspace', workspaceId);

    posthog.capture('github_app_install_initiated');

    // Open GitHub installation flow in new window
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const installWindow = window.open(
      installUrl,
      'github-install',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    // Poll for window close
    const checkInterval = setInterval(() => {
      if (installWindow?.closed) {
        clearInterval(checkInterval);
        // Check if installation was successful
        // This would typically check the backend for new installations
        if (onInstallComplete) {
          onInstallComplete();
        }
      }
    }, 1000);
  };

  return (
    <BrutalButton
      onClick={handleInstall}
      variant="primary"
      className="flex items-center gap-2"
    >
      <Github className="h-5 w-5" />
      Connect GitHub
    </BrutalButton>
  );
}