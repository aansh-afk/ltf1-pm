import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from '../../../../../../convex/_generated/dataModel';
import { GitCommit, GitPullRequest, Github } from "lucide-react";
import { BrutalCard } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
import { useAI } from "@/hooks/useAI";
import { HiSparkles } from "react-icons/hi";
import toast from "react-hot-toast";

interface TaskGitHubActivityProps {
  taskId: Id<"tasks">;
}

export function TaskGitHubActivity({ taskId }: TaskGitHubActivityProps) {
  const commits = useQuery(api.integrations.github.queries.getTaskCommits, { taskId });
  const pullRequests = useQuery(api.integrations.github.queries.getTaskPullRequests, { taskId });
  const { generatePRSummary, loading: aiLoading } = useAI();
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  const handleSummarize = async (pr: any) => {
    try {
      setSummarizingId(pr._id);
      // In a real scenario, we would fetch the PR diff/details here.
      // For now, we simulate sending context.
      const summary = await generatePRSummary(
        "Loading diff not implemented in this view yet.",
        `PR Title: ${pr.title}\nDescription: ${pr.body || ''}`
      );
      toast((t) => (
        <div className="font-mono text-sm max-h-[300px] overflow-y-auto">
          <h4 className="font-bold border-b border-black mb-2">AI Summary</h4>
          <div className="whitespace-pre-wrap">{summary}</div>
        </div>
      ), { duration: 5000, style: { border: '2px solid black' } });
    } catch (error) {
      // Error handled in hook
    } finally {
      setSummarizingId(null);
    }
  }

  if (!commits?.length && !pullRequests?.length) {
    return null;
  }

  return (
    <BrutalCard className="p-4 bg-white border-2 border-black">
      <div className="flex items-center gap-2 mb-4">
        <Github className="h-5 w-5" />
        <h3 className="text-lg font-bold">GitHub Activity</h3>
      </div>

      <div className="space-y-3">
        {/* Pull Requests */}
        {pullRequests?.map((pr) => (
          <div key={pr._id} className="flex items-start gap-3">
            <GitPullRequest className="h-4 w-4 mt-1 text-gray-600" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline"
                >
                  #{pr.number} {pr.title}
                </a>
                <button
                  onClick={() => handleSummarize(pr)}
                  disabled={aiLoading && summarizingId === pr._id}
                  className="text-xs flex items-center gap-1 text-primary-brutalist hover:text-brutal-info font-mono"
                  title="Summarize with AI"
                >
                  <HiSparkles className={aiLoading && summarizingId === pr._id ? "animate-spin" : ""} />
                  {aiLoading && summarizingId === pr._id ? "..." : "SUMMARIZE"}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className={`font-bold ${
                  pr.state === 'open' ? 'text-green-600' : 
                  pr.state === 'merged' ? 'text-purple-600' : 
                  'text-red-600'
                }`}>
                  {pr.state.toUpperCase()}
                </span>
                <span>•</span>
                <span>{pr.author}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(pr.updatedAt))} ago</span>
              </div>
            </div>
          </div>
        ))}

        {/* Commits */}
        {commits?.slice(0, 5).map((commit) => (
          <div key={commit._id} className="flex items-start gap-3">
            <GitCommit className="h-4 w-4 mt-1 text-gray-600" />
            <div className="flex-1">
              <a
                href={commit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono hover:underline"
              >
                {commit.sha.substring(0, 7)}
              </a>
              <p className="text-sm text-gray-700 mt-1">
                {commit.message.split('\n')[0]}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>{commit.author.name}</span>
                <span>•</span>
                <span>{commit.branch}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(commit.timestamp))} ago</span>
              </div>
            </div>
          </div>
        ))}

        {commits && commits.length > 5 && (
          <p className="text-sm text-gray-600">
            +{commits.length - 5} more commits
          </p>
        )}
      </div>
    </BrutalCard>
  );
}