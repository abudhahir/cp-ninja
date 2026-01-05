import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AsyncSkillLoader, LoadedSkill } from './AsyncSkillLoader';

export class DynamicSkillRegistry {
    private packagedSkills: Map<string, SkillDefinition> = new Map();
    private personalSkills: Map<string, SkillDefinition> = new Map();
    private skillLoader: AsyncSkillLoader;
    private _onPersonalSkillRegistered = new vscode.EventEmitter<string>();
    private _onPersonalSkillUnregistered = new vscode.EventEmitter<string>();

    public readonly onPersonalSkillRegistered = this._onPersonalSkillRegistered.event;
    public readonly onPersonalSkillUnregistered = this._onPersonalSkillUnregistered.event;

    constructor(
        private skillsDir: string,
        private personalSkillsDir: string
    ) {
        this.skillLoader = new AsyncSkillLoader(skillsDir, personalSkillsDir);
    }

    /**
     * Initialize by loading packaged skills eagerly
     */
    async initialize(): Promise<void> {
        await this.skillLoader.loadPackagedSkills();
        await this.loadPackagedSkillsRegistry();
        await this.loadPersonalSkillsRegistry();
    }

    private async loadPackagedSkillsRegistry(): Promise<void> {
        const metadata = await this.skillLoader.getAllSkillsMetadata();
        const packagedMetadata = metadata.filter(m => m.sourceType === 'cp-ninja');
        
        for (const meta of packagedMetadata) {
            const skillDef: SkillDefinition = {
                name: meta.name,
                description: meta.description,
                sourceType: meta.sourceType,
                skillFile: meta.skillFile,
                registeredAt: new Date(),
                isActive: true
            };
            
            this.packagedSkills.set(meta.name, skillDef);
        }
        
        console.log(`Registered ${this.packagedSkills.size} packaged skills`);
    }

    private async loadPersonalSkillsRegistry(): Promise<void> {
        const metadata = await this.skillLoader.getAllSkillsMetadata();
        const personalMetadata = metadata.filter(m => m.sourceType === 'personal');
        
        for (const meta of personalMetadata) {
            const skillDef: SkillDefinition = {
                name: meta.name,
                description: meta.description,
                sourceType: meta.sourceType,
                skillFile: meta.skillFile,
                registeredAt: new Date(),
                isActive: true
            };
            
            this.personalSkills.set(meta.name, skillDef);
        }
        
        console.log(`Registered ${this.personalSkills.size} personal skills for dynamic loading`);
    }

    /**
     * Register a skill from content (for dynamically created skills)
     * These go into personal skills directory for dynamic loading
     */
    async registerSkillFromContent(
        name: string,
        content: string,
        description?: string,
        sourceType: string = 'dynamic'
    ): Promise<boolean> {
        try {
            // Create skill in personal skills directory
            const skillDir = path.join(this.personalSkillsDir, 'temp', name);
            const skillFile = path.join(skillDir, 'SKILL.md');

            // Ensure directory exists
            await fs.promises.mkdir(skillDir, { recursive: true });

            // Write skill content with frontmatter
            const frontmatter = `---\nname: ${name}\ndescription: ${description || `Dynamic skill: ${name}`}\n---\n\n`;
            const fullContent = frontmatter + content;
            
            await fs.promises.writeFile(skillFile, fullContent, 'utf8');

            // Register as personal skill directly
            const skillDef: SkillDefinition = {
                name,
                description: description || `Dynamic skill: ${name}`,
                sourceType,
                skillFile,
                registeredAt: new Date(),
                isActive: true
            };

            this.personalSkills.set(name, skillDef);
            this._onPersonalSkillRegistered.fire(name);
            
            console.log(`Dynamically created and registered personal skill: ${name}`);
            return true;
        } catch (error) {
            console.error(`Error creating dynamic skill ${name}:`, error);
            return false;
        }
    }

    /**
     * Unregister a personal skill (packaged skills cannot be unregistered)
     */
    unregisterSkill(skillName: string): boolean {
        const personalSkill = this.personalSkills.get(skillName);
        if (personalSkill) {
            personalSkill.isActive = false;
            this.personalSkills.delete(skillName);
            this._onPersonalSkillUnregistered.fire(skillName);
            console.log(`Unregistered personal skill: ${skillName}`);
            return true;
        }
        console.log(`Cannot unregister packaged skill or skill not found: ${skillName}`);
        return false;
    }

    /**
     * Get a registered skill (packaged or personal)
     */
    getSkill(skillName: string): SkillDefinition | undefined {
        return this.packagedSkills.get(skillName) || this.personalSkills.get(skillName);
    }

    /**
     * Get all registered skills (packaged + personal)
     */
    getAllSkills(): SkillDefinition[] {
        const packaged = Array.from(this.packagedSkills.values()).filter(skill => skill.isActive);
        const personal = Array.from(this.personalSkills.values()).filter(skill => skill.isActive);
        return [...packaged, ...personal];
    }

    /**
     * Get only packaged skills
     */
    getPackagedSkills(): SkillDefinition[] {
        return Array.from(this.packagedSkills.values()).filter(skill => skill.isActive);
    }

    /**
     * Get only personal skills
     */
    getPersonalSkills(): SkillDefinition[] {
        return Array.from(this.personalSkills.values()).filter(skill => skill.isActive);
    }

    /**
     * Check if a skill is registered (packaged or personal)
     */
    isSkillRegistered(skillName: string): boolean {
        const packagedSkill = this.packagedSkills.get(skillName);
        const personalSkill = this.personalSkills.get(skillName);
        return (packagedSkill?.isActive || personalSkill?.isActive) || false;
    }

    /**
     * Load skill content on demand
     */
    async loadSkillContent(skillName: string): Promise<LoadedSkill | null> {
        const skill = this.getSkill(skillName);
        if (!skill || !skill.isActive) {
            return null;
        }

        return await this.skillLoader.loadSkill(skillName);
    }

    /**
     * Reload only personal skills (packaged skills remain cached)
     */
    async reloadPersonalSkills(): Promise<void> {
        console.log('Reloading personal skills...');
        
        // Clear personal skills only
        this.personalSkills.clear();
        this.skillLoader.clearPersonalCache();

        // Reload personal skills from metadata
        await this.loadPersonalSkillsRegistry();
    }

    /**
     * Watch for personal skill directory changes and auto-reload
     * Packaged skills are not watched as they don't change at runtime
     */
    enableAutoReload(): vscode.Disposable {
        const personalPattern = path.join(this.personalSkillsDir, '**/SKILL.md').replace(/\\/g, '/');

        const watchers: vscode.FileSystemWatcher[] = [];

        // Only watch personal skills for dynamic reloading
        if (fs.existsSync(this.personalSkillsDir)) {
            const personalWatcher = vscode.workspace.createFileSystemWatcher(personalPattern);
            personalWatcher.onDidCreate(() => this.reloadPersonalSkills());
            personalWatcher.onDidDelete(() => this.reloadPersonalSkills());
            personalWatcher.onDidChange(() => {
                this.skillLoader.clearPersonalCache(); // Clear personal cache on changes
            });
            watchers.push(personalWatcher);
        }

        return {
            dispose: () => {
                watchers.forEach(w => w.dispose());
            }
        };
    }

    dispose(): void {
        this._onPersonalSkillRegistered.dispose();
        this._onPersonalSkillUnregistered.dispose();
    }
}

export interface SkillDefinition {
    name: string;
    description: string;
    sourceType: string;
    skillFile: string;
    registeredAt: Date;
    isActive: boolean;
}