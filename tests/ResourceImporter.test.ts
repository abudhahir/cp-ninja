import { ResourceImporter } from '../src/ResourceImporter';
import * as fs from 'fs';

jest.mock('fs');

// Mock vscode module
jest.mock('vscode', () => ({
    window: {
        showWarningMessage: jest.fn()
    }
}), { virtual: true });

describe('ResourceImporter', () => {
    let importer: ResourceImporter;
    const mockWorkspace = '/test/workspace';

    beforeEach(() => {
        importer = new ResourceImporter(mockWorkspace);
        jest.clearAllMocks();
    });

    describe('validateResource', () => {
        it('rejects empty content', () => {
            const result = importer.validateResource('', 'skill');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('empty');
        });

        it('validates skill with frontmatter', () => {
            const content = `---
name: test-skill
description: Test
---
# Test Skill`;
            const result = importer.validateResource(content, 'skill');
            expect(result.valid).toBe(true);
        });

        it('rejects skill without frontmatter', () => {
            const content = '# Just a heading';
            const result = importer.validateResource(content, 'skill');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('frontmatter');
        });

        it('validates prompt markdown', () => {
            const content = '# My Prompt\nContent here';
            const result = importer.validateResource(content, 'prompt');
            expect(result.valid).toBe(true);
        });

        it('validates agent markdown', () => {
            const content = '# Agent\nInstructions';
            const result = importer.validateResource(content, 'agent');
            expect(result.valid).toBe(true);
        });

        it('rejects agent without markdown', () => {
            const content = 'Just text';
            const result = importer.validateResource(content, 'agent');
            expect(result.valid).toBe(false);
        });
    });

    describe('importResource', () => {
        it('imports skill to project location', async () => {
            const content = `---
name: test-skill
---
# Test`;
            
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            const result = await importer.importResource(content, 'SKILL.md', 'skill', 'project');

            expect(result.success).toBe(true);
            expect(result.path).toContain('.github/skills');
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it('prompts for overwrite when file exists', async () => {
            const content = `---
name: test
---
# Test`;
            
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            const vscode = require('vscode');
            vscode.window.showWarningMessage.mockResolvedValue('No');

            const result = await importer.importResource(content, 'SKILL.md', 'skill', 'project');

            expect(result.success).toBe(false);
            expect(result.error).toContain('cancelled');
            expect(vscode.window.showWarningMessage).toHaveBeenCalled();
        });

        it('creates directory if not exists', async () => {
            const content = `---
name: test
---
# Test`;
            
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            await importer.importResource(content, 'SKILL.md', 'skill', 'user-global');

            expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
        });
    });
});
