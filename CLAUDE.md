# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**cp-ninja** is a VS Code extension that enhances GitHub Copilot with structured, reusable skills - development workflows and best practices delivered via a chat participant (`@cp-ninja`). The extension provides 19+ built-in skills, supports personal skill creation, and includes features like skill search, favorites, workspace profiles, and Git repository browsing for importing resources.

**Key Requirement:** Skills are currently supported by VS Code Insiders only.

## Build & Development Commands

```bash
# Development workflow
npm install              # Install dependencies
npm run compile          # TypeScript → out/ directory
npm run watch            # Auto-compile on changes
npm run lint             # Run ESLint validation
npm test                 # Run Jest tests (ts-jest)
npm run validate         # Full validation: compile + lint + test

# Extension packaging
npm run clean            # Remove out/ and *.vsix files
npm run package          # Create .vsix package
npm run publish          # Publish to VS Code Marketplace

# Version management
npm run version:patch    # Bump patch version
npm run version:minor    # Bump minor version
npm run version:major    # Bump major version
npm run release:patch    # Version bump + package
npm run release:minor    # Version bump + package
npm run release:major    # Version bump + package
```

### Testing
- Test files: `tests/*.test.ts` using Jest with ts-jest
- Mock VS Code APIs: `jest.mock('vscode')`
- Run with coverage: `npm test -- --coverage`

### Extension Development
1. Press **F5** in VS Code to launch Extension Development Host
2. Debug Console shows `console.log` output
3. Personal skills hot-reload automatically
4. Packaged skills require extension restart
5. Test chat integration: Type `@cp-ninja` in Chat panel

## Architecture

### Dual Loading Strategy (Packaged vs Personal Skills)

The extension uses a sophisticated two-tier loading system:

**Packaged Skills** (`skills/` directory):
- **Eager loading**: Pre-loaded into cache during extension activation
- **Static**: Bundled with extension, require rebuild to modify
- **Handler**: `AsyncSkillLoader.loadPackagedSkills()`
- **Cache**: `AsyncSkillLoader.packagedSkillsCache`
- Symlinked to `~/.copilot/skills/` on activation for GitHub Copilot integration

**Personal Skills** (`~/.cp-ninja/skills/` or custom directory):
- **Lazy loading**: Loaded on-demand when first accessed
- **Dynamic**: Hot-reload on file changes via `SkillWatcher`
- **Handler**: `AsyncSkillLoader.doLoadPersonalSkill()`
- **Cache**: `AsyncSkillLoader.personalSkillsCache`

Resolution priority: Dynamic registry (personal) → Packaged cache → Filesystem fallback

### Core Components

**Skill System** (`skills/` and `~/.cp-ninja/skills/`):
- Markdown files with YAML frontmatter
- Each skill directory contains `SKILL.md` with metadata (name, description) and content
- Frontmatter stripped before display to users
- Skills injected as context into GitHub Copilot chat

**Chat Integration** (`src/extension.ts` - `mainChatHandler`):
- `@cp-ninja` participant registered via `vscode.chat.createChatParticipant()`
- Bootstrap mode: First chat turn auto-injects `using-cp-ninja` skill
- Slash commands: `/brainstorming`, `/systematic-debugging`, etc.
- Profile commands: `/switch-profile`, `/list-profiles`, `/technical-analysis`

**Resource Management** (`ResourceManager.ts`, `BootstrapManager.ts`):
- Layered config: `~/.cp-ninja/` (global) → `.cp-ninja/` (project) with inheritance
- Auto-detection: Analyzes `package.json`, file patterns for project type
- Presets: frontend-development, backend-api, technical-analysis, fullstack-development
- Symlink management: Creates `~/.copilot/skills/` symlinks for Copilot integration
- Logging: `~/.cp-ninja/logs/symlinks.log` tracks all created symlinks

**Key Managers**:
- `ConfigurationManager`: Workspace profiles, skill preferences, suggestion engine
- `ProfileManager`: Activates skill/agent sets based on project context
- `ContextDetector`: Detects frameworks, languages from workspace files
- `AgentManager`: Loads agent templates from `.github/prompts/`
- `OnboardingManager`: First-run welcome screen and tutorial
- `DynamicSkillRegistry`: Maintains registry of all skills (packaged + personal)
- `AsyncSkillLoader`: Handles async loading with caching strategy
- `EnhancedSuggestionEngine`: Context-aware skill suggestions

### Path Resolution

```typescript
// Personal skills directory supports ~ and ${WORKSPACE}
const customPath = config.get<string>('personalSkillsDirectory', '');
const resolvedPath = customPath
  .replace(/^~/, process.env.HOME || '')
  .replace(/\$\{([^}]+)\}/g, (_, env) => process.env[env] || '');
```

### Platform-Specific Paths

**VS Code User Profile Location**:
- macOS: `~/Library/Application Support/Code/User/prompts/`
- Windows: `%APPDATA%/Code/User/prompts/`
- Linux: `~/.config/Code/User/prompts/`

**Copilot Skills Directory**: `~/.copilot/skills/` (all platforms)

**CP-Ninja Global Directory**: `~/.cp-ninja/` with subdirectories:
- `skills/` - Personal skills
- `logs/` - Symlink logs and installation logs
- `profiles/` - Workspace profiles
- `resources/agents/` - Custom agents

## Critical Files

- `src/extension.ts`: Main activation, chat handler registration, command registration
- `src/AsyncSkillLoader.ts`: Dual loading strategy implementation (eager packaged, lazy personal)
- `src/DynamicSkillRegistry.ts`: Skill registry with hot-reload support
- `src/ResourceManager.ts`: Symlink management, profile resolution, skill enumeration
- `src/ProfileChatHandler.ts`: Handles profile-related chat commands
- `src/lib/skills-core.d.ts`: Core skill interfaces (JavaScript implementation)
- `package.json`: Commands, chat participants, configuration schema

## Skill Format

Skills follow this structure:

```markdown
---
name: skill-name
description: "Brief description of when to use this skill"
---
# Skill Title

## Overview
Detailed purpose and context...

## When to Use
- Use when [scenario 1]
- Use when [scenario 2]

## The Process
1. Step one with clear instructions
2. Step two with expected outcomes
3. Step three with verification criteria
```

**Conventions**:
- Use imperative tone: "Ask questions one at a time" (not "You should ask")
- Include contextual triggers: "Use when implementing new features"
- Break complex workflows into numbered sections
- Reference other skills: `@cp-ninja /skill-name`
- Frontmatter is required for skill detection

## Common Development Tasks

### Adding a New Command

1. Add to `package.json` → `contributes.commands`:
```json
{
  "command": "cp-ninja.myCommand",
  "title": "My Command",
  "category": "Copilot Ninja"
}
```

2. Register in `src/extension.ts` → `context.subscriptions.push()`:
```typescript
context.subscriptions.push(
  vscode.commands.registerCommand('cp-ninja.myCommand', async () => {
    // Implementation with error handling
  })
);
```

### Adding a New Packaged Skill

1. Create directory: `skills/new-skill/`
2. Add `SKILL.md` with frontmatter (see format above)
3. Restart extension to load (packaged skills are eagerly loaded)
4. Add slash command to `package.json` → `chatParticipants[0].commands`:
```json
{
  "name": "new-skill",
  "description": "Description for skill picker"
}
```

### Modifying Bootstrap Presets

Edit `src/BootstrapManager.ts` → `suggestPresets()` method to add new preset definitions based on context patterns (frameworks, file types, etc.).

### Managing Symlinks

The extension creates symlinks in `~/.copilot/skills/` pointing to packaged skills:
- Created on activation: `src/extension.ts` lines 680-701
- Logged to: `~/.cp-ninja/logs/symlinks.log`
- Cleanup on uninstall: `ResourceManager.removeSkillSymlinksFromLog()`
- Manual reload: Command `cp-ninja.reloadPackagedSkills`

## Integration Points

**VS Code APIs**:
- Chat API: `vscode.chat.createChatParticipant()` for `@cp-ninja` participant
- File Watchers: `vscode.workspace.createFileSystemWatcher()` for personal skills hot-reload
- Configuration: `vscode.workspace.getConfiguration('cpNinja')`
- Webviews: Skills Explorer sidebar, Tutorial, Git Repository Browser

**GitHub Copilot Integration**:
- Skills injected as context via chat participant messages
- Agent templates: `.github/prompts/` directory (copied from `templates/agents/` on activation)
- Personal prompts: Platform-specific VS Code User folder

**Resource Locations**:
- **Project resources** (workspace-specific): `.github/prompts/`, `.github/copilot-instructions.md`
- **User resources** (cross-workspace): `~/.cp-ninja/skills/`, VS Code User prompts folder

## Configuration Keys

```json
{
  "cpNinja.personalSkillsDirectory": "~/Documents/my-skills",
  "cpNinja.enableSuggestions": true,
  "cpNinja.suggestionFrequency": "normal",
  "cpNinja.suggestionCooldown": 300,
  "cpNinja.favoriteSkills": ["brainstorming", "systematic-debugging"],
  "cpNinja.blacklistedSkills": [],
  "cpNinja.enableAutoProfileDetection": true,
  "cpNinja.profileDetectionConfidenceThreshold": 0.6,
  "cpNinja.activeProfile": { "name": "frontend", "skills": [...], "agents": [...] },
  "cpNinja.workspaceProfiles": { "backend": { ... } }
}
```

## Error Handling Patterns

- All async operations use `try/catch` with descriptive error messages
- UI errors: `vscode.window.showErrorMessage()` with context
- Logging: `console.error('Operation failed:', error)` with operation context
- Graceful degradation: Fallback to basic functionality if advanced features fail

## Important Constraints

**DO**:
- Use `path.join()` for all path operations
- Respect user configuration for custom paths
- Handle missing files/directories gracefully
- Use async/await for file operations
- Log meaningful context with errors

**DON'T**:
- Modify `src/lib/skills-core.js` - it's a compiled JavaScript module
- Edit packaged skills in `skills/` without testing via `npm run compile && npm run package`
- Block extension activation - defer heavy operations
- Hardcode paths - always use path resolution utilities
- Assume directories exist - create with `{ recursive: true }`

## Git Repository Browser

The extension can import skills, prompts, agents, and instructions from GitHub repositories:
- UI: Webview panel with repository tree navigation
- Supported resources: `skills/*/SKILL.md`, `.github/prompts/*.md`, `.github/copilot-instructions.md`
- History: Stored in `RepoHistoryManager` with resource counts
- Import destinations: Project (`.github/`) or User (profile folder)

## Reference Documentation

- Design documents: `docs/plans/*.md`
- Skill examples: `skills/brainstorming/SKILL.md`, `skills/systematic-debugging/SKILL.md`
- Implementation details: `TASK5_IMPLEMENTATION_REPORT.md`
- Porting guide: `doc/porting-guide.md`
- Skills vs Agents: `doc/skills-vs-agents.md`
