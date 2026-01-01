# CP-Ninja Skill Composer

The CP-Ninja Skill Composer now uses VS Code's native markdown editor for the best possible experience with full Copilot integration.

## 🎯 How It Works

1. **Open Skill Composer**: Use the command palette (Ctrl+Shift+P) and run `CP-Ninja: Open Skill Composer`

2. **Choose Your Starting Point**:
   - **Templates**: Select from existing cp-ninja skills as starting points
   - **From Scratch**: Start with a comprehensive template with [placeholder] brackets
   - **Import**: Import an existing skill file

3. **Edit with Full VS Code Power**:
   - Native markdown editor with syntax highlighting
   - GitHub Copilot integration for AI-powered suggestions
   - IntelliSense autocomplete and error detection
   - All familiar VS Code shortcuts (Ctrl+S, Ctrl+Z, etc.)

4. **Save Your Skills**:
   - **User Skills**: Saved to `~/.cp-ninja/skills/` (global skills)
   - **Project Skills**: Saved to `.cp-ninja/skills/` (project-specific)
   - Use the save buttons in the Quick Start panel

## 🏗️ Template Structure

Skills use a comprehensive template with placeholder brackets for easy replacement:

```markdown
# [SKILL_NAME]

## Summary
[Brief description of what this skill does and when to use it]

## When to Use
- [Specific scenario 1]
- [Specific scenario 2]

## Process

### Step 1: [First Step Name]
[Detailed description of the first step]

```[LANGUAGE]
// [Code example or template]
[CODE_PLACEHOLDER]
```

## Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]

## Examples, Tips, and Troubleshooting sections included...
```

## 💡 Features

- **Native Editor Integration**: No custom editors - uses VS Code's powerful markdown editor
- **Copilot Support**: Get AI suggestions while writing your skills
- **Template Gallery**: Browse existing skills from your cp-ninja collection
- **Placeholder System**: Easy-to-find `[PLACEHOLDER]` format for quick customization
- **Dual Save Options**: Save to user directory or project directory
- **Import Functionality**: Import existing markdown files as skills

## 🎨 UI Layout

- **Left Panel (25%)**: Quick Start options and template gallery
- **Center Panel (55%)**: Instructions and workflow guidance
- **Right Panel (20%)**: Navigation and skill browser
- **Native Editor**: Opens in VS Code's main editor area

## 🔧 File Structure

When you save a skill, it creates:
```
~/.cp-ninja/skills/your-skill-name/
└── SKILL.md
```

Or for project skills:
```
.cp-ninja/skills/your-skill-name/
└── SKILL.md
```

## 🚀 Development Benefits

- **No Complex Setup**: Works with existing VS Code installation
- **Full Feature Support**: Markdown preview, extensions, themes
- **Performance**: Native editor is faster than webview alternatives
- **Familiar Experience**: Same editing experience as any markdown file

## 🎯 Next Steps

After creating a skill, you can:
- Use it with the cp-ninja chat participant
- Share it with your team
- Import it into other projects
- Continuously improve and refine it

Happy skill building! 🥷