# Simplify Skills Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use cp-ninja:executing-plans to implement this plan task-by-task.

**Goal:** Remove webview complexity and simplify skills display to action bar quick-pick + sidebar + native editor approach.

**Architecture:** Replace React webview components with native VS Code QuickPick API for skills selection, enhanced tree view for browsing, and native markdown editor for viewing. Use hybrid categorization (frontmatter → folder name → smart grouping).

**Tech Stack:** VS Code Extension API, TypeScript, QuickPick API, TreeDataProvider, native markdown editor

---

## Task 1: Create Enhanced Quick Pick Skills Command

**Files:**
- Create: `src/lib/SkillQuickPick.ts`
- Modify: `src/extension.ts:1-50` (command registration)
- Modify: `package.json:45-65` (add new command)

**Step 1: Write test for skill categorization**

```typescript
// tests/SkillQuickPick.test.ts
import { SkillQuickPick } from '../src/lib/SkillQuickPick';
import * as vscode from 'vscode';

describe('SkillQuickPick', () => {
    let skillQuickPick: SkillQuickPick;
    
    beforeEach(() => {
        skillQuickPick = new SkillQuickPick('/mock/skills/path');
    });
    
    test('should categorize skills by frontmatter', async () => {
        const mockSkills = [
            { path: 'brainstorming/SKILL.md', frontmatter: { category: 'Process' }, name: 'brainstorming' },
            { path: 'debugging/SKILL.md', frontmatter: {}, name: 'systematic-debugging' }
        ];
        
        const result = await skillQuickPick.categorizeSkills(mockSkills);
        
        expect(result['Process']).toContain('brainstorming');
        expect(result['Development']).toContain('systematic-debugging');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testNamePattern="SkillQuickPick"`
Expected: FAIL with "Cannot find module '../src/lib/SkillQuickPick'"

**Step 3: Create SkillQuickPick implementation**

```typescript
// src/lib/SkillQuickPick.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

interface SkillInfo {
    name: string;
    path: string;
    description?: string;
    frontmatter?: { category?: string };
}

interface QuickPickSkillItem extends vscode.QuickPickItem {
    skillPath: string;
    isCategory: boolean;
}

export class SkillQuickPick {
    constructor(private skillsPath: string) {}

    async showSkillPicker(): Promise<void> {
        const skills = await this.loadSkills();
        const categorizedSkills = await this.categorizeSkills(skills);
        const quickPickItems = this.createQuickPickItems(categorizedSkills);

        const quickPick = vscode.window.createQuickPick<QuickPickSkillItem>();
        quickPick.items = quickPickItems;
        quickPick.placeholder = 'Search skills or browse by category...';
        quickPick.canSelectMany = false;

        quickPick.onDidChangeSelection(async selection => {
            if (selection[0] && !selection[0].isCategory) {
                await this.openSkillInEditor(selection[0].skillPath);
                quickPick.dispose();
            }
        });

        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    }

    async categorizeSkills(skills: SkillInfo[]): Promise<Record<string, SkillInfo[]>> {
        const categories: Record<string, SkillInfo[]> = {};
        
        for (const skill of skills) {
            let category = skill.frontmatter?.category;
            
            if (!category) {
                // Fallback to folder name categorization
                const folderName = path.dirname(skill.path).split('/').pop() || '';
                category = this.smartCategorization(folderName);
            }
            
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(skill);
        }
        
        return categories;
    }

    private smartCategorization(folderName: string): string {
        const processSkills = ['brainstorming', 'systematic-debugging', 'test-driven-development'];
        const planningSkills = ['writing-plans', 'executing-plans'];
        const collaborationSkills = ['requesting-code-review', 'receiving-code-review'];
        const workflowSkills = ['using-git-worktrees', 'finishing-a-development-branch'];
        
        if (processSkills.includes(folderName)) return 'Development Process';
        if (planningSkills.includes(folderName)) return 'Planning & Execution';
        if (collaborationSkills.includes(folderName)) return 'Code Review & Collaboration';
        if (workflowSkills.includes(folderName)) return 'Workflow Management';
        
        return 'Other Skills';
    }

    private createQuickPickItems(categorizedSkills: Record<string, SkillInfo[]>): QuickPickSkillItem[] {
        const items: QuickPickSkillItem[] = [];
        
        for (const [category, skills] of Object.entries(categorizedSkills)) {
            // Add category separator
            items.push({
                label: category,
                kind: vscode.QuickPickItemKind.Separator,
                skillPath: '',
                isCategory: true
            });
            
            // Add skills in category
            for (const skill of skills) {
                items.push({
                    label: `$(book) ${skill.name}`,
                    description: skill.description || '',
                    skillPath: skill.path,
                    isCategory: false
                });
            }
        }
        
        return items;
    }

    private async loadSkills(): Promise<SkillInfo[]> {
        // This will use existing skills-core.js logic
        const { discoverSkills } = require('./skills-core');
        return await discoverSkills(this.skillsPath);
    }

    private async openSkillInEditor(skillPath: string): Promise<void> {
        const fullPath = path.join(this.skillsPath, skillPath);
        const document = await vscode.workspace.openTextDocument(fullPath);
        await vscode.window.showTextDocument(document);
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testNamePattern="SkillQuickPick"`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/SkillQuickPick.test.ts src/lib/SkillQuickPick.ts
git commit -m "feat: add enhanced skills quick pick with categorization"
```

## Task 2: Register Quick Pick Command

**Files:**
- Modify: `src/extension.ts:30-50`
- Modify: `package.json:20-40`

**Step 1: Add command registration in extension.ts**

```typescript
// In src/extension.ts activate function, add:
import { SkillQuickPick } from './lib/SkillQuickPick';

export function activate(context: vscode.ExtensionContext) {
    // Existing code...
    
    const skillsPath = path.join(context.extensionPath, 'skills');
    const skillQuickPick = new SkillQuickPick(skillsPath);
    
    // Register quick pick command
    const quickPickDisposable = vscode.commands.registerCommand('cp-ninja.showSkillsQuickPick', async () => {
        await skillQuickPick.showSkillPicker();
    });
    
    context.subscriptions.push(quickPickDisposable);
}
```

**Step 2: Add command to package.json**

```json
{
  "contributes": {
    "commands": [
      {
        "command": "cp-ninja.showSkillsQuickPick",
        "title": "Show Skills Quick Pick",
        "category": "Copilot Ninja",
        "icon": "$(list-selection)"
      }
    ]
  }
}
```

**Step 3: Add to activity bar menu**

```json
{
  "contributes": {
    "menus": {
      "view/title": [
        {
          "command": "cp-ninja.showSkillsQuickPick",
          "when": "view == cp-ninja.skillsView",
          "group": "navigation@0"
        }
      ]
    }
  }
}
```

**Step 4: Test command registration**

Run: `npm run compile && code --extensionDevelopmentHost=.`
Expected: Command appears in command palette and activity bar

**Step 5: Commit**

```bash
git add src/extension.ts package.json
git commit -m "feat: register skills quick pick command with activity bar integration"
```

## Task 3: Enhance Tree View for Native Editor Opening

**Files:**
- Modify: `src/SkillsTreeDataProvider.ts:50-80`
- Modify: `src/extension.ts:60-80`

**Step 1: Write test for tree view click behavior**

```typescript
// tests/SkillsTreeDataProvider.test.ts - add test
test('should open skill in native editor when clicked', async () => {
    const mockSkill = { name: 'test-skill', path: 'test/SKILL.md' };
    const openTextDocumentSpy = jest.spyOn(vscode.workspace, 'openTextDocument');
    const showTextDocumentSpy = jest.spyOn(vscode.window, 'showTextDocument');
    
    await skillsTreeProvider.openSkillInEditor(mockSkill);
    
    expect(openTextDocumentSpy).toHaveBeenCalledWith(expect.stringContaining('test/SKILL.md'));
    expect(showTextDocumentSpy).toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testNamePattern="should open skill in native editor"`
Expected: FAIL with "openSkillInEditor is not a function"

**Step 3: Add native editor opening to SkillsTreeDataProvider**

```typescript
// In src/SkillsTreeDataProvider.ts
import * as path from 'path';

export class SkillsTreeDataProvider implements vscode.TreeDataProvider<SkillTreeItem> {
    // Existing code...
    
    async openSkillInEditor(skill: SkillTreeItem): Promise<void> {
        if (skill.contextValue === 'skill') {
            const fullPath = path.join(this.skillsPath, skill.resourceUri?.fsPath || '');
            const document = await vscode.workspace.openTextDocument(fullPath);
            await vscode.window.showTextDocument(document, { preview: false });
        }
    }
}
```

**Step 4: Register tree view selection command**

```typescript
// In src/extension.ts
const treeViewDisposable = vscode.commands.registerCommand('cp-ninja.openSkill', async (item: SkillTreeItem) => {
    await skillsTreeProvider.openSkillInEditor(item);
});

context.subscriptions.push(treeViewDisposable);
```

**Step 5: Update tree view click behavior in package.json**

```json
{
  "contributes": {
    "menus": {
      "view/item/context": [
        {
          "command": "cp-ninja.openSkill",
          "when": "view == cp-ninja.skillsView && viewItem == skill",
          "group": "inline"
        }
      ]
    }
  }
}
```

**Step 6: Run test to verify it passes**

Run: `npm test -- --testNamePattern="should open skill in native editor"`
Expected: PASS

**Step 7: Commit**

```bash
git add src/SkillsTreeDataProvider.ts src/extension.ts package.json tests/SkillsTreeDataProvider.test.ts
git commit -m "feat: enhance tree view to open skills in native editor"
```

## Task 4: Remove Webview Components

**Files:**
- Delete: `webview-src/` (entire directory)
- Delete: `webview-dist/` (entire directory)  
- Delete: `src/webview/SkillComposerPanel.ts`
- Delete: `tests/webview/` (entire directory)
- Modify: `package.json:1-100` (remove webview commands and scripts)
- Modify: `src/extension.ts:1-200` (remove webview registrations)

**Step 1: Create backup and removal test**

```typescript
// tests/WebviewRemoval.test.ts
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Webview Removal', () => {
    test('webview directories should not exist', async () => {
        const webviewSrcExists = await fs.access('webview-src').then(() => true).catch(() => false);
        const webviewDistExists = await fs.access('webview-dist').then(() => true).catch(() => false);
        const skillComposerExists = await fs.access('src/webview').then(() => true).catch(() => false);
        
        expect(webviewSrcExists).toBe(false);
        expect(webviewDistExists).toBe(false);
        expect(skillComposerExists).toBe(false);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testNamePattern="webview directories should not exist"`
Expected: FAIL with directories still existing

**Step 3: Remove webview directories and files**

```bash
rm -rf webview-src/
rm -rf webview-dist/
rm -rf src/webview/
rm -rf tests/webview/
```

**Step 4: Remove webview commands from package.json**

```typescript
// Remove these commands from package.json:
- "cp-ninja.showDetails"
- "cp-ninja.showWelcome" (if webview-based)
// Remove these scripts:
- "build:webview"
- "watch:webview"
```

**Step 5: Remove webview registrations from extension.ts**

```typescript
// Remove imports and registrations for:
- SkillComposerPanel
- showDetails command
- Any webview-related disposables
```

**Step 6: Run test to verify it passes**

Run: `npm test -- --testNamePattern="webview directories should not exist"`
Expected: PASS

**Step 7: Update dependencies in package.json**

```json
// Remove webview-related devDependencies if any:
- webpack related packages
- React related packages (if not used elsewhere)
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: remove webview components and simplify to native editor approach"
```

## Task 5: Clean Up Unused Imports and Dependencies

**Files:**
- Modify: `src/extension.ts:1-50` (remove unused imports)
- Modify: `package.json:80-120` (remove unused dependencies)
- Run: ESLint fix for unused imports

**Step 1: Run ESLint to find unused imports**

Run: `npm run lint`
Expected: Shows unused import warnings

**Step 2: Fix unused imports**

Run: `npm run lint -- --fix`
Expected: Automatically removes unused imports

**Step 3: Check for unused dependencies**

Run: `npx depcheck`
Expected: Lists unused dependencies

**Step 4: Remove unused dependencies**

```bash
npm uninstall <unused-packages>
```

**Step 5: Verify compilation**

Run: `npm run compile`
Expected: Compiles successfully without errors

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add package.json src/extension.ts
git commit -m "feat: clean up unused imports and dependencies after webview removal"
```

## Task 6: Update Documentation

**Files:**
- Modify: `README.md:40-80` (update skills display section)
- Modify: `doc/installation.md:1-50` (remove webview setup instructions)

**Step 1: Update README.md skills section**

```markdown
## Skills Display

CP-Ninja provides two intuitive ways to access and view skills:

### 1. Quick Access via Action Bar
- Click the skills icon in the Skills Explorer title bar
- Search skills by name or browse by category
- Categories include: Development Process, Planning & Execution, Code Review & Collaboration
- Select any skill to open it in VS Code's native markdown editor

### 2. Browse via Sidebar
- Use the Skills Explorer in the activity bar
- Browse skills organized by folder structure  
- Click any skill to open it directly in the native editor

### Benefits of Native Editor Integration
- Syntax highlighting for markdown
- Familiar VS Code editing experience
- Follows your custom theme preferences
- Fast loading with no webview overhead
- Full text search and navigation
```

**Step 2: Update installation.md**

```markdown
<!-- Remove webview build instructions -->
<!-- Update setup steps to remove npm install in webview-src -->
```

**Step 3: Commit documentation updates**

```bash
git add README.md doc/installation.md
git commit -m "docs: update skills display documentation for native editor approach"
```

## Task 7: Integration Testing

**Files:**
- Create: `tests/integration/SimplifiedSkillsDisplay.test.ts`

**Step 1: Write comprehensive integration test**

```typescript
// tests/integration/SimplifiedSkillsDisplay.test.ts
import * as vscode from 'vscode';
import { SkillQuickPick } from '../../src/lib/SkillQuickPick';

describe('Simplified Skills Display Integration', () => {
    test('complete workflow from quick pick to editor', async () => {
        // Test quick pick opens
        await vscode.commands.executeCommand('cp-ninja.showSkillsQuickPick');
        
        // Test skill can be opened in editor
        const skillPath = 'brainstorming/SKILL.md';
        const skillQuickPick = new SkillQuickPick('skills');
        
        await skillQuickPick.openSkillInEditor(skillPath);
        
        // Verify document is opened
        const activeEditor = vscode.window.activeTextEditor;
        expect(activeEditor?.document.fileName).toContain('brainstorming');
        expect(activeEditor?.document.languageId).toBe('markdown');
    });
    
    test('tree view integration works', async () => {
        const treeDataProvider = new SkillsTreeDataProvider('skills');
        const skills = await treeDataProvider.getChildren();
        
        expect(skills.length).toBeGreaterThan(0);
        
        // Test opening skill from tree
        const firstSkill = skills[0];
        await vscode.commands.executeCommand('cp-ninja.openSkill', firstSkill);
        
        const activeEditor = vscode.window.activeTextEditor;
        expect(activeEditor?.document.languageId).toBe('markdown');
    });
});
```

**Step 2: Run integration test**

Run: `npm test -- --testNamePattern="Simplified Skills Display Integration"`
Expected: PASS

**Step 3: Test in VS Code extension host**

Run: `npm run compile && code --extensionDevelopmentHost=.`
Test: Use both quick pick and tree view, verify skills open in native editor

**Step 4: Commit integration tests**

```bash
git add tests/integration/SimplifiedSkillsDisplay.test.ts
git commit -m "test: add integration tests for simplified skills display"
```

---

## Summary of Changes

**Removed Components (~50% code reduction):**
- ✅ `webview-src/` - React application (15+ files)
- ✅ `webview-dist/` - Build output  
- ✅ `src/webview/SkillComposerPanel.ts` - Custom webview
- ✅ `tests/webview/` - Webview tests
- ✅ Webview commands and build scripts

**Added Components:**
- ✅ `src/lib/SkillQuickPick.ts` - Enhanced quick pick with search + categories
- ✅ Enhanced tree view with native editor integration
- ✅ Smart skill categorization system
- ✅ Action bar integration

**Benefits Achieved:**
- ✅ 50% less code to maintain
- ✅ No React/webpack complexity
- ✅ Faster load times (no webview initialization)  
- ✅ Native VS Code experience
- ✅ Automatic theme compatibility
- ✅ Better performance and reliability