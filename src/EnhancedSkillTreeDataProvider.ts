import * as vscode from 'vscode';
import { findSkillsInDir, Skill } from './lib/skills-core';
import { ConfigurationManager } from './ConfigurationManager';

export class EnhancedSkillTreeDataProvider implements vscode.TreeDataProvider<SkillItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SkillItem | undefined | void> = new vscode.EventEmitter<SkillItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<SkillItem | undefined | void> = this._onDidChangeTreeData.event;

    private searchFilter: string = '';
    private categoryFilter: string = 'all';
    private showFavoritesOnly: boolean = false;
    
    constructor(
        private skillsDir: string, 
        private personalSkillsDir: string, 
        private extensionBasePath: string,
        private configManager?: ConfigurationManager
    ) {}

    getTreeItem(element: SkillItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SkillItem): Promise<SkillItem[]> {
        if (element) {
            // Return skills within a category
            const skills = await this.getSkillsForSourceType(element.label as string);
            return this.filterAndSortSkills(skills).map(skill => 
                new SkillItem(
                    skill.name, 
                    skill.description, 
                    skill.sourceType, 
                    skill.skillFile, 
                    vscode.TreeItemCollapsibleState.None,
                    this.isSkillFavorite(skill.name)
                )
            );
        } else {
            // Root level - show categories with search/filter controls
            const items: SkillItem[] = [];
            
            // Add filter controls at top
            items.push(new SkillItem(
                '🔍 Search Skills...',
                'Click to search skills',
                'control',
                '',
                vscode.TreeItemCollapsibleState.None,
                false,
                {
                    command: 'cp-ninja.searchSkills',
                    title: 'Search Skills',
                    arguments: []
                }
            ));

            if (this.showFavoritesOnly) {
                items.push(new SkillItem(
                    '⭐ Favorites',
                    'Your favorite skills',
                    'favorites',
                    '',
                    vscode.TreeItemCollapsibleState.Expanded,
                    false
                ));
            } else {
                // Add categories
                const categories = await this.getSkillCategories();
                items.push(...categories.map(category => 
                    new SkillItem(
                        category, 
                        `Skills from ${category}`, 
                        category, 
                        '', 
                        vscode.TreeItemCollapsibleState.Collapsed,
                        false
                    )
                ));

                // Add recently used section if there are recent skills
                const recentSkills = this.getRecentlyUsedSkills();
                if (recentSkills.length > 0) {
                    items.unshift(new SkillItem(
                        '🕒 Recently Used',
                        'Recently used skills',
                        'recent',
                        '',
                        vscode.TreeItemCollapsibleState.Expanded,
                        false
                    ));
                }
            }

            return items;
        }
    }

    private async getSkillCategories(): Promise<string[]> {
        const categories: Set<string> = new Set();
        const cpNinjaSkills = findSkillsInDir(this.skillsDir, 'cp-ninja');
        const personalSkills = findSkillsInDir(this.personalSkillsDir, 'personal');
        
        cpNinjaSkills.forEach(skill => categories.add(skill.sourceType));
        personalSkills.forEach(skill => categories.add(skill.sourceType));
        
        return Array.from(categories);
    }

    private async getSkillsForSourceType(sourceType: string): Promise<Skill[]> {
        if (sourceType === 'recent') {
            return this.getRecentlyUsedSkills();
        }
        
        if (sourceType === 'favorites') {
            return this.getFavoriteSkills();
        }
        
        const cpNinjaSkills = findSkillsInDir(this.skillsDir, 'cp-ninja');
        const personalSkills = findSkillsInDir(this.personalSkillsDir, 'personal');
        const allSkills = [...cpNinjaSkills, ...personalSkills];
        
        return allSkills.filter(skill => skill.sourceType === sourceType);
    }

    private filterAndSortSkills(skills: Skill[]): Skill[] {
        let filtered = skills;
        
        // Apply search filter
        if (this.searchFilter) {
            const searchLower = this.searchFilter.toLowerCase();
            filtered = filtered.filter(skill => 
                skill.name.toLowerCase().includes(searchLower) ||
                skill.description.toLowerCase().includes(searchLower)
            );
        }
        
        // Apply category filter
        if (this.categoryFilter !== 'all') {
            filtered = filtered.filter(skill => skill.sourceType === this.categoryFilter);
        }
        
        // Sort by favorites first, then alphabetically
        return filtered.sort((a, b) => {
            const aFav = this.isSkillFavorite(a.name);
            const bFav = this.isSkillFavorite(b.name);
            
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            
            return a.name.localeCompare(b.name);
        });
    }

    private isSkillFavorite(skillName: string): boolean {
        if (!this.configManager) return false;
        const config = this.configManager.getEffectiveConfig();
        return config.favoriteSkills.includes(skillName);
    }

    private getRecentlyUsedSkills(): Skill[] {
        // This would integrate with usage tracking
        // For now, return empty array
        return [];
    }

    private getFavoriteSkills(): Skill[] {
        if (!this.configManager) return [];
        
        const config = this.configManager.getEffectiveConfig();
        const cpNinjaSkills = findSkillsInDir(this.skillsDir, 'cp-ninja');
        const personalSkills = findSkillsInDir(this.personalSkillsDir, 'personal');
        const allSkills = [...cpNinjaSkills, ...personalSkills];
        
        return allSkills.filter(skill => config.favoriteSkills.includes(skill.name));
    }

    // Public methods for filtering
    public setSearchFilter(filter: string): void {
        this.searchFilter = filter;
        this._onDidChangeTreeData.fire();
    }

    public setCategoryFilter(category: string): void {
        this.categoryFilter = category;
        this._onDidChangeTreeData.fire();
    }

    public toggleFavoritesView(): void {
        this.showFavoritesOnly = !this.showFavoritesOnly;
        this._onDidChangeTreeData.fire();
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Opens a skill directly in the native VS Code editor
     * @param skillItem The SkillItem to open in editor
     */
    async openSkillInEditor(skillItem: SkillItem): Promise<void> {
        // Check if this is actually a skill (not a category or control)
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
        public readonly isFavorite: boolean = false,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = description;
        
        // Set appropriate icons
        if (sourceType === 'control') {
            this.iconPath = new vscode.ThemeIcon('search');
        } else if (sourceType === 'recent') {
            this.iconPath = new vscode.ThemeIcon('history');
        } else if (sourceType === 'favorites') {
            this.iconPath = new vscode.ThemeIcon('star-full');
        } else if (isFavorite) {
            this.iconPath = new vscode.ThemeIcon('star-full');
        } else {
            this.iconPath = new vscode.ThemeIcon(sourceType === 'cp-ninja' ? 'verified' : 'account');
        }
        
        // Set context value for context menu
        if (collapsibleState === vscode.TreeItemCollapsibleState.None && skillFile) {
            this.contextValue = 'skill';
            if (!command) {
                // Use new openSkillInEditor command instead of useSkillFromView
                this.command = {
                    command: 'cp-ninja.openSkillInEditor',
                    title: 'Open Skill in Editor',
                    arguments: [this] // Pass the SkillItem as an argument
                };
            }
        } else if (sourceType === 'control') {
            this.contextValue = 'control';
        }
        
        // Add favorite indicator to label
        if (isFavorite && collapsibleState === vscode.TreeItemCollapsibleState.None) {
            this.label = `⭐ ${label}`;
        }
    }
}