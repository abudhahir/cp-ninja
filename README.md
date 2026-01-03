# cp-ninja: Superpowers for GitHub Copilot

This project is a conceptual port of the "Superpowers" skill system to a GitHub Copilot plugin (for use with VS Code/IntelliJ Copilot plugins). The goal is to allow Copilot to leverage a structured library of "skills" to guide its behavior and enforce development best practices.

For an understanding of the core concepts, see [Skills vs Agents](./doc/skills-vs-agents.md).

## Installation

For detailed setup and installation instructions, please see the [Installation Guide](./doc/installation.md).

## Project Structure

*   `./cp-ninja/src/lib/skills-core.js`: Contains the core logic for discovering, parsing, and resolving skills. This is directly adapted from the original Superpowers project.
*   `./cp-ninja/skills/`: This directory contains all the "skills" (in `SKILL.md` format) that Copilot Ninja can utilize. Each skill defines a specific process, best practice, or workflow.
*   `./cp-ninja/src/extension.ts`: The main entry point for the GitHub Copilot VS Code extension. It conceptually implements the integration points for skills.
*   `./cp-ninja/package.json`: Standard VS Code extension manifest and configuration.

## Native Integration with GitHub Copilot

This project is implemented as a **Chat Participant** extension for VS Code, providing a native chat experience for interacting with skills.

### Usage

1.  Open the Chat view in VS Code.
2.  Type `@cp-ninja:` to see all available skills with autocomplete
3.  Select a specific skill to activate it immediately:
    *   `@cp-ninja:brainstorming`: Activate the brainstorming skill
    *   `@cp-ninja:systematic-debugging`: Activate systematic debugging
    *   `@cp-ninja:test-driven-development`: Activate TDD workflow
4.  Or use the main participant `@cp-ninja` to see all available skills

### How it Works

*   **Individual Skill Participants:** Each skill has its own chat participant (e.g., `@cp-ninja:brainstorming`) for direct activation
*   **Main Participant:** `@cp-ninja` shows all available skills and usage instructions
*   **Discoverable Interface:** Typing `@cp-ninja:` triggers autocomplete showing all skills
*   **Dynamic Registration:** Skills are automatically discovered and registered as participants
*   **Instant Activation:** Select any skill participant to immediately load its content

## Skills Details View

CP-Ninja includes a **Skills Details View** that provides a native VS Code experience for browsing and exploring skills with integrated chat activation.

### 🚀 Getting Started

1. Open the command palette (`Ctrl+Shift+P`)
2. Run `CP-Ninja: Show Details`
3. Browse available skills:
   - **Full-width Gallery**: View all cp-ninja skills in organized categories
   - **Click to Preview**: View detailed markdown content for any skill
   - **Use Skill Button**: Instantly activate skills in GitHub Copilot Chat

### ✨ Key Features

- **Visual Skill Browser**: Browse skills with tags, descriptions, and difficulty levels
- **Markdown Preview**: View full skill content with proper formatting
- **One-Click Activation**: "Use Skill" button opens chat with skill ready to use
- **Category Filtering**: Filter skills by type (development, testing, planning, etc.)
- **Seamless Integration**: Direct connection to GitHub Copilot Chat system

### 🏗️ Skill Template Structure

```markdown
# [SKILL_NAME]

## Summary
[Brief description of what this skill does and when to use it]

## When to Use
- [Specific scenario 1]
- [Specific scenario 2]

## Process
### Step 1: [First Step Name]
[Detailed description with code examples]

## Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]

## Examples, Tips, Troubleshooting sections...
```

### 💡 Benefits

- **GitHub Copilot Integration**: AI-powered suggestions while writing skills
- **Syntax Highlighting**: Proper markdown formatting in native editor  
- **Familiar Experience**: Standard VS Code shortcuts and features
- **Performance**: Native editor is faster than custom webview alternatives
- **Team Collaboration**: Easy sharing and version control of skills

## Future Development

To make this a fully functional plugin, the placeholder Copilot API calls would need to be replaced with actual APIs provided by the GitHub Copilot extension framework (once they become available or are reverse-engineered). This would involve understanding how to:

*   Send system-level messages to Copilot.
*   Inject dynamic content into the Copilot chat context.
*   Register custom commands that Copilot can interpret and execute.

This project serves as a blueprint for extending Copilot's capabilities with a powerful, behavior-guiding skill system.