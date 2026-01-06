# CP-Ninja Command Implementation Analysis

## Summary
Analysis of commands defined in `package.json` vs. implementations in `extension.ts`

**Date:** January 6, 2026

---

## ✅ Implemented Commands

The following commands are **properly registered** in `extension.ts`:

1. ✅ **cp-ninja.showWelcome** (Line 530)
2. ✅ **cp-ninja.resetOnboarding** (Line 534)
3. ✅ **cp-ninja.showTutorial** (Line 538)
4. ✅ **cp-ninja.searchSkills** (Line 377)
5. ✅ **cp-ninja.toggleFavorites** (Line 383)
6. ✅ **cp-ninja.addToFavorites** (Line 484)
7. ✅ **cp-ninja.removeFromFavorites** (Line 492)
8. ✅ **cp-ninja.showSkillsQuickPick** (Line 545)
9. ✅ **cpNinja.browseGitRepo** (Line 390)
10. ✅ **cpNinja.refreshGitRepoHistory** (Line 449)
11. ✅ **cpNinja.clearGitRepoHistory** (Line 453)

---

## ❌ Missing Command Implementations

The following commands are **defined in package.json but NOT implemented** in `extension.ts`:

### 1. ❌ **cp-ninja.autoDetectProfile**
- **Defined in:** `package.json` (Line 42)
- **Status:** NOT FOUND in extension.ts
- **Expected behavior:** Auto-detect project profile based on workspace analysis
- **Related code:** AutoProfileManager exists but is commented out in extension.ts

### 2. ❌ **cp-ninja.showActiveProfile**
- **Defined in:** `package.json` (Line 46)
- **Status:** NOT FOUND in extension.ts
- **Expected behavior:** Display the currently active project profile
- **Related code:** ProfileChatHandler exists but doesn't register this command

### 3. ❌ **cp-ninja.configureProfile**
- **Defined in:** `package.json` (Line 50)
- **Status:** NOT FOUND in extension.ts
- **Expected behavior:** Open profile configuration UI
- **Related code:** Profile system exists but configuration command missing

### 4. ❌ **cp-ninja.openSkillInEditor**
- **Defined in:** `package.json` (Line 63)
- **Status:** NOT FOUND in extension.ts
- **Expected behavior:** Open a specific skill file in the editor
- **Note:** Comment on line 376 says "handled by webview" but no implementation found

---

## 🔄 Additional Registered Commands

These commands are **registered in extension.ts but NOT in package.json**:

1. **cp-ninja.showCommands** (Line 311) - Internal command for status bar
2. **cp-ninja.useSkillFromView** (Line 363) - Internal webview interaction
3. **cp-ninja.reloadSkills** (Line 468 & 551 - DUPLICATE!) - Reload skills functionality
4. **cp-ninja.createDynamicSkill** (Line 563) - Create custom skills
5. **cp-ninja.showSkillStats** (Line 600) - Display skill statistics

---

## 🐛 Issues Found

### Critical Issues:
1. **Duplicate Registration:** `cp-ninja.reloadSkills` is registered TWICE (lines 468 and 551)
2. **Missing Implementations:** 4 commands defined in package.json are not implemented
3. **AutoProfileManager Disabled:** Code exists but is commented out (lines 24, 218, 219)

### Moderate Issues:
1. **Inconsistent Command Prefix:** Mix of `cp-ninja.` and `cpNinja.` prefixes
2. **Undocumented Commands:** 5 commands in code are not exposed in package.json
3. **Webview Command Reference:** Comment says "handled by webview" but no handler found

---

## 📋 Recommendations

### Immediate Actions:

1. **Remove duplicate `cp-ninja.reloadSkills` registration** (line 551)
   - Keep the first registration at line 468

2. **Implement missing profile commands:**
   ```typescript
   // Add to extension.ts around line 540
   context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.autoDetectProfile', async () => {
       // Use AutoProfileManager or ContextDetector
   }));

   context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.showActiveProfile', async () => {
       // Display active profile from ConfigurationManager
   }));

   context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.configureProfile', async () => {
       // Open profile configuration UI
   }));
   ```

3. **Implement `cp-ninja.openSkillInEditor`:**
   ```typescript
   context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.openSkillInEditor', async (skillName: string) => {
       const skillPath = resolveSkillPath(skillName, skillsDir, personalSkillsDir);
       if (skillPath) {
           const doc = await vscode.workspace.openTextDocument(skillPath.skillFile);
           await vscode.window.showTextDocument(doc);
       }
   }));
   ```

4. **Add hidden commands to package.json** (or remove if truly internal):
   - cp-ninja.showCommands
   - cp-ninja.useSkillFromView
   - cp-ninja.createDynamicSkill
   - cp-ninja.showSkillStats

5. **Re-enable AutoProfileManager** if profile features should work

### Long-term Actions:

1. Standardize command naming (choose `cp-ninja.` or `cpNinja.` consistently)
2. Add unit tests for all command handlers
3. Document all commands in README.md
4. Create a command registry validation test

---

## 📊 Statistics

- **Total Commands in package.json:** 15
- **Implemented:** 11 (73%)
- **Missing:** 4 (27%)
- **Extra (not in package.json):** 5
- **Duplicates:** 1
- **Issues Found:** 6

---

## 🔍 Verification Steps

To test which commands actually work:

```bash
# Open VS Code Command Palette (Cmd+Shift+P)
# Type "Copilot Ninja" and check which commands appear

# Or use VS Code's Developer Tools
1. Help > Toggle Developer Tools
2. In Console, run:
   vscode.commands.getCommands().then(cmds => console.log(cmds.filter(c => c.startsWith('cp-ninja') || c.startsWith('cpNinja'))))
```

This will show all registered commands at runtime.
