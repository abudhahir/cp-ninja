import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ResourceDirectories, ProfileConfig, ProjectContext } from './types/ResourceTypes';

export class ResourceManager {
    private workspacePath: string;

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

        return { globalDir, projectDir, profilesDir, agentsDir };
    }

    private async ensureDirectory(dirPath: string): Promise<void> {
        if (!fs.existsSync(dirPath)) {
            await fs.promises.mkdir(dirPath, { recursive: true });
        }
    }
}