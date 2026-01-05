import { RepoHistoryManager } from '../src/RepoHistoryManager';

describe('RepoHistoryManager', () => {
    let manager: RepoHistoryManager;
    let mockContext: any;
    let storage: any[];

    beforeEach(() => {
        storage = [];
        mockContext = {
            globalState: {
                get: jest.fn().mockImplementation(() => storage),
                update: jest.fn().mockImplementation((key, value) => {
                    storage = value;
                    return Promise.resolve();
                })
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

    test('clearHistory removes all entries', async () => {
        await manager.addToHistory('owner/repo1', 5, 3, 1, 0);
        await manager.addToHistory('owner/repo2', 2, 1, 0, 1);
        
        await manager.clearHistory();
        
        const history = await manager.getHistory();
        expect(history).toHaveLength(0);
    });
});
