import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { findSkillsInDir, resolveSkillPath, stripFrontmatter } from './lib/skills-core';
import { SkillTreeDataProvider } from './SkillsTreeDataProvider'; // Import the new data provider
import { SuggestionEngine } from './SuggestionEngine'; // Import the SuggestionEngine
import { SkillComposerPanel } from './webview/SkillComposerPanel';

let extensionBasePath: string; // Declare globally

// Create a chat handler for a specific skill
const createSkillChatHandler = (skillName: string, skillsDir: string, personalSkillsDir: string): vscode.ChatRequestHandler => {
    return async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> => {
        const skill = resolveSkillPath(skillName, skillsDir, personalSkillsDir);
        if (skill) {
            const skillContent = fs.readFileSync(skill.skillFile, 'utf8');
            stream.markdown(`**Using skill: ${skillName}**\n\n` + stripFrontmatter(skillContent));
        } else {
            stream.markdown(`Sorry, I could not find the skill "${skillName}".`);
        }
        return {};
    };
};

// Define the main chat handler for @cp-ninja participant
const mainChatHandler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> => {
    const skillsDir = path.join(extensionBasePath, 'skills');
    const personalSkillsDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cp-ninja', 'skills');

    // Check if a specific skill command is being used
    if (request.command) {
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

    // Show available skills and usage instructions
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

    const skillsDir = path.join(context.extensionPath, 'skills');
    const personalSkillsDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cp-ninja', 'skills');
    
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

    // Skills Explorer View
    const skillsTreeDataProvider = new SkillTreeDataProvider(skillsDir, personalSkillsDir, extensionBasePath);
    vscode.window.createTreeView('cp-ninja.skillsView', { treeDataProvider: skillsTreeDataProvider });

    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.useSkillFromView', async (skillName: string) => {
        // Open chat view and show participant
        await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
        vscode.window.showInformationMessage(`In the chat view, type: @cp-ninja /${skillName}`);
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
                    // Open chat view and show participant
                    vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                    vscode.window.showInformationMessage(`In the chat view, type: @cp-ninja /${suggestion.skillName}`);
                }
                lastSuggestedSkill = suggestion.skillName; // Set last suggested skill to avoid immediate re-suggestion
            });
        }
    }));

    // Register Skills Details View command
    context.subscriptions.push(vscode.commands.registerCommand('cp-ninja.showDetails', () => {
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

export function deactivate() {}
