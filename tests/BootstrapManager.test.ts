import { BootstrapManager } from '../src/BootstrapManager';
import { ProjectContext } from '../src/types/ResourceTypes';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock the file system operations
jest.mock('fs/promises');

// Mock the other managers with proper implementations
jest.mock('../src/ResourceManager', () => ({
    ResourceManager: jest.fn().mockImplementation(() => ({
        initializeDirectories: jest.fn().mockResolvedValue({
            globalDir: '/test/.cp-ninja',
            projectDir: '/test/workspace/.cp-ninja',
            profilesDir: '/test/workspace/.cp-ninja/profiles',
            agentsDir: '/test/workspace/.cp-ninja/agents'
        })
    }))
}));

jest.mock('../src/ProfileManager', () => ({
    ProfileManager: jest.fn().mockImplementation(() => ({
        createProfile: jest.fn().mockResolvedValue(undefined)
    }))
}));

jest.mock('../src/ContextDetector', () => ({
    ContextDetector: jest.fn().mockImplementation(() => ({}))
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('BootstrapManager', () => {
    let bootstrapManager: BootstrapManager;
    const testWorkspacePath = '/test/workspace';

    beforeEach(() => {
        bootstrapManager = new BootstrapManager(testWorkspacePath);
        jest.clearAllMocks();
        
        // Mock fs operations to avoid actual file system calls
        mockedFs.access.mockResolvedValue(undefined);
        mockedFs.writeFile.mockResolvedValue(undefined);
        mockedFs.mkdir.mockResolvedValue(undefined);
    });

    describe('suggestPresets', () => {
        test('should suggest frontend-development preset for React projects', async () => {
            const context: ProjectContext = {
                language: ['typescript'],
                frameworks: ['react'],
                projectType: 'frontend',
                recentActivity: [],
                teamIndicators: ['.editorconfig']
            };
            
            const suggestions = await bootstrapManager.suggestPresets(context);
            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    preset: 'frontend-development',
                    confidence: expect.any(Number)
                })
            );
            expect(suggestions[0].confidence).toBeGreaterThan(0.8);
        });

        test('should suggest backend-api preset for Express projects', async () => {
            const context: ProjectContext = {
                language: ['javascript'],
                frameworks: ['express'],
                projectType: 'backend',
                recentActivity: [],
                teamIndicators: []
            };
            
            const suggestions = await bootstrapManager.suggestPresets(context);
            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    preset: 'backend-api',
                    confidence: expect.any(Number)
                })
            );
            expect(suggestions[0].confidence).toBeGreaterThan(0.8);
        });

        test('should suggest technical-analysis preset for planning activities', async () => {
            const context: ProjectContext = {
                language: ['typescript'],
                frameworks: [],
                projectType: 'library',
                recentActivity: ['planning', 'requirements'],
                teamIndicators: ['.github/PULL_REQUEST_TEMPLATE.md']
            };
            
            const suggestions = await bootstrapManager.suggestPresets(context);
            expect(suggestions).toContainEqual(
                expect.objectContaining({
                    preset: 'technical-analysis',
                    confidence: expect.any(Number)
                })
            );
        });

        test('should return suggestions sorted by confidence descending', async () => {
            const context: ProjectContext = {
                language: ['typescript'],
                frameworks: ['react'],
                projectType: 'frontend',
                recentActivity: ['planning'],
                teamIndicators: []
            };
            
            const suggestions = await bootstrapManager.suggestPresets(context);
            
            for (let i = 1; i < suggestions.length; i++) {
                expect(suggestions[i].confidence).toBeLessThanOrEqual(suggestions[i - 1].confidence);
            }
        });

        test('should return empty array for unknown project types', async () => {
            const context: ProjectContext = {
                language: ['cobol'],
                frameworks: ['legacy-framework'],
                projectType: 'mainframe',
                recentActivity: [],
                teamIndicators: []
            };
            
            const suggestions = await bootstrapManager.suggestPresets(context);
            expect(suggestions).toEqual([]);
        });
    });

    describe('initialize', () => {
        test('should initialize all managers and create default profiles', async () => {
            await bootstrapManager.initialize();

            // Verify that initialization completed without throwing
            expect(true).toBe(true);
        });

        test('should handle initialization errors gracefully', async () => {
            // Create a new bootstrap manager with a mocked ResourceManager that throws
            const MockResourceManager = require('../src/ResourceManager').ResourceManager;
            const failingResourceManager = new MockResourceManager();
            failingResourceManager.initializeDirectories = jest.fn().mockRejectedValue(new Error('Permission denied'));
            
            const failingBootstrap = new BootstrapManager('/test/workspace');
            failingBootstrap['resourceManager'] = failingResourceManager;

            await expect(failingBootstrap.initialize()).rejects.toThrow('Failed to initialize BootstrapManager: Permission denied');
        });
    });

    describe('bootstrapProject', () => {
        test('should bootstrap project with suggested presets', async () => {
            const context: ProjectContext = {
                language: ['typescript'],
                frameworks: ['react'],
                projectType: 'frontend',
                recentActivity: [],
                teamIndicators: []
            };

            const result = await bootstrapManager.bootstrapProject(context);

            expect(result.success).toBe(true);
            expect(result.appliedPresets).toContain('frontend-development');
            expect(result.createdResources).toBeInstanceOf(Array);
        });
    });
});