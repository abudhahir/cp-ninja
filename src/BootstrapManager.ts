import { ResourceManager } from './ResourceManager';
import { ProfileManager } from './ProfileManager';
import { ContextDetector } from './ContextDetector';
import { ProjectContext, ResourceDirectories, ProfileConfig } from './types/ResourceTypes';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PresetSuggestion {
    preset: string;
    confidence: number;
    reason: string;
}

export interface BootstrapResult {
    success: boolean;
    appliedPresets: string[];
    createdResources: string[];
    errors?: string[];
}

export class BootstrapManager {
    private resourceManager: ResourceManager;
    private profileManager?: ProfileManager;
    private contextDetector: ContextDetector;
    private workspacePath: string;

    constructor(workspacePath: string) {
        this.workspacePath = workspacePath;
        this.resourceManager = new ResourceManager(workspacePath);
        this.contextDetector = new ContextDetector(workspacePath);
    }

    async initialize(): Promise<void> {
        try {
            const directories = await this.resourceManager.initializeDirectories();
            this.profileManager = new ProfileManager(directories.globalDir, directories.projectDir);
            
            // Create default profiles if they don't exist
            await this.createDefaultProfiles(directories.profilesDir);
        } catch (error) {
            throw new Error(`Failed to initialize BootstrapManager: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async suggestPresets(context: ProjectContext): Promise<PresetSuggestion[]> {
        const suggestions: PresetSuggestion[] = [];
        
        // Frontend project detection
        if (context.frameworks.includes('react') || context.frameworks.includes('vue') || context.frameworks.includes('angular')) {
            suggestions.push({
                preset: 'frontend-development',
                confidence: 0.9,
                reason: 'Detected React/Vue/Angular framework'
            });
        }
        
        // Backend API detection
        if (context.frameworks.includes('express') || context.frameworks.includes('fastify') || context.frameworks.includes('koa')) {
            suggestions.push({
                preset: 'backend-api',
                confidence: 0.85,
                reason: 'Detected API framework'
            });
        }
        
        // Technical analysis context
        if (context.recentActivity.includes('planning') || context.recentActivity.includes('requirements')) {
            suggestions.push({
                preset: 'technical-analysis',
                confidence: 0.75,
                reason: 'Recent planning activity detected'
            });
        }
        
        // Full-stack detection
        if (suggestions.some(s => s.preset === 'frontend-development') && 
            suggestions.some(s => s.preset === 'backend-api')) {
            suggestions.push({
                preset: 'fullstack-development',
                confidence: 0.95,
                reason: 'Detected both frontend and backend components'
            });
        }

        // Testing-focused projects
        if (context.frameworks.includes('jest') || context.frameworks.includes('mocha') || 
            context.frameworks.includes('cypress') || context.frameworks.includes('playwright')) {
            suggestions.push({
                preset: 'test-automation',
                confidence: 0.8,
                reason: 'Detected testing frameworks'
            });
        }

        // Team collaboration indicators
        if (context.teamIndicators.length > 2) {
            suggestions.push({
                preset: 'team-collaboration',
                confidence: 0.7,
                reason: 'Strong team collaboration indicators detected'
            });
        }
        
        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    async bootstrapProject(context: ProjectContext): Promise<BootstrapResult> {
        const result: BootstrapResult = {
            success: false,
            appliedPresets: [],
            createdResources: [],
            errors: []
        };

        try {
            // Initialize if not already done
            if (!this.profileManager) {
                await this.initialize();
            }

            const suggestions = await this.suggestPresets(context);
            
            // Apply the highest confidence suggestion automatically
            if (suggestions.length > 0) {
                const topSuggestion = suggestions[0];
                const profileCreated = await this.applyPreset(topSuggestion.preset);
                
                if (profileCreated) {
                    result.appliedPresets.push(topSuggestion.preset);
                    result.createdResources.push(`Profile: ${topSuggestion.preset}`);
                }
            }

            // Create additional resources based on context
            const additionalResources = await this.createContextSpecificResources(context);
            result.createdResources.push(...additionalResources);

            result.success = true;
        } catch (error) {
            result.errors = [`Bootstrap failed: ${error instanceof Error ? error.message : 'Unknown error'}`];
        }

        return result;
    }

    private async applyPreset(presetName: string): Promise<boolean> {
        try {
            if (!this.profileManager) {
                throw new Error('ProfileManager not initialized');
            }

            const profile = await this.getDefaultProfile(presetName);
            if (profile) {
                await this.profileManager.createProfile(profile);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Failed to apply preset ${presetName}:`, error);
            return false;
        }
    }

    private async createContextSpecificResources(context: ProjectContext): Promise<string[]> {
        const resources: string[] = [];

        // Create language-specific templates
        for (const language of context.language) {
            const templatePath = await this.createLanguageTemplate(language);
            if (templatePath) {
                resources.push(`Template: ${language}`);
            }
        }

        // Create framework-specific configurations
        for (const framework of context.frameworks) {
            const configPath = await this.createFrameworkConfig(framework);
            if (configPath) {
                resources.push(`Config: ${framework}`);
            }
        }

        return resources;
    }

    private async createLanguageTemplate(language: string): Promise<string | null> {
        try {
            const directories = await this.resourceManager.initializeDirectories();
            const templatePath = path.join(directories.projectDir, 'templates', `${language}.md`);
            
            // Ensure templates directory exists
            await fs.mkdir(path.dirname(templatePath), { recursive: true });
            
            const templateContent = `# ${language.toUpperCase()} Development Template\n\nThis template provides best practices for ${language} development.\n`;
            await fs.writeFile(templatePath, templateContent, 'utf8');
            
            return templatePath;
        } catch (error) {
            console.error(`Failed to create language template for ${language}:`, error);
            return null;
        }
    }

    private async createFrameworkConfig(framework: string): Promise<string | null> {
        try {
            const directories = await this.resourceManager.initializeDirectories();
            const configPath = path.join(directories.projectDir, 'configs', `${framework}.json`);
            
            // Ensure configs directory exists
            await fs.mkdir(path.dirname(configPath), { recursive: true });
            
            const config = {
                framework,
                createdAt: new Date().toISOString(),
                recommendations: [`Use ${framework} best practices`, `Follow ${framework} conventions`]
            };
            
            await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
            
            return configPath;
        } catch (error) {
            console.error(`Failed to create framework config for ${framework}:`, error);
            return null;
        }
    }

    private async createDefaultProfiles(profilesDir: string): Promise<void> {
        const defaultProfiles = await this.getDefaultProfiles();
        
        for (const profile of defaultProfiles) {
            try {
                const profilePath = path.join(profilesDir, `${profile.name}.json`);
                
                // Check if profile already exists
                try {
                    await fs.access(profilePath);
                    continue; // Profile exists, skip creation
                } catch {
                    // Profile doesn't exist, create it
                }
                
                // Ensure profiles directory exists
                await fs.mkdir(profilesDir, { recursive: true });
                
                await fs.writeFile(profilePath, JSON.stringify(profile, null, 2), 'utf8');
            } catch (error) {
                console.error(`Failed to create default profile ${profile.name}:`, error);
            }
        }
    }

    private async getDefaultProfile(presetName: string): Promise<ProfileConfig | null> {
        const profiles = await this.getDefaultProfiles();
        return profiles.find(p => p.name === presetName) || null;
    }

    private async getDefaultProfiles(): Promise<ProfileConfig[]> {
        return [
            {
                name: 'frontend-development',
                description: 'Frontend development with React/Vue/Angular best practices',
                skills: ['test-driven-development', 'systematic-debugging', 'verification-before-completion'],
                agentTemplates: ['react-reviewer', 'accessibility-checker', 'performance-optimizer'],
                codingStandards: ['frontend-conventions.md', 'component-guidelines.md'],
                autoActivate: {
                    filePatterns: ['*.tsx', '*.jsx', '*.vue', '*.component.ts'],
                    dependencies: ['react', 'vue', 'angular', '@angular/core'],
                    keywords: ['component', 'frontend', 'ui', 'interface']
                }
            },
            {
                name: 'backend-api',
                description: 'Backend API development with best practices',
                skills: ['test-driven-development', 'systematic-debugging', 'using-superpowers'],
                agentTemplates: ['api-reviewer', 'security-checker', 'performance-analyzer'],
                codingStandards: ['api-conventions.md', 'security-guidelines.md'],
                autoActivate: {
                    filePatterns: ['*.controller.ts', '*.service.ts', '*.route.ts', '**/routes/**/*.js'],
                    dependencies: ['express', 'fastify', 'koa', 'nestjs'],
                    keywords: ['api', 'endpoint', 'controller', 'service', 'backend']
                }
            },
            {
                name: 'technical-analysis',
                description: 'Comprehensive requirement analysis workflow',
                skills: ['brainstorming', 'writing-plans', 'verification-before-completion'],
                agentTemplates: ['business-analyst', 'software-architect', 'technical-analyzer'],
                codingStandards: ['analysis-template.md', 'requirements-format.md'],
                autoActivate: {
                    filePatterns: ['requirements*.md', 'specs/**/*.md', 'docs/architecture/**'],
                    dependencies: [],
                    keywords: ['requirement', 'analysis', 'planning', 'specification', 'architecture']
                }
            },
            {
                name: 'fullstack-development',
                description: 'Full-stack development combining frontend and backend best practices',
                skills: ['test-driven-development', 'systematic-debugging', 'dispatching-parallel-agents'],
                agentTemplates: ['fullstack-reviewer', 'integration-tester', 'deployment-specialist'],
                codingStandards: ['fullstack-conventions.md', 'integration-guidelines.md'],
                autoActivate: {
                    filePatterns: ['*.ts', '*.js', '*.tsx', '*.jsx'],
                    dependencies: ['react', 'express', 'next', 'nuxt'],
                    keywords: ['fullstack', 'integration', 'deployment', 'monorepo']
                }
            },
            {
                name: 'test-automation',
                description: 'Test automation and quality assurance focused workflow',
                skills: ['test-driven-development', 'systematic-debugging', 'verification-before-completion'],
                agentTemplates: ['test-architect', 'qa-specialist', 'automation-engineer'],
                codingStandards: ['testing-conventions.md', 'test-patterns.md'],
                autoActivate: {
                    filePatterns: ['*.test.ts', '*.spec.ts', '*.e2e.ts', '**/tests/**/*.ts'],
                    dependencies: ['jest', 'mocha', 'cypress', 'playwright', 'vitest'],
                    keywords: ['test', 'testing', 'automation', 'quality', 'spec']
                }
            },
            {
                name: 'team-collaboration',
                description: 'Team collaboration and code review focused workflow',
                skills: ['requesting-code-review', 'receiving-code-review', 'subagent-driven-development'],
                agentTemplates: ['code-reviewer', 'team-lead', 'documentation-specialist'],
                codingStandards: ['team-conventions.md', 'review-guidelines.md'],
                autoActivate: {
                    filePatterns: ['*.md', 'PULL_REQUEST_TEMPLATE.md', 'CONTRIBUTING.md'],
                    dependencies: [],
                    keywords: ['review', 'collaboration', 'team', 'documentation', 'guidelines']
                }
            }
        ];
    }
}