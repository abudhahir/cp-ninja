import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { RemoteResource, GitRepositoryConfig, FetchResult } from './types/ResourceTypes';

export class RemoteResourceManager {
    private static readonly GITHUB_API = 'https://api.github.com';
    private static readonly GITLAB_API = 'https://gitlab.com/api/v4';
    private static outputChannel: vscode.OutputChannel;

    constructor(
        private workspacePath: string,
        private globalGitHubDir: string,
        private globalCpNinjaDir: string
    ) {
        if (!RemoteResourceManager.outputChannel) {
            RemoteResourceManager.outputChannel = vscode.window.createOutputChannel('CP Ninja Remote Resources');
            RemoteResourceManager.outputChannel.show();
        }
    }
    
    private log(message: string) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        RemoteResourceManager.outputChannel.appendLine(logMessage);
        console.log(logMessage);
    }

    /**
     * Fetch available resources from a remote Git repository
     */
    async listRemoteResources(config: GitRepositoryConfig): Promise<RemoteResource[]> {
        const resources: RemoteResource[] = [];
        
        this.log('=== RemoteResourceManager.listRemoteResources called ===');
        this.log(`Config: ${JSON.stringify(config, null, 2)}`);
        
        try {
            const repoInfo = this.parseGitUrl(config.url);
            this.log(`Parsed repo info: ${JSON.stringify(repoInfo)}`);
            
            if (repoInfo.platform === 'github') {
                this.log('Using GitHub API');
                resources.push(...await this.listGitHubResources(repoInfo, config));
            } else if (repoInfo.platform === 'gitlab') {
                this.log('Using GitLab API');
                resources.push(...await this.listGitLabResources(repoInfo, config));
            } else {
                throw new Error(`Unsupported Git platform: ${repoInfo.platform}`);
            }
            
            this.log(`Final resources count: ${resources.length}`);
            return resources;
        } catch (error) {
            this.log(`ERROR in listRemoteResources: ${error}`);
            throw new Error(`Failed to list remote resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Download and save selected resources to local directories
     */
    async fetchResources(
        resources: RemoteResource[],
        destination: 'project' | 'global',
        config: GitRepositoryConfig
    ): Promise<FetchResult> {
        const success: Array<{ name: string; path: string }> = [];
        const failed: string[] = [];

        for (const resource of resources) {
            try {
                const content = await this.downloadResourceContent(resource.url, config.token);
                const targetPath = this.getTargetPath(resource, destination);
                const targetDir = path.dirname(targetPath);
                
                // Debug logging
                this.log(`Downloading ${resource.name} (${resource.type})`);
                this.log(`Target path: ${targetPath}`);
                this.log(`Target dir: ${targetDir}`);
                
                // Ensure the full directory path exists
                await fs.promises.mkdir(targetDir, { recursive: true });
                await fs.promises.writeFile(targetPath, content, 'utf8');
                
                this.log(`✓ Successfully saved to ${targetPath}`);
                success.push({ name: resource.name, path: targetPath });
            } catch (error) {
                this.log(`✗ Failed to save ${resource.name}: ${error}`);
                failed.push(`${resource.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return { success, failed };
    }

    /**
     * Parse Git repository URL to extract platform and owner/repo information
     */
    private parseGitUrl(url: string): { platform: 'github' | 'gitlab' | 'unknown', owner: string, repo: string } {
        // Handle both HTTPS and SSH URLs
        const githubHttps = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
        const gitlabHttps = url.match(/gitlab\.com[/:]([^/]+)\/([^/.]+)/);
        
        if (githubHttps) {
            return { platform: 'github', owner: githubHttps[1], repo: githubHttps[2].replace(/\.git$/, '') };
        } else if (gitlabHttps) {
            return { platform: 'gitlab', owner: gitlabHttps[1], repo: gitlabHttps[2].replace(/\.git$/, '') };
        }
        
        return { platform: 'unknown', owner: '', repo: '' };
    }

    /**
     * List resources from GitHub repository
     */
    private async listGitHubResources(
        repoInfo: { owner: string, repo: string },
        config: GitRepositoryConfig
    ): Promise<RemoteResource[]> {
        const resources: RemoteResource[] = [];
        const branch = config.branch || 'main';

        // Map plural path keys to singular resource types
        const typeMapping: Record<string, RemoteResource['type']> = {
            'agents': 'agent',
            'prompts': 'prompt',
            'skills': 'skill',
            'instructions': 'instruction',
            'profiles': 'profile'
        };

        // Fetch resources from each configured path
        for (const [pathKey, dirPath] of Object.entries(config.paths)) {
            if (!dirPath) continue;

            try {
                const apiUrl = `${RemoteResourceManager.GITHUB_API}/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${dirPath}?ref=${branch}`;
                console.log(`Fetching from GitHub: ${apiUrl}`);
                const items = await this.fetchGitHubDirectory(apiUrl, config.token);
                console.log(`Found ${items.length} items in ${dirPath}`);

                for (const item of items) {
                    console.log(`  - ${item.name} (${item.type})`);
                    // Check if it's a file
                    if (item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.json'))) {
                        const resourceType = typeMapping[pathKey];
                        if (resourceType) {
                            resources.push({
                                name: item.name,
                                path: item.path,
                                type: resourceType,
                                url: item.download_url,
                                description: `From ${dirPath}`
                            });
                        }
                    }
                    // If it's a directory, recursively fetch its contents
                    else if (item.type === 'dir') {
                        try {
                            const subDirUrl = `${RemoteResourceManager.GITHUB_API}/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${item.path}?ref=${branch}`;
                            const subItems = await this.fetchGitHubDirectory(subDirUrl, config.token);
                            console.log(`  Found ${subItems.length} items in subdirectory ${item.name}`);
                            
                            for (const subItem of subItems) {
                                if (subItem.type === 'file' && (subItem.name.endsWith('.md') || subItem.name.endsWith('.json'))) {
                                    const resourceType = typeMapping[pathKey];
                                    if (resourceType) {
                                        resources.push({
                                            name: `${item.name}/${subItem.name}`,
                                            path: subItem.path,
                                            type: resourceType,
                                            url: subItem.download_url,
                                            description: `From ${dirPath}/${item.name}`
                                        });
                                    }
                                }
                            }
                        } catch (error) {
                            console.warn(`Failed to fetch subdirectory ${item.path}:`, error);
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch ${pathKey} from ${dirPath}:`, error);
            }
        }

        console.log(`Total resources found: ${resources.length}`);
        return resources;
    }

    /**
     * List resources from GitLab repository
     */
    private async listGitLabResources(
        repoInfo: { owner: string, repo: string },
        config: GitRepositoryConfig
    ): Promise<RemoteResource[]> {
        const resources: RemoteResource[] = [];
        const branch = config.branch || 'main';
        const projectPath = encodeURIComponent(`${repoInfo.owner}/${repoInfo.repo}`);

        // Map plural path keys to singular resource types
        const typeMapping: Record<string, RemoteResource['type']> = {
            'agents': 'agent',
            'prompts': 'prompt',
            'skills': 'skill',
            'instructions': 'instruction',
            'profiles': 'profile'
        };

        // Fetch resources from each configured path
        for (const [pathKey, dirPath] of Object.entries(config.paths)) {
            if (!dirPath) continue;

            try {
                const apiUrl = `${RemoteResourceManager.GITLAB_API}/projects/${projectPath}/repository/tree?path=${encodeURIComponent(dirPath)}&ref=${branch}`;
                const items = await this.fetchGitLabDirectory(apiUrl, config.token);

                for (const item of items) {
                    // Check if it's a file
                    if (item.type === 'blob' && (item.name.endsWith('.md') || item.name.endsWith('.json'))) {
                        const rawUrl = `${RemoteResourceManager.GITLAB_API}/projects/${projectPath}/repository/files/${encodeURIComponent(item.path)}/raw?ref=${branch}`;
                        const resourceType = typeMapping[pathKey];
                        if (resourceType) {
                            resources.push({
                                name: item.name,
                                path: item.path,
                                type: resourceType,
                                url: rawUrl,
                                description: `From ${dirPath}`
                            });
                        }
                    }
                    // If it's a directory (tree), recursively fetch its contents
                    else if (item.type === 'tree') {
                        try {
                            const subDirUrl = `${RemoteResourceManager.GITLAB_API}/projects/${projectPath}/repository/tree?path=${encodeURIComponent(item.path)}&ref=${branch}`;
                            const subItems = await this.fetchGitLabDirectory(subDirUrl, config.token);
                            
                            for (const subItem of subItems) {
                                if (subItem.type === 'blob' && (subItem.name.endsWith('.md') || subItem.name.endsWith('.json'))) {
                                    const rawUrl = `${RemoteResourceManager.GITLAB_API}/projects/${projectPath}/repository/files/${encodeURIComponent(subItem.path)}/raw?ref=${branch}`;
                                    const resourceType = typeMapping[pathKey];
                                    if (resourceType) {
                                        resources.push({
                                            name: `${item.name}/${subItem.name}`,
                                            path: subItem.path,
                                            type: resourceType,
                                            url: rawUrl,
                                            description: `From ${dirPath}/${item.name}`
                                        });
                                    }
                                }
                            }
                        } catch (error) {
                            console.warn(`Failed to fetch subdirectory ${item.path}:`, error);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Failed to fetch ${pathKey} from ${dirPath}:`, error);
            }
        }

        return resources;
    }

    /**
     * Fetch directory contents from GitHub API
     */
    private async fetchGitHubDirectory(apiUrl: string, token?: string): Promise<any[]> {
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'cp-ninja-vscode-extension'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            this.log(`Using token: ${token.substring(0, 8)}...`);
        } else {
            this.log('No token provided - using unauthenticated request');
        }

        return this.httpGet(apiUrl, headers);
    }

    /**
     * Fetch directory contents from GitLab API
     */
    private async fetchGitLabDirectory(apiUrl: string, token?: string): Promise<any[]> {
        const headers: Record<string, string> = {
            'User-Agent': 'cp-ninja-vscode-extension'
        };
        
        if (token) {
            headers['PRIVATE-TOKEN'] = token;
        }

        return this.httpGet(apiUrl, headers);
    }

    /**
     * Download content from a URL
     */
    private async downloadResourceContent(url: string, token?: string): Promise<string> {
        const headers: Record<string, string> = {
            'User-Agent': 'cp-ninja-vscode-extension'
        };
        
        // Determine if it's GitHub or GitLab based on URL
        if (url.includes('github.com')) {
            if (token) {
                headers['Authorization'] = `token ${token}`;
            }
        } else if (url.includes('gitlab.com')) {
            if (token) {
                headers['PRIVATE-TOKEN'] = token;
            }
        }

        return this.httpGet(url, headers);
    }

    /**
     * Generic HTTP GET request using Node.js https module
     */
    private httpGet(url: string, headers: Record<string, string>): Promise<any> {
        this.log(`HTTP GET: ${url}`);
        this.log(`Headers: ${Object.keys(headers).join(', ')}`);
        
        return new Promise((resolve, reject) => {
            https.get(url, { headers }, (response) => {
                let data = '';
                
                this.log(`Response status: ${response.statusCode}`);
                
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    if (response.headers.location) {
                        this.log(`Redirecting to: ${response.headers.location}`);
                        return this.httpGet(response.headers.location, headers)
                            .then(resolve)
                            .catch(reject);
                    }
                }
                
                if (response.statusCode !== 200) {
                    const error = new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`);
                    this.log(`ERROR: ${error.message}`);
                    reject(error);
                    return;
                }
                
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    try {
                        // Try to parse as JSON, otherwise return as string
                        const result = response.headers['content-type']?.includes('application/json') 
                            ? JSON.parse(data) 
                            : data;
                        this.log(`Response received, ${Array.isArray(result) ? result.length + ' items' : 'string data'}`);
                        resolve(result);
                    } catch (error) {
                        this.log('Response is raw text');
                        resolve(data); // Return raw data if JSON parsing fails
                    }
                });
            }).on('error', (error) => {
                this.log(`HTTP request error: ${error.message}`);
                reject(error);
            });
        });
    }

    /**
     * Get target path for a resource based on destination
     * Global: Uses VS Code User directory (same as GitHub Copilot)
     * Project: Uses workspace .github/ directory
     */
    private getTargetPath(resource: RemoteResource, destination: 'project' | 'global'): string {
        if (destination === 'project') {
            switch (resource.type) {
                case 'agent':
                case 'prompt':
                    return path.join(this.workspacePath, '.github', 'prompts', resource.name);
                case 'instruction':
                    // GitHub Copilot convention: copilot-instructions.md in .github root
                    return path.join(this.workspacePath, '.github', 'copilot-instructions.md');
                case 'skill':
                    return path.join(this.workspacePath, '.cp-ninja', 'skills', resource.name);
                case 'profile':
                    return path.join(this.workspacePath, '.cp-ninja', 'profiles', resource.name);
                default:
                    throw new Error(`Unknown resource type: ${resource.type}`);
            }
        } else {
            // global destination: use VS Code User directory (where GitHub Copilot stores prompts)
            // globalGitHubDir points to ~/Library/Application Support/Code/User/prompts
            switch (resource.type) {
                case 'agent':
                case 'prompt':
                    // Store in same location as GitHub Copilot prompts
                    return path.join(this.globalGitHubDir, resource.name);
                case 'instruction':
                    // Global GitHub Copilot instructions - store alongside prompts
                    return path.join(path.dirname(this.globalGitHubDir), 'copilot-instructions.md');
                case 'skill':
                    return path.join(this.globalCpNinjaDir, 'skills', resource.name);
                case 'profile':
                    return path.join(this.globalCpNinjaDir, 'profiles', resource.name);
                default:
                    throw new Error(`Unknown resource type: ${resource.type}`);
            }
        }
    }

    /**
     * Ensure directory exists
     */
    private async ensureDirectory(dirPath: string): Promise<void> {
        try {
            await fs.promises.access(dirPath);
        } catch {
            await fs.promises.mkdir(dirPath, { recursive: true });
        }
    }

    /**
     * Get configured remote repositories from VS Code settings
     */
    static getConfiguredRepositories(): GitRepositoryConfig[] {
        const config = vscode.workspace.getConfiguration('cpNinja');
        const repos = config.get<GitRepositoryConfig[]>('remoteRepositories', []);
        
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('CP Ninja Remote Resources');
        }
        
        this.outputChannel.appendLine('=== Getting Configured Repositories ===');
        this.outputChannel.appendLine(`Found ${repos.length} repositories in config`);
        this.outputChannel.appendLine(JSON.stringify(repos, null, 2));
        
        // Resolve environment variables in tokens
        const resolved = repos.map(repo => ({
            ...repo,
            token: repo.token ? this.resolveEnvVars(repo.token) : undefined
        }));
        
        this.outputChannel.appendLine('Resolved tokens (masked):');
        resolved.forEach((r, i) => {
            this.outputChannel.appendLine(`  [${i}] ${r.url} - token: ${r.token ? r.token.substring(0, 4) + '...' : 'NONE'}`);
        });
        
        return resolved;
    }

    /**
     * Resolve environment variables in strings like ${env:VAR_NAME}
     */
    private static resolveEnvVars(value: string): string {
        const resolved = value.replace(/\$\{env:([^}]+)\}/g, (_, envVar) => {
            const envValue = process.env[envVar];
            if (!this.outputChannel) {
                this.outputChannel = vscode.window.createOutputChannel('CP Ninja Remote Resources');
            }
            this.outputChannel.appendLine(`Resolving env var ${envVar}: ${envValue ? 'FOUND' : 'NOT FOUND'}`);
            return envValue || '';
        });
        return resolved;
    }
}
