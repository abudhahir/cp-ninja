import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { findSkillsInDir, Skill } from './lib/skills-core';

interface SkillWithMetrics extends Skill {
    usageCount: number;
    lastUsed: Date;
    contextRelevance: number;
}

interface ProjectContext {
    fileTypes: Set<string>;
    hasPackageJson: boolean;
    hasGitRepo: boolean;
    frameworks: Set<string>;
    testFiles: boolean;
    hasDocFiles: boolean;
}

export class EnhancedSuggestionEngine {
    private static readonly USAGE_STATS_KEY = 'cpNinja.skillUsageStats';
    private skills: SkillWithMetrics[] = [];
    private projectContext: ProjectContext | null = null;
    
    constructor(
        private skillsDir: string, 
        private personalSkillsDir: string,
        private context: vscode.ExtensionContext
    ) {
        this.loadSkills();
        this.analyzeProjectContext();
    }

    /**
     * Load all skills with usage metrics
     */
    private loadSkills(): void {
        const cpNinjaSkills = findSkillsInDir(this.skillsDir, 'cp-ninja');
        const personalSkills = findSkillsInDir(this.personalSkillsDir, 'personal');
        const usageStats = this.getUsageStats();

        this.skills = [...cpNinjaSkills, ...personalSkills].map(skill => ({
            ...skill,
            usageCount: usageStats[skill.name]?.count || 0,
            lastUsed: usageStats[skill.name]?.lastUsed ? new Date(usageStats[skill.name].lastUsed) : new Date(0),
            contextRelevance: 0
        }));
    }

    /**
     * Fuzzy search skills with enhanced matching
     */
    public fuzzySearchSkills(query: string): SkillWithMetrics[] {
        if (!query.trim()) {
            return this.getDefaultSkillOrder();
        }

        const queryLower = query.toLowerCase();
        const results = this.skills.map(skill => {
            let score = 0;

            // Exact name match gets highest score
            if (skill.name.toLowerCase() === queryLower) {
                score += 1000;
            }
            // Name starts with query
            else if (skill.name.toLowerCase().startsWith(queryLower)) {
                score += 500;
            }
            // Name contains query
            else if (skill.name.toLowerCase().includes(queryLower)) {
                score += 200;
            }
            // Description contains query
            else if (skill.description.toLowerCase().includes(queryLower)) {
                score += 100;
            }

            // Boost by usage frequency
            score += Math.min(skill.usageCount * 10, 100);

            // Boost by recency (within last 7 days)
            const daysSinceUsed = (Date.now() - skill.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUsed <= 7) {
                score += 50;
            }

            // Boost by context relevance
            score += skill.contextRelevance * 50;

            return { skill, score };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(result => result.skill);

        return results;
    }

    /**
     * Get skills in smart default order
     */
    private getDefaultSkillOrder(): SkillWithMetrics[] {
        return this.skills
            .map(skill => ({
                ...skill,
                score: skill.usageCount * 10 + skill.contextRelevance * 20
            }))
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Get context-aware skill suggestions
     */
    public getContextAwareSkills(activeDocument?: vscode.TextDocument): SkillWithMetrics[] {
        this.updateContextRelevance(activeDocument);
        return this.getDefaultSkillOrder().slice(0, 10);
    }

    /**
     * Update context relevance scores for all skills
     */
    private updateContextRelevance(activeDocument?: vscode.TextDocument): void {
        this.skills.forEach(skill => {
            skill.contextRelevance = this.calculateContextRelevance(skill, activeDocument);
        });
    }

    /**
     * Calculate context relevance score for a skill
     */
    private calculateContextRelevance(skill: Skill, activeDocument?: vscode.TextDocument): number {
        let relevance = 0;

        if (!this.projectContext) {
            return relevance;
        }

        // File type specific suggestions
        if (activeDocument) {
            const fileName = activeDocument.fileName.toLowerCase();
            const fileContent = activeDocument.getText();

            // TypeScript/JavaScript files
            if (fileName.endsWith('.ts') || fileName.endsWith('.js') || fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
                if (skill.name.includes('test-driven-development')) relevance += 3;
                if (skill.name.includes('systematic-debugging')) relevance += 2;
            }

            // Test files
            if (fileName.includes('test') || fileName.includes('spec') || 
                fileContent.includes('describe(') || fileContent.includes('it(')) {
                if (skill.name.includes('test-driven-development')) relevance += 4;
                if (skill.name.includes('systematic-debugging')) relevance += 3;
            }

            // Markdown files
            if (fileName.endsWith('.md')) {
                if (skill.name.includes('writing-plans')) relevance += 3;
                if (skill.name.includes('writing-skills')) relevance += 2;
            }

            // React components
            if (fileContent.includes('useState') || fileContent.includes('useEffect') || 
                fileContent.includes('React.') || fileName.includes('component')) {
                if (skill.name.includes('brainstorming')) relevance += 2;
            }

            // Git-related files
            if (fileName.includes('git') || fileName.includes('.github')) {
                if (skill.name.includes('using-git-worktrees')) relevance += 3;
                if (skill.name.includes('finishing-a-development-branch')) relevance += 2;
            }
        }

        // Project context based suggestions
        if (this.projectContext?.hasPackageJson) {
            if (skill.name.includes('test-driven-development')) relevance += 1;
        }

        if (this.projectContext?.testFiles) {
            if (skill.name.includes('systematic-debugging')) relevance += 2;
            if (skill.name.includes('test-driven-development')) relevance += 2;
        }

        if (this.projectContext?.hasGitRepo) {
            if (skill.name.includes('using-git-worktrees')) relevance += 1;
            if (skill.name.includes('requesting-code-review')) relevance += 1;
        }

        // Time-based suggestions
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 11) { // Morning - planning time
            if (skill.name.includes('writing-plans')) relevance += 1;
            if (skill.name.includes('brainstorming')) relevance += 1;
        } else if (hour >= 14 && hour <= 17) { // Afternoon - debugging time  
            if (skill.name.includes('systematic-debugging')) relevance += 1;
        }

        return Math.max(0, relevance);
    }

    /**
     * Analyze project context
     */
    private analyzeProjectContext(): void {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            this.projectContext = null;
            return;
        }

        const context: ProjectContext = {
            fileTypes: new Set(),
            hasPackageJson: false,
            hasGitRepo: false,
            frameworks: new Set(),
            testFiles: false,
            hasDocFiles: false
        };

        try {
            // Check for package.json
            const packageJsonPath = path.join(workspaceFolder.uri.fsPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                context.hasPackageJson = true;
                
                // Analyze package.json for frameworks
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                
                if (deps.react) context.frameworks.add('react');
                if (deps.vue) context.frameworks.add('vue');
                if (deps.angular) context.frameworks.add('angular');
                if (deps.express) context.frameworks.add('express');
                if (deps.jest || deps.mocha) context.testFiles = true;
            }

            // Check for .git directory
            const gitPath = path.join(workspaceFolder.uri.fsPath, '.git');
            context.hasGitRepo = fs.existsSync(gitPath);

            // Scan for file types and test files
            this.scanWorkspaceFiles(workspaceFolder.uri.fsPath, context);

        } catch (error) {
            console.error('Error analyzing project context:', error);
        }

        this.projectContext = context;
    }

    /**
     * Scan workspace files to understand project structure
     */
    private scanWorkspaceFiles(workspacePath: string, context: ProjectContext, maxDepth: number = 2): void {
        if (maxDepth <= 0) return;

        try {
            const items = fs.readdirSync(workspacePath);
            
            for (const item of items.slice(0, 50)) { // Limit to avoid performance issues
                if (item.startsWith('.') && item !== '.github') continue;
                
                const itemPath = path.join(workspacePath, item);
                const stat = fs.statSync(itemPath);

                if (stat.isFile()) {
                    const ext = path.extname(item);
                    if (ext) context.fileTypes.add(ext);

                    if (item.toLowerCase().includes('test') || item.toLowerCase().includes('spec')) {
                        context.testFiles = true;
                    }
                    if (ext === '.md') {
                        context.hasDocFiles = true;
                    }
                } else if (stat.isDirectory() && !['node_modules', 'dist', 'build'].includes(item)) {
                    this.scanWorkspaceFiles(itemPath, context, maxDepth - 1);
                }
            }
        } catch (error) {
            // Ignore errors for individual files/directories
        }
    }

    /**
     * Track skill usage
     */
    public trackSkillUsage(skillName: string): void {
        const stats = this.getUsageStats();
        stats[skillName] = {
            count: (stats[skillName]?.count || 0) + 1,
            lastUsed: new Date().toISOString()
        };
        
        this.context.globalState.update(EnhancedSuggestionEngine.USAGE_STATS_KEY, stats);
        
        // Update local skill metrics
        const skill = this.skills.find(s => s.name === skillName);
        if (skill) {
            skill.usageCount = stats[skillName].count;
            skill.lastUsed = new Date();
        }
    }

    /**
     * Get usage statistics
     */
    private getUsageStats(): Record<string, { count: number; lastUsed: string }> {
        return this.context.globalState.get(EnhancedSuggestionEngine.USAGE_STATS_KEY, {});
    }

    /**
     * Get skill preview information for hover
     */
    public getSkillPreview(skillName: string): { summary: string; whenToUse: string[] } | null {
        const skill = this.skills.find(s => s.name === skillName);
        if (!skill) return null;

        try {
            const content = fs.readFileSync(skill.skillFile, 'utf8');
            
            // Extract summary and when-to-use from skill content
            const lines = content.split('\n');
            let summary = '';
            const whenToUse: string[] = [];
            let inWhenToUse = false;

            for (const line of lines) {
                if (line.startsWith('## Summary')) {
                    const nextLineIndex = lines.indexOf(line) + 1;
                    if (nextLineIndex < lines.length) {
                        summary = lines[nextLineIndex].trim();
                    }
                }
                
                if (line.startsWith('## When to Use')) {
                    inWhenToUse = true;
                    continue;
                }
                
                if (inWhenToUse) {
                    if (line.startsWith('##')) break;
                    if (line.startsWith('- ')) {
                        whenToUse.push(line.substring(2).trim());
                    }
                }
            }

            return { summary: summary || skill.description, whenToUse };
        } catch (error) {
            return { summary: skill.description, whenToUse: [] };
        }
    }
}