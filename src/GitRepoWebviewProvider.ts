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
                        
                        // Show appropriate message based on resource type and target
                        let message = `✓ Imported ${file.name} to ${target === 'project' ? 'project' : 'user'}\nPath: ${result.path}`;
                        
                        // Add helpful context for user-global imports
                        if (target === 'user-global' && type !== 'skill') {
                            message += '\n\n✓ Resources in your user profile work across all workspaces!';
                        }
                        
                        const actions = ['Open Folder'];
                        
                        const action = await vscode.window.showInformationMessage(message, ...actions);
                        
                        if (action === 'Open Folder') {
                            const folderPath = path.dirname(result.path!);
                            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(folderPath));
                        } else if (action === 'Import to Project Instead') {
                            // Re-import to project
                            await this.importResource(file, 'project');
                        }
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
            margin-bottom: 10px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        
        .filter-search-box {
            width: 100%;
            padding: 8px;
            margin-bottom: 15px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        
        .toolbar {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            align-items: center;
        }
        
        .category-filters {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            flex: 1;
        }
        
        .category-filter {
            padding: 5px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
        }
        
        .category-filter.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .category-filter:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .view-toggle {
            padding: 5px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
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
        
        .resource-section.collapsed .resource-list {
            display: none;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            padding: 8px;
            background: var(--vscode-list-hoverBackground);
            border-radius: 4px;
            margin-bottom: 10px;
        }
        
        .section-header:hover {
            background: var(--vscode-list-activeSelectionBackground);
        }
        
        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--vscode-textLink-foreground);
            font-weight: bold;
        }
        
        .section-toggle {
            font-size: 0.8em;
        }
        
        .resource-list {
            padding-left: 10px;
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
        
        .resource-item.hidden {
            display: none;
        }
        
        .resource-item:hover {
            background: var(--vscode-list-activeSelectionBackground);
        }
        
        .resource-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .resource-name {
            font-weight: 500;
        }
        
        .resource-path {
            font-size: 0.85em;
            color: var(--vscode-descriptionForeground);
        }
        
        .highlight {
            background: var(--vscode-editor-findMatchHighlightBackground);
            padding: 1px 2px;
            border-radius: 2px;
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
            white-space: nowrap;
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
        
        .stats-summary {
            display: flex;
            gap: 15px;
            padding: 10px;
            background: var(--vscode-editor-background);
            border-radius: 4px;
            margin-bottom: 15px;
        }
        
        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .stat-count {
            font-size: 1.5em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        
        .stat-label {
            font-size: 0.85em;
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
            ${data ? this.getResourcesHtmlWithSearch(data) : '<div class="empty-state"><p>Enter a repository URL to browse resources</p></div>'}
        </div>
        
        <div class="sidebar">
            <h3>📚 Recent Repositories</h3>
            <div id="history"></div>
            <button onclick="clearHistory()" style="margin-top: 10px;">Clear History</button>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let currentViewMode = 'grouped'; // 'grouped' or 'flat'
        let activeCategories = new Set(['skills', 'prompts', 'instructions', 'agents']);
        
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
        
        function filterResources() {
            const searchTerm = document.getElementById('filterSearch').value.toLowerCase();
            const items = document.querySelectorAll('.resource-item');
            
            items.forEach(item => {
                const category = item.dataset.category;
                const name = item.querySelector('.resource-name').textContent.toLowerCase();
                const path = item.querySelector('.resource-path').textContent.toLowerCase();
                
                const matchesSearch = !searchTerm || name.includes(searchTerm) || path.includes(searchTerm);
                const matchesCategory = activeCategories.has(category);
                
                if (matchesSearch && matchesCategory) {
                    item.classList.remove('hidden');
                    highlightSearchTerm(item, searchTerm);
                } else {
                    item.classList.add('hidden');
                }
            });
            
            updateSectionVisibility();
        }
        
        function highlightSearchTerm(item, searchTerm) {
            if (!searchTerm) return;
            
            const nameEl = item.querySelector('.resource-name');
            const pathEl = item.querySelector('.resource-path');
            
            [nameEl, pathEl].forEach(el => {
                const text = el.textContent;
                const regex = new RegExp(\`(\${searchTerm})\`, 'gi');
                el.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
            });
        }
        
        function toggleCategory(category) {
            if (activeCategories.has(category)) {
                activeCategories.delete(category);
            } else {
                activeCategories.add(category);
            }
            
            // Update button styles
            const button = document.querySelector(\`.category-filter[data-category="\${category}"]\`);
            if (button) {
                button.classList.toggle('active');
            }
            
            filterResources();
        }
        
        function toggleViewMode() {
            currentViewMode = currentViewMode === 'grouped' ? 'flat' : 'grouped';
            const sections = document.querySelectorAll('.resource-section');
            
            if (currentViewMode === 'flat') {
                sections.forEach(section => {
                    section.classList.add('collapsed');
                    const toggle = section.querySelector('.section-toggle');
                    if (toggle) toggle.textContent = '▶';
                });
            } else {
                sections.forEach(section => {
                    section.classList.remove('collapsed');
                    const toggle = section.querySelector('.section-toggle');
                    if (toggle) toggle.textContent = '▼';
                });
            }
            
            // Update button text
            const viewToggle = document.querySelector('.view-toggle');
            if (viewToggle) {
                viewToggle.textContent = currentViewMode === 'grouped' ? '📋 Flat View' : '📁 Grouped View';
            }
        }
        
        function toggleSection(sectionId) {
            const section = document.getElementById(sectionId);
            if (!section) return;
            
            section.classList.toggle('collapsed');
            const toggle = section.querySelector('.section-toggle');
            if (toggle) {
                toggle.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
            }
        }
        
        function updateSectionVisibility() {
            const sections = document.querySelectorAll('.resource-section');
            sections.forEach(section => {
                const items = section.querySelectorAll('.resource-item:not(.hidden)');
                const header = section.querySelector('.section-header');
                const count = section.querySelector('.section-count');
                
                if (count) {
                    count.textContent = \`(\${items.length})\`;
                }
                
                if (items.length === 0) {
                    section.style.display = 'none';
                } else {
                    section.style.display = 'block';
                }
            });
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

    private getResourcesHtmlWithSearch(data: FetchResult): string {
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
            <div class="stats-summary">
                <div class="stat-item">
                    <div class="stat-count">${skills.length}</div>
                    <div class="stat-label">Skills</div>
                </div>
                <div class="stat-item">
                    <div class="stat-count">${prompts.length}</div>
                    <div class="stat-label">Prompts</div>
                </div>
                <div class="stat-item">
                    <div class="stat-count">${instructions.length}</div>
                    <div class="stat-label">Instructions</div>
                </div>
                <div class="stat-item">
                    <div class="stat-count">${agents.length}</div>
                    <div class="stat-label">Agents</div>
                </div>
                <div class="stat-item">
                    <div class="stat-count">${data.files.length}</div>
                    <div class="stat-label">Total Files</div>
                </div>
            </div>
            
            <input type="text" class="filter-search-box" id="filterSearch" 
                   placeholder="🔍 Search resources by name or path..." 
                   oninput="filterResources()">
            
            <div class="toolbar">
                <div class="category-filters">
                    <button class="category-filter active" data-category="skills" onclick="toggleCategory('skills')">
                        📚 Skills (${skills.length})
                    </button>
                    <button class="category-filter active" data-category="prompts" onclick="toggleCategory('prompts')">
                        💬 Prompts (${prompts.length})
                    </button>
                    <button class="category-filter active" data-category="instructions" onclick="toggleCategory('instructions')">
                        📝 Instructions (${instructions.length})
                    </button>
                    <button class="category-filter active" data-category="agents" onclick="toggleCategory('agents')">
                        🤖 Agents (${agents.length})
                    </button>
                </div>
                <button class="view-toggle" onclick="toggleViewMode()">📋 Flat View</button>
            </div>
            
            ${this.getResourceSection('Skills', 'skills', '📚', skills)}
            ${this.getResourceSection('Prompts', 'prompts', '💬', prompts)}
            ${this.getResourceSection('Instructions', 'instructions', '📝', instructions)}
            ${this.getResourceSection('Agents', 'agents', '🤖', agents)}
        `;
    }

    private getResourceSection(title: string, category: string, icon: string, files: RepoFile[]): string {
        if (files.length === 0) return '';

        return `
            <div class="resource-section" id="section-${category}">
                <div class="section-header" onclick="toggleSection('section-${category}')">
                    <div class="section-title">
                        <span>${icon}</span>
                        <span>${title}</span>
                        <span class="section-count">(${files.length})</span>
                    </div>
                    <span class="section-toggle">▼</span>
                </div>
                <div class="resource-list">
                    ${files.map(file => `
                        <div class="resource-item" data-category="${category}">
                            <div class="resource-info">
                                <div class="resource-name">${this.escapeHtml(file.name)}</div>
                                <div class="resource-path">${this.escapeHtml(file.path)}</div>
                            </div>
                            <div class="import-buttons">
                                <button onclick='importResource(${JSON.stringify(file)}, "project")'>📁 Project</button>
                                <button onclick='importResource(${JSON.stringify(file)}, "user-global")'>👤 User</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    private escapeHtml(text: string): string {
        const div = { textContent: text } as any;
        return div.textContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private getVsCodeApi(): string {
        return 'const vscode = acquireVsCodeApi();';
    }
}
