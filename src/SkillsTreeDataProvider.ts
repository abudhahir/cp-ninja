import * as vscode from 'vscode';
import { findSkillsInDir, Skill } from './lib/skills-core';

export class SkillTreeDataProvider implements vscode.TreeDataProvider<SkillItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SkillItem | undefined | void> = new vscode.EventEmitter<SkillItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<SkillItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private skillsDir: string, private personalSkillsDir: string, private extensionBasePath: string) {}

    getTreeItem(element: SkillItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SkillItem): Promise<SkillItem[]> {
        if (element) {
            // If an element is provided, it's a category (sourceType)
            // so we return the skills within that category
            const skills = await this.getSkillsForSourceType(element.label as string);
            return skills.map(skill => new SkillItem(skill.name, skill.description, skill.sourceType, skill.skillFile, vscode.TreeItemCollapsibleState.None));
        } else {
            // No element, so we're at the root of the tree.
            // Return the categories (sourceType)
            const categories = await this.getSkillCategories();
            return categories.map(category => new SkillItem(category, `Skills from ${category}`, category, '', vscode.TreeItemCollapsibleState.Collapsed));
        }
    }

    private async getSkillCategories(): Promise<string[]> {
        const categories: Set<string> = new Set();
        const superpowersSkills = findSkillsInDir(this.skillsDir, 'cp-ninja');
        const personalSkills = findSkillsInDir(this.personalSkillsDir, 'personal'); // Assuming this dir exists

        superpowersSkills.forEach(s => categories.add(s.sourceType));
        personalSkills.forEach(s => categories.add(s.sourceType));

        return Array.from(categories);
    }

    private async getSkillsForSourceType(sourceType: string): Promise<Skill[]> {
        let skills: Skill[] = [];
        if (sourceType === 'cp-ninja') {
            skills = findSkillsInDir(this.skillsDir, 'cp-ninja');
        } else if (sourceType === 'personal') {
            skills = findSkillsInDir(this.personalSkillsDir, 'personal');
        }
        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Opens a skill directly in the native VS Code editor
     * @param skillItem The SkillItem to open in editor
     */
    async openSkillInEditor(skillItem: SkillItem): Promise<void> {
        // Check if this is actually a skill (not a category)
        if (skillItem.contextValue !== 'skill') {
            return;
        }

        // Build full path to the skill file
        const skillPath = skillItem.skillFile;
        if (!skillPath) {
            vscode.window.showErrorMessage(`Could not find path for skill: ${skillItem.label}`);
            return;
        }

        try {
            // Open document with VS Code
            const document = await vscode.workspace.openTextDocument(skillPath);
            // Show document with preview set to false to keep documents open
            await vscode.window.showTextDocument(document, { preview: false });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open skill file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export class SkillItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly sourceType: string,
        public readonly skillFile: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = description;
        this.iconPath = new vscode.ThemeIcon(sourceType === 'cp-ninja' ? 'verified' : 'account'); // Different icons for cp-ninja vs personal
        
        if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
            // Set contextValue to identify this as a skill item
            this.contextValue = 'skill';
            // Use new openSkillInEditor command instead of useSkillFromView
            this.command = {
                command: 'cp-ninja.openSkillInEditor',
                title: 'Open Skill in Editor',
                arguments: [this] // Pass the SkillItem as an argument
            };
        } else {
            // Set contextValue for categories
            this.contextValue = 'category';
        }
    }
}