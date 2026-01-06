import * as vscode from 'vscode';
import * as path from 'path';
import { GitRepoFetcher, FetchResult, RepoFile } from './GitRepoFetcher';
import { ResourceImporter, ImportTarget, ResourceType } from './ResourceImporter';
import { RepoHistoryManager, RepoHistoryEntry } from './RepoHistoryManager';

export class GitRepoWebviewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private currentRepo: string | undefined;
    private currentData: FetchResult | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        private fetcher: GitRepoFetcher,
        private importer: ResourceImporter,
        private historyManager: RepoHistoryManager
    ) {}

    async show(repoUrl?: string): Promise<void> {
        console.log(`[GitRepoWebviewProvider] show() called with repoUrl: ${repoUrl}`);
        
        // Show immediate feedback
        if (repoUrl) {
            vscode.window.showInformationMessage(`Opening repository: ${repoUrl}`);
        }
        
        // Create or reveal panel
        if (this.panel) {
            console.log('[GitRepoWebviewProvider] Revealing existing panel');
            this.panel.reveal(vscode.ViewColumn.One);
        } else {
            console.log('[GitRepoWebviewProvider] Creating new webview panel');
            this.panel = vscode.window.createWebviewPanel(
                'gitRepoBrowser',
                'Git Repository Browser',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            console.log('[GitRepoWebviewProvider] Webview panel created');

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });

            // Handle messages from webview
            this.panel.webview.onDidReceiveMessage(async (message) => {
                await this.handleMessage(message);
            });
        }

        // If repo URL provided, fetch and display
        if (repoUrl) {
            await this.loadRepository(repoUrl);
        } else {
            // Show empty state with history
            this.panel.webview.html = this.getHtmlContent();
        }
    }

    private async loadRepository(repoUrl: string): Promise<void> {
        console.log(`[GitRepoWebviewProvider] loadRepository() called with: ${repoUrl}`);
        
        if (!this.panel) {
            console.error('[GitRepoWebviewProvider] No panel available!');
            return;
        }

        this.currentRepo = repoUrl;
        console.log('[GitRepoWebviewProvider] Setting loading HTML');
        this.panel.webview.html = this.getLoadingHtml();

        console.log(`[GitRepoWebviewProvider] Starting GitHub fetch with progress indicator`);

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Fetching repository: ${repoUrl}`,
                cancellable: false
            },
            async (progress) => {
                try {
                    progress.report({ message: 'Connecting to GitHub...' });
                    
                    // TODO: Get token from SecretStorage
                    const token = undefined;
                    
                    progress.report({ message: 'Fetching repository contents...' });
                    const data = await this.fetcher.fetchRepoContents(repoUrl, token);
                    this.currentData = data;

                    console.log(`[GitRepoWebviewProvider] Found ${data.skillsCount} skills, ${data.promptsCount} prompts, ${data.instructionsCount} instructions, ${data.agentsCount} agents`);

                    progress.report({ message: 'Saving to history...' });
                    // Add to history
                    await this.historyManager.addToHistory(
                        repoUrl,
                        data.skillsCount,
                        data.promptsCount,
                        data.instructionsCount,
                        data.agentsCount
                    );

                    progress.report({ message: 'Rendering results...' });
                    if (this.panel) {
                        this.panel.webview.html = this.getHtmlContent(data, repoUrl);
                    }
                    
                    vscode.window.showInformationMessage(`✓ Loaded ${repoUrl}: ${data.files.length} files found`);
                } catch (error) {
                    console.error(`[GitRepoWebviewProvider] Error loading repository:`, error);
                    vscode.window.showErrorMessage(`Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    if (this.panel) {
                        this.panel.webview.html = this.getErrorHtml(error instanceof Error ? error.message : 'Unknown error');
                    }
                }
            }
        );
    }

    private async handleMessage(message: any): Promise<void> {
        switch (message.command) {
            case 'loadRepo':
                await this.loadRepository(message.url);
                break;
            
            case 'importResource':
                await this.importResource(message.file, message.target);
                break;
            
            case 'refreshHistory':
                await this.refreshHistory();
                break;
            
            case 'clearHistory':
                await this.clearHistory();
                break;
            
            case 'removeFromHistory':
                await this.removeFromHistory(message.url);
                break;
        }
    }

    private async importResource(file: RepoFile, target: ImportTarget): Promise<void> {
        if (!this.currentRepo) {
            vscode.window.showErrorMessage('No repository loaded');
            return;
        }

        console.log(`[GitRepoWebviewProvider] Importing ${file.name} to ${target}`);

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Importing ${file.name}`,
                cancellable: false
            },
            async (progress) => {
                try {
                    progress.report({ message: 'Fetching file content...' });
                    // Fetch file content
                    const content = await this.fetcher.fetchFileContent(this.currentRepo!, file.path);
                    
                    progress.report({ message: 'Validating resource...' });
                    // Determine resource type from path
                    const type = this.determineResourceType(file.path);
                    
                    progress.report({ message: 'Writing file...' });
                    // Import
                    const result = await this.importer.importResource(content, file.name, type, target);
                    
                    if (result.success) {
                        console.log(`[GitRepoWebviewProvider] Successfully imported to ${result.path}`);
                        
                        // Trigger skill registry reload if it's a skill
                        if (type === 'skill' && target === 'user-global') {
                            console.log('[GitRepoWebviewProvider] Triggering skill registry reload for personal skills');
                            // Send a message to trigger reload via a command
                            await vscode.commands.executeCommand('cp-ninja.reloadSkills');
                        }
                        
                        vscode.window.showInformationMessage(
                            `✓ Imported ${file.name} to ${target === 'project' ? 'project' : 'user'}\nPath: ${result.path}`,
                            'Open Folder'
                        ).then(action => {
                            if (action === 'Open Folder') {
                                const folderPath = path.dirname(result.path!);
                                vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(folderPath));
                            }
                        });
                    } else {
                        console.error(`[GitRepoWebviewProvider] Import failed:`, result.error);
                        vscode.window.showErrorMessage(`Import failed: ${result.error}`);
                    }
                } catch (error) {
                    console.error(`[GitRepoWebviewProvider] Import error:`, error);
                    vscode.window.showErrorMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        );
    }

    private determineResourceType(filePath: string): ResourceType {
        const lowerPath = filePath.toLowerCase();
        
        if (lowerPath.includes('.github/skills/') && lowerPath.endsWith('.md')) {
            return 'skill';
        } else if (
            (lowerPath.includes('.github/prompts/') && lowerPath.endsWith('.md')) ||
            lowerPath.endsWith('-prompt.md') ||
            lowerPath.endsWith('.prompt.md')
        ) {
            return 'prompt';
        } else if (
            (lowerPath.includes('.github/instructions/') && lowerPath.endsWith('.md')) ||
            lowerPath.includes('copilot-instructions.md') ||
            lowerPath.endsWith('.instructions.md')
        ) {
            return 'instruction';
        } else if (lowerPath.endsWith('agents.md')) {
            return 'agent';
        }
        
        // Default to prompt for other markdown files
        return 'prompt';
    }

    private async refreshHistory(): Promise<void> {
        if (this.panel) {
            const history = await this.historyManager.getHistory();
            this.panel.webview.postMessage({
                command: 'updateHistory',
                history
            });
        }
    }

    private async clearHistory(): Promise<void> {
        await this.historyManager.clearHistory();
        await this.refreshHistory();
        vscode.window.showInformationMessage('History cleared');
    }

    private async removeFromHistory(url: string): Promise<void> {
        await this.historyManager.removeFromHistory(url);
        await this.refreshHistory();
    }

    private getLoadingHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loading...</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
        }
    </style>
</head>
<body>
    <div>Loading repository...</div>
</body>
</html>`;
    }

    private getErrorHtml(error: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-errorForeground);
            padding: 20px;
        }
    </style>
</head>
<body>
    <h2>Error Loading Repository</h2>
    <p>${error}</p>
</body>
</html>`;
    }

    private getHtmlContent(data?: FetchResult, repoUrl?: string): string {
        const vscode = this.getVsCodeApi();
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git Repository Browser</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            padding: 20px;
        }
        
        .header {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .search-box {
            width: 100%;
            padding: 8px;
            margin-bottom: 20px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }
        
        .content {
            display: flex;
            gap: 20px;
        }
        
        .main-panel {
            flex: 3;
        }
        
        .sidebar {
            flex: 1;
            border-left: 1px solid var(--vscode-panel-border);
            padding-left: 20px;
        }
        
        .resource-section {
            margin-bottom: 30px;
        }
        
        .resource-section h3 {
            color: var(--vscode-textLink-foreground);
            margin-bottom: 10px;
        }
        
        .resource-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            margin-bottom: 5px;
            background: var(--vscode-list-hoverBackground);
            border-radius: 4px;
        }
        
        .resource-item:hover {
            background: var(--vscode-list-activeSelectionBackground);
        }
        
        .import-buttons {
            display: flex;
            gap: 5px;
        }
        
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 4px;
        }
        
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .history-item {
            padding: 8px;
            margin-bottom: 5px;
            background: var(--vscode-list-hoverBackground);
            border-radius: 4px;
            cursor: pointer;
        }
        
        .history-item:hover {
            background: var(--vscode-list-activeSelectionBackground);
        }
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 Git Repository Browser</h1>
        <input type="text" class="search-box" id="repoInput" placeholder="Enter GitHub repository (owner/repo or URL)..." value="${repoUrl || ''}">
        <button onclick="loadRepo()">Load Repository</button>
    </div>
    
    <div class="content">
        <div class="main-panel">
            ${data ? this.getResourcesHtml(data) : '<div class="empty-state"><p>Enter a repository URL to browse resources</p></div>'}
        </div>
        
        <div class="sidebar">
            <h3>📚 Recent Repositories</h3>
            <div id="history"></div>
            <button onclick="clearHistory()" style="margin-top: 10px;">Clear History</button>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function loadRepo() {
            const input = document.getElementById('repoInput');
            vscode.postMessage({
                command: 'loadRepo',
                url: input.value
            });
        }
        
        function importResource(file, target) {
            vscode.postMessage({
                command: 'importResource',
                file: file,
                target: target
            });
        }
        
        function clearHistory() {
            vscode.postMessage({ command: 'clearHistory' });
        }
        
        function loadFromHistory(url) {
            document.getElementById('repoInput').value = url;
            loadRepo();
        }
        
        // Request history on load
        vscode.postMessage({ command: 'refreshHistory' });
        
        // Listen for history updates
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateHistory') {
                updateHistoryUI(message.history);
            }
        });
        
        function updateHistoryUI(history) {
            const historyDiv = document.getElementById('history');
            if (history.length === 0) {
                historyDiv.innerHTML = '<p style="color: var(--vscode-descriptionForeground);">No history</p>';
                return;
            }
            
            historyDiv.innerHTML = history.map(entry => \`
                <div class="history-item" onclick="loadFromHistory('\${entry.url}')">
                    <div><strong>\${entry.url}</strong></div>
                    <div style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">
                        Skills: \${entry.skillsCount || 0} | Prompts: \${entry.promptsCount || 0} | 
                        Instructions: \${entry.instructionsCount || 0} | Agents: \${entry.agentsCount || 0}
                    </div>
                </div>
            \`).join('');
        }
    </script>
</body>
</html>`;
    }

    private getResourcesHtml(data: FetchResult): string {
        const skills = data.files.filter(f => f.path.toLowerCase().includes('.github/skills/'));
        const prompts = data.files.filter(f => 
            f.path.toLowerCase().includes('.github/prompts/') || 
            f.path.toLowerCase().endsWith('-prompt.md') || 
            f.path.toLowerCase().endsWith('.prompt.md')
        );
        const instructions = data.files.filter(f => 
            f.path.toLowerCase().includes('.github/instructions/') || 
            f.path.toLowerCase().includes('copilot-instructions.md')
        );
        const agents = data.files.filter(f => f.path.toLowerCase().endsWith('agents.md'));

        return `
            ${this.getResourceSection('Skills', skills)}
            ${this.getResourceSection('Prompts', prompts)}
            ${this.getResourceSection('Instructions', instructions)}
            ${this.getResourceSection('Agents', agents)}
        `;
    }

    private getResourceSection(title: string, files: RepoFile[]): string {
        if (files.length === 0) return '';

        return `
            <div class="resource-section">
                <h3>${title} (${files.length})</h3>
                ${files.map(file => `
                    <div class="resource-item">
                        <span>${file.name}</span>
                        <div class="import-buttons">
                            <button onclick='importResource(${JSON.stringify(file)}, "project")'>Import to Project</button>
                            <button onclick='importResource(${JSON.stringify(file)}, "user-global")'>Import to User</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    private getVsCodeApi(): string {
        return 'const vscode = acquireVsCodeApi();';
    }
}
