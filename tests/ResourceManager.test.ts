import { ResourceManager } from '../src/ResourceManager';
import * as path from 'path';

describe('ResourceManager', () => {
    test('should initialize resource directories', async () => {
        const resourceManager = new ResourceManager('/test/workspace');
        const directories = await resourceManager.initializeDirectories();
        
        expect(path.normalize(directories.globalDir)).toBe(path.normalize(path.join(process.env.HOME!, '.cp-ninja')));
        expect(path.normalize(directories.projectDir)).toBe(path.normalize('/test/workspace/.cp-ninja'));
        expect(path.normalize(directories.profilesDir)).toBe(path.normalize(path.join(process.env.HOME!, '.cp-ninja', 'profiles')));
        expect(path.normalize(directories.agentsDir)).toBe(path.normalize(path.join(process.env.HOME!, '.cp-ninja', 'resources', 'agents')));
    });

    test('should handle directory creation errors gracefully', async () => {
        const resourceManager = new ResourceManager('/invalid/path/that/cannot/be/created');
        
        await expect(resourceManager.initializeDirectories()).rejects.toThrow('Failed to create directory');
    });
});