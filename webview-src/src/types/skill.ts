export interface SkillTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    tags: string[];
    content: string;
    customizationPoints: string[];
    dependencies: string[];
}

export interface SkillCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface SkillMetadata {
    name: string;
    description: string;
    tags: string[];
    category: string;
    dependencies: string[];
}

export type QuickStartMode = 'template' | 'scratch' | 'import';