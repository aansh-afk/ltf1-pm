# Local Secrets And Private Keys

This repo intentionally never tracks `.env*`, `*.pem`, `*.p8`, or `*.key` files.
The patterns are blocked in [`.gitignore`](../../.gitignore) and the optional
[`scripts/check-no-secrets.sh`](../../scripts/check-no-secrets.sh) pre-commit
guard.

## Inventory of files that may exist locally

These paths are referenced by current setup tooling. They must remain
untracked and outside backup snapshots. If they have ever been visible to
external tooling (LLM editors, sync clients, screen-shares), rotate the keys.

- `.env` — root deployment env, including Convex/Clerk URLs and webhook secrets.
- `apps/mobile/.env` — Expo public env values consumed by `apps/mobile/lib/convex.ts`.
- `apps/mobile/.env.local` — optional Expo overrides.
- `apps/web/.env.local` — Vite-only overrides.
- `ltf1-integration.<date>.private-key.pem` — GitHub App private key.
- `temp_key.pem`, `temp_key_new.pem` — historical key material; not used by
  current code paths and should be deleted after rotation.

## Recommended handling

1. **Move secrets outside the repo.** Prefer a per-host secret store
   (`~/.config/ltf1/.env`, OS keychain, 1Password CLI, `direnv` with the env
   file kept outside the repo).
2. **Rotate the GitHub App key** if the `.pem` was generated long ago or has
   been visible to AI tools. Replace it via the GitHub App settings page,
   download the new key into the secret store, and update the Convex
   `GITHUB_APP_PRIVATE_KEY` env var.
3. **Delete `temp_key*.pem`** if they are no longer needed; they are listed in
   `.gitignore` but should not exist on disk inside the repo workspace.
4. **Install the pre-commit guard** so secret-looking files cannot be staged
   even with `git add -f`:

   ```bash
   ln -sf ../../scripts/check-no-secrets.sh .git/hooks/pre-commit
   ```

5. **Audit history.** Run `git log --all --diff-filter=A -- '*.pem' '.env*'`
   on a fresh clone before publishing new tags or making the repo public to
   confirm no secret has ever been committed.

## CI guard

Wire `scripts/check-no-secrets.sh` into CI as well so non-local commits are
also screened — the script reads from `git diff --cached`, so call it after
`git stage` in a verification step.
