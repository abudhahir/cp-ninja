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
            
            if (fs.existsSync(profilePath)) {
                return this.loadProfile(profilePath);
            }
            
            return null;
        } catch (error) {
            throw new Error(`Failed to resolve profile '${profileName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async loadProfile(profilePath: string): Promise<ProfileConfig> {
        try {
            const content = await fs.promises.readFile(profilePath, 'utf8');
            const parsed = JSON.parse(content);
            
            // Basic validation
            if (!parsed.name || !Array.isArray(parsed.skills)) {
                throw new Error('Invalid profile format');
            }
            
            return parsed as ProfileConfig;
        } catch (error) {
            throw new Error(`Failed to load profile from ${profilePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getActiveProfileName(): Promise<string | null> {
        try {
            const activeProfilePath = path.join(this.projectDir, 'active-profile');
            
            if (fs.existsSync(activeProfilePath)) {
                const content = await fs.promises.readFile(activeProfilePath, 'utf8');
                return content.trim();
            }
            
            return null;
        } catch (error) {
            throw new Error(`Failed to get active profile name: ${error instanceof Error ? error.message : 'Unknown error'}`);
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