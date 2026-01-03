import { ContextDetector } from '../src/ContextDetector';
import { ProjectContext } from '../src/types/ResourceTypes';

describe('ContextDetector', () => {
    test('should detect React project context', async () => {
        const detector = new ContextDetector('/test/workspace');
        
        // Mock package.json with React dependencies
        jest.spyOn(detector as any, 'readPackageJson').mockResolvedValue({
            dependencies: { 'react': '^18.0.0', 'typescript': '^4.8.0' },
            devDependencies: { '@testing-library/react': '^13.0.0' }
        });
        
        const context = await detector.analyzeProject();
        
        expect(context.frameworks).toContain('react');
        expect(context.language).toContain('typescript');
        expect(context.projectType).toBe('frontend');
    });

    test('should detect backend Express project', async () => {
        const detector = new ContextDetector('/test/workspace');
        
        // Mock package.json with Express dependencies
        jest.spyOn(detector as any, 'readPackageJson').mockResolvedValue({
            dependencies: { 'express': '^4.18.0' },
            devDependencies: { '@types/node': '^18.0.0' }
        });
        
        jest.spyOn(detector as any, 'analyzeFilePatterns').mockResolvedValue([]);
        jest.spyOn(detector as any, 'detectTeamIndicators').mockResolvedValue([]);
        
        const context = await detector.analyzeProject();
        
        expect(context.frameworks).toContain('express');
        expect(context.language).toContain('javascript');
        expect(context.projectType).toBe('backend');
    });

    test('should handle project with no package.json', async () => {
        const detector = new ContextDetector('/test/workspace');
        
        // Mock package.json to return empty object (file doesn't exist)
        jest.spyOn(detector as any, 'readPackageJson').mockResolvedValue({});
        jest.spyOn(detector as any, 'analyzeFilePatterns').mockResolvedValue([]);
        jest.spyOn(detector as any, 'detectTeamIndicators').mockResolvedValue([]);
        
        const context = await detector.analyzeProject();
        
        expect(context.frameworks).toEqual([]);
        expect(context.language).toEqual([]);
        expect(context.projectType).toBe('unknown');
        expect(context.teamIndicators).toEqual([]);
    });

    test('should detect team indicators from config files', async () => {
        const detector = new ContextDetector('/test/workspace');
        
        jest.spyOn(detector as any, 'readPackageJson').mockResolvedValue({});
        jest.spyOn(detector as any, 'analyzeFilePatterns').mockResolvedValue([]);
        jest.spyOn(detector as any, 'detectTeamIndicators').mockResolvedValue(['.eslintrc', '.editorconfig']);
        
        const context = await detector.analyzeProject();
        
        expect(context.teamIndicators).toContain('.eslintrc');
        expect(context.teamIndicators).toContain('.editorconfig');
    });
});