import * as path from 'path';
import * as fs from 'fs';
import { ProfileConfig } from './types/ResourceTypes';

export class ProfileManager {
    constructor(
        private globalDir: string,
        private projectDir: string
    ) {}

    async resolveActiveProfile(profileName: string): Promise<ProfileConfig | null> {
        try {
            const profilePath = path.join(this.globalDir, 'profiles', `${profileName}.json`);
            
            try {
                await fs.promises.access(profilePath); // Replace fs.existsSync
                return await this.loadProfile(profilePath);
            } catch {
                return null; // File doesn't exist or not accessible
            }
        } catch (error) {
            throw new Error(`Failed to resolve profile ${profileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async loadProfile(profilePath: string): Promise<ProfileConfig> {
        try {
            const content = await fs.promises.readFile(profilePath, 'utf8');
            const parsed = JSON.parse(content);
            
            // Comprehensive validation
            if (!parsed.name || typeof parsed.name !== 'string') {
                throw new Error('Profile missing required field: name');
            }
            if (!Array.isArray(parsed.skills)) {
                throw new Error('Profile missing required field: skills (array)');
            }
            if (!Array.isArray(parsed.agentTemplates)) {
                throw new Error('Profile missing required field: agentTemplates (array)');
            }
            if (!parsed.autoActivate || typeof parsed.autoActivate !== 'object') {
                throw new Error('Profile missing required field: autoActivate (object)');
            }
            
            return parsed as ProfileConfig;
        } catch (error) {
            throw new Error(`Failed to load profile from ${profilePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getActiveProfileName(): Promise<string | null> {
        try {
            const activeProfilePath = path.join(this.projectDir, 'active-profile');
            
            try {
                const content = await fs.promises.readFile(activeProfilePath, 'utf8');
                return content.trim();
            } catch {
                return null; // File doesn't exist
            }
        } catch (error) {
            throw new Error(`Failed to get active profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async setActiveProfile(profileName: string): Promise<void> {
        try {
            const activeProfilePath = path.join(this.projectDir, 'active-profile');
            await fs.promises.writeFile(activeProfilePath, profileName);
        } catch (error) {
            throw new Error(`Failed to set active profile '${profileName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}