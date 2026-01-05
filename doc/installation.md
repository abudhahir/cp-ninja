# cp-ninja: Setup and Installation Guide

This guide provides comprehensive instructions for installing and setting up the Copilot Ninja Skills extension in Visual Studio Code.

---

## 🚀 Quick Installation

### From VS Code Marketplace (Recommended)

1. Open Visual Studio Code
2. Press `Ctrl+Shift+X` to open Extensions
3. Search for "Copilot Ninja Skills" or "cp-ninja"
4. Click **Install** on the official extension
5. Reload VS Code when prompted

### Manual Installation from VSIX

1. Download the latest `.vsix` file from [Releases](https://github.com/abudhahir/cp-ninja/releases)
2. Open VS Code
3. Press `Ctrl+Shift+P` and type "Extensions: Install from VSIX"
4. Select the downloaded `.vsix` file
5. Reload VS Code when prompted

---

## 🛠️ Development Installation

For developers who want to contribute or customize the extension:

### Prerequisites

- **Visual Studio Code** 1.75.0 or later
- **Node.js** 18.x or later with npm
- **Git** for version control
- **TypeScript** knowledge for modifications

### Setup Steps

```bash
# Clone the repository
git clone https://github.com/abudhahir/cp-ninja.git
cd cp-ninja

# Install dependencies
npm install

# Compile TypeScript to JavaScript
npm run compile

# Package the extension (optional)
npm run package
```

### Running in Development Mode

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new VS Code window
4. Make changes and press `Ctrl+R` in the dev window to reload

### Building and Packaging

```bash
# Compile for production
npm run vscode:prepublish

# Create VSIX package
npx vsce package

# Install locally from package
code --install-extension cp-ninja-0.1.0.vsix
```

---

## ✅ Verification & First Setup

### 1. Verify Installation

After installation, confirm the extension is working:

**Check the Activity Bar:**
- Look for the Copilot Ninja icon (⚙️) in the left sidebar
- Click it to open the Skills Explorer

**Test Chat Integration:**
- Open Chat panel (`Ctrl+Shift+I` or View > Chat)
- Type `@cp-ninja` - you should see skill suggestions
- Try `@cp-ninja /brainstorming` to test a specific skill

**Check Commands:**
- Press `Ctrl+Shift+P`
- Type "Copilot Ninja" to see available commands

### 2. Initial Configuration

**Set Up Personal Skills Directory (Optional):**
```json
{
  "cpNinja.personalSkillsDirectory": "~/Documents/my-skills"
}
```

**Configure Suggestions:**
```json
{
  "cpNinja.enableSuggestions": true,
  "cpNinja.suggestionCooldown": 300,
  "cpNinja.suggestionFrequency": "contextual"
}
```

### 3. First Usage

1. **Explore Built-in Skills:**
   - Open Skills Explorer from the activity bar
   - Browse the 19 built-in skills
   - Click any skill to open it in the editor

2. **Try Chat Integration:**
   - Open Chat and type `@cp-ninja /using-cp-ninja`
   - Follow the guided tour

3. **Create Your First Personal Skill:**
   - Run command "Copilot Ninja: Create Dynamic Skill"
   - Follow the prompts to create a custom skill

---

## 🔧 Troubleshooting

### Common Issues

**Extension Not Appearing:**
- Ensure VS Code version is 1.75.0+
- Check if extension is enabled in Extensions panel
- Try reloading VS Code window

**Skills Not Loading:**
- Check output panel (View > Output > Copilot Ninja)
- Verify personal skills directory exists and is accessible
- Run "Copilot Ninja: Reload Skills" command

**Chat Participant Not Working:**
- Ensure GitHub Copilot extension is installed and active
- Check that you have access to Copilot Chat
- Try typing `@` in chat to see if cp-ninja appears

**Performance Issues:**
- Check "Copilot Ninja: Show Skill Stats" for loading metrics
- Large personal skills directories may slow startup
- Consider organizing skills into subdirectories

### Getting Help

- **Documentation:** Check the [README](../README.md) for detailed feature documentation
- **Issues:** Report bugs on [GitHub Issues](https://github.com/abudhahir/cp-ninja/issues)
- **Discussions:** Join discussions for feature requests and community support

---

## 🚀 Advanced Setup

### Team/Workspace Configuration

**Shared Skills Directory:**
```json
{
  "cpNinja.personalSkillsDirectory": "${workspaceFolder}/.cp-ninja-skills"
}
```

**Workspace Profiles:**
```json
{
  "cpNinja.workspaceProfiles": {
    "react": {
      "favoriteSkills": ["test-driven-development", "requesting-code-review"],
      "enabledSkills": ["brainstorming", "systematic-debugging"]
    }
  },
  "cpNinja.activeProfile": "react"
}
```

### CI/CD Integration

Add skills validation to your build process:

```yaml
# .github/workflows/validate-skills.yml
name: Validate Skills
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install cp-ninja-cli
      - run: npx cp-ninja validate .cp-ninja-skills/
```

---

## 📋 System Requirements

### Minimum Requirements
- **VS Code:** 1.75.0+
- **OS:** Windows 10+, macOS 10.15+, or Linux
- **Memory:** 4GB RAM minimum
- **Storage:** 100MB free space

### Recommended
- **VS Code:** Latest stable version
- **Memory:** 8GB+ RAM for optimal performance
- **GitHub Copilot:** Active subscription for chat integration
- **Git:** For version control of custom skills

---

## 🔄 Updating

### Automatic Updates
- VS Code automatically updates extensions from the Marketplace
- Check for updates in Extensions panel

### Manual Updates
- Download new VSIX from releases
- Install over existing version
- Personal skills and settings are preserved

---

Ready to boost your development workflow? The extension is now installed and ready to supercharge your coding experience! 🚀
