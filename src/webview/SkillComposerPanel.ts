import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface DocumentTargetInfo {
    suggestedPath: string;
    suggestedName: string;
    saveLocation: 'user' | 'project';
    templateName: string;
}

export class SkillComposerPanel {
    public static currentPanel: SkillComposerPanel | undefined;
    public readonly viewType = 'cp-ninja.skillComposer';
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private disposables: vscode.Disposable[] = [];
    private documentTargets = new Map<string, DocumentTargetInfo>();
    private statusBarItem: vscode.StatusBarItem;

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
                    vscode.Uri.joinPath(extensionContext.extensionUri, 'webview-dist')
                ]
            }
        );

        SkillComposerPanel.currentPanel = new SkillComposerPanel(panel, extensionContext.extensionUri);
        return SkillComposerPanel.currentPanel;
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'cp-ninja.showTargetPath';
        this.disposables.push(this.statusBarItem);

        // Set the webview's initial html content
        this.updateWebview();
        
        // Listen for save events to handle target path saving
        vscode.workspace.onDidSaveTextDocument(this.handleDocumentSave, this, this.disposables);
        
        // Listen for active editor changes to update status bar
        vscode.window.onDidChangeActiveTextEditor(this.handleActiveEditorChange, this, this.disposables);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                    case 'templateSelected':
                        // Handle template selection - could store state or communicate with other components
                        console.log('Template selected:', message.template.name);
                        vscode.window.showInformationMessage(`Template selected: ${message.template.name}`);
                        return;
                    case 'createNewSkill':
                        await this.handleCreateNewSkill(message);
                        return;
                    case 'importSkill':
                        await this.handleImportSkill();
                        return;
                    case 'saveActiveSkill':
                        await this.handleSaveActiveSkill(message);
                        return;
                }
            },
            null,
            this.disposables
        );
    }

    public async showTargetPathCommand() {
        await this.handleShowTargetPath();
    }

    public dispose() {
        SkillComposerPanel.currentPanel = undefined;
        
        // Clean up status bar
        this.statusBarItem.dispose();
        
        // Clear document targets
        this.documentTargets.clear();

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
        this.panel.webview.html = this.getHtmlForWebview();
    }

    private async handleCreateNewSkill(message: any) {
        try {
            const { content, templateName, mode, saveLocation } = message;
            
            // Get suggested filename from template name
            let suggestedName = templateName || 'new-skill';
            suggestedName = suggestedName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
            
            // Determine target directory
            const targetDir = await this.getTargetDirectory(saveLocation);
            const suggestedPath = path.join(targetDir, suggestedName, 'SKILL.md');
            
            // Create new untitled document with the template content
            const doc = await vscode.workspace.openTextDocument({
                content: content,
                language: 'markdown'
            });
            
            // Show the document in a new editor
            const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
            
            // Store target info for this document
            this.storeDocumentTargetInfo(doc, {
                suggestedPath,
                suggestedName,
                saveLocation,
                templateName: templateName || 'Blank'
            });
            
            // Show status bar with suggested path
            this.showTargetPathInStatusBar(suggestedPath, saveLocation);
            
            // Show success message
            const modeLabel = mode === 'template' ? `Template: ${templateName}` : 'Blank Template';
            const locationLabel = saveLocation === 'user' ? 'User Skills' : 'Project Skills';
            vscode.window.showInformationMessage(
                `Draft created from ${modeLabel} → ${locationLabel}. Press Ctrl+S to save to suggested location.`,
                'Show Path'
            ).then(selection => {
                if (selection === 'Show Path') {
                    vscode.window.showInformationMessage(`Will save to: ${suggestedPath}`);
                }
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to create skill: ${errorMessage}`);
        }
    }

    private async handleImportSkill() {
        try {
            // Show file picker for markdown files
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Markdown files': ['md', 'markdown'],
                    'All files': ['*']
                },
                openLabel: 'Import Skill'
            });

            if (fileUri && fileUri[0]) {
                // Open the selected file
                const doc = await vscode.workspace.openTextDocument(fileUri[0]);
                await vscode.window.showTextDocument(doc);
                
                vscode.window.showInformationMessage('Skill imported successfully!');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to import skill: ${errorMessage}`);
        }
    }

    private async handleSaveActiveSkill(message: any) {
        try {
            const { location } = message;
            const activeEditor = vscode.window.activeTextEditor;
            
            if (!activeEditor) {
                vscode.window.showWarningMessage('No active editor found. Please open a skill file first.');
                return;
            }

            const document = activeEditor.document;
            if (document.languageId !== 'markdown') {
                vscode.window.showWarningMessage('Active file is not a markdown file. Skills should be markdown files.');
                return;
            }

            // Get skill name from user
            const skillName = await vscode.window.showInputBox({
                prompt: 'Enter skill name',
                placeHolder: 'my-awesome-skill',
                validateInput: (value) => {
                    if (!value || !value.trim()) {
                        return 'Skill name cannot be empty';
                    }
                    if (!/^[a-zA-Z0-9-_]+$/.test(value.trim())) {
                        return 'Skill name can only contain letters, numbers, hyphens, and underscores';
                    }
                    return null;
                }
            });

            if (!skillName) {
                return; // User cancelled
            }

            // Save the skill
            await this.saveSkillToLocation(skillName.trim(), document.getText(), location);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to save skill: ${errorMessage}`);
        }
    }

    private async saveSkillToLocation(skillName: string, content: string, location: 'user' | 'project') {
        // Determine save path based on location
        let skillsDir: string;
        if (location === 'user') {
            // User-specific skills directory
            const userHome = process.env.HOME || process.env.USERPROFILE || '';
            skillsDir = path.join(userHome, '.cp-ninja', 'skills');
        } else {
            // Project-specific skills directory
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found for project skills');
                return;
            }
            skillsDir = path.join(workspaceFolder.uri.fsPath, '.cp-ninja', 'skills');
        }

        // Create skill directory
        const skillDir = path.join(skillsDir, skillName);
        if (!fs.existsSync(skillDir)) {
            fs.mkdirSync(skillDir, { recursive: true });
        }

        // Write SKILL.md file
        const skillFile = path.join(skillDir, 'SKILL.md');
        fs.writeFileSync(skillFile, content, 'utf8');

        // Show success message
        const locationLabel = location === 'user' ? 'User Skills' : 'Project Skills';
        vscode.window.showInformationMessage(
            `Skill "${skillName}" saved to ${locationLabel}`,
            'Open Folder'
        ).then(selection => {
            if (selection === 'Open Folder') {
                vscode.env.openExternal(vscode.Uri.file(skillDir));
            }
        });
    }

    private async getTargetDirectory(saveLocation: 'user' | 'project'): Promise<string> {
        if (saveLocation === 'user') {
            const userHome = process.env.HOME || process.env.USERPROFILE || '';
            return path.join(userHome, '.cp-ninja', 'skills');
        } else {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found for project skills');
            }
            return path.join(workspaceFolder.uri.fsPath, '.cp-ninja', 'skills');
        }
    }
    
    private storeDocumentTargetInfo(document: vscode.TextDocument, info: DocumentTargetInfo) {
        this.documentTargets.set(document.uri.toString(), info);
    }
    
    private getDocumentTargetInfo(document: vscode.TextDocument): DocumentTargetInfo | undefined {
        return this.documentTargets.get(document.uri.toString());
    }
    
    private showTargetPathInStatusBar(suggestedPath: string, saveLocation: 'user' | 'project') {
        const locationIcon = saveLocation === 'user' ? '👤' : '📁';
        const shortPath = path.basename(path.dirname(suggestedPath)) + '/' + path.basename(suggestedPath);
        this.statusBarItem.text = `${locationIcon} → ${shortPath}`;
        this.statusBarItem.tooltip = `Click to save to: ${suggestedPath}`;
        this.statusBarItem.show();
    }
    
    private hideStatusBar() {
        this.statusBarItem.hide();
    }
    
    private async handleDocumentSave(document: vscode.TextDocument) {
        const targetInfo = this.getDocumentTargetInfo(document);
        if (!targetInfo || document.languageId !== 'markdown') {
            return;
        }
        
        // If document is still untitled, offer to save to suggested location
        if (document.isUntitled) {
            const result = await vscode.window.showInformationMessage(
                `Save "${targetInfo.templateName}" to suggested location?`,
                'Yes, Save There',
                'Choose Different Location',
                'Cancel'
            );
            
            if (result === 'Yes, Save There') {
                await this.saveToTargetLocation(document, targetInfo);
            } else if (result === 'Choose Different Location') {
                // Let VS Code handle normal Save As
                await vscode.commands.executeCommand('workbench.action.files.saveAs');
            }
            // Cancel does nothing
        }
    }
    
    private async handleActiveEditorChange(editor: vscode.TextEditor | undefined) {
        if (!editor) {
            this.hideStatusBar();
            return;
        }
        
        const targetInfo = this.getDocumentTargetInfo(editor.document);
        if (targetInfo) {
            this.showTargetPathInStatusBar(targetInfo.suggestedPath, targetInfo.saveLocation);
        } else {
            this.hideStatusBar();
        }
    }
    
    private async handleShowTargetPath() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        
        const targetInfo = this.getDocumentTargetInfo(activeEditor.document);
        if (targetInfo) {
            const result = await vscode.window.showInformationMessage(
                `Target: ${targetInfo.suggestedPath}`,
                'Save Now',
                'Show Folder',
                'Change Name'
            );
            
            if (result === 'Save Now') {
                await this.saveToTargetLocation(activeEditor.document, targetInfo);
            } else if (result === 'Show Folder') {
                const targetDir = path.dirname(targetInfo.suggestedPath);
                vscode.env.openExternal(vscode.Uri.file(targetDir));
            } else if (result === 'Change Name') {
                const newName = await vscode.window.showInputBox({
                    prompt: 'Enter new skill name',
                    value: targetInfo.suggestedName,
                    validateInput: (value) => {
                        if (!value || !value.trim()) {
                            return 'Skill name cannot be empty';
                        }
                        if (!/^[a-zA-Z0-9-_]+$/.test(value.trim())) {
                            return 'Skill name can only contain letters, numbers, hyphens, and underscores';
                        }
                        return null;
                    }
                });
                
                if (newName) {
                    const targetDir = await this.getTargetDirectory(targetInfo.saveLocation);
                    const newPath = path.join(targetDir, newName.trim(), 'SKILL.md');
                    const updatedInfo = {
                        ...targetInfo,
                        suggestedName: newName.trim(),
                        suggestedPath: newPath
                    };
                    this.storeDocumentTargetInfo(activeEditor.document, updatedInfo);
                    this.showTargetPathInStatusBar(newPath, targetInfo.saveLocation);
                }
            }
        }
    }

    private async saveToTargetLocation(document: vscode.TextDocument, targetInfo: DocumentTargetInfo) {
        try {
            // Create directory if it doesn't exist
            const targetDir = path.dirname(targetInfo.suggestedPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            
            // Write file
            fs.writeFileSync(targetInfo.suggestedPath, document.getText(), 'utf8');
            
            // Open the saved file
            const savedDoc = await vscode.workspace.openTextDocument(targetInfo.suggestedPath);
            await vscode.window.showTextDocument(savedDoc);
            
            // Clean up
            this.documentTargets.delete(document.uri.toString());
            this.hideStatusBar();
            
            // Show success
            const locationLabel = targetInfo.saveLocation === 'user' ? 'User Skills' : 'Project Skills';
            vscode.window.showInformationMessage(
                `Skill "${targetInfo.suggestedName}" saved to ${locationLabel}`,
                'Open Folder'
            ).then(selection => {
                if (selection === 'Open Folder') {
                    vscode.env.openExternal(vscode.Uri.file(targetDir));
                }
            });
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to save to target location: ${errorMessage}`);
        }
    }

    private getHtmlForWebview() {
        const webview = this.panel.webview;
        
        // Get the local resource paths for the React bundle
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'webview-dist', 'bundle.js')
        );

        // Generate a nonce for the script tag
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webview.cspSource} 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline';">
                <title>Skill Composer</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        font-weight: var(--vscode-font-weight);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        margin: 0;
                        padding: 0;
                        height: 100vh;
                        overflow: hidden;
                    }
                    #root {
                        height: 100%;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}