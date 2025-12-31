# Porting Guide: From Superpowers to cp-ninja

This document outlines the process and architectural decisions made when porting the original `superpowers` skill system to the `cp-ninja` GitHub Copilot extension.

## High-Level Goal

The core objective was to adapt the powerful, prompt-based `superpowers` skill library into a native extension for GitHub Copilot in VS Code. This was achieved by moving from a system that relied on external scripts and platform-specific bootstraps to one that uses the official VS Code "Chat Participant" API.

---

## Key Architectural Changes

### 1. Architectural Shift: From Scripts to Native API

*   **`superpowers` (Old Way):** Relied on different integration methods for each platform. For example, it used a `.claude-plugin` with `hooks.json` for Claude Code, and a `.codex` directory with bootstrap scripts for another platform. This required maintaining separate integration layers.
*   **`cp-ninja` (New Way):** We have consolidated this into a single, unified VS Code extension. The core of this new architecture is the **Chat Participant API**. Instead of external scripts, we now have `src/extension.ts`, which programmatically defines how the agent interacts with the VS Code chat UI.

### 2. Core Logic & Skills: What Stayed the Same

This is the most important point: **the heart of the system is unchanged.**

*   **`lib/skills-core.js`:** This crucial library, which handles discovering, resolving, and parsing skill files, was **copied directly and without modification** into `cp-ninja/src/lib/`.
*   **`skills/` Directory:** The entire library of `SKILL.md` files, which contain the instructional prompts that define each "superpower," was also **copied directly** into `cp-ninja/skills/`.

This means the proven, battle-tested logic of the original skills remains intact. We have simply changed how these skills are loaded and presented to the LLM.

### 3. Entry Point & Invocation: How You Use It

*   **`superpowers` (Old Way):** You would use a platform-specific tool, like the `Skill` tool in Claude Code, or follow instructions from a bootstrap file.
*   **`cp-ninja` (New Way):** The user now interacts with a dedicated chat agent, **`@cp-ninja`**.
    *   You invoke it by typing `@cp-ninja` in the VS Code chat.
    *   You use slash commands *within the chat* to interact with the system (e.g., `@cp-ninja /use_skill brainstorming`).

### 4. The "Glue" Code: `extension.ts` Explained

The new integration layer is `cp-ninja/src/extension.ts`. It replaces all the old platform-specific scripts. Here’s what it does:

1.  **`activate()` function:** This is the main entry point for the extension. When VS Code starts, this function is called.
2.  **`vscode.chat.createChatParticipant('cp-ninja', ...)`:** Inside `activate()`, this is the key line. It registers our `@cp-ninja` agent with VS Code's chat system.
3.  **`chatHandler`:** This is the "brain" of our new agent. It's a function that gets called every time a user sends a message to `@cp-ninja`. It's responsible for:
    *   **Parsing Commands:** It checks if the user's message is a command like `/use_skill` or `/find_skills`.
    *   **Loading Skills:** It uses the (unchanged) `skills-core.js` library to find the right `SKILL.md` file on the filesystem.
    *   **Injecting Content:** It reads the content of the skill file and streams it back into the chat, making the skill's instructions available to the main Copilot LLM.

### 5. Bootstrap Process: The First Message

*   **`superpowers` (Old Way):** Relied on a bootstrap file being pre-loaded into the agent's context (e.g., `.codex/superpowers-bootstrap.md`).
*   **`cp-ninja` (New Way):** This is now handled elegantly inside our `chatHandler`. The handler checks if the chat history is empty (`context.history.length === 0`). If it is, it knows this is the first interaction and automatically loads and injects the `using-cp-ninja` skill, which provides the initial instructions on how to use the system.

### 6. Configuration: From `plugin.json` to `package.json`

*   **`superpowers` (Old Way):** Used various config files like `.claude-plugin/plugin.json`.
*   **`cp-ninja` (New Way):** We now use a standard VS Code `package.json`. The key change was replacing the old `commands` section with the new `chat.participants` section, which formally registers `@cp-ninja` with the IDE.

---

### Summary

In short, we have taken the core "engine" of `superpowers` (the skills library and its loader) and placed it inside a new, more modern "chassis" (the VS Code Chat Participant API). This makes the system more native, easier to maintain, and provides a more integrated user experience within VS Code, while preserving the powerful, field-tested logic of the original skills.
