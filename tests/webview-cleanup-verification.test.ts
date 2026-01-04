import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from '@jest/globals';

describe('Webview Cleanup Verification', () => {
    const projectRoot = path.resolve(__dirname, '..');

    describe('Directories should not exist after cleanup', () => {
        it('webview-src directory should not exist', () => {
            const webviewSrcPath = path.join(projectRoot, 'webview-src');
            expect(fs.existsSync(webviewSrcPath)).toBe(false);
        });

        it('webview-dist directory should not exist', () => {
            const webviewDistPath = path.join(projectRoot, 'webview-dist');
            expect(fs.existsSync(webviewDistPath)).toBe(false);
        });

        it('tests/webview directory should not exist', () => {
            const testsWebviewPath = path.join(projectRoot, 'tests', 'webview');
            expect(fs.existsSync(testsWebviewPath)).toBe(false);
        });
    });

    describe('Files should not exist after cleanup', () => {
        it('src/webview/SkillComposerPanel.ts should not exist', () => {
            const skillComposerPath = path.join(projectRoot, 'src', 'webview', 'SkillComposerPanel.ts');
            expect(fs.existsSync(skillComposerPath)).toBe(false);
        });
    });

    describe('Package.json should not contain webview commands/scripts', () => {
        it('should not contain webview build scripts', () => {
            const packageJsonPath = path.join(projectRoot, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            expect(packageJson.scripts['build:webview']).toBeUndefined();
            expect(packageJson.scripts['watch:webview']).toBeUndefined();
        });

        it('should not contain webview-based commands', () => {
            const packageJsonPath = path.join(projectRoot, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            const commands = packageJson.contributes?.commands || [];
            const showDetailsCommand = commands.find((cmd: any) => cmd.command === 'cp-ninja.showDetails');
            expect(showDetailsCommand).toBeUndefined();
        });
    });

    describe('Extension.ts should not contain webview imports/registrations', () => {
        it('should not import SkillComposerPanel', () => {
            const extensionPath = path.join(projectRoot, 'src', 'extension.ts');
            const extensionContent = fs.readFileSync(extensionPath, 'utf8');
            
            expect(extensionContent.includes("import { SkillComposerPanel }")).toBe(false);
            expect(extensionContent.includes("from './webview/SkillComposerPanel'")).toBe(false);
        });

        it('should not register showDetails command', () => {
            const extensionPath = path.join(projectRoot, 'src', 'extension.ts');
            const extensionContent = fs.readFileSync(extensionPath, 'utf8');
            
            expect(extensionContent.includes("cp-ninja.showDetails")).toBe(false);
            expect(extensionContent.includes("SkillComposerPanel.createOrShow")).toBe(false);
        });

        it('should not register showTargetPath command', () => {
            const extensionPath = path.join(projectRoot, 'src', 'extension.ts');
            const extensionContent = fs.readFileSync(extensionPath, 'utf8');
            
            expect(extensionContent.includes("cp-ninja.showTargetPath")).toBe(false);
        });
    });
});