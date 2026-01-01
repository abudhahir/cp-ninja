import * as vscode from 'vscode';
import * as path from 'path';

export class SkillComposerPanel {
    public static currentPanel: SkillComposerPanel | undefined;
    public readonly viewType = 'cp-ninja.skillComposer';
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionContext: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (SkillComposerPanel.currentPanel) {
            SkillComposerPanel.currentPanel.panel.reveal(column);
            return SkillComposerPanel.currentPanel;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'cp-ninja.skillComposer',
            'Skill Composer',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionContext.extensionUri, 'resources'),
                    vscode.Uri.joinPath(extensionContext.extensionUri, 'out', 'webview')
                ]
            }
        );

        SkillComposerPanel.currentPanel = new SkillComposerPanel(panel, extensionContext.extensionUri);
        return SkillComposerPanel.currentPanel;
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;

        // Set the webview's initial html content
        this.updateWebview();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this.disposables
        );
    }

    public dispose() {
        SkillComposerPanel.currentPanel = undefined;

        // Clean up our resources
        this.panel.dispose();

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private updateWebview() {
        const webview = this.panel.webview;

        this.panel.webview.html = this.getHtmlForWebview(webview);
    }

    private getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Skill Composer</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        font-weight: var(--vscode-font-weight);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: var(--vscode-titleBar-activeForeground);
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Skill Composer</h1>
                    <p>Welcome to the Copilot Ninja Skill Composer!</p>
                    <p>This is a basic webview panel that will be enhanced with React components for skill composition.</p>
                </div>
            </body>
            </html>`;
    }
}