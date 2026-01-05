# Remote Resources - User Guide

## Overview
The Remote Resources feature allows you to browse and download agents, prompts, skills, instructions, and profiles from Git repositories (GitHub or GitLab) directly into your project or global directories.

## Quick Start

### 1. Configure a Repository

You can configure repositories in three ways:

#### Option A: Via Settings UI (Easiest)
1. Open Command Palette: `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Type: `Preferences: Open Settings (UI)`
3. Search: `cpNinja`
4. Scroll to **Remote Repositories**
5. Click **Add Item** and fill in the repository details

#### Option B: User Settings (Global)
**Recommended for personal/shared repositories that apply to all workspaces**

**Location:**
- macOS: `~/Library/Application Support/Code/User/settings.json`
- Linux: `~/.config/Code/User/settings.json`
- Windows: `%APPDATA%\Code\User\settings.json`

Or via menu: **File → Preferences → Settings** → search `cpNinja.remoteRepositories`

```json
{
  "cpNinja.remoteRepositories": [
    {
      "url": "https://github.com/yourorg/cp-ninja-resources",
      "branch": "main",
      "token": "${env:GITHUB_TOKEN}",
      "paths": {
        "agents": "agents",
        "prompts": "prompts",
        "skills": "skills",
        "instructions": "instructions",
        "profiles": "profiles"
      }
    }
  ]
}
```

#### Option C: Workspace Settings (Project-Specific)
**Recommended for team/project-specific repositories**

**Location:** `<workspace>/.vscode/settings.json`

```json
{
  "cpNinja.remoteRepositories": [
    {
      "url": "https://gitlab.com/company/team-resources",
      "branch": "main",
      "token": "${env:COMPANY_GITLAB_TOKEN}",
      "paths": {
        "agents": "agents",
        "instructions": "instructions"
      }
    }
  ]
}
```

**Note:** Workspace settings override User settings. If you configure repositories in both places, the workspace configuration takes precedence.

### 2. Browse and Download

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run: `Copilot Ninja: Browse Remote Resources`
3. Select repository (if multiple configured)
4. Wait for resources to load
5. Multi-select resources you want (Space to select, Enter to confirm)
6. Choose destination:
   - **Project**: Resources go to workspace `.github/` and `.cp-ninja/`
   - **Global**: Resources go to `~/.github/` and `~/.cp-ninja/`

## Resource Destinations

| Resource Type | Project Location | Global Location |
|--------------|------------------|-----------------|
| Agents/Prompts | `<workspace>/.github/prompts/` | `~/.github/prompts/` |
| Instructions | `<workspace>/.github/` | `~/.github/` |
| Skills | `<workspace>/.cp-ninja/skills/` | `~/.cp-ninja/skills/` |
| Profiles | `<workspace>/.cp-ninja/profiles/` | `~/.cp-ninja/profiles/` |

## Authentication

### GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo` (for private repos) or just public repo access
4. Set environment variable:
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   ```

### GitLab Personal Access Token

1. Go to GitLab → Preferences → Access Tokens
2. Create token with `read_api` scope
3. Set environment variable:
   ```bash
   export GITLAB_TOKEN=glpat_your_token_here
   ```

### Using Environment Variables in Settings

Reference tokens using `${env:VAR_NAME}` syntax:

```json
{
  "token": "${env:GITHUB_TOKEN}"
}
```

## Example Repository Structure

Your Git repository should follow this structure:

```
your-repo/
├── agents/
│   ├── code-reviewer-prompt.md
│   ├── security-analyst-prompt.md
│   └── performance-optimizer-prompt.md
├── prompts/
│   └── custom-prompts.md
├── skills/
│   ├── api-design/
│   │   └── SKILL.md
│   └── database-optimization/
│       └── SKILL.md
├── instructions/
│   └── copilot-instructions.md
└── profiles/
    ├── backend-api.json
    └── frontend-react.json
```

## Multiple Repositories

You can configure multiple repositories and switch between them:

```json
{
  "cpNinja.remoteRepositories": [
    {
      "url": "https://github.com/company/internal-resources",
      "token": "${env:COMPANY_GITHUB_TOKEN}",
      "paths": { "agents": "agents", "prompts": "prompts" }
    },
    {
      "url": "https://gitlab.com/team/shared-skills",
      "token": "${env:GITLAB_TOKEN}",
      "paths": { "skills": "skills" }
    }
  ]
}
```

## Troubleshooting

### "No resources found"
- Check the `paths` configuration matches your repository structure
- Verify the branch name (default is `main`, some repos use `master`)
- Ensure files have `.md` or `.json` extensions

### "HTTP 404" errors
- Verify the repository URL is correct
- Check if the repository is private and requires authentication
- Ensure your token has the necessary permissions

### "Authentication failed"
- Verify your token is valid and not expired
- Check environment variable is set correctly
- For private repos, ensure token has `repo` scope (GitHub) or `read_api` (GitLab)

## Best Practices

1. **Version Control**: Keep your shared resources in Git for team collaboration
2. **Global vs Project**: Use global for personal preferences, project for team standards
3. **Token Security**: Never commit tokens to settings.json, always use environment variables
4. **Organization**: Group related resources in subdirectories
5. **Documentation**: Include README files in your resource repositories

## Advanced: Self-Hosted GitLab/GitHub

For self-hosted instances, update the API URLs in your repository config:

```json
{
  "url": "https://gitlab.yourcompany.com/team/resources",
  "branch": "main",
  "token": "${env:COMPANY_GITLAB_TOKEN}",
  "paths": { ... }
}
```

Note: Currently only supports gitlab.com and github.com. Self-hosted support coming in future updates.
