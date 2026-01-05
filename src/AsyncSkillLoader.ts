import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { Skill, extractFrontmatter, stripFrontmatter } from './lib/skills-core';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export class AsyncSkillLoader {
    private packagedSkillsCache: Map<string, LoadedSkill> = new Map();
    private personalSkillsCache: Map<string, LoadedSkill> = new Map();
    private loadingPromises: Map<string, Promise<LoadedSkill | null>> = new Map();
    private packagedSkillsLoaded: boolean = false;

    constructor(
        private skillsDir: string,
        private personalSkillsDir: string
    ) {}

    /**
     * Eagerly load all packaged skills on startup
     */
    async loadPackagedSkills(): Promise<void> {
        if (this.packagedSkillsLoaded) {
            return;
        }

        console.log('Eagerly loading packaged skills...');
        const packagedSkills = await this.loadSkillsFromDir(this.skillsDir, 'cp-ninja');
        
        for (const skill of packagedSkills) {
            try {
                const loadedSkill = await this.doLoadSkillFromPath(skill.skillFile, skill.name, skill.sourceType);
                if (loadedSkill) {
                    this.packagedSkillsCache.set(skill.name, loadedSkill);
                }
            } catch (error) {
                console.error(`Failed to load packaged skill ${skill.name}:`, error);
            }
        }
        
        this.packagedSkillsLoaded = true;
        console.log(`Loaded ${this.packagedSkillsCache.size} packaged skills`);
    }

    /**
     * Load a skill asynchronously with content caching
     * Packaged skills are loaded eagerly, personal skills on-demand
     */
    async loadSkill(skillName: string): Promise<LoadedSkill | null> {
        // Check packaged skills cache first (always available)
        const packagedSkill = this.packagedSkillsCache.get(skillName);
        if (packagedSkill) {
            return packagedSkill;
        }

        // Check personal skills cache
        const personalSkill = this.personalSkillsCache.get(skillName);
        if (personalSkill) {
            return personalSkill;
        }

        // Check if already loading personal skill
        const loading = this.loadingPromises.get(skillName);
        if (loading) {
            return loading;
        }

        // Start loading personal skill dynamically
        const loadingPromise = this.doLoadPersonalSkill(skillName);
        this.loadingPromises.set(skillName, loadingPromise);

        try {
            const result = await loadingPromise;
            if (result) {
                this.personalSkillsCache.set(skillName, result);
            }
            return result;
        } finally {
            this.loadingPromises.delete(skillName);
        }
    }

    /**
     * Preload commonly used personal skills (packaged skills are already loaded)
     */
    async preloadPersonalSkills(skillNames: string[]): Promise<void> {
        const personalSkillPromises = skillNames
            .filter(name => !this.packagedSkillsCache.has(name)) // Only load if not already a packaged skill
            .map(name => this.loadSkill(name));
        await Promise.all(personalSkillPromises);
    }

    /**
     * Load all available skills metadata (lightweight)
     */
    async getAllSkillsMetadata(): Promise<SkillMetadata[]> {
        const skills: SkillMetadata[] = [];
        
        // Load from cp-ninja skills
        const cpNinjaSkills = await this.loadSkillsFromDir(this.skillsDir, 'cp-ninja');
        skills.push(...cpNinjaSkills);

        // Load from personal skills
        if (fs.existsSync(this.personalSkillsDir)) {
            const personalSkills = await this.loadSkillsFromDir(this.personalSkillsDir, 'personal');
            skills.push(...personalSkills);
        }

        return skills;
    }

    private async loadSkillsFromDir(dir: string, sourceType: string, maxDepth: number = 3): Promise<SkillMetadata[]> {
        const skills: SkillMetadata[] = [];

        if (!fs.existsSync(dir)) {
            return skills;
        }

        async function recurse(currentDir: string, depth: number): Promise<void> {
            if (depth > maxDepth) return;

            try {
                const entries = await readdir(currentDir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(currentDir, entry.name);

                    if (entry.isDirectory()) {
                        const skillFile = path.join(fullPath, 'SKILL.md');
                        if (fs.existsSync(skillFile)) {
                            const { name, description } = extractFrontmatter(skillFile);
                            const stats = await stat(skillFile);
                            
                            skills.push({
                                name: name || entry.name,
                                description: description || '',
                                sourceType,
                                skillFile,
                                path: fullPath,
                                lastModified: stats.mtime,
                                size: stats.size
                            });
                        }
                        await recurse(fullPath, depth + 1);
                    }
                }
            } catch (error) {
                console.error(`Error reading directory ${currentDir}:`, error);
            }
        }

        await recurse(dir, 0);
        return skills;
    }

    private async doLoadPersonalSkill(skillName: string): Promise<LoadedSkill | null> {
        // Only load from personal skills directory
        const skillPath = path.join(this.personalSkillsDir, skillName, 'SKILL.md');
        
        if (!fs.existsSync(skillPath)) {
            return null;
        }

        return await this.doLoadSkillFromPath(skillPath, skillName, 'personal');
    }

    private async doLoadSkillFromPath(skillPath: string, skillName: string, sourceType: string): Promise<LoadedSkill | null> {
        try {
            const content = await readFile(skillPath, 'utf8');
            const { name, description } = extractFrontmatter(skillPath);
            const skillContent = stripFrontmatter(content);
            const stats = await stat(skillPath);

            return {
                name: name || skillName,
                description: description || '',
                sourceType,
                skillFile: skillPath,
                path: path.dirname(skillPath),
                content: skillContent,
                fullContent: content,
                lastModified: stats.mtime,
                size: stats.size
            };
        } catch (error) {
            console.error(`Error loading skill ${skillName} from ${skillPath}:`, error);
            return null;
        }
    }

    /**
     * Clear cache for a specific personal skill (useful for hot reload)
     */
    invalidatePersonalSkill(skillName: string): void {
        this.personalSkillsCache.delete(skillName);
        this.loadingPromises.delete(skillName);
    }

    /**
     * Clear personal skills cache (packaged skills remain cached)
     */
    clearPersonalCache(): void {
        this.personalSkillsCache.clear();
        this.loadingPromises.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { packagedSize: number; personalSize: number; loadingCount: number } {
        return {
            packagedSize: this.packagedSkillsCache.size,
            personalSize: this.personalSkillsCache.size,
            loadingCount: this.loadingPromises.size
        };
    }

    /**
     * Get all loaded skills (packaged + personal)
     */
    getAllLoadedSkills(): LoadedSkill[] {
        return [
            ...Array.from(this.packagedSkillsCache.values()),
            ...Array.from(this.personalSkillsCache.values())
        ];
    }
}

export interface SkillMetadata {
    name: string;
    description: string;
    sourceType: string;
    skillFile: string;
    path: string;
    lastModified: Date;
    size: number;
}

export interface LoadedSkill extends SkillMetadata {
    content: string;       // Content without frontmatter
    fullContent: string;   // Full content including frontmatter
}