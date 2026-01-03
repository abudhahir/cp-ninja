import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ResourceDirectories, ProfileConfig, ProjectContext } from './types/ResourceTypes';
import { ProfileManager } from './ProfileManager';

export class ResourceManager {
    private workspacePath: string;
    private profileManager?: ProfileManager;

    constructor(workspacePath: string) {
        this.workspacePath = workspacePath;
    }

    async initializeDirectories(): Promise<ResourceDirectories> {
        const globalDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cp-ninja');
        const projectDir = path.join(this.workspacePath, '.cp-ninja');
        const profilesDir = path.join(globalDir, 'profiles');
        const agentsDir = path.join(globalDir, 'resources', 'agents');

        // Create directories if they don't exist
        await this.ensureDirectory(globalDir);
        await this.ensureDirectory(projectDir);
        await this.ensureDirectory(profilesDir);
        await this.ensureDirectory(agentsDir);

        // Initialize ProfileManager with the directories
        this.profileManager = new ProfileManager(globalDir, projectDir);

        return { globalDir, projectDir, profilesDir, agentsDir };
    }

    async getActiveProfile(): Promise<ProfileConfig | null> {
        if (!this.profileManager) {
            throw new Error('ResourceManager not initialized. Call initializeDirectories first.');
        }

        const activeProfileName = await this.profileManager.getActiveProfileName();
        if (!activeProfileName) {
            return null;
        }

        return await this.profileManager.resolveActiveProfile(activeProfileName);
    }

    async setActiveProfile(profileName: string): Promise<void> {
        if (!this.profileManager) {
            throw new Error('ResourceManager not initialized. Call initializeDirectories first.');
        }

        await this.profileManager.setActiveProfile(profileName);
    }

    async resolveProfile(profileName: string): Promise<ProfileConfig | null> {
        if (!this.profileManager) {
            throw new Error('ResourceManager not initialized. Call initializeDirectories first.');
        }

        return await this.profileManager.resolveActiveProfile(profileName);
    }

    private async ensureDirectory(dirPath: string): Promise<void> {
        try {
            if (!fs.existsSync(dirPath)) {
                await fs.promises.mkdir(dirPath, { recursive: true });
            }
        } catch (error: any) {
            throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
        }
    }
}