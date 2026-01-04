import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface SkillConfiguration {
    enableSuggestions: boolean;
    suggestionCooldown: number;
    blacklistedSkills: string[];
    customShortcuts: Record<string, string>;
    themePreference: 'auto' | 'light' | 'dark';
    suggestionFrequency: 'never' | 'minimal' | 'normal' | 'aggressive';
    favoriteSkills: string[];
    workspaceProfiles: Record<string, WorkspaceProfile>;
}

export interface WorkspaceProfile {
    name: string;
    description: string;
    enabledSkills: string[];
    preferredSkills: string[];
    autoActivateSkills: string[];
    customSettings: Record<string, any>;
}

export interface WorkspaceConfig {
    profileName?: string;
    skillPreferences: Record<string, number>; // skill name -> preference weight
    blacklistedSkills: string[];
    customShortcuts: Record<string, string>;
    autoActivatePatterns: Array<{
        pattern: string;
        skillName: string;
        condition: 'file-open' | 'file-create' | 'workspace-open';
    }>;
}

export class ConfigurationManager {
    private static readonly CONFIG_FILE_NAME = 'cp-ninja.json';
    private globalConfig: SkillConfiguration;
    private workspaceConfig: WorkspaceConfig | null = null;

    constructor(private context: vscode.ExtensionContext) {
        this.globalConfig = this.loadGlobalConfiguration();
        this.loadWorkspaceConfiguration();
        this.setupConfigurationWatcher();
    }

    /**
     * Load global configuration from VS Code settings
     */
    private loadGlobalConfiguration(): SkillConfiguration {
        const config = vscode.workspace.getConfiguration('cpNinja');
        
        return {
            enableSuggestions: config.get('enableSuggestions', true),
            suggestionCooldown: config.get('suggestionCooldown', 300),
            blacklistedSkills: config.get('blacklistedSkills', []),
            customShortcuts: config.get('customShortcuts', {}),
            themePreference: config.get('themePreference', 'auto'),
            suggestionFrequency: config.get('suggestionFrequency', 'normal'),
            favoriteSkills: config.get('favoriteSkills', []),
            workspaceProfiles: config.get('workspaceProfiles', {})
        };
    }

    /**
     * Load workspace-specific configuration
     */
    private loadWorkspaceConfiguration(): void {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            this.workspaceConfig = null;
            return;
        }

        const configPath = path.join(workspaceFolder.uri.fsPath, '.vscode', ConfigurationManager.CONFIG_FILE_NAME);
        
        try {
            if (fs.existsSync(configPath)) {
                const configContent = fs.readFileSync(configPath, 'utf8');
                this.workspaceConfig = JSON.parse(configContent);
            } else {
                // Create default workspace config
                this.workspaceConfig = this.createDefaultWorkspaceConfig();
                this.saveWorkspaceConfiguration();
            }
        } catch (error) {
            console.error('Error loading workspace configuration:', error);
            this.workspaceConfig = this.createDefaultWorkspaceConfig();
        }
    }

    /**
     * Create default workspace configuration
     */
    private createDefaultWorkspaceConfig(): WorkspaceConfig {
        return {
            skillPreferences: {},
            blacklistedSkills: [],
            customShortcuts: {},
            autoActivatePatterns: []
        };
    }

    /**
     * Save workspace configuration
     */
    public async saveWorkspaceConfiguration(): Promise<void> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder || !this.workspaceConfig) {
            return;
        }

        const vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode');
        const configPath = path.join(vscodeDir, ConfigurationManager.CONFIG_FILE_NAME);

        try {
            // Ensure .vscode directory exists
            if (!fs.existsSync(vscodeDir)) {
                fs.mkdirSync(vscodeDir, { recursive: true });
            }

            // Write configuration
            fs.writeFileSync(configPath, JSON.stringify(this.workspaceConfig, null, 2));
        } catch (error) {
            console.error('Error saving workspace configuration:', error);
        }
    }

    /**
     * Setup configuration file watcher
     */
    private setupConfigurationWatcher(): void {
        // Watch VS Code settings changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cpNinja')) {
                this.globalConfig = this.loadGlobalConfiguration();
            }
        });

        // Watch workspace configuration file changes
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            const configPath = path.join(workspaceFolder.uri.fsPath, '.vscode', ConfigurationManager.CONFIG_FILE_NAME);
            const watcher = vscode.workspace.createFileSystemWatcher(configPath);
            
            watcher.onDidChange(() => this.loadWorkspaceConfiguration());
            watcher.onDidCreate(() => this.loadWorkspaceConfiguration());
            watcher.onDidDelete(() => this.workspaceConfig = this.createDefaultWorkspaceConfig());
        }
    }

    /**
     * Get effective configuration (global + workspace merged)
     */
    public getEffectiveConfig(): SkillConfiguration & { workspace: WorkspaceConfig | null } {
        return {
            ...this.globalConfig,
            // Override with workspace settings where applicable
            blacklistedSkills: [
                ...this.globalConfig.blacklistedSkills,
                ...(this.workspaceConfig?.blacklistedSkills || [])
            ],
            customShortcuts: {
                ...this.globalConfig.customShortcuts,
                ...(this.workspaceConfig?.customShortcuts || {})
            },
            workspace: this.workspaceConfig
        };
    }

    /**
     * Check if a skill is enabled in current context
     */
    public isSkillEnabled(skillName: string): boolean {
        const config = this.getEffectiveConfig();
        return !config.blacklistedSkills.includes(skillName);
    }

    /**
     * Get skill preference weight (higher = more preferred)
     */
    public getSkillPreference(skillName: string): number {
        if (!this.workspaceConfig) return 0;
        return this.workspaceConfig.skillPreferences[skillName] || 0;
    }

    /**
     * Update skill preference
     */
    public async updateSkillPreference(skillName: string, weight: number): Promise<void> {
        if (!this.workspaceConfig) {
            this.workspaceConfig = this.createDefaultWorkspaceConfig();
        }

        this.workspaceConfig.skillPreferences[skillName] = weight;
        await this.saveWorkspaceConfiguration();
    }

    /**
     * Add skill to blacklist
     */
    public async blacklistSkill(skillName: string, scope: 'global' | 'workspace' = 'workspace'): Promise<void> {
        if (scope === 'global') {
            const config = vscode.workspace.getConfiguration('cpNinja');
            const blacklisted = config.get<string[]>('blacklistedSkills', []);
            if (!blacklisted.includes(skillName)) {
                blacklisted.push(skillName);
                await config.update('blacklistedSkills', blacklisted, vscode.ConfigurationTarget.Global);
            }
        } else {
            if (!this.workspaceConfig) {
                this.workspaceConfig = this.createDefaultWorkspaceConfig();
            }
            if (!this.workspaceConfig.blacklistedSkills.includes(skillName)) {
                this.workspaceConfig.blacklistedSkills.push(skillName);
                await this.saveWorkspaceConfiguration();
            }
        }
    }

    /**
     * Remove skill from blacklist
     */
    public async unblacklistSkill(skillName: string, scope: 'global' | 'workspace' = 'workspace'): Promise<void> {
        if (scope === 'global') {
            const config = vscode.workspace.getConfiguration('cpNinja');
            const blacklisted = config.get<string[]>('blacklistedSkills', []);
            const filtered = blacklisted.filter(s => s !== skillName);
            await config.update('blacklistedSkills', filtered, vscode.ConfigurationTarget.Global);
        } else {
            if (this.workspaceConfig) {
                this.workspaceConfig.blacklistedSkills = this.workspaceConfig.blacklistedSkills.filter(s => s !== skillName);
                await this.saveWorkspaceConfiguration();
            }
        }
    }

    /**
     * Add skill to favorites
     */
    public async addToFavorites(skillName: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('cpNinja');
        const favorites = config.get<string[]>('favoriteSkills', []);
        if (!favorites.includes(skillName)) {
            favorites.push(skillName);
            await config.update('favoriteSkills', favorites, vscode.ConfigurationTarget.Global);
        }
    }

    /**
     * Remove skill from favorites
     */
    public async removeFromFavorites(skillName: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('cpNinja');
        const favorites = config.get<string[]>('favoriteSkills', []);
        const filtered = favorites.filter(s => s !== skillName);
        await config.update('favoriteSkills', filtered, vscode.ConfigurationTarget.Global);
    }

    /**
     * Set custom shortcut for skill
     */
    public async setCustomShortcut(skillName: string, shortcut: string, scope: 'global' | 'workspace' = 'global'): Promise<void> {
        if (scope === 'global') {
            const config = vscode.workspace.getConfiguration('cpNinja');
            const shortcuts = config.get<Record<string, string>>('customShortcuts', {});
            shortcuts[shortcut] = skillName;
            await config.update('customShortcuts', shortcuts, vscode.ConfigurationTarget.Global);
        } else {
            if (!this.workspaceConfig) {
                this.workspaceConfig = this.createDefaultWorkspaceConfig();
            }
            this.workspaceConfig.customShortcuts[shortcut] = skillName;
            await this.saveWorkspaceConfiguration();
        }
    }

    /**
     * Get predefined workspace profiles
     */
    public getPredefinedProfiles(): Record<string, WorkspaceProfile> {
        return {
            'full-stack-web': {
                name: 'Full Stack Web Development',
                description: 'Profile optimized for full-stack web development',
                enabledSkills: ['test-driven-development', 'systematic-debugging', 'brainstorming', 'writing-plans'],
                preferredSkills: ['test-driven-development', 'systematic-debugging'],
                autoActivateSkills: ['using-cp-ninja'],
                customSettings: {
                    suggestionFrequency: 'normal',
                    enableSuggestions: true
                }
            },
            'data-science': {
                name: 'Data Science & Analytics',
                description: 'Profile for data science and machine learning projects',
                enabledSkills: ['systematic-debugging', 'brainstorming', 'writing-plans', 'verification-before-completion'],
                preferredSkills: ['systematic-debugging', 'brainstorming'],
                autoActivateSkills: ['using-cp-ninja'],
                customSettings: {
                    suggestionFrequency: 'minimal',
                    enableSuggestions: true
                }
            },
            'devops': {
                name: 'DevOps & Infrastructure',
                description: 'Profile for DevOps, infrastructure, and automation work',
                enabledSkills: ['systematic-debugging', 'writing-plans', 'verification-before-completion'],
                preferredSkills: ['systematic-debugging', 'writing-plans'],
                autoActivateSkills: ['using-cp-ninja'],
                customSettings: {
                    suggestionFrequency: 'normal',
                    enableSuggestions: true
                }
            }
        };
    }

    /**
     * Apply workspace profile
     */
    public async applyWorkspaceProfile(profileName: string): Promise<void> {
        const predefinedProfiles = this.getPredefinedProfiles();
        const userProfiles = this.globalConfig.workspaceProfiles;
        const profile = predefinedProfiles[profileName] || userProfiles[profileName];

        if (!profile) {
            throw new Error(`Profile '${profileName}' not found`);
        }

        if (!this.workspaceConfig) {
            this.workspaceConfig = this.createDefaultWorkspaceConfig();
        }

        // Apply profile settings
        this.workspaceConfig.profileName = profileName;
        
        // Set skill preferences based on profile
        profile.preferredSkills.forEach(skillName => {
            this.workspaceConfig!.skillPreferences[skillName] = 2;
        });
        
        profile.enabledSkills.forEach(skillName => {
            if (!this.workspaceConfig!.skillPreferences[skillName]) {
                this.workspaceConfig!.skillPreferences[skillName] = 1;
            }
        });

        // Apply custom settings to VS Code configuration
        const config = vscode.workspace.getConfiguration('cpNinja');
        for (const [key, value] of Object.entries(profile.customSettings)) {
            await config.update(key, value, vscode.ConfigurationTarget.Workspace);
        }

        await this.saveWorkspaceConfiguration();
    }

    /**
     * Get auto-activation patterns for current workspace
     */
    public getAutoActivationPatterns(): Array<{ pattern: string; skillName: string; condition: string }> {
        return this.workspaceConfig?.autoActivatePatterns || [];
    }

    /**
     * Add auto-activation pattern
     */
    public async addAutoActivationPattern(pattern: string, skillName: string, condition: 'file-open' | 'file-create' | 'workspace-open'): Promise<void> {
        if (!this.workspaceConfig) {
            this.workspaceConfig = this.createDefaultWorkspaceConfig();
        }

        this.workspaceConfig.autoActivatePatterns.push({ pattern, skillName, condition });
        await this.saveWorkspaceConfiguration();
    }
}