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
