# Fix GitHub MCP (create repo + push)

Cloud Agents were getting **403** on `create_repository` because the default GitHub connection is often **read-only**. This project expects GitHub’s MCP server to use a **personal access token (PAT)** with repository write access.

## 1. Create a PAT

1. Open [github.com/settings/tokens](https://github.com/settings/tokens).
2. **Fine-grained** (recommended): select account **gustreet**, grant access to **All repositories** or only `norwegianmethod`, and enable:
   - **Metadata** (required)
   - **Contents** — Read and write
   - **Administration** — Read and write (needed to **create** repositories)
3. **Or classic**: scope **`repo`** (full control of private repositories).

Copy the token once; you will not see it again.

## 2. Wire it in Cursor (both steps)

**A — GitHub MCP (required for `create_repository` in chat)**

1. **Settings → Plugins → GitHub → Configure**
2. Paste your PAT into **GitHub personal access token** (this is separate from environment secrets).

**B — Cloud Agent shell / `git push`**

1. Environment or run **Secrets**: name **`GITHUB_PERSONAL_ACCESS_TOKEN`** (or `GH_TOKEN`).
2. **Save** the environment and start a **new** agent run — secrets do not hot-reload on an already-running VM.

**Desktop / Plugins**

1. **Settings → Plugins → GitHub → Configure**.
2. Paste the same value into **GitHub personal access token**.

This repo includes [`.cursor/mcp.json`](../.cursor/mcp.json), which points the GitHub MCP server at `https://api.githubcopilot.com/mcp/` with that header.

## 3. Verify

Ask the agent to run GitHub MCP `get_me`, then `create_repository` for `norwegianmethod`, or push `main` to `git@github.com:gustreet/norwegianmethod.git`.

## 4. Git push from the VM (optional)

With `GITHUB_PERSONAL_ACCESS_TOKEN` set in the environment:

```bash
git remote set-url github "https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/gustreet/norwegianmethod.git"
git push -u github main
```

## Still failing?

- Disconnect **Integrations → GitHub** OAuth if it conflicts with the plugin PAT; prefer the plugin + secret above.
- Fine-grained tokens without **Administration** can push to an existing repo but cannot **create** one—create `norwegianmethod` on GitHub first, or add Administration.
