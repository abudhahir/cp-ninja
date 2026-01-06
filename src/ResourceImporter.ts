import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export type ImportTarget = 'project' | 'user-global';
export type ResourceType = 'skill' | 'prompt' | 'instruction' | 'agent';

export interface ImportResult {
    success: boolean;
    path?: string;
    error?: string;
}

export class ResourceImporter {
    constructor(private workspacePath: string) {}

    /**
     * Validate resource content and structure
     */
    validateResource(content: string, type: ResourceType): { valid: boolean; error?: string } {
        if (!content || content.trim().length === 0) {
            return { valid: false, error: 'Resource content is empty' };
        }

        // Type-specific validation
        switch (type) {
            case 'skill':
                // Skills should have YAML frontmatter with name/description
                if (!content.includes('---') || !content.includes('name:')) {
                    return { valid: false, error: 'Skill must have YAML frontmatter with name field' };
                }
                break;
            case 'prompt':
                // Prompts should end with .prompt.md or -prompt.md
                // Content validation - just check it's markdown
                if (!content.trim().startsWith('#') && !content.trim().startsWith('---')) {
                    console.warn('Prompt may not be properly formatted markdown');
                }
                break;
            case 'instruction':
                // Instructions should be markdown
                if (!content.includes('#')) {
                    console.warn('Instruction may not be properly formatted markdown');
                }
                break;
            case 'agent':
                // Agents should have some structure
                if (!content.includes('#')) {
                    return { valid: false, error: 'Agent file should be markdown formatted' };
                }
                break;
        }

        return { valid: true };
    }

    /**
     * Import a resource to project or user-global location
     */
    async importResource(
        content: string,
        fileName: string,
        type: ResourceType,
        target: ImportTarget
    ): Promise<ImportResult> {
        // Validate first
        const validation = this.validateResource(content, type);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        try {
            const targetPath = this.getTargetPath(fileName, type, target);
            
            // Check if file exists
            if (fs.existsSync(targetPath)) {
                const overwrite = await vscode.window.showWarningMessage(
                    `File ${path.basename(targetPath)} already exists. Overwrite?`,
                    'Yes',
                    'No'
                );
                
                if (overwrite !== 'Yes') {
                    return { success: false, error: 'User cancelled: file already exists' };
                }
            }

            // Create directory if needed
            const dir = path.dirname(targetPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write file
            fs.writeFileSync(targetPath, content, 'utf8');

            return { success: true, path: targetPath };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error during import' 
            };
        }
    }

    /**
     * Get the target path based on resource type and import target
     */
    private getTargetPath(fileName: string, type: ResourceType, target: ImportTarget): string {
        if (target === 'project') {
            // Project-local paths under .github/
            switch (type) {
                case 'skill':
                    // Extract skill name from filename or frontmatter
                    const skillName = fileName.replace('.md', '').replace('SKILL', '').trim().toLowerCase();
                    return path.join(this.workspacePath, '.github', 'skills', skillName || 'imported-skill', 'SKILL.md');
                case 'prompt':
                    return path.join(this.workspacePath, '.github', 'prompts', fileName);
                case 'instruction':
                    return path.join(this.workspacePath, '.github', 'instructions', fileName);
                case 'agent':
                    return path.join(this.workspacePath, 'AGENTS.md');
            }
        } else {
            // User-global paths
            const homeDir = process.env.HOME || process.env.USERPROFILE || '';
            const cpNinjaDir = path.join(homeDir, '.cp-ninja');

            switch (type) {
                case 'skill':
                    const skillName = fileName.replace('.md', '').replace('SKILL', '').trim().toLowerCase();
                    return path.join(cpNinjaDir, 'skills', skillName || 'imported-skill', 'SKILL.md');
                case 'prompt':
                    return path.join(cpNinjaDir, 'prompts', fileName);
                case 'instruction':
                    return path.join(cpNinjaDir, 'instructions', fileName);
                case 'agent':
                    return path.join(cpNinjaDir, 'AGENTS.md');
            }
        }
    }
}
