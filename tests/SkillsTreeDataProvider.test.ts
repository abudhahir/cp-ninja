import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SkillTreeDataProvider, SkillItem } from '../src/SkillsTreeDataProvider';
import { EnhancedSkillTreeDataProvider } from '../src/EnhancedSkillTreeDataProvider';

suite('SkillsTreeDataProvider Tests', () => {
    let mockExtensionPath: string;
    let mockSkillsDir: string;
    let mockPersonalSkillsDir: string;
    let testSkillFile: string;

    suiteSetup(async () => {
        // Create temporary test directories and files
        mockExtensionPath = path.join(__dirname, '..', 'test-workspace');
        mockSkillsDir = path.join(mockExtensionPath, 'skills');
        mockPersonalSkillsDir = path.join(mockExtensionPath, 'personal-skills');
        
        // Ensure directories exist
        await fs.promises.mkdir(mockSkillsDir, { recursive: true });
        await fs.promises.mkdir(mockPersonalSkillsDir, { recursive: true });
        
        // Create a test skill directory and file
        const testSkillDir = path.join(mockSkillsDir, 'test-skill');
        await fs.promises.mkdir(testSkillDir, { recursive: true });
        
        testSkillFile = path.join(testSkillDir, 'SKILL.md');
        const testSkillContent = `---
name: test-skill
description: A test skill for unit testing
sourceType: cp-ninja
---

# Test Skill

This is a test skill used for unit testing the tree view functionality.
`;
        await fs.promises.writeFile(testSkillFile, testSkillContent);
    });

    suiteTeardown(async () => {
        // Cleanup test files
        try {
            await fs.promises.rm(mockExtensionPath, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
            console.log('Cleanup error (expected in some environments):', error);
        }
    });

    test('SkillTreeDataProvider openSkillInEditor should handle skill items correctly', async () => {
        const provider = new SkillTreeDataProvider(mockSkillsDir, mockPersonalSkillsDir, mockExtensionPath);
        
        // Create a test skill item
        const skillItem = new SkillItem(
            'test-skill',
            'A test skill for unit testing',
            'cp-ninja',
            testSkillFile,
            vscode.TreeItemCollapsibleState.None
        );
        
        // Mock vscode.workspace.openTextDocument and vscode.window.showTextDocument
        let openedDocumentPath: string | undefined;
        let showTextDocumentCalled = false;
        
        const originalOpenTextDocument = vscode.workspace.openTextDocument;
        const originalShowTextDocument = vscode.window.showTextDocument;
        
        try {
            // Mock the vscode functions
            (vscode.workspace as any).openTextDocument = async (path: string) => {
                openedDocumentPath = path;
                return { fileName: path } as vscode.TextDocument;
            };
            
            (vscode.window as any).showTextDocument = async (document: vscode.TextDocument, options?: any) => {
                showTextDocumentCalled = true;
                assert.strictEqual(options?.preview, false, 'Preview should be set to false');
                return {} as vscode.TextEditor;
            };
            
            // Test the openSkillInEditor method
            await provider.openSkillInEditor(skillItem);
            
            // Verify the method was called with correct parameters
            assert.strictEqual(openedDocumentPath, testSkillFile, 'Should open the correct skill file');
            assert.strictEqual(showTextDocumentCalled, true, 'Should call showTextDocument');
            
        } finally {
            // Restore original functions
            (vscode.workspace as any).openTextDocument = originalOpenTextDocument;
            (vscode.window as any).showTextDocument = originalShowTextDocument;
        }
    });

    test('SkillTreeDataProvider openSkillInEditor should ignore non-skill items', async () => {
        const provider = new SkillTreeDataProvider(mockSkillsDir, mockPersonalSkillsDir, mockExtensionPath);
        
        // Create a category item (not a skill)
        const categoryItem = new SkillItem(
            'cp-ninja',
            'Skills from cp-ninja',
            'cp-ninja',
            '',
            vscode.TreeItemCollapsibleState.Collapsed
        );
        
        let openTextDocumentCalled = false;
        const originalOpenTextDocument = vscode.workspace.openTextDocument;
        
        try {
            // Mock to detect if the method is called
            (vscode.workspace as any).openTextDocument = async () => {
                openTextDocumentCalled = true;
                return {} as vscode.TextDocument;
            };
            
            // Test with category item
            await provider.openSkillInEditor(categoryItem);
            
            // Should not call openTextDocument for categories
            assert.strictEqual(openTextDocumentCalled, false, 'Should not open documents for category items');
            
        } finally {
            // Restore original function
            (vscode.workspace as any).openTextDocument = originalOpenTextDocument;
        }
    });

    test('EnhancedSkillTreeDataProvider openSkillInEditor should work correctly', async () => {
        const provider = new EnhancedSkillTreeDataProvider(mockSkillsDir, mockPersonalSkillsDir, mockExtensionPath);
        
        // Create a test skill item with correct contextValue
        const skillItem = new SkillItem(
            'test-skill',
            'A test skill for unit testing',
            'cp-ninja',
            testSkillFile,
            vscode.TreeItemCollapsibleState.None,
            false
        );
        
        // The SkillItem constructor should set contextValue to 'skill'
        assert.strictEqual(skillItem.contextValue, 'skill', 'SkillItem should have contextValue set to skill');
        
        // Mock vscode functions
        let openedDocumentPath: string | undefined;
        let showTextDocumentOptions: any;
        
        const originalOpenTextDocument = vscode.workspace.openTextDocument;
        const originalShowTextDocument = vscode.window.showTextDocument;
        
        try {
            (vscode.workspace as any).openTextDocument = async (path: string) => {
                openedDocumentPath = path;
                return { fileName: path } as vscode.TextDocument;
            };
            
            (vscode.window as any).showTextDocument = async (document: vscode.TextDocument, options?: any) => {
                showTextDocumentOptions = options;
                return {} as vscode.TextEditor;
            };
            
            // Test the openSkillInEditor method
            await provider.openSkillInEditor(skillItem);
            
            // Verify the correct behavior
            assert.strictEqual(openedDocumentPath, testSkillFile, 'Should open the correct skill file');
            assert.strictEqual(showTextDocumentOptions?.preview, false, 'Should set preview to false');
            
        } finally {
            // Restore original functions
            (vscode.workspace as any).openTextDocument = originalOpenTextDocument;
            (vscode.window as any).showTextDocument = originalShowTextDocument;
        }
    });

    test('SkillItem should use openSkillInEditor command for skills', () => {
        // Create a skill item
        const skillItem = new SkillItem(
            'test-skill',
            'A test skill',
            'cp-ninja',
            testSkillFile,
            vscode.TreeItemCollapsibleState.None
        );
        
        // Verify the command is set correctly
        assert.ok(skillItem.command, 'Skill item should have a command');
        assert.strictEqual(skillItem.command?.command, 'cp-ninja.openSkillInEditor', 'Should use openSkillInEditor command');
        assert.strictEqual(skillItem.command?.arguments?.length, 1, 'Should pass one argument');
        assert.strictEqual(skillItem.command?.arguments?.[0], skillItem, 'Should pass the SkillItem as argument');
        assert.strictEqual(skillItem.contextValue, 'skill', 'Should have contextValue set to skill');
    });

    test('SkillItem should use category contextValue for categories', () => {
        // Create a category item
        const categoryItem = new SkillItem(
            'cp-ninja',
            'Skills from cp-ninja',
            'cp-ninja',
            '',
            vscode.TreeItemCollapsibleState.Collapsed
        );
        
        // Verify the contextValue is set correctly
        assert.strictEqual(categoryItem.contextValue, 'category', 'Should have contextValue set to category');
        assert.ok(!categoryItem.command, 'Category items should not have commands');
    });
});