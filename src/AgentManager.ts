import * as path from 'path';
import * as fs from 'fs';

export class AgentManager {
    constructor(private agentsDir: string) {}

    async getAgentTemplate(agentType: string): Promise<string | null> {
        try {
            const templatePath = path.join(this.agentsDir, `${agentType}-prompt.md`);
            
            try {
                await fs.promises.access(templatePath);
                return await this.readTemplate(templatePath);
            } catch {
                // Fallback to built-in templates
                const builtinPath = path.join(__dirname, '..', 'templates', 'agents', `${agentType}-prompt.md`);
                try {
                    await fs.promises.access(builtinPath);
                    return await this.readTemplate(builtinPath);
                } catch {
                    return null; // Neither user nor built-in template exists
                }
            }
        } catch (error) {
            throw new Error(`Failed to get agent template '${agentType}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async readTemplate(templatePath: string): Promise<string> {
        try {
            return await fs.promises.readFile(templatePath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read template from ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async listAvailableAgents(): Promise<string[]> {
        try {
            const agents: string[] = [];
            
            // Check user agents directory
            try {
                await fs.promises.access(this.agentsDir);
                const files = await fs.promises.readdir(this.agentsDir);
                agents.push(...files.filter(f => f.endsWith('-prompt.md')).map(f => f.replace('-prompt.md', '')));
            } catch {
                // User agents directory doesn't exist, that's fine
            }
            
            // Check built-in templates
            const builtinDir = path.join(__dirname, '..', 'templates', 'agents');
            try {
                await fs.promises.access(builtinDir);
                const files = await fs.promises.readdir(builtinDir);
                const builtinAgents = files.filter(f => f.endsWith('-prompt.md')).map(f => f.replace('-prompt.md', ''));
                agents.push(...builtinAgents.filter(a => !agents.includes(a)));
            } catch {
                // Built-in templates directory doesn't exist, that's fine
            }
            
            return agents;
        } catch (error) {
            throw new Error(`Failed to list available agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}