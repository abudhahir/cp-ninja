import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { findSkillsInDir, resolveSkillPath, stripFrontmatter } from './lib/skills-core';
import { SkillTreeDataProvider } from './SkillsTreeDataProvider'; // Import the new data provider
import { SuggestionEngine } from './SuggestionEngine'; // Import the SuggestionEngine
import { SkillComposerPanel } from './webview/SkillComposerPanel';
import { ResourceManager } from './ResourceManager';
import { BootstrapManager } from './BootstrapManager';
import { ContextDetector } from './ContextDetector';
import { ProfileChatHandler } from './ProfileChatHandler';

let extensionBasePath: string; // Declare globally
let profileChatHandler: ProfileChatHandler; // Profile chat handler instance

// Define the chat handler for our @cp-ninja participant
const chatHandler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> => {
    const skillsDir = path.join(extensionBasePath, 'skills'); // Use the stored path
    const personalSkillsDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cp-ninja', 'skills');

    // Bootstrap: On the first turn, inject the using-cp-ninja skill
    if (context.history.length === 0) {
        const bootstrapSkillPath = resolveSkillPath('using-cp-ninja', skillsDir, personalSkillsDir);
        if (bootstrapSkillPath) {
            const bootstrapContent = fs.readFileSync(bootstrapSkillPath.skillFile, 'utf8');
            stream.markdown(stripFrontmatter(bootstrapContent));
        } else {
            stream.markdown('Welcome to Copilot Ninja! The `using-cp-ninja` bootstrap skill could not be found.');
        }
        return {};
    }

    // Handle profile-related commands first
    if (request.command === 'switch-profile' || request.command === 'list-profiles' || request.command === 'technical-analysis') {
        try {
            await profileChatHandler.handleProfileCommand(request, stream);
            return {};
        } catch (error) {
            stream.markdown(`❌ Profile command error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {};
        }
    }

    // Command handling - parse commands from the prompt text
    const message = request.prompt.trim();
    
    if (message.startsWith('/use_skill')) {
        const skillName = message.replace('/use_skill', '').trim();
        const skill = resolveSkillPath(skillName, skillsDir, personalSkillsDir);
        if (skill) {
            const skillContent = fs.readFileSync(skill.skillFile, 'utf8');
            stream.markdown(`**Using skill: ${skillName}**\n\n` + stripFrontmatter(skillContent));
        } else {
            stream.markdown(`Sorry, I could not find the skill "${skillName}".`);
        }
        return {};
    }

    if (message.startsWith('/find_skills')) {
        const cpNinjaSkills = findSkillsInDir(skillsDir, 'cp-ninja');
        const personalSkills = findSkillsInDir(personalSkillsDir, 'personal');
        const allSkills = [...cpNinjaSkills, ...personalSkills];

        if (allSkills.length === 0) {
            stream.markdown('No skills found.');
        } else {
            const skillList = allSkills.map(s => `- **${s.name}** (${s.sourceType}): ${s.description}`).join('\n');
            stream.markdown(`**Available Skills:**\n${skillList}`);
        }
        return {};
    }
    
    // Enhanced help message including profile commands
    stream.markdown("I am the @cp-ninja participant. Available commands:\n\n" +
        "**Skill Commands:**\n" +
        "- `/use_skill <skill-name>` - Activate a specific skill\n" +
        "- `/find_skills` - List all available skills\n\n" +
        "**Profile Commands:**\n" +
        "- `@cp-ninja switch-profile <profile-name>` - Switch to a development profile\n" +
        "- `@cp-ninja list-profiles` - List available profiles\n" +
        "- `@cp-ninja technical-analysis <requirement>` - Start technical analysis workflow");

    return {};
};

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "cp-ninja" is now active!');

    extensionBasePath = context.extensionPath; // Store the extension path

    // Initialize ProfileChatHandler
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const workspacePath = workspaceFolder.uri.fsPath;
        const globalDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cp-ninja');
        const projectDir = path.join(workspacePath, '.cp-ninja');
        const agentsDir = path.join(globalDir, 'agents');
        
        profileChatHandler = new ProfileChatHandler(workspacePath, globalDir, projectDir, agentsDir);
    }

    // Initialize CP-Ninja Bootstrap System
    if (workspaceFolder) {
        initializeCpNinjaBootstrap(workspaceFolder.uri.fsPath, context);
    }

    // Register the chat participant
    const participant = vscode.chat.createChatParticipant('cp-ninja', chatHandler);
    
    // We can set properties on the participant, like an icon
    participant.iconPath = new vscode.ThemeIcon('beaker');

    // Add the participant to the context's subscriptions
    context.subscriptions.push(participant);

    // Create a status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = `$(beaker) @cp-ninja`;
    statusBarItem.tooltip = 'Copilot Ninja Skills - Click to access commands';
    statusBarItem.command = 'cp-ninja.showCommands';
    context.subscriptions.push(statusBarItem);
    statusBarItem.show();

    // Register command for the status bar item
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.showCommands', async () => {
        const pick = await vscode.window.showQuickPick(
            [
                { label: 'Find Skills', description: 'List all available skills' }, 
                { label: 'Use Skill...', description: 'Invoke a specific skill' },
                { label: 'Switch Profile...', description: 'Switch to a development profile' },
                { label: 'List Profiles', description: 'Show available development profiles' },
                { label: 'Technical Analysis...', description: 'Start technical analysis workflow' },
                { label: 'Bootstrap Project', description: 'Setup project with recommended presets' },
                { label: 'Detect Context', description: 'Analyze current project context' }
            ],
            { placeHolder: 'Select a Copilot Ninja command' }
        );

        if (pick) {
            if (pick.label === 'Find Skills') {
                // Open chat view and show instructions
                await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                vscode.window.showInformationMessage('In the chat view, type: @cp-ninja /find_skills');
            } else if (pick.label === 'Use Skill...') {
                const skillName = await vscode.window.showInputBox({
                    prompt: 'Enter the name of the skill to use',
                    placeHolder: 'e.g., brainstorming'
                });
                if (skillName) {
                    // Open chat view and show instructions
                    await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                    vscode.window.showInformationMessage(`In the chat view, type: @cp-ninja /use_skill ${skillName}`);
                }
            } else if (pick.label === 'Switch Profile...') {
                const profileName = await vscode.window.showInputBox({
                    prompt: 'Enter the name of the profile to switch to',
                    placeHolder: 'e.g., frontend-development, backend-api, technical-analysis'
                });
                if (profileName) {
                    await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                    vscode.window.showInformationMessage(`In the chat view, type: @cp-ninja switch-profile ${profileName}`);
                }
            } else if (pick.label === 'List Profiles') {
                await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                vscode.window.showInformationMessage('In the chat view, type: @cp-ninja list-profiles');
            } else if (pick.label === 'Technical Analysis...') {
                const requirement = await vscode.window.showInputBox({
                    prompt: 'Enter the requirement to analyze',
                    placeHolder: 'e.g., Build a user authentication system'
                });
                if (requirement) {
                    await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                    vscode.window.showInformationMessage(`In the chat view, type: @cp-ninja technical-analysis ${requirement}`);
                }
            } else if (pick.label === 'Bootstrap Project') {
                await vscode.commands.executeCommand('cp-ninja.bootstrap');
            } else if (pick.label === 'Detect Context') {
                await vscode.commands.executeCommand('cp-ninja.detectContext');
            }
        }
    }));

    // Skills Explorer View
    const skillsDir = path.join(context.extensionPath, 'skills');
    const personalSkillsDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cp-ninja', 'skills');
    const skillsTreeDataProvider = new SkillTreeDataProvider(skillsDir, personalSkillsDir, extensionBasePath);
    vscode.window.createTreeView('cp-ninja.skillsView', { treeDataProvider: skillsTreeDataProvider });

    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.useSkillFromView', async (skillName: string) => {
        // Open chat view and show instructions
        await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
        vscode.window.showInformationMessage(`In the chat view, type: @cp-ninja /use_skill ${skillName}`);
    }));

    // Proactive Skill Suggestions
    const suggestionEngine = new SuggestionEngine(skillsDir, personalSkillsDir, extensionBasePath);
    let lastSuggestedSkill: string | null = null;

    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async editor => {
        if (!editor || !editor.document) {
            return;
        }

        const config = vscode.workspace.getConfiguration('cpNinja');
        const enableSuggestions = config.get<boolean>('enableSuggestions', true);

        if (!enableSuggestions) {
            return;
        }

        const suggestion = await suggestionEngine.getSuggestion(editor.document);
        if (suggestion && suggestion.skillName !== lastSuggestedSkill) {
            vscode.window.showInformationMessage(
                suggestion.description,
                'Use Skill',
                'Dismiss'
            ).then(selection => {
                if (selection === 'Use Skill') {
                    // Open chat view and show instructions
                    vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                    vscode.window.showInformationMessage(`In the chat view, type: @cp-ninja /use_skill ${suggestion.skillName}`);
                }
                lastSuggestedSkill = suggestion.skillName; // Set last suggested skill to avoid immediate re-suggestion
            });
        }
    }));

    // Register Skill Composer command
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.openSkillComposer', () => {
        SkillComposerPanel.createOrShow(context);
    }));

    // Register command for status bar target path display
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.showTargetPath', async () => {
        // This command is called by the status bar item
        if (SkillComposerPanel.currentPanel) {
            await SkillComposerPanel.currentPanel.showTargetPathCommand();
        }
    }));
}

async function initializeCpNinjaBootstrap(workspacePath: string, context: vscode.ExtensionContext): Promise<void> {
    try {
        const bootstrapManager = new BootstrapManager(workspacePath);
        const contextDetector = new ContextDetector(workspacePath);

        // Initialize the bootstrap system
        await bootstrapManager.initialize();
        console.log('CP-Ninja: Bootstrap system initialized successfully');

        // Detect project context and suggest presets
        const projectContext = await contextDetector.analyzeProject();
        const suggestions = await bootstrapManager.suggestPresets(projectContext);

        // If we have high-confidence suggestions, offer them to the user
        if (suggestions.length > 0 && suggestions[0].confidence > 0.8) {
            const topSuggestion = suggestions[0];
            
            const action = await vscode.window.showInformationMessage(
                `CP-Ninja: Detected ${topSuggestion.reason.toLowerCase()}. Would you like to bootstrap with the "${topSuggestion.preset}" profile?`,
                'Yes, Bootstrap',
                'Not Now',
                'Show All Suggestions'
            );

            if (action === 'Yes, Bootstrap') {
                const result = await bootstrapManager.bootstrapProject(projectContext);
                if (result.success) {
                    vscode.window.showInformationMessage(
                        `CP-Ninja: Successfully bootstrapped with ${result.appliedPresets.join(', ')} profile(s)!`
                    );
                } else {
                    vscode.window.showWarningMessage(
                        `CP-Ninja: Bootstrap completed with some issues: ${result.errors?.join(', ') || 'Unknown errors'}`
                    );
                }
            } else if (action === 'Show All Suggestions') {
                const selected = await vscode.window.showQuickPick(
                    suggestions.map(s => ({
                        label: s.preset,
                        description: `${(s.confidence * 100).toFixed(0)}% confidence`,
                        detail: s.reason,
                        suggestion: s
                    })),
                    {
                        placeHolder: 'Select a preset to bootstrap with',
                        ignoreFocusOut: true
                    }
                );

                if (selected) {
                    const result = await bootstrapManager.bootstrapProject(projectContext);
                    if (result.success) {
                        vscode.window.showInformationMessage(
                            `CP-Ninja: Successfully bootstrapped with ${selected.label} profile!`
                        );
                    }
                }
            }
        }

        // Register bootstrap-related commands
        context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.bootstrap', async () => {
            const currentContext = await contextDetector.analyzeProject();
            const currentSuggestions = await bootstrapManager.suggestPresets(currentContext);
            
            if (currentSuggestions.length === 0) {
                vscode.window.showInformationMessage('CP-Ninja: No suitable presets found for current project context.');
                return;
            }

            const selected = await vscode.window.showQuickPick(
                currentSuggestions.map(s => ({
                    label: s.preset,
                    description: `${(s.confidence * 100).toFixed(0)}% confidence`,
                    detail: s.reason,
                    suggestion: s
                })),
                {
                    placeHolder: 'Select a preset to bootstrap with',
                    ignoreFocusOut: true
                }
            );

            if (selected) {
                const result = await bootstrapManager.bootstrapProject(currentContext);
                if (result.success) {
                    vscode.window.showInformationMessage(
                        `CP-Ninja: Successfully bootstrapped with ${selected.label} profile!`
                    );
                } else {
                    vscode.window.showWarningMessage(
                        `CP-Ninja: Bootstrap failed: ${result.errors?.join(', ') || 'Unknown error'}`
                    );
                }
            }
        }));

        context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.detectContext', async () => {
            const currentContext = await contextDetector.analyzeProject();
            const contextInfo = [
                `Languages: ${currentContext.language.join(', ') || 'None detected'}`,
                `Frameworks: ${currentContext.frameworks.join(', ') || 'None detected'}`,
                `Project Type: ${currentContext.projectType || 'Unknown'}`,
                `Recent Activity: ${currentContext.recentActivity.join(', ') || 'None detected'}`,
                `Team Indicators: ${currentContext.teamIndicators.length} found`
            ].join('\n');

            vscode.window.showInformationMessage(`CP-Ninja Project Context:\n${contextInfo}`, { modal: true });
        }));

    } catch (error) {
        console.error('CP-Ninja: Failed to initialize bootstrap system:', error);
        vscode.window.showWarningMessage(
            'CP-Ninja: Failed to initialize advanced features. Basic functionality will still work.'
        );
        
        // Fallback to basic ResourceManager initialization
        const resourceManager = new ResourceManager(workspacePath);
        resourceManager.initializeDirectories().catch(fallbackError => {
            console.error('CP-Ninja: Fallback initialization also failed:', fallbackError);
        });
    }
}

export function deactivate() {}
