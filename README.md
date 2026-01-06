# CP-Ninja

A VS Code extension that enhances GitHub Copilot with structured, reusable skills - development workflows and best practices delivered through a chat participant.

> **Note:** Skills are currently supported by VS Code Insiders - ref: https://code.visualstudio.com/docs/copilot/customization/agent-skills

## Features

- **19 built-in skills** for common development workflows
- **Chat integration** via `@cp-ninja` participant with slash commands
- **Personal skills** - create and manage custom workflows
- **Skills Explorer** - searchable sidebar with favorites, categories, and quick actions
- **Interactive tutorial** - onboarding guide for skills, agents, prompts, and instructions
- **Git repository browser** - import skills and resources from GitHub repositories
- **Smart suggestions** - context-aware skill recommendations based on file type and content
- **Workspace profiles** - project-specific skill configurations with auto-detection
- **Status bar integration** - quick access to commands and tutorial

## Installation

**From VS Code Marketplace:**
1. Open Extensions (Ctrl+Shift+X)
2. Search for "Copilot Ninja Skills"
3. Click Install

**From VSIX:**
```bash
code --install-extension cp-ninja-*.vsix
```

## Quick Start

1. **Launch tutorial**: Click status bar `@cp-ninja` icon → "Show Tutorial"
2. **Use in chat**: Type `@cp-ninja` to see available skills
3. **Activate skill**: `@cp-ninja /brainstorming` or `@cp-ninja /systematic-debugging`
4. **Browse skills**: Open CP-Ninja sidebar from activity bar

## Chat Participant Commands

Use `@cp-ninja` in GitHub Copilot Chat with these slash commands:

| Command | When to Use |
|---------|-------------|
| `/brainstorming` | Before creating features or components |
| `/systematic-debugging` | Complex bug investigation |
| `/test-driven-development` | Implementing with TDD workflow |
| `/writing-plans` | Creating implementation plans |
| `/executing-plans` | Executing step-by-step plans |
| `/requesting-code-review` | Preparing code for review |
| `/receiving-code-review` | Addressing review feedback |
| `/subagent-driven-development` | Parallel task execution |
| `/dispatching-parallel-agents` | Independent concurrent tasks |
| `/verification-before-completion` | Pre-completion quality check |
| `/finishing-a-development-branch` | Pre-merge cleanup |
| `/using-git-worktrees` | Isolated workspace setup |
| `/technical-analysis` | Comprehensive technical analysis |
| `/switch-profile` | Change development profile |
| `/list-profiles` | View available profiles |

## Core Skills

| Skill | Purpose |
|-------|---------|  
| `brainstorming` | Structured ideation for new features |
| `systematic-debugging` | Methodical bug investigation |
| `test-driven-development` | TDD workflow |
| `subagent-driven-development` | Parallel task execution |
| `requesting-code-review` | Prepare code review requests |
| `receiving-code-review` | Address review feedback |
| `writing-plans` | Create implementation plans |
| `executing-plans` | Step-by-step execution |
| `verification-before-completion` | Pre-completion checklist |
| `finishing-a-development-branch` | Pre-merge cleanup |

[View all skills →](skills/)

## Workspace Profiles

CP-Ninja automatically detects your project type and configures relevant skills:

**Auto-detected profiles:**
- **frontend-development** - React, Vue, Angular projects
- **backend-api** - Node.js, Express, Spring Boot APIs
- **fullstack-development** - Combined frontend/backend
- **data-science** - Python, Jupyter, ML projects
- **mobile-development** - React Native, Flutter
- **devops** - Infrastructure, CI/CD, containers

**Manual profile switching:**
1. Use `@cp-ninja /switch-profile` in chat
2. Run `CP-Ninja: Configure Profile` command
3. Set `cpNinja.activeProfile` in settings

## Configuration

**Skills and Suggestions:**
```json
{
  "cpNinja.personalSkillsDirectory": "~/Documents/my-skills",
  "cpNinja.enableSuggestions": true,
  "cpNinja.suggestionFrequency": "normal",
  "cpNinja.suggestionCooldown": 300,
  "cpNinja.favoriteSkills": ["brainstorming", "systematic-debugging"],
  "cpNinja.blacklistedSkills": []
}
```

**Workspace Profiles:**
```json
{
  "cpNinja.enableAutoProfileDetection": true,
  "cpNinja.profileDetectionConfidenceThreshold": 0.6,
  "cpNinja.activeProfile": {
    "name": "frontend",
    "skills": ["test-driven-development"],
    "agents": ["technical-analysis"]
  },
  "cpNinja.workspaceProfiles": {
    "backend": {
      "favoriteSkills": ["systematic-debugging"],
      "agents": ["software-architect"]
    }
  }
}
```

**Custom Shortcuts:**
```json
{
  "cpNinja.customShortcuts": {
    "ctrl+shift+b": "brainstorming",
    "ctrl+shift+d": "systematic-debugging"
  }
}
```

## Commands

| Command | Action |
|---------|--------|
| `CP-Ninja: Show Tutorial` | Launch interactive onboarding tutorial |
| `CP-Ninja: Show Welcome Screen` | Display welcome screen with setup |
| `CP-Ninja: Show Skills Quick Pick` | Quick skill selector and launcher |
| `CP-Ninja: Search Skills` | Search skills by name or description |
| `CP-Ninja: Toggle Favorites View` | Show/hide favorites in Skills Explorer |
| `CP-Ninja: Add to Favorites` | Add skill to favorites list |
| `CP-Ninja: Remove from Favorites` | Remove skill from favorites |
| `CP-Ninja: Open Skill in Editor` | Open skill file in VS Code editor |
| `CP-Ninja: Browse Git Repository` | Import resources from GitHub repos |
| `CP-Ninja: Clear Repository History` | Clear browsing history |
| `CP-Ninja: Auto-Detect Project Profile` | Detect and configure project type |
| `CP-Ninja: Show Active Profile` | View current profile configuration |
| `CP-Ninja: Configure Profile` | Customize workspace profile |
| `CP-Ninja: Reset Onboarding` | Reset first-run experience |

## Git Repository Browser

Import skills, prompts, agents, and instructions from any GitHub repository:

1. Click status bar icon → "Browse Git Repository"
2. Enter repository URL (e.g., `owner/repo`)
3. Browse repository structure
4. Select resources to import
5. Choose destination: **Project** (`.github/`) or **User** (profile folder)

**Supported resource types:**
- Skills: `skills/*/SKILL.md`
- Prompts: `.github/prompts/*.md`
- Instructions: `.github/copilot-instructions.md`
- Agents: Template files with agent definitions

## Resource Locations

**Project resources** (workspace-specific, stored in `.github/`):
- Prompts: `.github/prompts/`
- Instructions: `.github/copilot-instructions.md`
- Agents: `.github/prompts/`

**User resources** (cross-workspace, available globally):
- Skills: `~/.cp-ninja/skills/`
- Prompts: Platform-specific VS Code User folder:
  - macOS: `~/Library/Application Support/Code/User/prompts/`
  - Windows: `%APPDATA%/Code/User/prompts/`
  - Linux: `~/.config/Code/User/prompts/`

## Skills Explorer

The sidebar provides powerful skill management:

**Features:**
- **Search** - Filter skills by name or description
- **Favorites** - Pin frequently used skills for quick access
- **Categories** - Browse skills by workflow type
- **Quick actions** - Open in editor, add to chat, copy to clipboard
- **Context menu** - Right-click for favorite management

**Keyboard shortcuts:**
- Click skill → Opens in editor
- `Ctrl+Shift+P` → Quick Pick launcher
- Search icon → Filter skills
- Star icon → Toggle favorites view

## Creating Custom Skills

**Directory structure:**
```
~/.cp-ninja/skills/
  └── my-skill/
      └── SKILL.md
```

**Skill template:**
```markdown
---
name: my-skill
description: Brief description of when to use this skill
---

# My Skill

## Overview
Detailed explanation of the skill's purpose.

## When to Use
- Use when [scenario 1]
- Use when [scenario 2]

## Process
1. Step one with clear instructions
2. Step two with expected outcomes
3. Step three with verification criteria

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

**Personal skills directory:**
- Default: `~/.cp-ninja/skills/`
- Custom: Set `cpNinja.personalSkillsDirectory`
- Supports `~` and `${WORKSPACE}` variables
- Auto-reloads on file changes

**Creating via command:**
1. Run `CP-Ninja: Create Dynamic Skill` (if available)
2. Or manually create directory structure above
3. Skills appear automatically in explorer

## Smart Suggestions

CP-Ninja proactively suggests skills based on your work:

**Suggestion triggers:**
- Opening files with specific patterns (test files, bug reports)
- Detecting keywords (TODO, FIXME, BUG)
- File type and language detection
- Workspace analysis (frameworks, project structure)

**Suggestion frequency settings:**
- `never` - Disable all suggestions
- `minimal` - Only critical workflow suggestions
- `normal` - Balanced suggestion frequency (default)
- `aggressive` - Frequent contextual suggestions

**Cooldown:** Prevents suggestion spam (default: 300 seconds)

## Development

```bash
git clone https://github.com/abudhahir/cp-ninja.git
cd cp-ninja
npm install
npm run compile
```

## License

MIT License - see [LICENSE](LICENSE)

---

**Documentation:** [Installation](doc/installation.md) | [Skills vs Agents](doc/skills-vs-agents.md)