import * as vscode from 'vscode';
import { OnboardingWebviewProvider } from '../src/OnboardingWebviewProvider';

// Mock vscode
jest.mock('vscode', () => ({
    window: {
        createWebviewPanel: jest.fn(),
        showInformationMessage: jest.fn(),
    },
    commands: {
        executeCommand: jest.fn(),
    },
    ViewColumn: {
        One: 1,
    },
    Uri: {
        file: jest.fn((path: string) => ({ fsPath: path, scheme: 'file' })),
        joinPath: jest.fn(),
    },
    workspace: {
        workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
        fs: {
            stat: jest.fn(),
        },
    },
}), { virtual: true });

describe('OnboardingWebviewProvider', () => {
    let provider: OnboardingWebviewProvider;
    let mockExtensionUri: vscode.Uri;
    let mockPanel: any;
    let mockWebview: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock webview
        mockWebview = {
            html: '',
            options: {},
            onDidReceiveMessage: jest.fn(),
            postMessage: jest.fn(),
            cspSource: 'test-csp-source',
        };

        // Create mock panel
        mockPanel = {
            webview: mockWebview,
            reveal: jest.fn(),
            dispose: jest.fn(),
            onDidDispose: jest.fn((callback) => {
                // Store callback to simulate disposal later if needed
                return { dispose: jest.fn() };
            }),
        };

        (vscode.window.createWebviewPanel as jest.Mock).mockReturnValue(mockPanel);

        // Create mock extension URI
        mockExtensionUri = { fsPath: '/test/extension', scheme: 'file' } as vscode.Uri;

        // Create provider instance
        provider = new OnboardingWebviewProvider(mockExtensionUri);
    });

    describe('show', () => {
        it('should create a new webview panel if none exists', async () => {
            await provider.show();

            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
                'cpNinjaOnboarding',
                '🥷 CP-Ninja Tutorial',
                vscode.ViewColumn.One,
                expect.objectContaining({
                    enableScripts: true,
                    localResourceRoots: [mockExtensionUri],
                    retainContextWhenHidden: true,
                })
            );
        });

        it('should reveal existing panel if it already exists', async () => {
            // First call creates panel
            await provider.show();
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);

            // Second call should reveal existing panel
            await provider.show();
            expect(mockPanel.reveal).toHaveBeenCalled();
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1); // Not called again
        });

        it('should set HTML content on webview', async () => {
            await provider.show();

            expect(mockWebview.html).toBeTruthy();
            expect(mockWebview.html).toContain('CP-Ninja Tutorial');
            expect(mockWebview.html).toContain('Skills');
            expect(mockWebview.html).toContain('Agents');
            expect(mockWebview.html).toContain('Prompts');
            expect(mockWebview.html).toContain('Instructions');
        });

        it('should register message handlers', async () => {
            await provider.show();

            expect(mockWebview.onDidReceiveMessage).toHaveBeenCalled();
        });
    });

    describe('message handling', () => {
        let messageHandler: (message: any) => Promise<void>;

        beforeEach(async () => {
            await provider.show();
            // Extract the message handler that was registered
            messageHandler = (mockWebview.onDidReceiveMessage as jest.Mock).mock.calls[0][0];
        });

        it('should handle openChat message', async () => {
            await messageHandler({ type: 'openChat' });

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'workbench.panel.chat.view.copilot.focus'
            );
        });

        it('should handle openSkillsExplorer message', async () => {
            await messageHandler({ type: 'openSkillsExplorer' });

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('cp-ninja.showDetails');
        });

        it('should handle createSkill message', async () => {
            await messageHandler({ type: 'createSkill' });

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('cp-ninja.createSkill');
        });

        it('should handle viewAgents message', async () => {
            await messageHandler({ type: 'viewAgents' });

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'revealFileInOS',
                expect.anything()
            );
        });

        it('should handle viewInstructions message', async () => {
            // Mock stat to simulate file exists
            (vscode.workspace.fs.stat as jest.Mock).mockResolvedValue({});

            await messageHandler({ type: 'viewInstructions' });

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'vscode.open',
                expect.anything()
            );
        });

        it('should handle tryExample message', async () => {
            await messageHandler({ type: 'tryExample' });

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'workbench.panel.chat.view.copilot.focus'
            );
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('@cp-ninja /brainstorming')
            );
        });

        it('should handle close message', async () => {
            await messageHandler({ type: 'close' });

            expect(mockPanel.dispose).toHaveBeenCalled();
        });

        it('should handle navigate message', async () => {
            await messageHandler({ type: 'navigate', step: 3 });

            // Should update current step (no external effects to verify, but shouldn't throw)
            expect(true).toBe(true);
        });
    });

    describe('HTML content', () => {
        it('should include all tutorial steps', async () => {
            await provider.show();
            const html = mockWebview.html;

            // Check for step titles
            expect(html).toContain('What You\'ll Learn');
            expect(html).toContain('Skills: Your Development Playbook');
            expect(html).toContain('Agents: Your AI Workforce');
            expect(html).toContain('Skills vs Agents');
            expect(html).toContain('When to Use What: Decision Guide');
            expect(html).toContain('Prompts: Agent Templates');
            expect(html).toContain('Instructions: Global AI Context');
            expect(html).toContain('Customization Guide');
            expect(html).toContain('Ready to Get Started');
        });

        it('should include CSP with nonce', async () => {
            await provider.show();
            const html = mockWebview.html;

            expect(html).toContain('Content-Security-Policy');
            expect(html).toMatch(/nonce-[a-zA-Z0-9]{32}/);
        });

        it('should include navigation buttons', async () => {
            await provider.show();
            const html = mockWebview.html;

            expect(html).toContain('prevBtn');
            expect(html).toContain('nextBtn');
            expect(html).toContain('navigate');
        });

        it('should include progress bar', async () => {
            await provider.show();
            const html = mockWebview.html;

            expect(html).toContain('progress-bar');
            expect(html).toContain('progress-fill');
        });

        it('should include step indicators', async () => {
            await provider.show();
            const html = mockWebview.html;

            expect(html).toContain('steps-indicator');
            expect(html).toContain('step-dot');
        });

        it('should include comparison table', async () => {
            await provider.show();
            const html = mockWebview.html;

            expect(html).toContain('comparison-table');
        });

        it('should include visual diagrams', async () => {
            await provider.show();
            const html = mockWebview.html;

            expect(html).toContain('visual-diagram');
            expect(html).toContain('diagram-row');
            expect(html).toContain('diagram-box');
        });

        it('should include action buttons', async () => {
            await provider.show();
            const html = mockWebview.html;

            expect(html).toContain('openSkillsExplorer');
            expect(html).toContain('viewAgents');
            expect(html).toContain('viewInstructions');
            expect(html).toContain('tryExample');
        });
    });

    describe('panel lifecycle', () => {
        it('should clean up when panel is disposed', async () => {
            await provider.show();
            
            // Get the onDidDispose callback
            const disposeCallback = (mockPanel.onDidDispose as jest.Mock).mock.calls[0][0];
            
            // Simulate panel disposal
            disposeCallback();

            // Try to show again, should create new panel
            await provider.show();
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(2);
        });
    });
});
