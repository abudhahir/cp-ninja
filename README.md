# cp-ninja: Superpowers for GitHub Copilot

A powerful VS Code extension that enhances GitHub Copilot with structured "skills" - reusable development workflows, best practices, and methodologies. Transform your AI assistant into a knowledgeable pair programming partner with context-aware suggestions and guided workflows.
updated

## ✨ Features

### 🎯 **Skills Library**
- **19 built-in skills** covering development workflows, debugging, code review, and more
- **Personal skills** - Create and manage your own custom skills
- **Dynamic loading** - Packaged skills load instantly, personal skills on-demand
- **Hot reload** - Personal skills update automatically when modified

### 💬 **GitHub Copilot Integration**
- **Chat participant** `@cp-ninja` for natural skill interaction
- **Slash commands** `/brainstorming`, `/systematic-debugging`, etc.
- **Auto-suggestions** based on file context and development patterns
- **Bootstrap mode** - Automatically shows getting started guidance

### 🌟 **Skills Explorer**
- **Dedicated sidebar** with searchable skills tree
- **Categories & filtering** - Find skills by name, description, or type
- **Favorites system** - Pin frequently used skills
- **Native editor integration** - Open skills in VS Code's markdown editor

### ⚙️ **Smart Configuration**
- **Configurable personal skills directory** with `~` and environment variable support
- **Suggestion engine** with cooldown and frequency controls
- **Workspace profiles** for project-specific skill sets
- **Auto-detection** of relevant skills based on context

## 📦 Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Copilot Ninja Skills"
4. Click Install

### Manual Installation
1. Download the `.vsix` file from releases
2. Open VS Code
3. Press Ctrl+Shift+P and type "Extensions: Install from VSIX"
4. Select the downloaded file

## 🚀 Getting Started

### Using Chat Integration
1. Open the Chat panel in VS Code
2. Type `@cp-ninja` to see all available skills
3. Use slash commands like `@cp-ninja /brainstorming` to activate specific skills
4. Follow the guided workflow provided by each skill

### Using the Skills Explorer
1. Click the Copilot Ninja icon in the activity bar
2. Browse skills by category in the Skills Explorer
3. Search skills using the search box
4. Click any skill to open it in the editor
5. Add frequently used skills to favorites

## 📋 Built-in Skills

| Skill | Description | Use When |
|-------|-------------|----------|
| **brainstorming** | Structured ideation and design process | Starting new features or creative work |
| **systematic-debugging** | Methodical debugging approach | Encountering complex bugs or errors |
| **test-driven-development** | TDD workflow and best practices | Implementing new features with tests |
| **requesting-code-review** | Prepare thorough code review requests | Code is ready for team review |
| **receiving-code-review** | Handle review feedback systematically | Received review comments to address |
| **executing-plans** | Step-by-step plan implementation | Have a detailed implementation plan |
| **writing-plans** | Create structured project plans | Need to organize complex work |
| **subagent-driven-development** | Parallel task execution | Multiple independent tasks to complete |
| **dispatching-parallel-agents** | Coordinate concurrent work streams | 2+ independent tasks without dependencies |
| **finishing-a-development-branch** | Pre-merge cleanup checklist | Feature work is complete, ready to merge |
| **verification-before-completion** | Quality assurance checklist | Final verification before task completion |
| **using-git-worktrees** | Git worktree workflow | Need isolated workspaces for parallel work |
| **software-architect** | Architecture design and decisions | Designing system architecture |
| **technical-analyzer** | Technical analysis methodology | Need comprehensive technical analysis |
| **springboot-tech-investigation** | Spring Boot investigation guide | Working with Spring Boot applications |
| **creating-skill** | Guide for creating new skills | Want to create custom skills |
| **writing-skills** | Best practices for skill creation | Improving existing or creating skills |
| **using-cp-ninja** | Extension usage guide | Getting started with the extension |
| **using-superpowers** | Advanced workflow techniques | Want to maximize productivity |

## ⚙️ Configuration

### Personal Skills Directory

Customize where your personal skills are stored:

```json
{
  "cpNinja.personalSkillsDirectory": "~/Documents/my-skills"
}
```

**Examples:**
- `"~/Documents/my-skills"` → `~/Documents/my-skills/skills/`
- `"/team/shared-skills"` → `/team/shared-skills/skills/`  
- `"${WORKSPACE}/custom-skills"` → `{workspace}/custom-skills/skills/`
- Empty (default) → `~/.cp-ninja/skills/`

### Suggestion Engine

Control how and when skills are suggested:

```json
{
  "cpNinja.enableSuggestions": true,
  "cpNinja.suggestionCooldown": 300,
  "cpNinja.suggestionFrequency": "contextual"
}
```

### Favorites & Blacklists

Manage your skill preferences:

```json
{
  "cpNinja.favoriteSkills": ["brainstorming", "systematic-debugging"],
  "cpNinja.blacklistedSkills": []
}
```

## 🎯 Available Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| **Show Skills Quick Pick** | Quick skill selector | `Ctrl+Shift+P` → "Show Skills Quick Pick" |
| **Search Skills** | Search skills by name/description | Available in Skills Explorer |
| **Toggle Favorites** | Show/hide favorites view | Click ⭐ in Skills Explorer |
| **Reload Skills** | Refresh personal skills | Via Command Palette |
| **Create Dynamic Skill** | Create new skill interactively | Via Command Palette |
| **Show Skill Stats** | View loading statistics | Via Command Palette |
| **Show Welcome Screen** | Display onboarding | Via Command Palette |

## 🛠️ Creating Personal Skills

### Method 1: Interactive Creation
1. Open Command Palette (Ctrl+Shift+P)
2. Run "Copilot Ninja: Create Dynamic Skill"
3. Follow the prompts to name, describe, and write your skill

### Method 2: Manual Creation
1. Navigate to your personal skills directory (default: `~/.cp-ninja/skills/`)
2. Create a new folder with your skill name
3. Add a `SKILL.md` file with frontmatter:

```markdown
---
name: my-custom-skill
description: Brief description of what this skill does
---

# My Custom Skill

## Overview
Detailed description of the skill's purpose and when to use it.

## Process
1. Step one
2. Step two
3. Step three

## Success Criteria
- [ ] Criterion one
- [ ] Criterion two
```

## 📊 Performance Features

### Smart Loading Strategy
- **Packaged skills**: Loaded eagerly on startup for instant access
- **Personal skills**: Loaded dynamically on-demand for better performance
- **File watching**: Personal skills auto-reload when changed
- **Caching**: Intelligent caching reduces file system access

### Context Awareness
- **File type detection**: Suggests relevant skills based on current file
- **Content analysis**: Identifies patterns like TODOs, bugs, test files
- **Workspace analysis**: Detects project types and suggests appropriate workflows
- **Usage tracking**: Learns from your skill usage patterns

## 🔧 Advanced Usage

### Workspace Profiles
Configure different skill sets for different project types:

```json
{
  "cpNinja.workspaceProfiles": {
    "frontend": {
      "favoriteSkills": ["test-driven-development", "requesting-code-review"],
      "activeSkills": ["brainstorming", "systematic-debugging"]
    },
    "backend": {
      "favoriteSkills": ["springboot-tech-investigation", "technical-analyzer"]
    }
  },
  "cpNinja.activeProfile": "frontend"
}
```

### Team Collaboration
- **Shared skills directory**: Point multiple team members to the same skills folder
- **Version control**: Track skill evolution in your repository
- **Standardized workflows**: Ensure consistent practices across the team

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Report bugs** using GitHub Issues
2. **Suggest features** or improvements
3. **Contribute skills** to the built-in library
4. **Submit pull requests** for enhancements

### Development Setup
```bash
git clone https://github.com/abudhahir/cp-ninja.git
cd cp-ninja
npm install
npm run compile
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Based on the original "Superpowers" skill system concept
- Built for the GitHub Copilot ecosystem
- Inspired by developer workflow automation needs

---

**Ready to supercharge your development workflow?** Install Copilot Ninja Skills and transform your AI assistant into the ultimate pair programming partner! 🚀