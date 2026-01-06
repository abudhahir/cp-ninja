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
});
