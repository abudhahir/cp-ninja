import * as path from 'path';
import * as fs from 'fs';
import { ProjectContext } from './types/ResourceTypes';

export class ContextDetector {
    constructor(private workspacePath: string) {}

    async analyzeProject(): Promise<ProjectContext> {
        try {
            const packageJson = await this.readPackageJson();
            const filePatterns = await this.analyzeFilePatterns();
            
            const frameworks = this.detectFrameworks(packageJson);
            const languages = this.detectLanguages(packageJson, filePatterns);
            const projectType = this.determineProjectType(frameworks, filePatterns);
            
            return {
                language: languages,
                frameworks: frameworks,
                projectType: projectType,
                recentActivity: [], // TODO: Git analysis
                teamIndicators: await this.detectTeamIndicators()
            };
        } catch (error) {
            throw new Error(`Failed to analyze project: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async readPackageJson(): Promise<any> {
        try {
            const packagePath = path.join(this.workspacePath, 'package.json');
            
            try {
                await fs.promises.access(packagePath);
                const content = await fs.promises.readFile(packagePath, 'utf8');
                return JSON.parse(content);
            } catch {
                return {}; // File doesn't exist or not accessible
            }
        } catch (error) {
            throw new Error(`Failed to read package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private detectFrameworks(packageJson: any): string[] {
        try {
            const frameworks: string[] = [];
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            if (deps.react) frameworks.push('react');
            if (deps.vue) frameworks.push('vue');
            if (deps.angular) frameworks.push('angular');
            if (deps.express) frameworks.push('express');
            if (deps.fastify) frameworks.push('fastify');
            
            return frameworks;
        } catch (error) {
            throw new Error(`Failed to detect frameworks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private detectLanguages(packageJson: any, filePatterns: string[]): string[] {
        try {
            const languages: string[] = [];
            
            if (packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript || filePatterns.includes('.ts')) {
                languages.push('typescript');
            }
            if (filePatterns.includes('.js') || Object.keys(packageJson.dependencies || {}).length > 0) {
                languages.push('javascript');
            }
            
            return languages;
        } catch (error) {
            throw new Error(`Failed to detect languages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private determineProjectType(frameworks: string[], filePatterns: string[]): string {
        try {
            if (frameworks.some(f => ['react', 'vue', 'angular'].includes(f))) {
                return 'frontend';
            }
            if (frameworks.some(f => ['express', 'fastify', 'nest'].includes(f))) {
                return 'backend';
            }
            return 'unknown';
        } catch (error) {
            throw new Error(`Failed to determine project type: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async analyzeFilePatterns(): Promise<string[]> {
        try {
            const patterns: string[] = [];
            
            const tsconfigPath = path.join(this.workspacePath, 'tsconfig.json');
            try {
                await fs.promises.access(tsconfigPath);
                patterns.push('.ts');
            } catch {
                // tsconfig.json doesn't exist
            }
            
            return patterns;
        } catch (error) {
            throw new Error(`Failed to analyze file patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async detectTeamIndicators(): Promise<string[]> {
        try {
            const indicators: string[] = [];
            
            const configs = [
                { file: '.editorconfig', indicator: '.editorconfig' },
                { file: '.eslintrc', indicator: '.eslintrc' },
                { file: '.eslintrc.json', indicator: '.eslintrc' },
                { file: '.prettierrc', indicator: '.prettierrc' }
            ];
            
            for (const config of configs) {
                const configPath = path.join(this.workspacePath, config.file);
                try {
                    await fs.promises.access(configPath);
                    if (!indicators.includes(config.indicator)) {
                        indicators.push(config.indicator);
                    }
                } catch {
                    // Config file doesn't exist
                }
            }
            
            return indicators;
        } catch (error) {
            throw new Error(`Failed to detect team indicators: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}