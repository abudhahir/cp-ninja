import * as vscode from 'vscode';
import { findSkillsInDir, Skill } from './lib/skills-core';
import { ConfigurationManager } from './ConfigurationManager';

export class SkillsWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'cp-ninja.skillsView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private skillsDir: string,
        private personalSkillsDir: string,
        private configManager?: ConfigurationManager
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'openSkill':
                    await this._openSkillInEditor(data.skillFile);
                    break;
                case 'addToFavorites':
                    await this._addToFavorites(data.skillName);
                    break;
                case 'removeFromFavorites':
                    await this._removeFromFavorites(data.skillName);
                    break;
                case 'requestSkills':
                    this._sendSkillsToWebview();
                    break;
            }
        });

        // Send initial skills data
        this._sendSkillsToWebview();
    }

    private _sendSkillsToWebview() {
        if (!this._view) {
            return;
        }

        const cpNinjaSkills = findSkillsInDir(this.skillsDir, 'cp-ninja');
        const personalSkills = findSkillsInDir(this.personalSkillsDir, 'personal');
        const allSkills = [...cpNinjaSkills, ...personalSkills];

        const favoriteSkills = this.configManager?.getEffectiveConfig().favoriteSkills || [];

        const skillsData = allSkills.map(skill => ({
            name: skill.name,
            description: skill.description,
            sourceType: skill.sourceType,
            skillFile: skill.skillFile,
            isFavorite: favoriteSkills.includes(skill.name)
        }));

        this._view.webview.postMessage({
            type: 'updateSkills',
            skills: skillsData
        });
    }

    public refresh() {
        this._sendSkillsToWebview();
    }

    private async _openSkillInEditor(skillFile: string) {
        try {
            const uri = vscode.Uri.file(skillFile);
            await vscode.commands.executeCommand('vscode.open', uri, {
                preview: true,
                preserveFocus: false
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open skill: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async _addToFavorites(skillName: string) {
        if (this.configManager) {
            await this.configManager.addToFavorites(skillName);
            vscode.window.showInformationMessage(`Added "${skillName}" to favorites`);
            this.refresh();
        }
    }

    private async _removeFromFavorites(skillName: string) {
        if (this.configManager) {
            await this.configManager.removeFromFavorites(skillName);
            vscode.window.showInformationMessage(`Removed "${skillName}" from favorites`);
            this.refresh();
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skills Explorer</title>
    <style>
        body {
            padding: 0;
            margin: 0;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
        }

        .search-container {
            position: sticky;
            top: 0;
            padding: 8px 12px;
            background-color: var(--vscode-sideBar-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            z-index: 100;
        }

        .search-box {
            width: 100%;
            padding: 6px 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            outline: none;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }

        .search-box:focus {
            border-color: var(--vscode-focusBorder);
        }

        .search-box::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }

        .skills-list {
            padding: 4px 0;
        }

        .skill-item {
            display: flex;
            align-items: flex-start;
            padding: 8px 12px;
            cursor: pointer;
            border-left: 2px solid transparent;
        }

        .skill-item:hover {
            background-color: var(--vscode-list-hoverBackground);
            border-left-color: var(--vscode-focusBorder);
        }

        .skill-icon {
            flex-shrink: 0;
            margin-right: 8px;
            opacity: 0.8;
        }

        .skill-content {
            flex: 1;
            min-width: 0;
        }

        .skill-name {
            font-weight: 500;
            margin-bottom: 2px;
        }

        .skill-description {
            font-size: 0.9em;
            opacity: 0.8;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }

        .skill-actions {
            display: flex;
            gap: 4px;
            margin-left: 8px;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .skill-item:hover .skill-actions {
            opacity: 1;
        }

        .action-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px 4px;
            color: var(--vscode-foreground);
            opacity: 0.7;
            font-size: 1.1em;
        }

        .action-button:hover {
            opacity: 1;
            background-color: var(--vscode-list-hoverBackground);
        }

        .no-results {
            padding: 20px;
            text-align: center;
            opacity: 0.6;
        }

        .filter-info {
            padding: 4px 12px;
            font-size: 0.85em;
            opacity: 0.7;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .favorite-star {
            color: #f9a825;
        }

        .source-badge {
            display: inline-block;
            padding: 1px 6px;
            font-size: 0.75em;
            border-radius: 3px;
            margin-left: 6px;
            opacity: 0.7;
        }

        .badge-cp-ninja {
            background-color: rgba(0, 122, 204, 0.2);
            color: #007acc;
        }

        .badge-personal {
            background-color: rgba(76, 175, 80, 0.2);
            color: #4caf50;
        }
    </style>
</head>
<body>
    <div class="search-container">
        <input 
            type="text" 
            class="search-box" 
            id="searchInput" 
            placeholder="🔍 Type to search skills..."
            autocomplete="off"
            spellcheck="false"
        >
    </div>
    <div id="filterInfo" class="filter-info" style="display: none;"></div>
    <div id="skillsList" class="skills-list"></div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let allSkills = [];

        const searchInput = document.getElementById('searchInput');
        const skillsList = document.getElementById('skillsList');
        const filterInfo = document.getElementById('filterInfo');

        // Request initial skills data
        vscode.postMessage({ type: 'requestSkills' });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'updateSkills') {
                allSkills = message.skills;
                renderSkills();
            }
        });

        // Search input handler with debouncing
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                renderSkills();
            }, 150);
        });

        function renderSkills() {
            const query = searchInput.value.toLowerCase().trim();
            
            let filtered = allSkills;
            if (query) {
                filtered = allSkills.filter(skill => 
                    skill.name.toLowerCase().includes(query) ||
                    skill.description.toLowerCase().includes(query)
                );
            }

            // Sort: favorites first, then alphabetically
            filtered.sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1;
                if (!a.isFavorite && b.isFavorite) return 1;
                return a.name.localeCompare(b.name);
            });

            // Update filter info
            if (query) {
                filterInfo.style.display = 'block';
                filterInfo.textContent = \`Showing \${filtered.length} of \${allSkills.length} skills\`;
            } else {
                filterInfo.style.display = 'none';
            }

            // Render skills
            if (filtered.length === 0) {
                skillsList.innerHTML = \`
                    <div class="no-results">
                        \${query ? \`No skills match "\${query}"\` : 'No skills available'}
                    </div>
                \`;
                return;
            }

            skillsList.innerHTML = filtered.map(skill => {
                const icon = skill.sourceType === 'cp-ninja' ? '✓' : '👤';
                const favoriteIcon = skill.isFavorite ? '<span class="favorite-star">⭐</span>' : '';
                const sourceBadge = \`<span class="source-badge badge-\${skill.sourceType}">\${skill.sourceType}</span>\`;
                
                return \`
                    <div class="skill-item" data-skill-file="\${skill.skillFile}" data-skill-name="\${skill.name}">
                        <div class="skill-icon">\${icon}</div>
                        <div class="skill-content">
                            <div class="skill-name">
                                \${favoriteIcon}
                                \${skill.name}
                                \${sourceBadge}
                            </div>
                            <div class="skill-description">\${skill.description}</div>
                        </div>
                        <div class="skill-actions">
                            <button class="action-button favorite-btn" 
                                    data-skill-name="\${skill.name}" 
                                    data-is-favorite="\${skill.isFavorite}"
                                    title="\${skill.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                                \${skill.isFavorite ? '★' : '☆'}
                            </button>
                        </div>
                    </div>
                \`;
            }).join('');

            // Add click handlers
            document.querySelectorAll('.skill-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.classList.contains('favorite-btn')) {
                        e.stopPropagation();
                        const skillName = e.target.dataset.skillName;
                        const isFavorite = e.target.dataset.isFavorite === 'true';
                        vscode.postMessage({
                            type: isFavorite ? 'removeFromFavorites' : 'addToFavorites',
                            skillName: skillName
                        });
                    } else {
                        const skillFile = item.dataset.skillFile;
                        vscode.postMessage({
                            type: 'openSkill',
                            skillFile: skillFile
                        });
                    }
                });
            });
        }

        // Focus search box on load
        searchInput.focus();
    </script>
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
