import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import { findSkillsInDir, resolveSkillPath, stripFrontmatter } from './lib/skills-core';
import { EnhancedSkillTreeDataProvider } from './EnhancedSkillTreeDataProvider';
import { SkillsWebviewProvider } from './SkillsWebviewProvider';
import { SkillQuickPick } from './lib/SkillQuickPick';
import { ProfileChatHandler } from './ProfileChatHandler';
import { OnboardingManager } from './OnboardingManager';
import { EnhancedSuggestionEngine } from './EnhancedSuggestionEngine';
import { ConfigurationManager } from './ConfigurationManager';
import { DynamicSkillRegistry } from './DynamicSkillRegistry';
import { AsyncSkillLoader } from './AsyncSkillLoader';
// import { AutoProfileManager } from './AutoProfileManager';

// Utility function to get the configured personal skills directory
function getPersonalSkillsDirectory(): string {
    const config = vscode.workspace.getConfiguration('cpNinja');
    const customPath = config.get<string>('personalSkillsDirectory', '');
    
    if (customPath && customPath.trim()) {
        // Use custom path, resolve ~ and environment variables
        const resolvedPath = customPath.replace(/^~/, process.env.HOME || process.env.USERPROFILE || '')
                                      .replace(/\$\{([^}]+)\}/g, (match, envVar) => process.env[envVar] || match);
        return path.resolve(resolvedPath, 'skills');
    }
    
    // Default to ~/.cp-ninja/skills
    return path.join(process.env.HOME || process.env.USERPROFILE || '', '.cp-ninja', 'skills');
}

let extensionBasePath: string; // Declare globally
let profileChatHandler: ProfileChatHandler; // Profile chat handler instance
let onboardingManager: OnboardingManager;
let enhancedSuggestionEngine: EnhancedSuggestionEngine;
let configurationManager: ConfigurationManager;
let dynamicSkillRegistry: DynamicSkillRegistry;
let asyncSkillLoader: AsyncSkillLoader;
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
    const personalSkillsDir = getPersonalSkillsDirectory();

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

        // Handle regular skill commands - use dynamic registry first
        const skillName = request.command;
        
        // Try dynamic registry first
        if (dynamicSkillRegistry?.isSkillRegistered(skillName)) {
            const skillContent = await dynamicSkillRegistry.loadSkillContent(skillName);
            if (skillContent) {
                stream.markdown(`**Using skill: ${skillName}**\n\n` + skillContent.content);
                return {};
            }
        }
        
        // Fallback to static resolution
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
    const dynamicSkills = dynamicSkillRegistry?.getAllSkills() || [];
    const cpNinjaSkills = findSkillsInDir(skillsDir, 'cp-ninja');
    const personalSkills = findSkillsInDir(personalSkillsDir, 'personal');
    const allSkills = [...cpNinjaSkills, ...personalSkills, ...dynamicSkills.map(s => ({ name: s.name, description: s.description }))];

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

export async function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "cp-ninja" is now active!');

    extensionBasePath = context.extensionPath; // Store the extension path
    
    // Copy agents directory to .github/prompts on startup
    copyAgentsToGitHubPrompts(context.extensionPath).catch(error => {
        console.error('Error during agents directory copy:', error);
    });

    const skillsDir = path.join(context.extensionPath, 'skills');
    const personalSkillsDir = getPersonalSkillsDirectory();
    
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
        
        // Initialize dynamic skill loading system
        dynamicSkillRegistry = new DynamicSkillRegistry(skillsDir, personalSkillsDir);
        asyncSkillLoader = new AsyncSkillLoader(skillsDir, personalSkillsDir);
        
        // Auto-reload personal skills when files change (packaged skills are static)
        const autoReloadDisposable = dynamicSkillRegistry.enableAutoReload();
        context.subscriptions.push(autoReloadDisposable);
        
        // Initialize skills registry - eagerly load packaged skills, set up personal skills
        await dynamicSkillRegistry.initialize();
        
        console.log('Packaged skills loaded eagerly, personal skills ready for dynamic loading');
        
        // Initialize auto-profile system (Phase 1 & 2) - commented out to fix lint
        // autoProfileManager = new AutoProfileManager(context, profileChatHandler);
        
        console.log('Extension initialization completed successfully');
    
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

    // Enhanced Skills Explorer View with embedded search box
    const skillsWebviewProvider = new SkillsWebviewProvider(
        context.extensionUri,
        skillsDir,
        personalSkillsDir,
        configurationManager
    );
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SkillsWebviewProvider.viewType,
            skillsWebviewProvider
        )
    );

    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.useSkillFromView', async (skillName: string) => {
        // Track skill usage
        if (enhancedSuggestionEngine) {
            enhancedSuggestionEngine.trackSkillUsage(skillName);
        }
        
        // Open chat view and show participant
        await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
        vscode.window.showInformationMessage(`In the chat view, type: @cp-ninja /${skillName}`);
    }));

    // Command for opening skills in editor is now handled by webview

    // Add search skills command - now opens quick pick as alternative to webview search
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.searchSkills', async () => {
        // Open the quick pick for skill search
        await vscode.commands.executeCommand('cp-ninja.showSkillsQuickPick');
    }));

    // Add toggle favorites command
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.toggleFavorites', () => {
        // For webview, we just refresh - filtering is done in the search box
        skillsWebviewProvider.refresh();
        vscode.window.showInformationMessage('Favorites toggled');
    }));

    // Add skill to favorites command
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.addToFavorites', async (skillItem: any) => {
        const skillName = skillItem?.label?.replace('⭐ ', '') || skillItem?.skillName || skillItem;
        await configurationManager.addToFavorites(skillName);
        skillsWebviewProvider.refresh();
        vscode.window.showInformationMessage(`Added "${skillName}" to favorites`);
    }));

    // Remove skill from favorites command
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.removeFromFavorites', async (skillItem: any) => {
        const skillName = skillItem?.label?.replace('⭐ ', '') || skillItem?.skillName || skillItem;
        await configurationManager.removeFromFavorites(skillName);
        skillsWebviewProvider.refresh();
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

    // Register dynamic skill management commands
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.reloadSkills', async () => {
        if (dynamicSkillRegistry) {
            await dynamicSkillRegistry.reloadPersonalSkills();
            vscode.window.showInformationMessage('Personal skills reloaded successfully! (Packaged skills are always available)');
            
            // Refresh webview
            if (skillsWebviewProvider) {
                skillsWebviewProvider.refresh();
            }
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.createDynamicSkill', async () => {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter skill name',
            placeHolder: 'my-custom-skill'
        });
        
        if (!name) return;
        
        const description = await vscode.window.showInputBox({
            prompt: 'Enter skill description',
            placeHolder: 'What does this skill do?'
        });
        
        if (!description) return;
        
        const content = await vscode.window.showInputBox({
            prompt: 'Enter skill content (markdown)',
            placeHolder: '# My Custom Skill\n\nThis skill helps with...',
            value: `# ${name}\n\n## Overview\n\n${description}\n\n## Instructions\n\n1. Step one\n2. Step two\n3. Step three`
        });
        
        if (!content) return;
        
        if (dynamicSkillRegistry) {
            const success = await dynamicSkillRegistry.registerSkillFromContent(name, content, description);
            if (success) {
                vscode.window.showInformationMessage(`Dynamic skill "${name}" created successfully!`);
                // Refresh webview
                if (skillsWebviewProvider) {
                    skillsWebviewProvider.refresh();
                }
            } else {
                vscode.window.showErrorMessage(`Failed to create skill "${name}"`);
            }
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.showSkillStats', async () => {
        if (dynamicSkillRegistry && asyncSkillLoader) {
            const packagedSkills = dynamicSkillRegistry.getPackagedSkills();
            const personalSkills = dynamicSkillRegistry.getPersonalSkills();
            const cacheStats = asyncSkillLoader.getCacheStats();
            
            const message = `**Skill Loading Statistics:**\n\n` +
                `- Packaged Skills (Eager): ${packagedSkills.length}\n` +
                `- Personal Skills (Dynamic): ${personalSkills.length}\n` +
                `- Total Skills: ${packagedSkills.length + personalSkills.length}\n\n` +
                `**Cache Status:**\n` +
                `- Packaged Skills Cached: ${cacheStats.packagedSize}\n` +
                `- Personal Skills Cached: ${cacheStats.personalSize}\n` +
                `- Currently Loading: ${cacheStats.loadingCount}\n\n` +
                `**Loading Strategy:**\n` +
                `- Packaged skills are loaded eagerly on startup\n` +
                `- Personal skills are loaded on-demand for better performance`;
                
            vscode.window.showInformationMessage(message);
        }
    }));
}

export function deactivate() {}
