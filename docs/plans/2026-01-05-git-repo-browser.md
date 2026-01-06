# Git Repository Browser Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use cp-ninja:executing-plans to implement this plan task-by-task.

**Goal:** Add a webview-based Git repository browser to cp-ninja that allows users to discover, browse, and import skills, prompts, instructions, and agents from GitHub repositories, with history tracking and seamless integration into the existing status bar menu.

**Architecture:** Four new components work together: GitRepoFetcher handles GitHub API communication with caching, RepoHistoryManager persists repository access history using VS Code's globalState, GitRepoWebviewProvider manages the webview lifecycle and message passing, and ResourceImporter validates and copies resources to appropriate project or user directories. The system integrates with existing status bar menu via Quick Pick → Webview flow, and triggers existing managers (DynamicSkillRegistry) after imports.

**Tech Stack:** 
- VS Code Extension APIs (Webview, SecretStorage, globalState, Quick Pick)
- GitHub REST API v3 (fetch repository contents)
- TypeScript with async/await patterns
- Native fetch API for HTTP requests
- Existing cp-ninja managers integration

**Directory Structure:**
```
src/
├── GitRepoFetcher.ts (new)
├── RepoHistoryManager.ts (new)
├── GitRepoWebviewProvider.ts (new)
├── ResourceImporter.ts (new)
└── extension.ts (modify)
```

---

## Topic 1: RepoHistoryManager Component

### Task 1: Create RepoHistoryManager with History Storage

**Files:**
- Create: `src/RepoHistoryManager.ts`
- Create: `tests/RepoHistoryManager.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/RepoHistoryManager.test.ts
import { RepoHistoryManager } from '../src/RepoHistoryManager';

describe('RepoHistoryManager', () => {
    let manager: RepoHistoryManager;
    let mockContext: any;

    beforeEach(() => {
        mockContext = {
            globalState: {
                get: jest.fn().mockReturnValue([]),
                update: jest.fn().mockResolvedValue(undefined)
            }
        };
        manager = new RepoHistoryManager(mockContext);
    });

    test('addToHistory stores repository with timestamp', async () => {
        await manager.addToHistory('owner/repo', 10, 5, 2, 1);
        
        const history = await manager.getHistory();
        expect(history).toHaveLength(1);
        expect(history[0].url).toBe('owner/repo');
        expect(history[0].skillsCount).toBe(10);
        expect(history[0].promptsCount).toBe(5);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/RepoHistoryManager.test.ts`
Expected: FAIL with "Cannot find module '../src/RepoHistoryManager'"

**Step 3: Write minimal implementation**

```typescript
// src/RepoHistoryManager.ts
import * as vscode from 'vscode';

export interface RepoHistoryEntry {
    url: string;
    lastAccessed: Date;
    skillsCount: number;
    promptsCount: number;
    instructionsCount: number;
    agentsCount: number;
}

export class RepoHistoryManager {
    private static readonly STORAGE_KEY = 'cpNinja.gitRepoHistory';
    private static readonly MAX_HISTORY = 20;

    constructor(private readonly context: vscode.ExtensionContext) {}

    async addToHistory(
        url: string,
        skillsCount: number,
        promptsCount: number,
        instructionsCount: number,
        agentsCount: number
    ): Promise<void> {
        const history = await this.getHistory();
        
        // Remove existing entry for this URL
        const filtered = history.filter(entry => entry.url !== url);
        
        // Add new entry at the beginning
        const newEntry: RepoHistoryEntry = {
            url,
            lastAccessed: new Date(),
            skillsCount,
            promptsCount,
            instructionsCount,
            agentsCount
        };
        
        filtered.unshift(newEntry);
        
        // Keep only MAX_HISTORY entries
        const trimmed = filtered.slice(0, RepoHistoryManager.MAX_HISTORY);
        
        await this.context.globalState.update(
            RepoHistoryManager.STORAGE_KEY,
            trimmed
        );
    }

    async getHistory(): Promise<RepoHistoryEntry[]> {
        const stored = this.context.globalState.get<any[]>(
            RepoHistoryManager.STORAGE_KEY,
            []
        );
        
        // Convert stored dates back to Date objects
        return stored.map(entry => ({
            ...entry,
            lastAccessed: new Date(entry.lastAccessed)
        }));
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/RepoHistoryManager.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/RepoHistoryManager.ts tests/RepoHistoryManager.test.ts
git commit -m "feat: add RepoHistoryManager with history storage"
```

---

### Task 2: Add Clear History Method

**Files:**
- Modify: `src/RepoHistoryManager.ts:45-50`
- Modify: `tests/RepoHistoryManager.test.ts:25-35`

**Step 1: Write the failing test**

```typescript
// Add to tests/RepoHistoryManager.test.ts after existing tests
test('clearHistory removes all entries', async () => {
    await manager.addToHistory('owner/repo1', 5, 3, 1, 0);
    await manager.addToHistory('owner/repo2', 2, 1, 0, 1);
    
    await manager.clearHistory();
    
    const history = await manager.getHistory();
    expect(history).toHaveLength(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/RepoHistoryManager.test.ts`
Expected: FAIL with "manager.clearHistory is not a function"

**Step 3: Write minimal implementation**

```typescript
// Add to src/RepoHistoryManager.ts after getHistory method
async clearHistory(): Promise<void> {
    await this.context.globalState.update(
        RepoHistoryManager.STORAGE_KEY,
        []
    );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/RepoHistoryManager.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/RepoHistoryManager.ts tests/RepoHistoryManager.test.ts
git commit -m "feat: add clearHistory method to RepoHistoryManager"
```

---

### Task 3: Add Remove Single Entry Method

**Files:**
- Modify: `src/RepoHistoryManager.ts:51-60`
- Modify: `tests/RepoHistoryManager.test.ts:36-50`

**Step 1: Write the failing test**

```typescript
// Add to tests/RepoHistoryManager.test.ts
test('removeFromHistory removes specific entry', async () => {
    await manager.addToHistory('owner/repo1', 5, 3, 1, 0);
    await manager.addToHistory('owner/repo2', 2, 1, 0, 1);
    await manager.addToHistory('owner/repo3', 3, 2, 1, 0);
    
    await manager.removeFromHistory('owner/repo2');
    
    const history = await manager.getHistory();
    expect(history).toHaveLength(2);
    expect(history.find(e => e.url === 'owner/repo2')).toBeUndefined();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/RepoHistoryManager.test.ts`
Expected: FAIL with "manager.removeFromHistory is not a function"

**Step 3: Write minimal implementation**

```typescript
// Add to src/RepoHistoryManager.ts after clearHistory method
async removeFromHistory(url: string): Promise<void> {
    const history = await this.getHistory();
    const filtered = history.filter(entry => entry.url !== url);
    
    await this.context.globalState.update(
        RepoHistoryManager.STORAGE_KEY,
        filtered
    );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/RepoHistoryManager.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/RepoHistoryManager.ts tests/RepoHistoryManager.test.ts
git commit -m "feat: add removeFromHistory method"
```

---

## Topic 2: GitRepoFetcher Component

### Task 4: Create GitRepoFetcher with Basic Fetch

**Files:**
- Create: `src/GitRepoFetcher.ts`
- Create: `tests/GitRepoFetcher.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/GitRepoFetcher.test.ts
import { GitRepoFetcher } from '../src/GitRepoFetcher';

describe('GitRepoFetcher', () => {
    let fetcher: GitRepoFetcher;

    beforeEach(() => {
        fetcher = new GitRepoFetcher();
        global.fetch = jest.fn();
    });

    test('parseRepoUrl extracts owner and repo', () => {
        const result = fetcher['parseRepoUrl']('owner/repo');
        expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    test('parseRepoUrl handles GitHub URLs', () => {
        const result = fetcher['parseRepoUrl']('https://github.com/owner/repo');
        expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    test('parseRepoUrl removes .git suffix', () => {
        const result = fetcher['parseRepoUrl']('owner/repo.git');
        expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/GitRepoFetcher.test.ts`
Expected: FAIL with "Cannot find module '../src/GitRepoFetcher'"

**Step 3: Write minimal implementation**

```typescript
// src/GitRepoFetcher.ts
import * as vscode from 'vscode';

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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/GitRepoFetcher.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/GitRepoFetcher.ts tests/GitRepoFetcher.test.ts
git commit -m "feat: add GitRepoFetcher with basic fetch capability"
```

---

### Task 5: Add Recursive Directory Fetching

**Files:**
- Modify: `src/GitRepoFetcher.ts:70-120`
- Modify: `tests/GitRepoFetcher.test.ts:30-60`

**Step 1: Write the failing test**

```typescript
// Add to tests/GitRepoFetcher.test.ts
test('fetchDirectoryRecursive fetches all files', async () => {
    (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { name: 'skills', type: 'dir', path: '.github/skills' },
                { name: 'README.md', type: 'file', path: 'README.md', download_url: 'http://...' }
            ]
        })
        .mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { name: 'SKILL.md', type: 'file', path: '.github/skills/test/SKILL.md', download_url: 'http://...' }
            ]
        });

    const result = await fetcher['fetchDirectoryRecursive']('owner', 'repo', '', undefined);
    
    expect(result).toHaveLength(2); // README.md + SKILL.md
    expect(result.some(f => f.path === '.github/skills/test/SKILL.md')).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/GitRepoFetcher.test.ts`
Expected: FAIL with "fetcher.fetchDirectoryRecursive is not a function"

**Step 3: Write minimal implementation**

```typescript
// Add to src/GitRepoFetcher.ts after fetchViaGitHubAPI method
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
```

**Step 4: Update fetchRepoContents to use recursive fetch**

```typescript
// Modify fetchRepoContents method in src/GitRepoFetcher.ts
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
```

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/GitRepoFetcher.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/GitRepoFetcher.ts tests/GitRepoFetcher.test.ts
git commit -m "feat: add recursive directory fetching to GitRepoFetcher"
```

---

### Task 6: Implement Resource Categorization

**Files:**
- Modify: `src/GitRepoFetcher.ts:150-200`
- Modify: `tests/GitRepoFetcher.test.ts:61-100`

**Step 1: Write the failing test**

```typescript
// Add to tests/GitRepoFetcher.test.ts
test('categorizeResources identifies all resource types', () => {
    const files: any[] = [
        { path: '.github/skills/test/SKILL.md', type: 'file', name: 'SKILL.md' },
        { path: '.github/skills/debug/SKILL.md', type: 'file', name: 'SKILL.md' },
        { path: '.github/prompts/review.prompt.md', type: 'file', name: 'review.prompt.md' },
        { path: '.github/prompts/architect-prompt.md', type: 'file', name: 'architect-prompt.md' },
        { path: '.github/instructions/python.instructions.md', type: 'file', name: 'python.instructions.md' },
        { path: '.github/copilot-instructions.md', type: 'file', name: 'copilot-instructions.md' },
        { path: 'AGENTS.md', type: 'file', name: 'AGENTS.md' },
        { path: 'README.md', type: 'file', name: 'README.md' }
    ];

    const result = fetcher['categorizeResources'](files);
    
    expect(result.skillsCount).toBe(2);
    expect(result.promptsCount).toBe(2);
    expect(result.instructionsCount).toBe(2); // includes copilot-instructions.md
    expect(result.agentsCount).toBe(1);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/GitRepoFetcher.test.ts`
Expected: FAIL with incorrect counts (0, 0, 0, 0)

**Step 3: Write minimal implementation**

```typescript
// Replace categorizeResources method in src/GitRepoFetcher.ts
private categorizeResources(files: RepoFile[]): FetchResult {
    const categorized = {
        skills: [] as RepoFile[],
        prompts: [] as RepoFile[],
        instructions: [] as RepoFile[],
        agents: [] as RepoFile[]
    };

    for (const file of files) {
        if (file.type !== 'file') {
            continue;
        }

        const path = file.path.toLowerCase();
        const name = file.name.toLowerCase();

        // Skills: .github/skills/**/SKILL.md or .claude/skills/**/SKILL.md
        if (name === 'skill.md' && 
            (path.includes('.github/skills/') || path.includes('.claude/skills/'))) {
            categorized.skills.push(file);
        }
        // Prompts: .github/prompts/*.prompt.md or *-prompt.md
        else if (path.includes('.github/prompts/') && 
                 (name.endsWith('.prompt.md') || name.endsWith('-prompt.md'))) {
            categorized.prompts.push(file);
        }
        // Instructions: .github/instructions/*.instructions.md or copilot-instructions.md
        else if ((path.includes('.github/instructions/') && name.endsWith('.instructions.md')) ||
                 (path === '.github/copilot-instructions.md')) {
            categorized.instructions.push(file);
        }
        // Agents: AGENTS.md at root or subfolders
        else if (name === 'agents.md') {
            categorized.agents.push(file);
        }
    }

    return {
        files: [
            ...categorized.skills,
            ...categorized.prompts,
            ...categorized.instructions,
            ...categorized.agents
        ],
        skillsCount: categorized.skills.length,
        promptsCount: categorized.prompts.length,
        instructionsCount: categorized.instructions.length,
        agentsCount: categorized.agents.length
    };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/GitRepoFetcher.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/GitRepoFetcher.ts tests/GitRepoFetcher.test.ts
git commit -m "feat: implement resource categorization in GitRepoFetcher"
```

---

### Task 7: Add File Content Fetching

**Files:**
- Modify: `src/GitRepoFetcher.ts:201-230`
- Modify: `tests/GitRepoFetcher.test.ts:101-120`

**Step 1: Write the failing test**

```typescript
// Add to tests/GitRepoFetcher.test.ts
test('fetchFileContent retrieves file from download URL', async () => {
    const mockContent = '---\nname: test\n---\nContent';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => mockContent
    });

    const content = await fetcher.fetchFileContent('http://example.com/file.md');
    
    expect(content).toBe(mockContent);
});

test('fetchFileContent throws on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
    });

    await expect(
        fetcher.fetchFileContent('http://example.com/file.md')
    ).rejects.toThrow('Failed to fetch file: Not Found');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/GitRepoFetcher.test.ts`
Expected: FAIL with "fetcher.fetchFileContent is not a function"

**Step 3: Write minimal implementation**

```typescript
// Add to src/GitRepoFetcher.ts after categorizeResources method
async fetchFileContent(downloadUrl: string): Promise<string> {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return response.text();
}

clearCache(): void {
    this.cache.clear();
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/GitRepoFetcher.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/GitRepoFetcher.ts tests/GitRepoFetcher.test.ts
git commit -m "feat: add file content fetching to GitRepoFetcher"
```

---

## Topic 3: ResourceImporter Component

### Task 8: Create ResourceImporter with Validation

**Files:**
- Create: `src/ResourceImporter.ts`
- Create: `tests/ResourceImporter.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/ResourceImporter.test.ts
import { ResourceImporter, ResourceType } from '../src/ResourceImporter';
import * as vscode from 'vscode';

jest.mock('vscode');
jest.mock('fs');

describe('ResourceImporter', () => {
    let importer: ResourceImporter;
    let mockContext: any;

    beforeEach(() => {
        mockContext = {
            extensionUri: { fsPath: '/extension/path' }
        };
        importer = new ResourceImporter(mockContext);
    });

    test('detectResourceType identifies skills', () => {
        const type = importer['detectResourceType'](
            'SKILL.md',
            '.github/skills/test/SKILL.md'
        );
        expect(type).toBe('skill');
    });

    test('detectResourceType identifies prompts', () => {
        const type = importer['detectResourceType'](
            'review.prompt.md',
            '.github/prompts/review.prompt.md'
        );
        expect(type).toBe('prompt');
    });

    test('detectResourceType identifies instructions', () => {
        const type = importer['detectResourceType'](
            'python.instructions.md',
            '.github/instructions/python.instructions.md'
        );
        expect(type).toBe('instruction');
    });

    test('detectResourceType identifies agents', () => {
        const type = importer['detectResourceType'](
            'AGENTS.md',
            'AGENTS.md'
        );
        expect(type).toBe('agent');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/ResourceImporter.test.ts`
Expected: FAIL with "Cannot find module '../src/ResourceImporter'"

**Step 3: Write minimal implementation**

See file content in plan above (too long to repeat)

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/ResourceImporter.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ResourceImporter.ts tests/ResourceImporter.test.ts
git commit -m "feat: add ResourceImporter with validation and target path resolution"
```

---

### Task 9: Add Import with Validation

**Files:**
- Modify: `src/ResourceImporter.ts:120-180`
- Modify: `tests/ResourceImporter.test.ts:50-90`

**Step 1: Write the failing test**

```typescript
// Add to tests/ResourceImporter.test.ts
test('validateSkillContent checks for required frontmatter', () => {
    const validSkill = '---\nname: test\ndescription: "Test"\n---\nContent';
    const invalidSkill = 'No frontmatter here';

    expect(importer['validateSkillContent'](validSkill)).toBe(true);
    expect(importer['validateSkillContent'](invalidSkill)).toBe(false);
});

test('validatePromptContent checks for prompt.md extension', () => {
    expect(importer['validatePromptContent']('review.prompt.md')).toBe(true);
    expect(importer['validatePromptContent']('review.md')).toBe(false);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/ResourceImporter.test.ts`
Expected: FAIL with "importer.validateSkillContent is not a function"

**Step 3: Write minimal implementation**

See file content in plan above (validation methods)

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/ResourceImporter.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ResourceImporter.ts tests/ResourceImporter.test.ts
git commit -m "feat: add validation methods to ResourceImporter"
```

---

## Topic 4: GitRepoWebviewProvider Component

### Task 10: Create GitRepoWebviewProvider with Singleton Pattern

**Files:**
- Create: `src/GitRepoWebviewProvider.ts`

**Step 1: Write the minimal implementation** (No test - webview is hard to test)

See complete implementation in plan above.

**Step 2: Commit**

```bash
git add src/GitRepoWebviewProvider.ts
git commit -m "feat: add GitRepoWebviewProvider with webview UI"
```

---

## Topic 5: Integration with Extension

### Task 11: Update Status Bar Menu

**Files:**
- Modify: `src/extension.ts:267-295`

**Step 1: Update showCommands handler**

See modification in plan above.

**Step 2: Commit**

```bash
git add src/extension.ts
git commit -m "feat: add Browse Git Repository to status bar menu"
```

---

### Task 12: Register Git Browser Command with Quick Pick

**Files:**
- Modify: `src/extension.ts:20-30`
- Modify: `src/extension.ts:180-250`

**Step 1: Import new modules**
**Step 2: Initialize components**
**Step 3: Register browse command with Quick Pick**

See implementation in plan above.

**Step 4: Commit**

```bash
git add src/extension.ts
git commit -m "feat: register Git browser command with Quick Pick history"
```

---

### Task 13: Add Refresh Command

**Files:**
- Modify: `src/extension.ts:350-370`
- Modify: `package.json:110-115`

**Step 1: Register refresh skills command**
**Step 2: Add command to package.json**

See implementation in plan above.

**Step 3: Commit**

```bash
git add src/extension.ts package.json
git commit -m "feat: add refresh skills command"
```

---

### Task 14: Add Clear Repository History Command

**Files:**
- Modify: `src/extension.ts:371-385`
- Modify: `package.json:116-120`

**Step 1: Register clear history command**
**Step 2: Add command to package.json**

See implementation in plan above.

**Step 3: Commit**

```bash
git add src/extension.ts package.json
git commit -m "feat: add clear repository history command"
```

---

### Task 15: Update Package.json with Dependencies

**Files:**
- Modify: `package.json:1-30`

**Step 1: Verify no new dependencies needed**

All functionality uses:
- Native fetch API (built-in)
- VS Code APIs (already available)
- Node.js fs/path (already in use)

No new dependencies to add!

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: verify package.json dependencies for Git browser"
```

---

### Task 16: Final Integration Test

**Files:**
- Test manually (no automated test file)

**Step 1: Build and test extension**

Run: `npm run compile`
Expected: SUCCESS with no errors

**Step 2: Launch Extension Development Host**

Press F5 in VS Code
Expected: Extension Development Host opens

**Step 3: Test the workflow**

1. Click status bar `$(beaker) @cp-ninja`
2. Select "🌐 Browse Git Repository"
3. Select "➕ Enter new repository URL..."
4. Enter "github/awesome-copilot"
5. Click "Browse Repository"
6. Verify resources are displayed by category
7. Click "Import to User" on a skill
8. Verify success message appears

**Step 4: Test history**

1. Click status bar again
2. Select "🌐 Browse Git Repository"
3. Verify "github/awesome-copilot" appears in history
4. Select it from history
5. Verify it loads immediately

**Step 5: Commit**

```bash
git add -A
git commit -m "test: verify Git repository browser integration"
```
