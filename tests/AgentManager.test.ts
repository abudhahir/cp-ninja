import { AgentManager } from '../src/AgentManager';
import * as fs from 'fs';
import * as path from 'path';

describe('AgentManager', () => {
    test('should load agent template', async () => {
        const agentManager = new AgentManager('/test/global/agents');
        
        jest.spyOn(agentManager as any, 'readTemplate').mockResolvedValue(`
# Business Analyst Agent

## Role
Requirements validation and stakeholder analysis specialist.

## Process
1. Validate requirements completeness
2. Identify stakeholder needs
3. Define acceptance criteria
        `);
        
        const template = await agentManager.getAgentTemplate('business-analyst');
        expect(template).toContain('Requirements validation');
    });

    test('should load built-in agent template when user template not found', async () => {
        const agentManager = new AgentManager('/test/global/agents');
        
        // Mock user template access to fail, built-in to succeed
        jest.spyOn(fs.promises, 'access')
            .mockRejectedValueOnce(new Error('User template not found'))
            .mockResolvedValueOnce(undefined); // Built-in template exists
        
        jest.spyOn(agentManager as any, 'readTemplate').mockResolvedValue(`
# Technical Analyzer Agent

## Role
Code quality and technical implementation specialist.
        `);
        
        const template = await agentManager.getAgentTemplate('technical-analyzer');
        expect(template).toContain('Code quality');
    });

    test('should return null when template does not exist', async () => {
        const agentManager = new AgentManager('/test/global/agents');
        
        // Mock both user and built-in template access to fail
        jest.spyOn(fs.promises, 'access').mockRejectedValue(new Error('Template not found'));
        
        const template = await agentManager.getAgentTemplate('nonexistent-agent');
        expect(template).toBeNull();
    });

    test('should list available agents from both user and built-in directories', async () => {
        const agentManager = new AgentManager('/test/global/agents');
        
        // Mock directory access and readdir
        jest.spyOn(fs.promises, 'access').mockResolvedValue(undefined);
        jest.spyOn(fs.promises, 'readdir')
            .mockResolvedValueOnce(['custom-agent-prompt.md', 'other-file.txt'] as any)
            .mockResolvedValueOnce(['business-analyst-prompt.md', 'software-architect-prompt.md'] as any);
        
        const agents = await agentManager.listAvailableAgents();
        expect(agents).toContain('custom-agent');
        expect(agents).toContain('business-analyst');
        expect(agents).toContain('software-architect');
        expect(agents).not.toContain('other-file'); // Should filter out non-prompt files
    });

    test('should load actual built-in agent templates', async () => {
        const agentManager = new AgentManager('/nonexistent/path'); // Force fallback to built-ins
        
        const businessAnalyst = await agentManager.getAgentTemplate('business-analyst');
        const softwareArchitect = await agentManager.getAgentTemplate('software-architect');
        const technicalAnalyzer = await agentManager.getAgentTemplate('technical-analyzer');
        
        expect(businessAnalyst).toContain('Requirements validation and stakeholder analysis specialist');
        expect(softwareArchitect).toContain('System design and architectural decision specialist');
        expect(technicalAnalyzer).toContain('Code quality and technical implementation specialist');
    });
});