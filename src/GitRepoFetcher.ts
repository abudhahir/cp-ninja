export interface RepoFile {
    name: string;
    path: string;
    type: 'file' | 'dir';
    downloadUrl?: string;
    sha: string;
}

export interface FetchResult {
    files: RepoFile[];
    skillsCount: number;
    promptsCount: number;
    instructionsCount: number;
    agentsCount: number;
}

// Type definitions for fetch API
type HeadersInit = Record<string, string>;

// Declare fetch for Node.js environment
declare function fetch(url: string, init?: { headers?: HeadersInit }): Promise<{
    ok: boolean;
    status: number;
    statusText: string;
    json(): Promise<any>;
    text(): Promise<string>;
}>;

export class GitRepoFetcher {
    private cache = new Map<string, { data: FetchResult; expires: number }>();
    private static readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    private parseRepoUrl(url: string): { owner: string; repo: string } {
        // Handle both formats: "owner/repo" or "https://github.com/owner/repo"
        const match = url.match(/(?:github\.com\/)?([^\/]+)\/([^\/\s]+)/);
        if (!match) {
            throw new Error('Invalid repository URL format. Use owner/repo or https://github.com/owner/repo');
        }
        return { 
            owner: match[1], 
            repo: match[2].replace('.git', '') 
        };
    }

    async fetchRepoContents(
        repoUrl: string,
        token?: string
    ): Promise<FetchResult> {
        const { owner, repo } = this.parseRepoUrl(repoUrl);
        const cacheKey = `${owner}/${repo}`;

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() < cached.expires) {
            console.log(`Using cached data for ${cacheKey}`);
            return cached.data;
        }

        // Use recursive fetch instead of simple fetch
        const files = await this.fetchDirectoryRecursive(owner, repo, '', token);
        const result = this.categorizeResources(files);

        // Cache result
        this.cache.set(cacheKey, {
            data: result,
            expires: Date.now() + GitRepoFetcher.CACHE_DURATION
        });

        return result;
    }

    private async fetchViaGitHubAPI(
        owner: string,
        repo: string,
        token?: string
    ): Promise<RepoFile[]> {
        const baseUrl = 'https://api.github.com';
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'cp-ninja-vscode-extension'
        };

        if (token) {
            headers['Authorization'] = `token ${token}`;
        }

        const response = await fetch(
            `${baseUrl}/repos/${owner}/${repo}/contents`,
            { headers }
        );

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Repository not found or is private');
            } else if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded. Try again later or add a token.');
            } else if (response.status === 401) {
                throw new Error('Authentication failed. Check your token.');
            }
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.map((item: any) => ({
            name: item.name,
            path: item.path,
            type: item.type === 'dir' ? 'dir' : 'file',
            downloadUrl: item.download_url,
            sha: item.sha
        }));
    }

    private async fetchDirectoryRecursive(
        owner: string,
        repo: string,
        path: string,
        token?: string,
        depth: number = 0
    ): Promise<RepoFile[]> {
        const MAX_DEPTH = 5; // Prevent infinite recursion
        if (depth > MAX_DEPTH) {
            return [];
        }

        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'cp-ninja-vscode-extension'
        };

        if (token) {
            headers['Authorization'] = `token ${token}`;
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const response = await fetch(url, { headers });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        const allFiles: RepoFile[] = [];

        for (const item of data) {
            const file: RepoFile = {
                name: item.name,
                path: item.path,
                type: item.type === 'dir' ? 'dir' : 'file',
                downloadUrl: item.download_url,
                sha: item.sha
            };

            if (item.type === 'dir') {
                // Skip irrelevant directories
                if (this.shouldSkipDirectory(item.name)) {
                    continue;
                }

                // Recursively fetch subdirectory
                const subFiles = await this.fetchDirectoryRecursive(
                    owner,
                    repo,
                    item.path,
                    token,
                    depth + 1
                );
                allFiles.push(...subFiles);
            } else {
                allFiles.push(file);
            }
        }

        return allFiles;
    }

    private shouldSkipDirectory(name: string): boolean {
        const skipDirs = ['node_modules', '.git', 'dist', 'build', 'out', '.vscode', 'coverage'];
        return skipDirs.includes(name);
    }

    private categorizeResources(files: RepoFile[]): FetchResult {
        let skillsCount = 0;
        let promptsCount = 0;
        let instructionsCount = 0;
        let agentsCount = 0;

        for (const file of files) {
            const lowerPath = file.path.toLowerCase();

            // Skills: .github/skills/*/SKILL.md or .github/skills/*/*.md
            if (lowerPath.includes('.github/skills/') && lowerPath.endsWith('.md')) {
                skillsCount++;
            }
            // Prompts: .github/prompts/*.prompt.md or *-prompt.md
            else if (
                (lowerPath.includes('.github/prompts/') && lowerPath.endsWith('.md')) ||
                lowerPath.endsWith('-prompt.md') ||
                lowerPath.endsWith('.prompt.md')
            ) {
                promptsCount++;
            }
            // Instructions: .github/instructions/*.instructions.md or .github/copilot-instructions.md
            else if (
                (lowerPath.includes('.github/instructions/') && lowerPath.endsWith('.md')) ||
                lowerPath.includes('copilot-instructions.md') ||
                lowerPath.endsWith('.instructions.md')
            ) {
                instructionsCount++;
            }
            // Agents: AGENTS.md anywhere
            else if (lowerPath.endsWith('agents.md')) {
                agentsCount++;
            }
        }

        return {
            files,
            skillsCount,
            promptsCount,
            instructionsCount,
            agentsCount
        };
    }

    async fetchFileContent(
        repoUrl: string,
        filePath: string,
        token?: string
    ): Promise<string> {
        const { owner, repo } = this.parseRepoUrl(repoUrl);
        
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'cp-ninja-vscode-extension'
        };

        if (token) {
            headers['Authorization'] = `token ${token}`;
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        const response = await fetch(url, { headers });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`File not found: ${filePath}`);
            } else if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded. Try again later or add a token.');
            } else if (response.status === 401) {
                throw new Error('Authentication failed. Check your token.');
            }
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        return await response.text();
    }

    clearCache(): void {
        this.cache.clear();
        console.log('GitRepoFetcher cache cleared');
    }
}
