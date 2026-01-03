import { ProfileChatHandler } from '../../src/ProfileChatHandler';
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

// Mock vscode module
jest.mock('vscode', () => ({
    // Mock minimal vscode types needed for testing
}));

// Mock the dependencies
jest.mock('../../src/ProfileManager', () => ({
    ProfileManager: jest.fn().mockImplementation(() => ({
        setActiveProfile: jest.fn(),
        resolveActiveProfile: jest.fn(),
        getActiveProfileName: jest.fn()
    }))
}));

jest.mock('../../src/AgentManager', () => ({
    AgentManager: jest.fn().mockImplementation(() => ({
        getAgentTemplate: jest.fn()
    }))
}));

describe('ProfileChatHandler Integration', () => {
    let handler: ProfileChatHandler;
    let mockProfileManager: any;
    let mockAgentManager: any;

    beforeEach(() => {
        const workspacePath = '/test/workspace';
        const globalDir = path.join(os.homedir(), '.cp-ninja');
        const projectDir = path.join(workspacePath, '.cp-ninja');
        const agentsDir = path.join(globalDir, 'agents');

        handler = new ProfileChatHandler(workspacePath, globalDir, projectDir, agentsDir);
        
        // Get the mocked instances
        const { ProfileManager } = require('../../src/ProfileManager');
        const { AgentManager } = require('../../src/AgentManager');
        mockProfileManager = ProfileManager.mock.results[ProfileManager.mock.results.length - 1].value;
        mockAgentManager = AgentManager.mock.results[AgentManager.mock.results.length - 1].value;
    });

    describe('End-to-End Profile Commands', () => {
        test('should complete full profile switching workflow', async () => {
            const mockStream = {
                markdown: jest.fn()
            };
            
            const switchRequest = {
                command: 'switch-profile',
                prompt: 'frontend-development'
            } as vscode.ChatRequest;

            // Mock successful profile resolution
            const mockProfile = {
                name: 'frontend-development',
                description: 'Frontend development preset',
                skills: ['brainstorming', 'writing-plans', 'using-superpowers'],
                agentTemplates: ['frontend-specialist', 'ui-designer', 'accessibility-expert'],
                codingStandards: ['react-standards.md', 'typescript-standards.md'],
                autoActivate: {
                    filePatterns: ['*.tsx', '*.jsx'],
                    dependencies: ['react', 'vue', 'angular'],
                    keywords: ['component', 'hook', 'state']
                }
            };

            mockProfileManager.setActiveProfile.mockResolvedValue(undefined);
            mockProfileManager.resolveActiveProfile.mockResolvedValue(mockProfile);
            
            // Execute profile switch
            await handler.handleProfileCommand(switchRequest, mockStream as any);
            
            // Verify all calls were made correctly
            expect(mockProfileManager.setActiveProfile).toHaveBeenCalledWith('frontend-development');
            expect(mockProfileManager.resolveActiveProfile).toHaveBeenCalledWith('frontend-development');
            
            // Verify success message format
            const markdownCall = mockStream.markdown.mock.calls[0][0];
            expect(markdownCall).toContain('✅ **Switched to frontend-development profile**');
            expect(markdownCall).toContain('brainstorming, writing-plans, using-superpowers');
            expect(markdownCall).toContain('frontend-specialist, ui-designer, accessibility-expert');
            expect(markdownCall).toContain('Use `@cp-ninja:skill-name` to activate skills from this profile');
        });

        test('should handle complete technical analysis workflow', async () => {
            const mockStream = {
                markdown: jest.fn()
            };
            
            const analysisRequest = {
                command: 'technical-analysis',
                prompt: 'Build a scalable user authentication system with OAuth2 integration'
            } as vscode.ChatRequest;

            // Mock successful agent template retrieval
            const mockTemplate = `# Business Analyst Agent

You are an expert Business Analyst specializing in technical requirement analysis.

## Your Role:
- Analyze business requirements and translate them to technical specifications
- Identify stakeholder needs and system constraints
- Create detailed requirement documents

## Current Task:
Analyze the following requirement and provide a comprehensive business analysis...`;

            mockAgentManager.getAgentTemplate.mockResolvedValue(mockTemplate);
            
            // Execute technical analysis
            await handler.handleProfileCommand(analysisRequest, mockStream as any);
            
            // Verify agent template was requested
            expect(mockAgentManager.getAgentTemplate).toHaveBeenCalledWith('business-analyst');
            
            // Verify workflow messages
            const calls = mockStream.markdown.mock.calls;
            expect(calls.length).toBe(2);
            
            // First call should be the workflow initiation
            const initMessage = calls[0][0];
            expect(initMessage).toContain('🔍 **Starting Technical Analysis Workflow**');
            expect(initMessage).toContain('Build a scalable user authentication system with OAuth2 integration');
            expect(initMessage).toContain('**Phase 1: Business Analysis** - Dispatching Business Analyst agent...');
            
            // Second call should be the agent template
            const agentMessage = calls[1][0];
            expect(agentMessage).toContain('**Business Analyst Agent Activated**');
            expect(agentMessage).toContain('You are an expert Business Analyst');
        });

        test('should provide comprehensive profile listing with current state', async () => {
            const mockStream = {
                markdown: jest.fn()
            };
            
            const listRequest = {
                command: 'list-profiles',
                prompt: ''
            } as vscode.ChatRequest;

            // Mock current active profile
            mockProfileManager.getActiveProfileName.mockResolvedValue('backend-api');
            
            // Execute profile listing
            await handler.handleProfileCommand(listRequest, mockStream as any);
            
            // Verify active profile query
            expect(mockProfileManager.getActiveProfileName).toHaveBeenCalled();
            
            // Verify listing format
            const markdownCall = mockStream.markdown.mock.calls[0][0];
            expect(markdownCall).toContain('**Available Profiles:**');
            expect(markdownCall).toContain('*Current: backend-api*');
            expect(markdownCall).toContain('`frontend-development` - React/Vue development preset');
            expect(markdownCall).toContain('`backend-api` - API development preset');
            expect(markdownCall).toContain('`technical-analysis` - Requirements analysis workflow');
            expect(markdownCall).toContain('`tdd-workflow` - Test-driven development preset');
            expect(markdownCall).toContain('Use `@cp-ninja switch-profile <name>` to switch profiles');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should gracefully handle missing agent templates', async () => {
            const mockStream = {
                markdown: jest.fn()
            };
            
            const analysisRequest = {
                command: 'technical-analysis',
                prompt: 'Analyze authentication requirements'
            } as vscode.ChatRequest;

            // Mock missing agent template
            mockAgentManager.getAgentTemplate.mockResolvedValue(null);
            
            await handler.handleProfileCommand(analysisRequest, mockStream as any);
            
            const calls = mockStream.markdown.mock.calls;
            expect(calls.length).toBe(2);
            
            const errorMessage = calls[1][0];
            expect(errorMessage).toContain('❌ Business Analyst agent template not found');
        });

        test('should handle profile manager errors with proper messaging', async () => {
            const mockStream = {
                markdown: jest.fn()
            };
            
            const switchRequest = {
                command: 'switch-profile',
                prompt: 'test-profile'
            } as vscode.ChatRequest;

            // Mock profile manager error
            mockProfileManager.setActiveProfile.mockRejectedValue(new Error('Profile directory not accessible'));
            
            await handler.handleProfileCommand(switchRequest, mockStream as any);
            
            const errorMessage = mockStream.markdown.mock.calls[0][0];
            expect(errorMessage).toContain('❌ Error switching profile: Error: Profile directory not accessible');
        });
    });

    describe('Command Recognition and Routing', () => {
        test('should properly recognize all supported commands', async () => {
            const mockStream = { markdown: jest.fn() };
            
            const commands = [
                { command: 'switch-profile', prompt: 'test-profile' },
                { command: 'list-profiles', prompt: '' },
                { command: 'technical-analysis', prompt: 'test requirement' }
            ];

            // Mock successful responses for all commands
            mockProfileManager.setActiveProfile.mockResolvedValue(undefined);
            mockProfileManager.resolveActiveProfile.mockResolvedValue(null); // Profile not found
            mockProfileManager.getActiveProfileName.mockResolvedValue('current-profile');
            mockAgentManager.getAgentTemplate.mockResolvedValue('mock template');

            for (const cmd of commands) {
                mockStream.markdown.mockClear();
                await handler.handleProfileCommand(cmd as vscode.ChatRequest, mockStream as any);
                expect(mockStream.markdown).toHaveBeenCalled();
            }
        });
    });
});