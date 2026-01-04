import * as vscode from 'vscode';
import { ProjectProfile, ProjectProfileDetector } from './ProjectProfileDetector';
import { ProfileChatHandler } from './ProfileChatHandler';

export class AutoProfileManager {
    private activeProfile: ProjectProfile | null = null;
    private profileChatHandler: ProfileChatHandler | undefined;
    private statusBarItem: vscode.StatusBarItem;

    constructor(
        private context: vscode.ExtensionContext,
        profileChatHandler?: ProfileChatHandler
    ) {
        this.profileChatHandler = profileChatHandler;
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left, 
            50
        );
        this.context.subscriptions.push(this.statusBarItem);
        
        this.initialize();
    }

    private async initialize(): Promise<void> {
        // Auto-detect profile on startup
        await this.autoDetectProfile();
        
        // Watch for changes that might affect profile detection
        const watcher = vscode.workspace.createFileSystemWatcher('**/package.json');
        watcher.onDidChange(() => this.autoDetectProfile());
        watcher.onDidCreate(() => this.autoDetectProfile());
        this.context.subscriptions.push(watcher);

        // Register commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand('cp-ninja.autoDetectProfile', () => this.autoDetectProfile()),
            vscode.commands.registerCommand('cp-ninja.showActiveProfile', () => this.showActiveProfile()),
            vscode.commands.registerCommand('cp-ninja.configureProfile', () => this.configureProfile())
        );
    }

    async autoDetectProfile(): Promise<void> {
        const workspaces = vscode.workspace.workspaceFolders;
        if (!workspaces || workspaces.length === 0) {
            this.updateStatusBar(null);
            return;
        }

        try {
            // For now, analyze the first workspace folder
            const detector = new ProjectProfileDetector(workspaces[0]);
            const profile = await detector.detectProfile();
            
            if (profile) {
                console.log(`Auto-detected profile: ${profile.name} (${(profile.confidence * 100).toFixed(1)}% confidence)`);
                await this.activateProfile(profile);
            } else {
                console.log('No matching profile detected');
                this.updateStatusBar(null);
            }
        } catch (error) {
            console.error('Error in auto profile detection:', error);
            this.updateStatusBar(null);
        }
    }

    private async activateProfile(profile: ProjectProfile): Promise<void> {
        this.activeProfile = profile;
        this.updateStatusBar(profile);
        
        // Store in workspace settings
        await this.persistProfile(profile);
        
        // Show notification with option to customize
        const selection = await vscode.window.showInformationMessage(
            `Auto-detected ${profile.name} project. Default agents and workflows are now available.`,
            'Show Details', 
            'Customize',
            'Dismiss'
        );

        if (selection === 'Show Details') {
            await this.showActiveProfile();
        } else if (selection === 'Customize') {
            await this.configureProfile();
        }
    }

    private updateStatusBar(profile: ProjectProfile | null): void {
        if (profile) {
            this.statusBarItem.text = `$(beaker) ${profile.name}`;
            this.statusBarItem.tooltip = `Active Profile: ${profile.name}\nConfidence: ${(profile.confidence * 100).toFixed(1)}%\nClick for details`;
            this.statusBarItem.command = 'cp-ninja.showActiveProfile';
            this.statusBarItem.show();
        } else {
            this.statusBarItem.text = `$(beaker) No Profile`;
            this.statusBarItem.tooltip = 'No project profile detected\nClick to configure';
            this.statusBarItem.command = 'cp-ninja.configureProfile';
            this.statusBarItem.show();
        }
    }

    private async persistProfile(profile: ProjectProfile): Promise<void> {
        const config = vscode.workspace.getConfiguration('cpNinja');
        await config.update('activeProfile', {
            name: profile.name,
            type: profile.type,
            autoDetected: true,
            detectionTime: new Date().toISOString()
        }, vscode.ConfigurationTarget.Workspace);
    }

    private async showActiveProfile(): Promise<void> {
        if (!this.activeProfile) {
            vscode.window.showInformationMessage('No active profile detected.');
            return;
        }

        const profile = this.activeProfile;
        const markdown = new vscode.MarkdownString();
        
        markdown.appendMarkdown(`# Active Profile: ${profile.name}\n\n`);
        markdown.appendMarkdown(`**Type:** ${profile.type}  \n`);
        markdown.appendMarkdown(`**Confidence:** ${(profile.confidence * 100).toFixed(1)}%  \n\n`);
        
        markdown.appendMarkdown(`## Default Agents\n`);
        profile.defaultAgents.forEach(agent => {
            markdown.appendMarkdown(`- ${agent}  \n`);
        });
        
        markdown.appendMarkdown(`\n## Available Workflows\n`);
        profile.workflows.forEach(workflow => {
            markdown.appendMarkdown(`- ${workflow}  \n`);
        });
        
        markdown.appendMarkdown(`\n## Included Skills\n`);
        profile.skills.forEach(skill => {
            markdown.appendMarkdown(`- \`@cp-ninja /${skill}\`  \n`);
        });

        // Create a webview to show the profile details
        const panel = vscode.window.createWebviewPanel(
            'cpNinjaProfile',
            `CP-Ninja Profile: ${profile.name}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = this.getProfileWebviewContent(profile);
    }

    private getProfileWebviewContent(profile: ProjectProfile): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${profile.name} Profile</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                }
                .confidence { 
                    color: var(--vscode-charts-green);
                    font-weight: bold;
                }
                .section {
                    margin: 20px 0;
                }
                .agents, .workflows, .skills {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .tag {
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.9em;
                }
                .skill-tag {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
            </style>
        </head>
        <body>
            <h1>🎯 ${profile.name}</h1>
            <p><strong>Type:</strong> ${profile.type}</p>
            <p><strong>Detection Confidence:</strong> <span class="confidence">${(profile.confidence * 100).toFixed(1)}%</span></p>
            
            <div class="section">
                <h2>🤖 Default Agents</h2>
                <div class="agents">
                    ${profile.defaultAgents.map(agent => `<span class="tag">${agent}</span>`).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>🔄 Available Workflows</h2>
                <div class="workflows">
                    ${profile.workflows.map(workflow => `<span class="tag">${workflow}</span>`).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>⚡ Included Skills</h2>
                <div class="skills">
                    ${profile.skills.map(skill => `<span class="tag skill-tag">@cp-ninja /${skill}</span>`).join('')}
                </div>
            </div>
            
            <div class="section">
                <h3>💡 How to Use</h3>
                <p>Your project profile is automatically active. Use these commands:</p>
                <ul>
                    <li><code>@cp-ninja /technical-analysis</code> - Start comprehensive analysis</li>
                    <li><code>@cp-ninja /list-profiles</code> - See all available profiles</li>
                    <li><code>@cp-ninja /switch-profile</code> - Change to different profile</li>
                </ul>
            </div>
        </body>
        </html>`;
    }

    private async configureProfile(): Promise<void> {
        const options = [
            { label: '🔍 Auto-Detect Profile', description: 'Scan project and detect optimal profile' },
            { label: '📋 List All Profiles', description: 'See available pre-configured profiles' },
            { label: '⚙️ Custom Profile', description: 'Create custom profile for this project' },
            { label: '🚫 Disable Auto-Detection', description: 'Turn off automatic profile detection' }
        ];

        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Choose profile configuration option'
        });

        if (!selection) return;

        switch (selection.label) {
            case '🔍 Auto-Detect Profile':
                await this.autoDetectProfile();
                break;
            case '📋 List All Profiles':
                // Use existing profile command
                if (this.profileChatHandler) {
                    try {
                        const request = { command: 'list-profiles', prompt: '' } as any;
                        const stream = { markdown: (text: string) => vscode.window.showInformationMessage(text) } as any;
                        await this.profileChatHandler.handleProfileCommand(request, stream);
                    } catch (error) {
                        console.error('Failed to list profiles:', error);
                    }
                }
                break;
            case '⚙️ Custom Profile':
                vscode.window.showInformationMessage('Custom profile creation coming in Phase 3!');
                break;
            case '🚫 Disable Auto-Detection':
                const config = vscode.workspace.getConfiguration('cpNinja');
                await config.update('enableAutoProfileDetection', false, vscode.ConfigurationTarget.Workspace);
                vscode.window.showInformationMessage('Auto-detection disabled for this workspace.');
                break;
        }
    }

    getActiveProfile(): ProjectProfile | null {
        return this.activeProfile;
    }

    async suggestAgentsForContext(context: string): Promise<string[]> {
        if (!this.activeProfile) {
            return [];
        }

        // Basic context-based suggestions
        const suggestions: string[] = [];
        
        if (context.includes('security') || context.includes('vulnerability')) {
            suggestions.push('security-analyst');
        }
        
        if (context.includes('performance') || context.includes('optimization')) {
            suggestions.push('performance-analyzer');
        }
        
        if (context.includes('architecture') || context.includes('design')) {
            suggestions.push('software-architect');
        }
        
        // Always include default agents for the profile
        return [...new Set([...suggestions, ...this.activeProfile.defaultAgents])];
    }
}