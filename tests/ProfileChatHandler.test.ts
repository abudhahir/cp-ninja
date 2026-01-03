import { ProfileChatHandler } from '../src/ProfileChatHandler';
import * as vscode from 'vscode';

// Mock the dependencies
jest.mock('../src/ProfileManager', () => ({
    ProfileManager: jest.fn().mockImplementation(() => ({
        setActiveProfile: jest.fn(),
        resolveActiveProfile: jest.fn(),
        getActiveProfileName: jest.fn()
    }))
}));

jest.mock('../src/AgentManager', () => ({
    AgentManager: jest.fn().mockImplementation(() => ({
        getAgentTemplate: jest.fn()
    }))
}));

describe('ProfileChatHandler', () => {
    let handler: ProfileChatHandler;
    let mockProfileManager: any;
    let mockAgentManager: any;

    beforeEach(() => {
        handler = new ProfileChatHandler(
            '/test/workspace',
            '/test/global',
            '/test/project',
            '/test/agents'
        );
        
        // Get the mocked instances
        const { ProfileManager } = require('../src/ProfileManager');
        const { AgentManager } = require('../src/AgentManager');
        mockProfileManager = ProfileManager.mock.results[ProfileManager.mock.results.length - 1].value;
        mockAgentManager = AgentManager.mock.results[AgentManager.mock.results.length - 1].value;
    });

    describe('handleProfileCommand', () => {
        test('should handle switch-profile command successfully', async () => {
            const mockStream = {
                markdown: jest.fn()
            };
            
            const mockRequest = {
                command: 'switch-profile',
                prompt: 'frontend-development'
            } as vscode.ChatRequest;

            const mockProfile = {
                name: 'frontend-development',
                skills: ['brainstorming', 'writing-plans'],
                agentTemplates: ['frontend-specialist', 'ui-designer'],
                description: 'Frontend development preset',
                codingStandards: [],
                autoActivate: {
                    filePatterns: [],
                    dependencies: [],
                    keywords: []
                }
            };

            mockProfileManager.setActiveProfile.mockResolvedValue(undefined);
            mockProfileManager.resolveActiveProfile.mockResolvedValue(mockProfile);
            
            await handler.handleProfileCommand(mockRequest, mockStream as any);
            
            expect(mockProfileManager.setActiveProfile).toHaveBeenCalledWith('frontend-development');
            expect(mockProfileManager.resolveActiveProfile).toHaveBeenCalledWith('frontend-development');
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('✅ **Switched to frontend-development profile**')
            );
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('brainstorming, writing-plans')
            );
        });

        test('should handle switch-profile command when profile not found', async () => {
            const mockStream = {
                markdown: jest.fn()
            };
            
            const mockRequest = {
                command: 'switch-profile',
                prompt: 'non-existent'
            } as vscode.ChatRequest;

            mockProfileManager.setActiveProfile.mockResolvedValue(undefined);
            mockProfileManager.resolveActiveProfile.mockResolvedValue(null);
            
            await handler.handleProfileCommand(mockRequest, mockStream as any);
            
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('❌ Profile "non-existent" not found.')
            );
        });

        test('should handle list-profiles command', async () => {
            const mockStream = {
                markdown: jest.fn()
            };
            
            const mockRequest = {
                command: 'list-profiles',
                prompt: ''
            } as vscode.ChatRequest;

            mockProfileManager.getActiveProfileName.mockResolvedValue('frontend-development');
            
            await handler.handleProfileCommand(mockRequest, mockStream as any);
            
            expect(mockProfileManager.getActiveProfileName).toHaveBeenCalled();
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('**Available Profiles:**')
            );
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('*Current: frontend-development*')
            );
        });

        test('should handle technical-analysis command', async () => {
            const mockStream = {
                markdown: jest.fn()
            };
            
            const mockRequest = {
                command: 'technical-analysis',
                prompt: 'Build a user authentication system'
            } as vscode.ChatRequest;

            const mockTemplate = 'You are a Business Analyst. Analyze requirements...';
            mockAgentManager.getAgentTemplate.mockResolvedValue(mockTemplate);
            
            await handler.handleProfileCommand(mockRequest, mockStream as any);
            
            expect(mockAgentManager.getAgentTemplate).toHaveBeenCalledWith('business-analyst');
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('🔍 **Starting Technical Analysis Workflow**')
            );
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('Build a user authentication system')
            );
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('**Business Analyst Agent Activated**')
            );
        });

        test('should handle errors gracefully in switch-profile', async () => {
            const mockStream = {
                markdown: jest.fn()
            };
            
            const mockRequest = {
                command: 'switch-profile',
                prompt: 'test-profile'
            } as vscode.ChatRequest;

            mockProfileManager.setActiveProfile.mockRejectedValue(new Error('Database error'));
            
            await handler.handleProfileCommand(mockRequest, mockStream as any);
            
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('❌ Error switching profile: Error: Database error')
            );
        });
    });
});