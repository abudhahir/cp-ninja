import * as vscode from 'vscode';
import * as path from 'path';
import { resolveSkillPath } from './lib/skills-core';

interface SuggestionRule {
    filePattern?: RegExp;
    contentKeywords?: RegExp;
    skillName: string;
    description: string;
}

export class SuggestionEngine {
    private lastSuggestionTime: number = 0;
    private suggestionCooldown: number = 0; // In seconds

    private rules: SuggestionRule[] = [
        {
            filePattern: /\.test\.(ts|js|tsx|jsx)$/,
            skillName: 'test-driven-development',
            description: 'Looks like you\'re working on a test file. The "test-driven-development" skill might be useful.'
        },
        {
            filePattern: /README\.md$/,
            contentKeywords: /TODO|FIXME|HACK/i,
            skillName: 'writing-plans',
            description: 'Your README has TODOs or FIXMEs. The "writing-plans" skill can help you structure your work.'
        },
        {
            contentKeywords: /bug|fixme|error/i,
            skillName: 'systematic-debugging',
            description: 'Encountering bugs or errors? The "systematic-debugging" skill can guide you.'
        }
        // Add more rules as needed
    ];

    constructor(private skillsDir: string, private personalSkillsDir: string) {
        this.loadConfiguration();
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.intersectsConfiguration('cpNinja')) {
                this.loadConfiguration();
            }
        });
    }

    private loadConfiguration() {
        const config = vscode.workspace.getConfiguration('cpNinja');
        this.suggestionCooldown = config.get<number>('suggestionCooldown', 300);
    }

    public async getSuggestion(document: vscode.TextDocument): Promise<{ skillName: string; description: string } | null> {
        const now = Date.now();
        if (now - this.lastSuggestionTime < this.suggestionCooldown * 1000) {
            return null; // Still in cooldown period
        }

        const fileName = path.basename(document.fileName);
        const fileContent = document.getText();

        for (const rule of this.rules) {
            let matchesFile = true;
            let matchesContent = true;

            if (rule.filePattern && !rule.filePattern.test(fileName)) {
                matchesFile = false;
            }

            if (rule.contentKeywords && !rule.contentKeywords.test(fileContent)) {
                matchesContent = false;
            }

            if (matchesFile && matchesContent) {
                // Ensure the skill actually exists
                if (resolveSkillPath(rule.skillName, this.skillsDir, this.personalSkillsDir)) {
                    this.lastSuggestionTime = now;
                    return { skillName: rule.skillName, description: rule.description };
                }
            }
        }
        return null;
    }
}
