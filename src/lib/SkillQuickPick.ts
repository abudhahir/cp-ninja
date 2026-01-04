import * as vscode from 'vscode';
import * as path from 'path';
import { findSkillsInDir, extractFrontmatter } from './skills-core';

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
    constructor(private skillsPath: string, private personalSkillsPath?: string) {}

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
                const folderName = skill.path.includes('/') 
                    ? skill.path.split('/').pop()
                    : skill.path.includes('\\')
                    ? skill.path.split('\\').pop()
                    : skill.path;
                category = this.smartCategorization(folderName || '');
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
        
        if (processSkills.includes(folderName)) {
            return 'Development Process';
        }
        if (planningSkills.includes(folderName)) {
            return 'Planning & Execution';
        }
        if (collaborationSkills.includes(folderName)) {
            return 'Code Review & Collaboration';
        }
        if (workflowSkills.includes(folderName)) {
            return 'Workflow Management';
        }
        
        return 'Other Skills';
    }

    createQuickPickItems(categorizedSkills: Record<string, SkillInfo[]>): QuickPickSkillItem[] {
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

    async loadSkills(): Promise<SkillInfo[]> {
        const skills: SkillInfo[] = [];
        
        // Load cp-ninja skills
        const cpNinjaSkills = findSkillsInDir(this.skillsPath, 'cp-ninja', 3);
        
        // Load personal skills if path is provided
        const personalSkills = this.personalSkillsPath 
            ? findSkillsInDir(this.personalSkillsPath, 'personal', 3)
            : [];
        
        const allSkills = [...cpNinjaSkills, ...personalSkills];
        
        for (const skill of allSkills) {
            // Extract frontmatter for category information
            const frontmatter = extractFrontmatter(skill.skillFile);
            
            skills.push({
                name: skill.name,
                path: skill.path,
                description: skill.description,
                frontmatter: frontmatter as { category?: string }
            });
        }
        
        return skills;
    }

    async openSkillInEditor(skillPath: string): Promise<void> {
        // skillPath is already a full directory path, just add SKILL.md
        const skillFile = path.join(skillPath, 'SKILL.md');
        const document = await vscode.workspace.openTextDocument(skillFile);
        await vscode.window.showTextDocument(document, { preview: false });
    }
}