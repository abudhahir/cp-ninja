# CP-Ninja

A VS Code extension that enhances GitHub Copilot with structured, reusable skills - development workflows and best practices delivered through a chat participant.

## Features

- **19 built-in skills** for common development workflows
- **Chat integration** via `@cp-ninja` participant with slash commands
- **Personal skills** - create and manage custom workflows
- **Skills Explorer** - searchable sidebar with favorites
- **Interactive tutorial** - onboarding guide for skills, agents, prompts, and instructions
- **Git repository browser** - import skills and resources from GitHub
- **Smart suggestions** based on file context

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

## Configuration

```json
{
  "cpNinja.personalSkillsDirectory": "~/Documents/my-skills",
  "cpNinja.enableSuggestions": true,
  "cpNinja.favoriteSkills": ["brainstorming", "systematic-debugging"]
}
```

## Commands

| Command | Action |
|---------|--------|
| `CP-Ninja: Show Tutorial` | Launch onboarding |
| `CP-Ninja: Show Skills Quick Pick` | Quick skill selector |
| `CP-Ninja: Browse Git Repository` | Import from GitHub |
| `CP-Ninja: Reload Skills` | Refresh personal skills |

## Resource Locations

**Project resources** (`.github/` in workspace):
- Prompts: `.github/prompts/`
- Instructions: `.github/copilot-instructions.md`

**User resources** (cross-workspace):
- Skills: `~/.cp-ninja/skills/`
- Prompts: VS Code User folder (platform-specific)

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
description: Brief description
---

# My Skill

## Process
1. Step one
2. Step two
```

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