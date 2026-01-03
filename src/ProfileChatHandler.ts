import * as vscode from 'vscode';
import { ProfileManager } from './ProfileManager';
import { AgentManager } from './AgentManager';

export class ProfileChatHandler {
    private profileManager: ProfileManager;
    private agentManager: AgentManager;

    constructor(
        workspacePath: string,
        globalDir: string,
        projectDir: string,
        agentsDir: string
    ) {
        this.profileManager = new ProfileManager(globalDir, projectDir);
        this.agentManager = new AgentManager(agentsDir);
    }

    async handleProfileCommand(
        request: vscode.ChatRequest, 
        stream: vscode.ChatResponseStream
    ): Promise<void> {
        if (request.command === 'switch-profile') {
            await this.handleSwitchProfile(request.prompt, stream);
        } else if (request.command === 'list-profiles') {
            await this.handleListProfiles(stream);
        } else if (request.command === 'technical-analysis') {
            await this.handleTechnicalAnalysis(request.prompt, stream);
        }
    }

    private async handleSwitchProfile(profileName: string, stream: vscode.ChatResponseStream): Promise<void> {
        try {
            await this.profileManager.setActiveProfile(profileName);
            const profile = await this.profileManager.resolveActiveProfile(profileName);
            
            if (profile) {
                stream.markdown(`✅ **Switched to ${profileName} profile**\n\n` +
                    `**Active Skills:** ${profile.skills.join(', ')}\n\n` +
                    `**Available Agents:** ${profile.agentTemplates.join(', ')}\n\n` +
                    `Use \`@cp-ninja:skill-name\` to activate skills from this profile.`);
            } else {
                stream.markdown(`❌ Profile "${profileName}" not found.`);
            }
        } catch (error) {
            stream.markdown(`❌ Error switching profile: ${error}`);
        }
    }

    private async handleListProfiles(stream: vscode.ChatResponseStream): Promise<void> {
        try {
            const activeProfile = await this.profileManager.getActiveProfileName();
            stream.markdown(`**Available Profiles:**\n\n` +
                `${activeProfile ? `*Current: ${activeProfile}*\n\n` : ''}` +
                `- \`frontend-development\` - React/Vue development preset\n` +
                `- \`backend-api\` - API development preset\n` +
                `- \`technical-analysis\` - Requirements analysis workflow\n` +
                `- \`tdd-workflow\` - Test-driven development preset\n\n` +
                `Use \`@cp-ninja switch-profile <name>\` to switch profiles.`);
        } catch (error) {
            stream.markdown(`❌ Error listing profiles: ${error}`);
        }
    }

    private async handleTechnicalAnalysis(requirement: string, stream: vscode.ChatResponseStream): Promise<void> {
        try {
            stream.markdown(`🔍 **Starting Technical Analysis Workflow**\n\n` +
                `**Requirement:** ${requirement}\n\n` +
                `**Phase 1: Business Analysis** - Dispatching Business Analyst agent...`);
            
            const baTemplate = await this.agentManager.getAgentTemplate('business-analyst');
            if (baTemplate) {
                stream.markdown(`\n\n**Business Analyst Agent Activated**\n\n${baTemplate}`);
            } else {
                stream.markdown(`\n\n❌ Business Analyst agent template not found.`);
            }
        } catch (error) {
            stream.markdown(`❌ Error in technical analysis: ${error}`);
        }
    }
}