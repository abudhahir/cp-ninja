import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { findSkillsInDir, extractFrontmatter, Skill } from './lib/skills-core';

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
            this.command = {
                command: 'cp-ninja.useSkillFromView',
                title: 'Use Skill',
                arguments: [label] // Pass the skill name as an argument
            };
        }
    }
}