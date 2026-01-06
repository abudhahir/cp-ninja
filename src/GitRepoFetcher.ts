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

        const files = await this.fetchViaGitHubAPI(owner, repo, token);
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

    private categorizeResources(files: RepoFile[]): FetchResult {
        // Placeholder - will implement actual categorization
        return {
            files,
            skillsCount: 0,
            promptsCount: 0,
            instructionsCount: 0,
            agentsCount: 0
        };
    }
}
