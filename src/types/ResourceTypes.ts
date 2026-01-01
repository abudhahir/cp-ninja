export interface ResourceDirectories {
    globalDir: string;
    projectDir: string;
    profilesDir: string;
    agentsDir: string;
}

export interface ProfileConfig {
    name: string;
    description: string;
    skills: string[];
    agentTemplates: string[];
    codingStandards: string[];
    autoActivate: {
        filePatterns: string[];
        dependencies: string[];
        keywords: string[];
    };
}

export interface ProjectContext {
    language: string[];
    frameworks: string[];
    projectType: string;
    recentActivity: string[];
    teamIndicators: string[];
}