import * as vscode from 'vscode';
import { SkillComposerPanel } from '../../src/webview/SkillComposerPanel';

describe('SkillComposerPanel', () => {
    test('should create webview panel with correct options', () => {
        const mockContext = {} as vscode.ExtensionContext;
        const panel = SkillComposerPanel.createOrShow(mockContext);
        
        expect(panel).toBeDefined();
        expect(panel.viewType).toBe('cp-ninja.skillComposer');
    });
});