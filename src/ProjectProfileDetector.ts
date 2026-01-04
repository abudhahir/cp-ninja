import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface ProjectProfile {
    name: string;
    type: string;
    confidence: number;
    triggers: {
        dependencies?: string[];
        filePatterns?: string[];
        packageScripts?: string[];
    };
    defaultAgents: string[];
    workflows: string[];
    skills: string[];
    contextualTriggers?: {
        [event: string]: string[];
    };
}

export interface PackageJsonData {
    name?: string;
    dependencies?: { [key: string]: string };
    devDependencies?: { [key: string]: string };
    scripts?: { [key: string]: string };
}

export class ProjectProfileDetector {
    private workspace: vscode.WorkspaceFolder;
    
    constructor(workspace: vscode.WorkspaceFolder) {
        this.workspace = workspace;
    }

    async detectProfile(): Promise<ProjectProfile | null> {
        try {
            const packageJson = await this.analyzePackageJson();
            const fileStructure = await this.analyzeFileStructure();
            
            // Try to match against known profiles
            const profiles = this.getKnownProfiles();
            let bestMatch: ProjectProfile | null = null;
            let highestConfidence = 0;

            for (const profile of profiles) {
                const confidence = this.calculateConfidence(profile, packageJson, fileStructure);
                if (confidence > highestConfidence && confidence > 0.6) {
                    highestConfidence = confidence;
                    bestMatch = { ...profile, confidence };
                }
            }

            return bestMatch;
        } catch (error) {
            console.error('Failed to detect project profile:', error);
            return null;
        }
    }

    private async analyzePackageJson(): Promise<PackageJsonData | null> {
        try {
            const packagePath = path.join(this.workspace.uri.fsPath, 'package.json');
            if (!fs.existsSync(packagePath)) {
                return null;
            }

            const content = await fs.promises.readFile(packagePath, 'utf8');
            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    private async analyzeFileStructure(): Promise<string[]> {
        const patterns = [
            'src/components',
            'src/pages', 
            'src/routes',
            'public/index.html',
            'server.js',
            'app.js',
            'api/',
            'pages/',
            'components/',
            'styles/',
            'tests/',
            '__tests__/'
        ];

        const foundPatterns: string[] = [];
        
        for (const pattern of patterns) {
            const fullPath = path.join(this.workspace.uri.fsPath, pattern);
            if (fs.existsSync(fullPath)) {
                foundPatterns.push(pattern);
            }
        }

        return foundPatterns;
    }

    private calculateConfidence(
        profile: ProjectProfile, 
        packageJson: PackageJsonData | null, 
        fileStructure: string[]
    ): number {
        let score = 0;
        let totalChecks = 0;

        // Check dependencies
        if (profile.triggers.dependencies && packageJson) {
            const allDeps = { 
                ...packageJson.dependencies, 
                ...packageJson.devDependencies 
            };
            
            for (const dep of profile.triggers.dependencies) {
                totalChecks++;
                if (allDeps[dep]) {
                    score++;
                }
            }
        }

        // Check file patterns
        if (profile.triggers.filePatterns) {
            for (const pattern of profile.triggers.filePatterns) {
                totalChecks++;
                if (fileStructure.some(found => found.includes(pattern.replace('**', '')))) {
                    score++;
                }
            }
        }

        // Check package scripts
        if (profile.triggers.packageScripts && packageJson?.scripts) {
            for (const script of profile.triggers.packageScripts) {
                totalChecks++;
                if (packageJson.scripts[script]) {
                    score++;
                }
            }
        }

        return totalChecks > 0 ? score / totalChecks : 0;
    }

    private getKnownProfiles(): ProjectProfile[] {
        return [
            {
                name: "React Frontend",
                type: "react-frontend",
                confidence: 0,
                triggers: {
                    dependencies: ["react", "@types/react", "react-dom"],
                    filePatterns: ["src/components", "public/index.html", "src/App"],
                    packageScripts: ["build", "start", "dev"]
                },
                defaultAgents: ["software-architect", "technical-analyzer"],
                workflows: ["component-design-review", "state-management-analysis"],
                skills: ["brainstorming", "systematic-debugging", "test-driven-development"]
            },
            {
                name: "Node.js Backend",
                type: "node-backend", 
                confidence: 0,
                triggers: {
                    dependencies: ["express", "fastify", "koa", "@nestjs/core"],
                    filePatterns: ["server.js", "app.js", "src/routes", "api/"],
                    packageScripts: ["start", "dev", "server"]
                },
                defaultAgents: ["software-architect", "security-analyst", "technical-analyzer"],
                workflows: ["api-security-review", "database-optimization"],
                skills: ["systematic-debugging", "verification-before-completion"]
            },
            {
                name: "Next.js Full Stack",
                type: "next-fullstack",
                confidence: 0,
                triggers: {
                    dependencies: ["next", "react"],
                    filePatterns: ["pages/", "api/", "components/"],
                    packageScripts: ["build", "dev", "start"]
                },
                defaultAgents: ["business-analyst", "software-architect", "security-analyst", "technical-analyzer"],
                workflows: ["end-to-end-security-review", "performance-optimization"],
                skills: ["brainstorming", "systematic-debugging", "verification-before-completion"]
            },
            {
                name: "Vue.js Frontend",
                type: "vue-frontend",
                confidence: 0,
                triggers: {
                    dependencies: ["vue", "@vue/cli-service", "nuxt"],
                    filePatterns: ["src/components", "src/views", "public/index.html"],
                    packageScripts: ["serve", "build", "dev"]
                },
                defaultAgents: ["software-architect", "technical-analyzer"],
                workflows: ["component-design-review", "vue-performance-analysis"],
                skills: ["brainstorming", "systematic-debugging", "test-driven-development"]
            },
            {
                name: "Angular Application",
                type: "angular-app",
                confidence: 0,
                triggers: {
                    dependencies: ["@angular/core", "@angular/cli"],
                    filePatterns: ["src/app", "angular.json"],
                    packageScripts: ["ng", "build", "start"]
                },
                defaultAgents: ["software-architect", "technical-analyzer"],
                workflows: ["angular-architecture-review", "dependency-injection-analysis"],
                skills: ["brainstorming", "systematic-debugging", "test-driven-development"]
            }
        ];
    }
}