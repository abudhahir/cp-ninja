import { SkillQuickPick } from '../src/lib/SkillQuickPick';
import * as vscode from 'vscode';
import * as skillsCore from '../src/lib/skills-core';

interface SkillInfo {
    name: string;
    path: string;
    description?: string;
    frontmatter?: { category?: string };
}

describe('SkillQuickPick', () => {
    let skillQuickPick: SkillQuickPick;
    const mockSkillsPath = '/mock/skills/path';
    const mockPersonalPath = '/mock/personal/path';
    
    beforeEach(() => {
        skillQuickPick = new SkillQuickPick(mockSkillsPath, mockPersonalPath);
        jest.clearAllMocks();
    });
    
    test('should categorize skills using smart grouping for folder names', async () => {
        const mockSkills: SkillInfo[] = [
            {
                path: 'brainstorming',
                name: 'brainstorming',
                description: 'Use when you need to generate ideas'
            },
            {
                path: 'systematic-debugging',
                name: 'systematic-debugging', 
                description: 'Use when debugging complex issues'
            },
            {
                path: 'writing-plans',
                name: 'writing-plans',
                description: 'Use when creating project plans'
            },
            {
                path: 'custom-skill',
                name: 'custom-skill',
                description: 'Custom skill'
            }
        ];
        
        const result = await skillQuickPick.categorizeSkills(mockSkills);
        
        // Check Development Process category
        expect(result['Development Process']).toBeDefined();
        expect(result['Development Process']).toHaveLength(2);
        
        const devProcessNames = result['Development Process'].map((s: SkillInfo) => s.name);
        expect(devProcessNames).toContain('brainstorming');
        expect(devProcessNames).toContain('systematic-debugging');
        
        // Check Planning & Execution category
        expect(result['Planning & Execution']).toBeDefined();
        expect(result['Planning & Execution']).toHaveLength(1);
        expect(result['Planning & Execution'][0].name).toBe('writing-plans');
        
        // Check Other Skills category
        expect(result['Other Skills']).toBeDefined();
        expect(result['Other Skills']).toHaveLength(1);
        expect(result['Other Skills'][0].name).toBe('custom-skill');
    });
    
    test('should categorize skills by frontmatter when available', async () => {
        const mockSkills: SkillInfo[] = [
            {
                path: 'brainstorming',
                name: 'brainstorming',
                description: 'Use when you need to generate ideas',
                frontmatter: { category: 'Process' }
            },
            {
                path: 'systematic-debugging',
                name: 'systematic-debugging',
                description: 'Use when debugging complex issues'
            }
        ];
        
        const result = await skillQuickPick.categorizeSkills(mockSkills);
        
        // Should use frontmatter category
        expect(result['Process']).toBeDefined();
        expect(result['Process'][0].name).toBe('brainstorming');
        
        // Should fall back to smart categorization for skill without frontmatter
        expect(result['Development Process']).toBeDefined();
        expect(result['Development Process'][0].name).toBe('systematic-debugging');
    });
    
    test('should create QuickPick items with category separators', () => {
        const categorizedSkills = {
            'Development Process': [
                {
                    path: 'brainstorming',
                    name: 'brainstorming',
                    description: 'Use when you need to generate ideas'
                }
            ],
            'Planning & Execution': [
                {
                    path: 'writing-plans',
                    name: 'writing-plans',
                    description: 'Use when creating project plans'
                }
            ]
        };
        
        const result = skillQuickPick.createQuickPickItems(categorizedSkills);
        
        // Should have 4 items: 2 separators + 2 skills
        expect(result).toHaveLength(4);
        
        // First item should be separator for Development Process
        expect(result[0].label).toBe('Development Process');
        expect(result[0].kind).toBe(vscode.QuickPickItemKind.Separator);
        expect(result[0].isCategory).toBe(true);
        
        // Second item should be the skill
        expect(result[1].label).toBe('$(book) brainstorming');
        expect(result[1].description).toBe('Use when you need to generate ideas');
        expect(result[1].isCategory).toBe(false);
        
        // Third item should be separator for Planning & Execution
        expect(result[2].label).toBe('Planning & Execution');
        expect(result[2].kind).toBe(vscode.QuickPickItemKind.Separator);
        
        // Fourth item should be the planning skill
        expect(result[3].label).toBe('$(book) writing-plans');
        expect(result[3].description).toBe('Use when creating project plans');
    });
    
    test('should load skills from both cp-ninja and personal directories', async () => {
        const mockCpNinjaSkills = [
            {
                path: '/skills/brainstorming',
                skillFile: '/skills/brainstorming/SKILL.md',
                name: 'brainstorming',
                description: 'Brainstorming skill',
                sourceType: 'cp-ninja'
            }
        ];
        
        const mockPersonalSkills = [
            {
                path: '/personal/my-skill',
                skillFile: '/personal/my-skill/SKILL.md',
                name: 'my-skill',
                description: 'Personal skill',
                sourceType: 'personal'
            }
        ];
        
        jest.spyOn(skillsCore, 'findSkillsInDir')
            .mockReturnValueOnce(mockCpNinjaSkills)
            .mockReturnValueOnce(mockPersonalSkills);
            
        jest.spyOn(skillsCore, 'extractFrontmatter')
            .mockReturnValue({ name: '', description: '' });
        
        const result = await skillQuickPick.loadSkills();
        
        expect(skillsCore.findSkillsInDir).toHaveBeenCalledWith(mockSkillsPath, 'cp-ninja', 3);
        expect(skillsCore.findSkillsInDir).toHaveBeenCalledWith(mockPersonalPath, 'personal', 3);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('brainstorming');
        expect(result[1].name).toBe('my-skill');
    });
});