import * as vscode from 'vscode';
import { OnboardingWebviewProvider } from './OnboardingWebviewProvider';

export class OnboardingManager {
    private static readonly ONBOARDING_COMPLETED_KEY = 'cpNinja.onboardingCompleted';
    private static readonly FIRST_SKILL_USED_KEY = 'cpNinja.firstSkillUsed';
    private webviewProvider: OnboardingWebviewProvider;
    
    constructor(private context: vscode.ExtensionContext) {
        this.webviewProvider = new OnboardingWebviewProvider(context.extensionUri);
    }

    /**
     * Check if user needs onboarding and show welcome if needed
     */
    public async checkAndShowWelcome(): Promise<void> {
        const hasCompletedOnboarding = this.context.globalState.get<boolean>(OnboardingManager.ONBOARDING_COMPLETED_KEY, false);
        
        if (!hasCompletedOnboarding) {
            await this.showWelcomeScreen();
        }
    }

    /**
     * Show the first-run welcome screen
     */
    public async showWelcomeScreen(): Promise<void> {
        const selection = await vscode.window.showInformationMessage(
            '🥷 Welcome to CP-Ninja! Transform your coding workflow with AI-powered skills.',
            { modal: true },
            'Interactive Tutorial',
            'Quick Tour',
            'Browse Skills',
            'Start Coding'
        );

        switch (selection) {
            case 'Interactive Tutorial':
                await this.showTutorial();
                break;
            case 'Quick Tour':
                await this.startQuickTour();
                break;
            case 'Browse Skills':
                await vscode.commands.executeCommand('cp-ninja.showDetails');
                break;
            case 'Start Coding':
                await this.showChatPrompt();
                break;
        }

        // Mark onboarding as completed
        await this.context.globalState.update(OnboardingManager.ONBOARDING_COMPLETED_KEY, true);
    }

    /**
     * Start interactive quick tour
     */
    public async startQuickTour(): Promise<void> {
        // Step 1: Show skills explorer
        await vscode.commands.executeCommand('workbench.view.explorer');
        await vscode.window.showInformationMessage(
            '📚 This is your Skills Explorer. Browse and discover development skills here.',
            'Next'
        );

        // Step 2: Open chat
        await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
        await vscode.window.showInformationMessage(
            '💬 Use @cp-ninja in chat to access skills. Try typing "@cp-ninja" now!',
            'Next'
        );

        // Step 3: Show details view
        await vscode.commands.executeCommand('cp-ninja.showDetails');
        await vscode.window.showInformationMessage(
            '🚀 The Skills Details view lets you browse and preview skills visually.',
            'Finish Tour'
        );
    }

    /**
     * Show the interactive tutorial webview
     */
    public async showTutorial(): Promise<void> {
        await this.webviewProvider.show();
    }

    /**
     * Show chat prompt for new users
     */
    public async showChatPrompt(): Promise<void> {
        await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
        vscode.window.showInformationMessage(
            'Ready to start! Type "@cp-ninja" in chat to see available skills.'
        );
    }

    /**
     * Get suggested skills for new users based on context
     */
    public getSuggestedSkillsForNewUser(activeDocument?: vscode.TextDocument): string[] {
        const suggestions: string[] = [];

        // Always suggest core skills for new users
        suggestions.push('using-cp-ninja', 'brainstorming');

        if (activeDocument) {
            const fileName = activeDocument.fileName.toLowerCase();
            const fileContent = activeDocument.getText();

            // Language-specific suggestions
            if (fileName.endsWith('.ts') || fileName.endsWith('.js')) {
                suggestions.push('test-driven-development');
            }
            if (fileName.endsWith('.md')) {
                suggestions.push('writing-plans', 'writing-skills');
            }
            if (fileName.includes('test') || fileContent.includes('describe(') || fileContent.includes('it(')) {
                suggestions.push('systematic-debugging');
            }
            
            // Git context
            if (vscode.workspace.workspaceFolders) {
                suggestions.push('using-git-worktrees');
            }
        } else {
            // No active document - suggest planning skills
            suggestions.push('writing-plans', 'using-superpowers');
        }

        return [...new Set(suggestions)]; // Remove duplicates
    }

    /**
     * Show skill suggestion prompt
     */
    public async showSkillSuggestion(skillName: string, reason: string): Promise<void> {
        const hasUsedFirstSkill = this.context.globalState.get<boolean>(OnboardingManager.FIRST_SKILL_USED_KEY, false);
        
        if (!hasUsedFirstSkill) {
            const selection = await vscode.window.showInformationMessage(
                `💡 New to CP-Ninja? Try the "${skillName}" skill! ${reason}`,
                'Use Skill',
                'Learn More',
                'Don\'t Show Again'
            );

            switch (selection) {
                case 'Use Skill':
                    await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                    vscode.window.showInformationMessage(`Type: @cp-ninja /${skillName}`);
                    await this.context.globalState.update(OnboardingManager.FIRST_SKILL_USED_KEY, true);
                    break;
                case 'Learn More':
                    await vscode.commands.executeCommand('cp-ninja.showDetails');
                    break;
                case 'Don\'t Show Again':
                    await this.context.globalState.update(OnboardingManager.FIRST_SKILL_USED_KEY, true);
                    break;
            }
        }
    }

    /**
     * Show empty chat window prompts
     */
    public async showEmptyChatPrompts(): Promise<void> {
        // This would integrate with chat participant to detect empty state
        const suggestions = this.getSuggestedSkillsForNewUser(vscode.window.activeTextEditor?.document);
        
        if (suggestions.length > 0) {
            const randomSkill = suggestions[Math.floor(Math.random() * suggestions.length)];
            vscode.window.showInformationMessage(
                `💭 Try asking: "@cp-ninja /${randomSkill}" to get started!`,
                'Try It'
            ).then(selection => {
                if (selection === 'Try It') {
                    vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                }
            });
        }
    }

    /**
     * Reset onboarding state (for testing)
     */
    public async resetOnboarding(): Promise<void> {
        await this.context.globalState.update(OnboardingManager.ONBOARDING_COMPLETED_KEY, false);
        await this.context.globalState.update(OnboardingManager.FIRST_SKILL_USED_KEY, false);
    }
}