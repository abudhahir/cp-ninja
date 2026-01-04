import * as fs from 'fs/promises';

describe('Webview Removal', () => {
    test('webview directories should not exist', async () => {
        const webviewSrcExists = await fs.access('webview-src').then(() => true).catch(() => false);
        const webviewDistExists = await fs.access('webview-dist').then(() => true).catch(() => false);
        const skillComposerExists = await fs.access('src/webview').then(() => true).catch(() => false);
        const testWebviewExists = await fs.access('tests/webview').then(() => true).catch(() => false);
        
        expect(webviewSrcExists).toBe(false);
        expect(webviewDistExists).toBe(false);
        expect(skillComposerExists).toBe(false);
        expect(testWebviewExists).toBe(false);
    });
    
    test('webview commands should not exist in package.json', async () => {
        const packageJsonContent = await fs.readFile('package.json', 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        
        // Check that webview-related commands are removed
        const commands = packageJson.contributes?.commands || [];
        const commandIds = commands.map((cmd: any) => cmd.command);
        
        expect(commandIds).not.toContain('cp-ninja.showDetails');
        expect(commandIds).not.toContain('cp-ninja.showWelcome');
        
        // Check that webview build scripts are removed
        const scripts = packageJson.scripts || {};
        expect(scripts['build:webview']).toBeUndefined();
        expect(scripts['watch:webview']).toBeUndefined();
    });
});