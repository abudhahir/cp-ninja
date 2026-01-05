import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { findSkillsInDir } from './lib/skills-core';

export class SkillWatcher {
    private watchers: vscode.FileSystemWatcher[] = [];
    private personalSkillsCache: Map<string, any> = new Map();
    
    constructor(
        private skillsDir: string,
        private personalSkillsDir: string,
        private onPersonalSkillsChanged: () => void
    ) {
        this.setupWatchers();
        this.refreshPersonalSkillsCache();
    }

    private setupWatchers() {
        // Only watch personal skills directory for dynamic loading
        // Packaged skills are loaded eagerly and don't need watching
        const personalPattern = path.join(this.personalSkillsDir, '**/SKILL.md').replace(/\\/g, '/');

        // Watch personal skills only
        if (fs.existsSync(this.personalSkillsDir)) {
            const personalWatcher = vscode.workspace.createFileSystemWatcher(personalPattern);
            personalWatcher.onDidCreate(() => this.handlePersonalSkillChange());
            personalWatcher.onDidDelete(() => this.handlePersonalSkillChange());
            personalWatcher.onDidChange(() => this.handlePersonalSkillChange());
            this.watchers.push(personalWatcher);
        }
    }

    private handlePersonalSkillChange() {
        console.log('Personal skills changed - refreshing cache');
        this.refreshPersonalSkillsCache();
        this.onPersonalSkillsChanged();
    }

    private refreshPersonalSkillsCache() {
        this.personalSkillsCache.clear();
        
        // Only cache personal skills for dynamic loading
        const personalSkills = findSkillsInDir(this.personalSkillsDir, 'personal');
        
        personalSkills.forEach(skill => {
            this.personalSkillsCache.set(skill.name, skill);
        });
        
        console.log(`Loaded ${this.personalSkillsCache.size} personal skills into dynamic cache`);
    }

    public getPersonalSkillByName(name: string) {
        return this.personalSkillsCache.get(name);
    }

    public getAllPersonalSkills() {
        return Array.from(this.personalSkillsCache.values());
    }

    public dispose() {
        this.watchers.forEach(watcher => watcher.dispose());
        this.personalSkillsCache.clear();
    }
}