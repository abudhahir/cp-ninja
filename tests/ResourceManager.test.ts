import { ResourceManager } from '../src/ResourceManager';
import * as path from 'path';

describe('ResourceManager', () => {
    test('should initialize resource directories', async () => {
        const resourceManager = new ResourceManager('/test/workspace');
        const directories = await resourceManager.initializeDirectories();
        
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        expect(directories.globalDir).toBe(path.join(homeDir, '.cp-ninja'));
        expect(directories.projectDir).toBe('/test/workspace/.cp-ninja');
        expect(directories.profilesDir).toBe(path.join(homeDir, '.cp-ninja', 'profiles'));
        expect(directories.agentsDir).toBe(path.join(homeDir, '.cp-ninja', 'resources', 'agents'));
    });
});