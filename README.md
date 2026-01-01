# cp-ninja: Superpowers for GitHub Copilot

This project is a conceptual port of the "Superpowers" skill system to a GitHub Copilot plugin (for use with VS Code/IntelliJ Copilot plugins). The goal is to allow Copilot to leverage a structured library of "skills" to guide its behavior and enforce development best practices.

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
2.  Start an interaction by mentioning the participant: `@cp-ninja`
3.  Use commands within the chat to interact with the skill system:
    *   `@cp-ninja /find_skills`: Lists all available skills.
    *   `@cp-ninja /use_skill <skill_name>`: Loads a specific skill into the conversation.

### How it Works

*   **`@cp-ninja` Chat Participant:** The extension registers a single chat participant named `@cp-ninja` which handles all interactions.
*   **Command Parsing:** The participant's handler in `src/extension.ts` parses commands like `/use_skill` and `/find_skills` from the user's chat message.
*   **Dynamic Skill Loading:** Based on the command, the handler uses the `skills-core.js` library to find the appropriate `SKILL.md` file and injects its content directly into the chat conversation.
*   **Bootstrap:** When a new chat session with `@cp-ninja` begins, the `using-cp-ninja` skill is automatically loaded to provide initial instructions.

## Skill Composer

CP-Ninja includes a **Skill Composer** that provides a native VS Code integrated experience for creating and managing skills with full GitHub Copilot support.

### 🚀 Getting Started

1. Open the command palette (`Ctrl+Shift+P`)
2. Run `CP-Ninja: Open Skill Composer`
3. Choose your starting point:
   - **Templates**: Browse existing cp-ninja skills
   - **From Scratch**: Start with a comprehensive template
   - **Import**: Import existing markdown files

### ✨ Key Features

- **Native Editor Integration**: Skills open in VS Code's markdown editor with full Copilot support
- **Template Gallery**: Browse and use existing skills as starting points
- **Placeholder System**: Templates use `[PLACEHOLDER]` format for easy customization
- **Dual Save Options**: Save to user (`~/.cp-ninja/skills`) or project (`.cp-ninja/skills`) directories
- **AI-Powered Editing**: Full GitHub Copilot integration while writing skills

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