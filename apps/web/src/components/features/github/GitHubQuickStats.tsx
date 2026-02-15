import BrutalCard from '@/components/ui/BrutalCard';

interface GitHubQuickStatsProps {
  stargazersCount?: number;
  language?: string;
  openIssuesCount?: number;
  defaultBranch?: string;
  commitsCount: number;
  openPRsCount: number;
}

export default function GitHubQuickStats({
  stargazersCount,
  language,
  openIssuesCount,
  defaultBranch,
  commitsCount,
  openPRsCount,
}: GitHubQuickStatsProps) {
  const items = [
    stargazersCount !== undefined && { icon: '\u2B50', value: stargazersCount.toLocaleString() },
    language && { icon: '\uD83D\uDCDD', value: language },
    openIssuesCount !== undefined && { icon: '\uD83D\uDC1B', value: `${openIssuesCount} open issues` },
    defaultBranch && { icon: '\uD83C\uDF3F', value: defaultBranch },
    commitsCount > 0 && { icon: '\uD83D\uDCCA', value: `${commitsCount} commits` },
    openPRsCount > 0 && { icon: '\uD83D\uDD00', value: `${openPRsCount} open PRs` },
  ].filter(Boolean) as { icon: string; value: string }[];

  if (items.length === 0) return null;

  return (
    <BrutalCard className="py-[8px] px-[12px]" padding="none">
      <div className="flex items-center gap-[8px] font-mono text-brutal-xs text-[var(--theme-foreground)]/60 flex-wrap">
        {items.map((item, idx) => (
          <span key={idx} className="flex items-center gap-[4px]">
            {idx > 0 && <span className="text-[var(--theme-foreground)]/20 mr-[4px]">{'\u2502'}</span>}
            <span>{item.icon}</span>
            <span>{item.value}</span>
          </span>
        ))}
      </div>
    </BrutalCard>
  );
}
