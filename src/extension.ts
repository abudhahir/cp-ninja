import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import { findSkillsInDir, resolveSkillPath, stripFrontmatter } from './lib/skills-core';
import { EnhancedSkillTreeDataProvider } from './EnhancedSkillTreeDataProvider';
import { SkillQuickPick } from './lib/SkillQuickPick';
import { ResourceManager } from './ResourceManager';
import { BootstrapManager } from './BootstrapManager';
import { ContextDetector } from './ContextDetector';
import { ProfileChatHandler } from './ProfileChatHandler';
import { OnboardingManager } from './OnboardingManager';
import { EnhancedSuggestionEngine } from './EnhancedSuggestionEngine';
import { ConfigurationManager } from './ConfigurationManager';
// import { AutoProfileManager } from './AutoProfileManager';

let extensionBasePath: string; // Declare globally
let profileChatHandler: ProfileChatHandler; // Profile chat handler instance
let onboardingManager: OnboardingManager;
let enhancedSuggestionEngine: EnhancedSuggestionEngine;
let configurationManager: ConfigurationManager;
// let autoProfileManager: AutoProfileManager;

// Utility function to copy agents directory to .github/prompts
async function copyAgentsToGitHubPrompts(extensionPath: string): Promise<void> {
    const sourceDir = path.join(extensionPath, 'templates', 'agents');
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    
    if (!workspaceFolder) {
        console.log('No workspace folder found, skipping agents directory copy');
        return;
    }
    
    const targetDir = path.join(workspaceFolder, '.github', 'prompts');
    
    try {
        // Check if source directory exists
        if (!fs.existsSync(sourceDir)) {
            console.log(`Source agents directory not found: ${sourceDir}`);
            return;
        }
        
        // Create target directory if it doesn't exist
        await fsPromises.mkdir(targetDir, { recursive: true });
        
        // Copy all files from source to target
        const files = await fsPromises.readdir(sourceDir);
        
        for (const file of files) {
            const sourceFile = path.join(sourceDir, file);
            const targetFile = path.join(targetDir, file);
            
            const stat = await fsPromises.stat(sourceFile);
            if (stat.isFile()) {
                await fsPromises.copyFile(sourceFile, targetFile);
                console.log(`Copied ${file} to .github/prompts/`);
            }
        }
        
        console.log(`Successfully copied agents directory to ${targetDir}`);
    } catch (error) {
        console.error('Failed to copy agents directory to .github/prompts:', error);
    }
}

// Define the main chat handler for @cp-ninja participant  
const mainChatHandler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> => {
    const skillsDir = path.join(extensionBasePath, 'skills');
    const personalSkillsDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cp-ninja', 'skills');

    // Bootstrap: On the first turn, inject the using-cp-ninja skill
    if (context.history.length === 0) {
        const bootstrapSkillPath = resolveSkillPath('using-cp-ninja', skillsDir, personalSkillsDir);
        if (bootstrapSkillPath) {
            const bootstrapContent = fs.readFileSync(bootstrapSkillPath.skillFile, 'utf8');
            stream.markdown(stripFrontmatter(bootstrapContent));
            return {};
        }
    }

    // Handle slash commands
    if (request.command) {
        console.log(`Received command: ${request.command}`);
        
        // Handle profile commands first (via ProfileChatHandler)
        if (['switch-profile', 'list-profiles', 'technical-analysis'].includes(request.command)) {
            console.log(`Processing profile command: ${request.command}`);
            
            if (profileChatHandler) {
                try {
                    await profileChatHandler.handleProfileCommand(request, stream);
                    return {};
                } catch (error) {
                    console.error('Profile chat handler error:', error);
                    stream.markdown(`⚠️ Error processing profile command: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    return {};
                }
            } else {
                console.error('ProfileChatHandler not initialized');
                // Provide fallback for technical-analysis
                if (request.command === 'technical-analysis') {
                    stream.markdown(`🔍 **Technical Analysis Workflow**\n\n` +
                        `**Requirement:** ${request.prompt || 'No specific requirement provided'}\n\n` +
                        `**Analysis Process:**\n` +
                        `1. **Business Analysis** - Understanding business requirements and constraints\n` +
                        `2. **Architecture Design** - System design and component architecture\n` +
                        `3. **Technical Review** - Code quality, security, and performance analysis\n\n` +
                        `**Security Implications to Consider:**\n` +
                        `- Authentication and authorization mechanisms\n` +
                        `- Data encryption in transit and at rest\n` +
                        `- Input validation and sanitization\n` +
                        `- Access control and privilege management\n` +
                        `- Vulnerability assessment and threat modeling\n` +
                        `- Compliance requirements (GDPR, HIPAA, etc.)\n\n` +
                        `*Note: ProfileChatHandler not fully initialized. Using fallback mode.*`);
                    return {};
                } else if (request.command === 'list-profiles') {
                    stream.markdown(`📋 **Available Profiles:**\n\n` +
                        `- **Technical Analysis** - Comprehensive security and architecture review\n` +
                        `- **Software Architect** - System design and architectural decisions\n` +
                        `- **Security Analyst** - Security-focused analysis and recommendations\n\n` +
                        `*Note: ProfileChatHandler not fully initialized. Basic profile list provided.*`);
                    return {};
                } else {
                    stream.markdown(`⚠️ ProfileChatHandler not initialized. Cannot process profile commands.`);
                    return {};
                }
            }
        }

        // Handle regular skill commands
        const skillName = request.command;
        const skill = resolveSkillPath(skillName, skillsDir, personalSkillsDir);
        if (skill) {
            const skillContent = fs.readFileSync(skill.skillFile, 'utf8');
            stream.markdown(`**Using skill: ${skillName}**\n\n` + stripFrontmatter(skillContent));
            return {};
        } else {
            stream.markdown(`Sorry, I could not find the skill "${skillName}".`);
            return {};
        }
    }

    // Handle profile queries via the ProfileChatHandler (fallback for non-command requests)
    if (profileChatHandler) {
        try {
            // This is for any remaining profile-related queries that aren't commands
            if (request.prompt && (request.prompt.includes('profile') || request.prompt.includes('technical-analysis'))) {
                // Handle as a general query, not a specific command
                return {};
            }
        } catch (error) {
            console.error('Profile chat handler error:', error);
            // Continue to default handling if profile handler fails
        }
    }

    // Show available skills and usage instructions (default behavior)
    const cpNinjaSkills = findSkillsInDir(skillsDir, 'cp-ninja');
    const personalSkills = findSkillsInDir(personalSkillsDir, 'personal');
    const allSkills = [...cpNinjaSkills, ...personalSkills];

    if (allSkills.length === 0) {
        stream.markdown('No skills found.');
    } else {
        stream.markdown('**Available CP-Ninja Skills:**\n\n' +
            'Use `@cp-ninja /skill-name` to activate a specific skill:\n\n' +
            allSkills.map(s => `- **@cp-ninja /${s.name}** - ${s.description}`).join('\n') +
            '\n\nOr use the Skills Details view to browse and activate skills visually.'
        );
    }
    return {};
};

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "cp-ninja" is now active!');

    extensionBasePath = context.extensionPath; // Store the extension path
    
    // Copy agents directory to .github/prompts on startup
    copyAgentsToGitHubPrompts(context.extensionPath).catch(error => {
        console.error('Error during agents directory copy:', error);
    });

    const skillsDir = path.join(context.extensionPath, 'skills');
    const personalSkillsDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cp-ninja', 'skills');
    
    // Initialize the resources system
    try {
        const resourceManager = new ResourceManager(context.extensionPath);
        const contextDetector = new ContextDetector(context.extensionPath);
        const bootstrapManager = new BootstrapManager(context.extensionPath);
        
        // Initialize ProfileChatHandler
        const agentsDir = path.join(context.extensionPath, 'templates', 'agents');
        console.log(`Initializing ProfileChatHandler with agents directory: ${agentsDir}`);
        
        // Check if agents directory exists
        if (fs.existsSync(agentsDir)) {
            profileChatHandler = new ProfileChatHandler(context.extensionPath, path.join(process.env.HOME || process.env.USERPROFILE || '', '.cp-ninja'), context.extensionPath, agentsDir);
            console.log('ProfileChatHandler initialized successfully');
        } else {
            console.warn(`Agents directory not found: ${agentsDir}`);
        }
        
        // Initialize new managers
        onboardingManager = new OnboardingManager(context);
        configurationManager = new ConfigurationManager(context);
        enhancedSuggestionEngine = new EnhancedSuggestionEngine(skillsDir, personalSkillsDir, context);
        
        // Initialize auto-profile system (Phase 1 & 2) - commented out to fix lint
        // autoProfileManager = new AutoProfileManager(context, profileChatHandler);
        
        console.log('Resources system initialized successfully');
    } catch (error) {
        console.error('Failed to initialize resources system:', error);
        // Continue without resources system if initialization fails
    }
    
    // Register the main chat participant
    const mainParticipant = vscode.chat.createChatParticipant('cp-ninja', mainChatHandler);
    mainParticipant.iconPath = new vscode.ThemeIcon('beaker');
    context.subscriptions.push(mainParticipant);

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
            [{ label: 'Show Skills', description: 'List all available skills' }, { label: 'Use Skill...', description: 'Select a specific skill to use' }],
            { placeHolder: 'Select a Copilot Ninja command' }
        );

        if (pick) {
            if (pick.label === 'Show Skills') {
                // Open chat view and show main participant
                await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                vscode.window.showInformationMessage('In the chat view, type: @cp-ninja');
            } else if (pick.label === 'Use Skill...') {
                const cpNinjaSkills = findSkillsInDir(skillsDir, 'cp-ninja');
                const personalSkills = findSkillsInDir(personalSkillsDir, 'personal');
                const allSkills = [...cpNinjaSkills, ...personalSkills];
                const skillPick = await vscode.window.showQuickPick(
                    allSkills.map(skill => ({ label: skill.name, description: skill.description })),
                    { placeHolder: 'Select a skill to use' }
                );
                if (skillPick) {
                    // Open chat view and show participant
                    await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                    vscode.window.showInformationMessage(`In the chat view, type: @cp-ninja /${skillPick.label}`);
                }
            }
        }
    }));

    // Enhanced Skills Explorer View with search and filtering
    const enhancedSkillsTreeDataProvider = new EnhancedSkillTreeDataProvider(skillsDir, personalSkillsDir, extensionBasePath, configurationManager);
    vscode.window.createTreeView('cp-ninja.skillsView', { 
        treeDataProvider: enhancedSkillsTreeDataProvider,
        showCollapseAll: true
    });

    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.useSkillFromView', async (skillName: string) => {
        // Track skill usage
        if (enhancedSuggestionEngine) {
            enhancedSuggestionEngine.trackSkillUsage(skillName);
        }
        
        // Open chat view and show participant
        await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
        vscode.window.showInformationMessage(`In the chat view, type: @cp-ninja /${skillName}`);
    }));

    // Register command for opening skills directly in editor from tree view
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.openSkillInEditor', async (skillItem: any) => {
        if (enhancedSkillsTreeDataProvider && skillItem) {
            await enhancedSkillsTreeDataProvider.openSkillInEditor(skillItem);
        }
    }));

    // Add search skills command
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.searchSkills', async () => {
        const searchTerm = await vscode.window.showInputBox({
            prompt: 'Search skills by name or description',
            placeHolder: 'Enter search term...'
        });
        
        if (searchTerm !== undefined) {
            enhancedSkillsTreeDataProvider.setSearchFilter(searchTerm);
        }
    }));

    // Add toggle favorites command
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.toggleFavorites', () => {
        enhancedSkillsTreeDataProvider.toggleFavoritesView();
    }));

    // Add skill to favorites command
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.addToFavorites', async (skillItem: any) => {
        const skillName = skillItem.label.replace('⭐ ', ''); // Remove star if present
        await configurationManager.addToFavorites(skillName);
        enhancedSkillsTreeDataProvider.refresh();
        vscode.window.showInformationMessage(`Added "${skillName}" to favorites`);
    }));

    // Remove skill from favorites command
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.removeFromFavorites', async (skillItem: any) => {
        const skillName = skillItem.label.replace('⭐ ', ''); // Remove star if present
        await configurationManager.removeFromFavorites(skillName);
        enhancedSkillsTreeDataProvider.refresh();
        vscode.window.showInformationMessage(`Removed "${skillName}" from favorites`);
    }));

    // Proactive Skill Suggestions - using enhanced suggestion engine
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

        if (enhancedSuggestionEngine && configurationManager) {
            const contextSkills = enhancedSuggestionEngine.getContextAwareSkills(editor.document);
            if (contextSkills.length > 0) {
                const topSkill = contextSkills[0];
                if (topSkill.name !== lastSuggestedSkill && configurationManager.isSkillEnabled(topSkill.name)) {
                    await onboardingManager.showSkillSuggestion(topSkill.name, `Contextually relevant for ${path.extname(editor.document.fileName)} files`);
                    lastSuggestedSkill = topSkill.name;
                }
            }
        }
    }));

    // Register Skills Details View command
    // REMOVED: webview-based showDetails command

    // Register onboarding commands
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.showWelcome', () => {
        onboardingManager?.showWelcomeScreen();
    }));
    
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.resetOnboarding', () => {
        onboardingManager?.resetOnboarding();
    }));

    // Check for first-run onboarding

    // Register SkillQuickPick command
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.showSkillsQuickPick', async () => {
        const skillQuickPick = new SkillQuickPick(skillsDir, personalSkillsDir);
        await skillQuickPick.showSkillPicker();
    }));
}

export function deactivate() {}
