# cp-ninja: Setup and Installation Guide

This guide provides instructions on how to install the `@cp-ninja` extension in Visual Studio Code, covering both local installation for development and standard installation from the Marketplace.

---

## 1. Prerequisites

Before you begin, ensure you have the following software installed:

*   **Visual Studio Code:** Version 1.75 or later.
*   **Node.js and npm:** Required for building the extension from source. You can download them from [nodejs.org](https://nodejs.org/).
*   **Git:** For version control.

---

## 2. Local Installation (for Development and Testing)

Use this method to run the extension directly from the source code. This is ideal for development, testing, or contributing to the project.

**Step 1: Obtain the Source Code**
Ensure you have the `cp-ninja` project directory on your local machine.

**Step 2: Install Dependencies**
Open a terminal inside the `cp-ninja` project root directory and run the following command to install the necessary `devDependencies`:
```bash
npm install
```

**Step 3: Compile the TypeScript Code**
The extension is written in TypeScript (`.ts`) and needs to be compiled into JavaScript (`.js`). Run the following command:
```bash
npm run compile
```
This will create an `out` directory containing the compiled JavaScript files.

**Step 4: Run the Extension in a Development Host**
1.  Open the `cp-ninja` project directory in VS Code.
2.  Press `F5` on your keyboard (or go to `Run > Start Debugging`).
3.  This will open a new VS Code window called the "Extension Development Host." The `@cp-ninja` extension will be active in this new window.

---

## 3. Marketplace Installation (for End-Users)

This is the standard method for users once the extension is published to the official Visual Studio Code Marketplace.

**Step 1: Open the Extensions View**
In VS Code, click on the Extensions icon in the Activity Bar on the side of the window or press `Ctrl+Shift+X`.

**Step 2: Search for the Extension**
In the search bar, type `Copilot Ninja` or `cp-ninja`.

**Step 3: Install**
Find the `@cp-ninja` extension in the search results and click the **Install** button.

**Step 4: Reload VS Code (if required)**
VS Code will prompt you to reload the window if necessary to activate the extension.

---

## 4. How to Verify the Installation

After either local or Marketplace installation, you can verify that `@cp-ninja` is working correctly:

1.  **Check the Status Bar:** Look for the `$(beaker) @cp-ninja` item in the bottom-left corner of the VS Code status bar.
2.  **Check the Activity Bar:** Look for the new Copilot Ninja icon in the Activity Bar on the far left. Clicking it should open the "Skills Explorer" view.
3.  **Check the Chat:** Open the Chat view and type `@`. You should see `@cp-ninja` appear in the list of available chat participants. Start a chat by typing `@cp-ninja /find_skills` to see a list of available skills.

---

## For Maintainers: Publishing to the Marketplace

To publish the extension, you will need the `vsce` (Visual Studio Code Extensions) command-line tool.

```bash
# Install vsce globally
npm install -g vsce

# Package the extension into a .vsix file
vsce package

# Publish the extension (requires a publisher identity)
vsce publish
```
This part of the process is only for project maintainers who have the necessary access rights to the VS Code Marketplace publisher account.
