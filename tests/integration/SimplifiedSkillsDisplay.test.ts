// Mock VS Code module before importing other modules
const mockVscode = {
    commands: {
        executeCommand: jest.fn()
    },
    window: {
        activeTextEditor: undefined,
        showTextDocument: jest.fn(),
        createQuickPick: jest.fn()
    },
    workspace: {
        openTextDocument: jest.fn()
    },
    QuickPickItemKind: {
        Separator: -1
    },
    TreeItemCollapsibleState: {
        None: 0,
        Collapsed: 1,
        Expanded: 2
    },
    TreeItem: class TreeItem {
        constructor(public label: string, public collapsibleState?: number) {}
    },
    EventEmitter: class EventEmitter {
        constructor() {}
        fire() {}
        event = () => {}
    }
};

// Mock the vscode module
jest.mock('vscode', () => mockVscode, { virtual: true });

// Mock skills-core module
jest.mock('../../src/lib/skills-core', () => ({
    findSkillsInDir: jest.fn(),
    extractFrontmatter: jest.fn()
}), { virtual: true });

import { SkillQuickPick } from '../../src/lib/SkillQuickPick';
import { SkillTreeDataProvider } from '../../src/SkillsTreeDataProvider';

describe('Simplified Skills Display Integration', () => {
    let skillQuickPick: SkillQuickPick;
    let skillsTreeDataProvider: SkillTreeDataProvider;
    
    beforeEach(() => {
        const mockSkillsPath = 'test-skills';
        const mockPersonalSkillsPath = 'test-personal-skills';
        const mockExtensionBasePath = 'test-extension-path';
        
        skillQuickPick = new SkillQuickPick(mockSkillsPath, mockPersonalSkillsPath);
        skillsTreeDataProvider = new SkillTreeDataProvider(mockSkillsPath, mockPersonalSkillsPath, mockExtensionBasePath);
        
        jest.clearAllMocks();
    });
    
    test('complete workflow from quick pick to editor', async () => {
        const mockDocument = {
            fileName: '/skills/brainstorming/SKILL.md',
            languageId: 'markdown'
        };
        
        const mockEditor = {
            document: mockDocument
        };
        
        // Mock VS Code APIs
        (mockVscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
        (mockVscode.window.showTextDocument as jest.Mock).mockResolvedValue(mockEditor);
        (mockVscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
        
        // Set up active editor mock
        Object.defineProperty(mockVscode.window, 'activeTextEditor', {
            value: mockEditor,
            writable: true
        });
        
        // Test command execution
        await mockVscode.commands.executeCommand('cp-ninja.showSkillsQuickPick');
        expect(mockVscode.commands.executeCommand).toHaveBeenCalledWith('cp-ninja.showSkillsQuickPick');
        
        // Test skill opening in editor
        const skillPath = 'brainstorming';
        await skillQuickPick.openSkillInEditor(skillPath);
        
        // Verify document operations
        expect(mockVscode.workspace.openTextDocument).toHaveBeenCalled();
        expect(mockVscode.window.showTextDocument).toHaveBeenCalled();
        
        // Verify document properties
        const activeEditor = mockVscode.window.activeTextEditor as any;
        expect(activeEditor?.document.fileName).toContain('brainstorming');
        expect(activeEditor?.document.languageId).toBe('markdown');
    });
    
    test('tree view integration works', async () => {
        // Mock skills data
        const mockSkills = [
            {
                label: 'brainstorming',
                description: 'Brainstorming skill',
                sourceType: 'cp-ninja',
                skillFile: '/skills/brainstorming/SKILL.md',
                collapsibleState: mockVscode.TreeItemCollapsibleState?.None || 0
            }
        ];
        
        // Mock tree data provider methods
        jest.spyOn(skillsTreeDataProvider, 'getChildren').mockResolvedValue(mockSkills as any);
        
        const skills = await skillsTreeDataProvider.getChildren();
        expect(skills.length).toBeGreaterThan(0);
        
        // Test opening skill from tree
        const firstSkill = skills[0];
        await mockVscode.commands.executeCommand('cp-ninja.openSkillInEditor', firstSkill);
        
        expect(mockVscode.commands.executeCommand).toHaveBeenCalledWith('cp-ninja.openSkillInEditor', firstSkill);
    });
    
    test('skills quick pick categorization works', async () => {
        const mockSkills = [
            {
                name: 'brainstorming',
                path: 'brainstorming',
                description: 'Generate ideas creatively',
                frontmatter: { category: 'Process' }
            },
            {
                name: 'systematic-debugging',
                path: 'systematic-debugging', 
                description: 'Debug issues systematically'
            }
        ];
        
        const categorizedSkills = await skillQuickPick.categorizeSkills(mockSkills);
        
        // Verify categorization
        expect(categorizedSkills['Process']).toBeDefined();
        expect(categorizedSkills['Process']).toHaveLength(1);
        expect(categorizedSkills['Process'][0].name).toBe('brainstorming');
        
        expect(categorizedSkills['Development Process']).toBeDefined();
        expect(categorizedSkills['Development Process']).toHaveLength(1);
        expect(categorizedSkills['Development Process'][0].name).toBe('systematic-debugging');
    });
    
    test('quick pick items creation includes categories and skills', () => {
        const categorizedSkills = {
            'Development Process': [
                {
                    name: 'brainstorming',
                    path: 'brainstorming',
                    description: 'Generate ideas creatively'
                }
            ],
            'Planning & Execution': [
                {
                    name: 'writing-plans',
                    path: 'writing-plans',
                    description: 'Create implementation plans'
                }
            ]
        };
        
        const quickPickItems = skillQuickPick.createQuickPickItems(categorizedSkills);
        
        // Should have 4 items: 2 categories + 2 skills
        expect(quickPickItems).toHaveLength(4);
        
        // First item should be category separator
        expect(quickPickItems[0].label).toBe('Development Process');
        expect(quickPickItems[0].isCategory).toBe(true);
        
        // Second item should be skill
        expect(quickPickItems[1].label).toBe('$(book) brainstorming');
        expect(quickPickItems[1].isCategory).toBe(false);
        expect(quickPickItems[1].description).toBe('Generate ideas creatively');
    });
    
    test('native editor integration preserves VS Code functionality', async () => {
        const skillPath = 'test-skill';
        const mockDocument = {
            fileName: '/skills/test-skill/SKILL.md',
            languageId: 'markdown',
            getText: jest.fn().mockReturnValue('# Test Skill\n\nThis is a test skill.')
        };
        
        (mockVscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
        (mockVscode.window.showTextDocument as jest.Mock).mockResolvedValue({ document: mockDocument });
        
        await skillQuickPick.openSkillInEditor(skillPath);
        
        // Verify native editor integration
        expect(mockVscode.workspace.openTextDocument).toHaveBeenCalledWith(
            expect.stringContaining('SKILL.md')
        );
        expect(mockVscode.window.showTextDocument).toHaveBeenCalledWith(
            mockDocument,
            { preview: false }
        );
    });
});