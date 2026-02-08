import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from '../../../../../../convex/_generated/dataModel';
import { GitCommit, GitPullRequest, Github } from "lucide-react";
import BrutalCard from "@/components/ui/BrutalCard";
import { formatDistanceToNow } from "date-fns";

interface TaskGitHubActivityProps {
  taskId: Id<"tasks">;
}

export function TaskGitHubActivity({ taskId }: TaskGitHubActivityProps) {
  const commits = useQuery(api.integrations.github.queries.getTaskCommits, { taskId });
  const pullRequests = useQuery(api.integrations.github.queries.getTaskPullRequests, { taskId });

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
              <a
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
              >
                #{pr.number} {pr.title}
              </a>
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