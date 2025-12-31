export interface Skill {
    path: string;
    skillFile: string;
    name: string;
    description: string;
    sourceType: string;
}

export function extractFrontmatter(filePath: string): { name: string; description: string; };
export function findSkillsInDir(dir: string, sourceType: string, maxDepth?: number): Skill[];
export function resolveSkillPath(skillName: string, superpowersDir: string, personalDir: string): { skillFile: string; sourceType: string; skillPath: string; } | null;
export function checkForUpdates(repoDir: string): boolean;
export function stripFrontmatter(content: string): string;
