# Copilot Ninja - AI Agent Instructions

## Project Overview
**cp-ninja** is a VS Code extension that enhances GitHub Copilot with structured, reusable "skills" - development workflows, best practices, and methodologies delivered via a chat participant (`@cp-ninja`) and sidebar explorer.

## Architecture

### Core Components
- **Skills System**: Markdown files with YAML frontmatter in `skills/` (packaged) and `~/.cp-ninja/skills/` (personal)
  - Packaged skills load eagerly at startup, personal skills lazy-load on-demand
  - Each skill directory contains `SKILL.md` with metadata (name, description) and content
  - Skills are stripped of frontmatter before display to users
  
- **Dual Loading Strategy** ([AsyncSkillLoader.ts](src/AsyncSkillLoader.ts), [DynamicSkillRegistry.ts](src/DynamicSkillRegistry.ts)):
  - Packaged skills: Pre-loaded into cache during extension activation
  - Personal skills: Loaded on first access, cached thereafter
  - Hot-reload: Personal skills auto-refresh on file changes via `SkillWatcher`

- **Chat Integration** ([extension.ts](src/extension.ts)):
  - `@cp-ninja` participant with slash commands (e.g., `/brainstorming`, `/systematic-debugging`)
  - Bootstrap mode: First chat turn auto-injects `using-cp-ninja` skill
  - Profile commands: `/switch-profile`, `/list-profiles`, `/technical-analysis`

- **Resource Management** ([ResourceManager.ts](src/ResourceManager.ts), [BootstrapManager.ts](src/BootstrapManager.ts)):
  - Layered config: `~/.cp-ninja/` (global) → `.cp-ninja/` (project) with inheritance
  - Auto-detection: Analyzes `package.json`, file patterns, and team indicators to suggest presets
  - Presets: frontend-development, backend-api, technical-analysis, fullstack-development, etc.

### Key Managers
- **ConfigurationManager**: Workspace profiles, skill preferences, suggestion engine settings
- **ProfileManager**: Activates skill/agent sets based on project context
- **ContextDetector**: Detects frameworks, languages, project type from workspace files
- **AgentManager**: Loads agent templates from `.github/prompts/`
- **OnboardingManager**: First-run welcome screen and guided setup

## Development Workflow

### Build & Test
```bash
npm run compile        # TypeScript → out/
npm run lint          # ESLint validation
npm test              # Jest tests (ts-jest)
npm run validate      # compile + lint + test
npm run watch         # Auto-compile on changes
```

### Testing Pattern
- Test files: `tests/*.test.ts` (Jest with `ts-jest`)
- Mock VS Code APIs using `jest.mock('vscode')`
- Coverage: Run `npm test -- --coverage`

### Extension Development
1. Press **F5** in VS Code to launch Extension Development Host
2. Open Debug Console to see `console.log` output
3. Skills reload automatically (personal), but packaged skills require restart
4. Use `@cp-ninja` in Chat panel to test skill injection

### Creating Skills
Skills follow this structure:
```markdown
---
name: skill-name
description: "When to use this skill"
---
# Skill Title

## Overview
Brief description...

## The Process
Step-by-step workflow...
```

**Conventions:**
- Use imperative tone ("Ask questions one at a time", not "You should ask")
- Include contextual triggers ("Use when implementing new features")
- Break complex workflows into numbered sections
- Reference other skills as `cp-ninja:skill-name`

## Project-Specific Patterns

### Path Resolution
```typescript
// Personal skills directory supports ~ and ${WORKSPACE}
const customPath = config.get<string>('personalSkillsDirectory', '');
const resolvedPath = customPath
  .replace(/^~/, process.env.HOME || '')
  .replace(/\$\{([^}]+)\}/g, (_, env) => process.env[env] || '');
```

### Skill Resolution Priority
1. Dynamic registry (personal skills, if loaded)
2. Packaged skills cache (`AsyncSkillLoader.packagedSkillsCache`)
3. Fallback to `resolveSkillPath` with filesystem lookup

### Error Handling
- All async operations use `try/catch` with descriptive error messages
- UI errors show via `vscode.window.showErrorMessage()`
- Log errors with context: `console.error('Failed to load skill X:', error)`

### Configuration Keys
```json
{
  "cpNinja.personalSkillsDirectory": "~/Documents/my-skills",
  "cpNinja.enableSuggestions": true,
  "cpNinja.suggestionCooldown": 300,
  "cpNinja.favoriteSkills": ["brainstorming"]
}
```

## Critical Files
- [src/extension.ts](src/extension.ts): Main activation logic, chat handler registration
- [src/lib/skills-core.d.ts](src/lib/skills-core.d.ts): Core skill interfaces and utilities (JavaScript impl)
- [src/EnhancedSkillTreeDataProvider.ts](src/EnhancedSkillTreeDataProvider.ts): Sidebar tree view with search/favorites
- [package.json](package.json): Commands, chat participants, configuration schema

## Common Tasks

### Adding a New Command
1. Add to `package.json` → `contributes.commands`
2. Register in `extension.ts` → `context.subscriptions.push()`
3. Implement handler with proper error handling

### Adding a New Skill
1. Create directory: `skills/new-skill/`
2. Add `SKILL.md` with frontmatter
3. Restart extension or wait for hot-reload (personal skills only)
4. Add slash command in `package.json` → `chatParticipants[0].commands`

### Modifying Bootstrap Presets
Edit `BootstrapManager.ts` → `suggestPresets()` with new preset definitions matching context patterns

## Integration Points
- **VS Code Chat API**: `vscode.chat.createChatParticipant()` for `@cp-ninja`
- **GitHub Copilot**: Skills injected as context via chat messages
- **.github/prompts/**: Agent templates copied from `templates/agents/` on activation
- **File Watchers**: `vscode.workspace.createFileSystemWatcher()` for personal skills

## Avoid
- Don't modify `src/lib/skills-core.js` - it's a compiled JavaScript module
- Don't edit packaged skills in `skills/` without rebuilding the extension
- Don't block extension activation - use async operations and defer heavy work
- Don't hardcode paths - use `path.join()` and respect user config

## References
- Design docs: `docs/plans/*.md`
- Skill examples: `skills/brainstorming/SKILL.md`, `skills/systematic-debugging/SKILL.md`
- Implementation report: `TASK5_IMPLEMENTATION_REPORT.md`
