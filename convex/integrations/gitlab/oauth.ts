import { httpRouter } from "convex/server";
import { httpAction } from "../../_generated/server";
import { api } from "../../_generated/api";

const GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID!;
const GITLAB_CLIENT_SECRET = process.env.GITLAB_CLIENT_SECRET!;
// Redirect URI - use environment variable or fallback to localhost for development
const GITLAB_REDIRECT_URI =
  process.env.GITLAB_REDIRECT_URI ||
  "http://localhost:3000/api/gitlab/callback";

// GitLab OAuth URLs
const GITLAB_AUTH_URL = "https://gitlab.com/oauth/authorize";
const GITLAB_TOKEN_URL = "https://gitlab.com/oauth/token";

export const gitlabOAuth = httpAction(async (ctx, request) => {
  const url = new URL(request.url);

  // Start OAuth flow
  if (url.pathname === "/api/gitlab/auth") {
    const state = Math.random().toString(36).substring(7);
    const scope = "api read_user read_repository write_repository";

    // Store state in database for verification
    await ctx.runMutation(api.integrations.gitlab.mutations.storeOAuthState, {
      state,
    });

    const authUrl = new URL(GITLAB_AUTH_URL);
    authUrl.searchParams.append("client_id", GITLAB_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", GITLAB_REDIRECT_URI);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("scope", scope);

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
      },
    });
  }

  // Handle OAuth callback
  if (url.pathname === "/api/gitlab/callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return new Response("Missing code or state parameter", { status: 400 });
    }

    // Verify state
    const isValidState = await ctx.runQuery(
      api.integrations.gitlab.queries.verifyOAuthState,
      { state },
    );
    if (!isValidState) {
      return new Response("Invalid state parameter", { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch(GITLAB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITLAB_CLIENT_ID,
        client_secret: GITLAB_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: GITLAB_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("GitLab token exchange failed:", error);
      return new Response("Failed to exchange code for token", { status: 500 });
    }

    const tokenData = await tokenResponse.json();

    // Get user information
    const userResponse = await fetch("https://gitlab.com/api/v4/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return new Response("Failed to fetch user information", { status: 500 });
    }

    const userData = await userResponse.json();

    // Store the token and user info
    await ctx.runMutation(api.integrations.gitlab.mutations.storeAccessToken, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      userId: userData.id,
      username: userData.username,
      email: userData.email,
      name: userData.name,
      avatarUrl: userData.avatar_url,
    });

    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/settings/integrations?gitlab=connected",
      },
    });
  }

  // Disconnect GitLab
  if (url.pathname === "/api/gitlab/disconnect") {
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response("Missing userId parameter", { status: 400 });
    }

    await ctx.runMutation(api.integrations.gitlab.mutations.disconnectGitLab, {
      userId,
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/settings/integrations?gitlab=disconnected",
      },
    });
  }

  return new Response("Not found", { status: 404 });
});

// Export for HTTP router
const http = httpRouter();
http.route({
  path: "/api/gitlab/auth",
  method: "GET",
  handler: gitlabOAuth,
});
http.route({
  path: "/api/gitlab/callback",
  method: "GET",
  handler: gitlabOAuth,
});
http.route({
  path: "/api/gitlab/disconnect",
  method: "POST",
  handler: gitlabOAuth,
});

export default http;
