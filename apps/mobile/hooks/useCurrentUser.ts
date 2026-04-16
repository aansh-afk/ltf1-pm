import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-expo";
import { api } from "convex/_generated/api";

export function useCurrentUser() {
  const { user: clerkUser } = useUser();
  const convexUser = useQuery(
    api.auth.users.getCurrentUser,
    clerkUser ? {} : "skip",
  );
  return {
    clerkUser,
    user: convexUser,
    isLoading: convexUser === undefined,
  };
}
