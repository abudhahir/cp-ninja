import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('React Setup', () => {
    test('should build webview successfully', async () => {
        const { stdout, stderr } = await execAsync('npm run build:webview');
        expect(stderr).toBe('');
        expect(stdout).toContain('webpack');
    }, 30000);
});