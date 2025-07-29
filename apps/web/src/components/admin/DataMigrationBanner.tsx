import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";

export function DataMigrationBanner() {
  const [isUpdating, setIsUpdating] = useState(false);
  const migrationStatus = useQuery(api.admin.migrationStatus.checkMigrationStatus);
  const clearOldActivities = useMutation(api.workspaces.mutations.clearOldActivities);

  if (!migrationStatus?.needsMigration) {
    return null; // Don't show banner if no migration needed
  }

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await clearOldActivities();
      // Refetch will happen automatically via Convex reactivity
    } catch (error) {
      console.error("Migration failed:", error);
      alert("Update failed. Please try again or contact support.");
    }
    setIsUpdating(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm font-bold">!</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">App Update Required</h3>
              <p className="text-red-100">
                {migrationStatus.message}
              </p>
              {migrationStatus.oldRecordCount > 0 && (
                <p className="text-sm text-red-200 mt-1">
                  {migrationStatus.oldRecordCount} records need to be updated
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="bg-white text-red-600 px-6 py-2 rounded font-bold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              "Update Now"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}