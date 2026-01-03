import { ProfileManager } from '../src/ProfileManager';
import { ProfileConfig } from '../src/types/ResourceTypes';

describe('ProfileManager', () => {
    test('should resolve profile with inheritance', async () => {
        const profileManager = new ProfileManager('/test/global', '/test/project');
        
        const mockProfile: ProfileConfig = {
            name: 'frontend-dev',
            description: 'Frontend development preset',
            skills: ['test-driven-development', 'systematic-debugging'],
            agentTemplates: ['react-reviewer'],
            codingStandards: ['frontend-conventions.md'],
            autoActivate: {
                filePatterns: ['*.tsx', '*.jsx'],
                dependencies: ['react'],
                keywords: ['component', 'frontend']
            }
        };

        // Mock fs.promises.access to succeed and loadProfile to return mockProfile
        const fs = require('fs');
        jest.spyOn(fs.promises, 'access').mockResolvedValue(undefined);
        jest.spyOn(profileManager as any, 'loadProfile').mockResolvedValue(mockProfile);
        
        const resolved = await profileManager.resolveActiveProfile('frontend-dev');
        expect(resolved).toBeTruthy();
        expect(resolved!.skills).toContain('test-driven-development');
        expect(resolved!.name).toBe('frontend-dev');
    });
});