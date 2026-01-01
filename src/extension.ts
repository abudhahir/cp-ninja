import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { findSkillsInDir, resolveSkillPath, stripFrontmatter } from './lib/skills-core';
import { SkillTreeDataProvider } from './SkillsTreeDataProvider'; // Import the new data provider
import { SuggestionEngine } from './SuggestionEngine'; // Import the SuggestionEngine
import { SkillComposerPanel } from './webview/SkillComposerPanel';

let extensionBasePath: string; // Declare globally

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
    
    // Default behavior if no command is matched - could be to pass through to the default agent
    // For now, we'll just indicate that a command is needed.
    stream.markdown("I am the @cp-ninja participant. Please use `/use_skill` or `/find_skills`.");

    return {};
};

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "cp-ninja" is now active!');

    extensionBasePath = context.extensionPath; // Store the extension path

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
            [{ label: 'Find Skills', description: 'List all available skills' }, { label: 'Use Skill...', description: 'Invoke a specific skill' }],
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
}

export function deactivate() {}
