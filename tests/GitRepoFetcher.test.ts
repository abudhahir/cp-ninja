import { GitRepoFetcher } from '../src/GitRepoFetcher';

describe('GitRepoFetcher', () => {
    let fetcher: GitRepoFetcher;

    beforeEach(() => {
        fetcher = new GitRepoFetcher();
        (global as any).fetch = jest.fn();
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

    test('fetchDirectoryRecursive fetches all files', async () => {
        (global as any).fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { name: 'skills', type: 'dir', path: '.github/skills', sha: '123' },
                    { name: 'README.md', type: 'file', path: 'README.md', download_url: 'http://...', sha: '456' }
                ]
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { name: 'SKILL.md', type: 'file', path: '.github/skills/test/SKILL.md', download_url: 'http://...', sha: '789' }
                ]
            });

        const result = await fetcher['fetchDirectoryRecursive']('owner', 'repo', '', undefined);
        
        expect(result).toHaveLength(2); // README.md + SKILL.md
        expect(result.some(f => f.path === '.github/skills/test/SKILL.md')).toBe(true);
    });

    test('categorizeResources counts resource types', () => {
        const files = [
            { name: 'SKILL.md', path: '.github/skills/test/SKILL.md', type: 'file' as const, downloadUrl: 'url', sha: 'sha1' },
            { name: 'test.prompt.md', path: '.github/prompts/test.prompt.md', type: 'file' as const, downloadUrl: 'url', sha: 'sha2' },
            { name: 'copilot-instructions.md', path: '.github/copilot-instructions.md', type: 'file' as const, downloadUrl: 'url', sha: 'sha3' },
            { name: 'AGENTS.md', path: 'AGENTS.md', type: 'file' as const, downloadUrl: 'url', sha: 'sha4' },
            { name: 'README.md', path: 'README.md', type: 'file' as const, downloadUrl: 'url', sha: 'sha5' }
        ];

        const result = fetcher['categorizeResources'](files);

        expect(result.files).toHaveLength(5);
        expect(result.skillsCount).toBe(1);
        expect(result.promptsCount).toBe(1);
        expect(result.instructionsCount).toBe(1);
        expect(result.agentsCount).toBe(1);
    });
});
