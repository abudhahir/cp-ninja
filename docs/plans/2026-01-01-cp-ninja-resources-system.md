# CP-Ninja Resources System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use cp-ninja:executing-plans to implement this plan task-by-task.

**Goal:** Build a comprehensive resources directory system with profiles, agent templates, and smart context detection for cp-ninja

**Architecture:** Layered inheritance system (global → profile → project) with background context analysis, agent template management, and automatic preset suggestions based on project detection

**Tech Stack:** TypeScript, VS Code Extensions API, Node.js file system operations, JSON configuration files

---

## Task 1: Resource Directory Foundation

**Files:**
- Create: `src/ResourceManager.ts`
- Create: `src/types/ResourceTypes.ts`  
- Modify: `src/extension.ts:45-65`
- Test: `tests/ResourceManager.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/ResourceManager.test.ts
import { ResourceManager } from '../src/ResourceManager';
import * as path from 'path';

describe('ResourceManager', () => {
    test('should initialize resource directories', async () => {
        const resourceManager = new ResourceManager('/test/workspace');
        const directories = await resourceManager.initializeDirectories();
        
        expect(directories.globalDir).toBe(path.join(process.env.HOME!, '.cp-ninja'));
        expect(directories.projectDir).toBe('/test/workspace/.cp-ninja');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testNamePattern="should initialize resource directories"`
Expected: FAIL with "ResourceManager not defined"

**Step 3: Create resource types interface**

```typescript
// src/types/ResourceTypes.ts
export interface ResourceDirectories {
    globalDir: string;
    projectDir: string;
    profilesDir: string;
    agentsDir: string;
}

export interface ProfileConfig {
    name: string;
    description: string;
    skills: string[];
    agentTemplates: string[];
    codingStandards: string[];
    autoActivate: {
        filePatterns: string[];
        dependencies: string[];
        keywords: string[];
    };
}

export interface ProjectContext {
    language: string[];
    frameworks: string[];
    projectType: string;
    recentActivity: string[];
    teamIndicators: string[];
}
```

**Step 4: Write minimal ResourceManager implementation**

```typescript
// src/ResourceManager.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ResourceDirectories, ProfileConfig, ProjectContext } from './types/ResourceTypes';

export class ResourceManager {
    private workspacePath: string;

    constructor(workspacePath: string) {
        this.workspacePath = workspacePath;
    }

    async initializeDirectories(): Promise<ResourceDirectories> {
        const globalDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cp-ninja');
        const projectDir = path.join(this.workspacePath, '.cp-ninja');
        const profilesDir = path.join(globalDir, 'profiles');
        const agentsDir = path.join(globalDir, 'resources', 'agents');

        // Create directories if they don't exist
        await this.ensureDirectory(globalDir);
        await this.ensureDirectory(projectDir);
        await this.ensureDirectory(profilesDir);
        await this.ensureDirectory(agentsDir);

        return { globalDir, projectDir, profilesDir, agentsDir };
    }

    private async ensureDirectory(dirPath: string): Promise<void> {
        if (!fs.existsSync(dirPath)) {
            await fs.promises.mkdir(dirPath, { recursive: true });
        }
    }
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- --testNamePattern="should initialize resource directories"`
Expected: PASS

**Step 6: Commit**

```bash
git add tests/ResourceManager.test.ts src/ResourceManager.ts src/types/ResourceTypes.ts
git commit -m "feat: add ResourceManager with directory initialization"
```

## Task 2: Profile System with Layered Inheritance

**Files:**
- Modify: `src/ResourceManager.ts:25-60`
- Create: `src/ProfileManager.ts`
- Test: `tests/ProfileManager.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/ProfileManager.test.ts
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

        jest.spyOn(profileManager as any, 'loadProfile').mockResolvedValue(mockProfile);
        
        const resolved = await profileManager.resolveActiveProfile('frontend-dev');
        expect(resolved.skills).toContain('test-driven-development');
        expect(resolved.name).toBe('frontend-dev');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testNamePattern="should resolve profile with inheritance"`
Expected: FAIL with "ProfileManager not defined"

**Step 3: Write ProfileManager implementation**

```typescript
// src/ProfileManager.ts
import * as path from 'path';
import * as fs from 'fs';
import { ProfileConfig } from './types/ResourceTypes';

export class ProfileManager {
    constructor(
        private globalDir: string,
        private projectDir: string
    ) {}

    async resolveActiveProfile(profileName: string): Promise<ProfileConfig | null> {
        const profilePath = path.join(this.globalDir, 'profiles', `${profileName}.json`);
        
        if (fs.existsSync(profilePath)) {
            return this.loadProfile(profilePath);
        }
        
        return null;
    }

    private async loadProfile(profilePath: string): Promise<ProfileConfig> {
        const content = await fs.promises.readFile(profilePath, 'utf8');
        return JSON.parse(content) as ProfileConfig;
    }

    async getActiveProfileName(): Promise<string | null> {
        const activeProfilePath = path.join(this.projectDir, 'active-profile');
        
        if (fs.existsSync(activeProfilePath)) {
            const content = await fs.promises.readFile(activeProfilePath, 'utf8');
            return content.trim();
        }
        
        return null;
    }

    async setActiveProfile(profileName: string): Promise<void> {
        const activeProfilePath = path.join(this.projectDir, 'active-profile');
        await fs.promises.writeFile(activeProfilePath, profileName);
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testNamePattern="should resolve profile with inheritance"`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/ProfileManager.test.ts src/ProfileManager.ts
git commit -m "feat: add ProfileManager with inheritance resolution"
```

## Task 3: Context Detection Engine

**Files:**
- Create: `src/ContextDetector.ts`
- Test: `tests/ContextDetector.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/ContextDetector.test.ts
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
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testNamePattern="should detect React project context"`
Expected: FAIL with "ContextDetector not defined"

**Step 3: Write ContextDetector implementation**

```typescript
// src/ContextDetector.ts
import * as path from 'path';
import * as fs from 'fs';
import { ProjectContext } from './types/ResourceTypes';

export class ContextDetector {
    constructor(private workspacePath: string) {}

    async analyzeProject(): Promise<ProjectContext> {
        const packageJson = await this.readPackageJson();
        const filePatterns = await this.analyzeFilePatterns();
        
        const frameworks = this.detectFrameworks(packageJson);
        const languages = this.detectLanguages(packageJson, filePatterns);
        const projectType = this.determineProjectType(frameworks, filePatterns);
        
        return {
            language: languages,
            frameworks: frameworks,
            projectType: projectType,
            recentActivity: [], // TODO: Git analysis
            teamIndicators: await this.detectTeamIndicators()
        };
    }

    private async readPackageJson(): Promise<any> {
        const packagePath = path.join(this.workspacePath, 'package.json');
        
        if (fs.existsSync(packagePath)) {
            const content = await fs.promises.readFile(packagePath, 'utf8');
            return JSON.parse(content);
        }
        
        return {};
    }

    private detectFrameworks(packageJson: any): string[] {
        const frameworks: string[] = [];
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps.react) frameworks.push('react');
        if (deps.vue) frameworks.push('vue');
        if (deps.angular) frameworks.push('angular');
        if (deps.express) frameworks.push('express');
        if (deps.fastify) frameworks.push('fastify');
        
        return frameworks;
    }

    private detectLanguages(packageJson: any, filePatterns: string[]): string[] {
        const languages: string[] = [];
        
        if (packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript || filePatterns.includes('.ts')) {
            languages.push('typescript');
        }
        if (filePatterns.includes('.js') || Object.keys(packageJson.dependencies || {}).length > 0) {
            languages.push('javascript');
        }
        
        return languages;
    }

    private determineProjectType(frameworks: string[], filePatterns: string[]): string {
        if (frameworks.some(f => ['react', 'vue', 'angular'].includes(f))) {
            return 'frontend';
        }
        if (frameworks.some(f => ['express', 'fastify', 'nest'].includes(f))) {
            return 'backend';
        }
        return 'unknown';
    }

    private async analyzeFilePatterns(): Promise<string[]> {
        const patterns: string[] = [];
        
        if (fs.existsSync(path.join(this.workspacePath, 'tsconfig.json'))) {
            patterns.push('.ts');
        }
        
        return patterns;
    }

    private async detectTeamIndicators(): Promise<string[]> {
        const indicators: string[] = [];
        
        if (fs.existsSync(path.join(this.workspacePath, '.editorconfig'))) {
            indicators.push('.editorconfig');
        }
        if (fs.existsSync(path.join(this.workspacePath, '.eslintrc'))) {
            indicators.push('.eslintrc');
        }
        
        return indicators;
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testNamePattern="should detect React project context"`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/ContextDetector.test.ts src/ContextDetector.ts
git commit -m "feat: add ContextDetector for project analysis"
```

## Task 4: Agent Template Management

**Files:**
- Create: `src/AgentManager.ts`
- Create: `templates/agents/business-analyst-prompt.md`
- Create: `templates/agents/software-architect-prompt.md`
- Create: `templates/agents/technical-analyzer-prompt.md`
- Test: `tests/AgentManager.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/AgentManager.test.ts
import { AgentManager } from '../src/AgentManager';

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
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testNamePattern="should load agent template"`
Expected: FAIL with "AgentManager not defined"

**Step 3: Create agent template files**

```markdown
<!-- templates/agents/business-analyst-prompt.md -->
# Business Analyst Agent

## Role
Requirements validation and stakeholder analysis specialist that bridges business needs with technical implementation.

## Process
1. **Requirements Validation** - Verify completeness, consistency, and feasibility of requirements
2. **Stakeholder Analysis** - Identify all stakeholders and their needs/constraints
3. **Business Logic Validation** - Ensure business rules and processes are clearly defined
4. **Acceptance Criteria** - Define measurable success criteria for each requirement
5. **Risk Assessment** - Identify business and technical risks

## Output Templates
- Business Requirements Analysis Document
- Stakeholder Impact Assessment
- Acceptance Criteria Checklist
- Risk Matrix and Mitigation Strategies

## Integration Points
- Hands off validated requirements to Software Architect
- Provides business context for Technical Analyzer
- Validates final implementation against business needs
```

```markdown
<!-- templates/agents/software-architect-prompt.md -->
# Software Architect Agent  

## Role
System design and architecture planning specialist that creates scalable, maintainable technical solutions.

## Process
1. **System Analysis** - Understand current architecture and constraints
2. **Architecture Design** - Design system components, data flow, and integration patterns
3. **Scalability Planning** - Ensure design can handle growth requirements  
4. **Technology Selection** - Choose appropriate technologies and frameworks
5. **Integration Strategy** - Plan how new components integrate with existing system

## Output Templates
- System Architecture Diagram
- Component Design Documentation  
- Technology Stack Recommendations
- Integration and API Specifications
- Scalability and Performance Considerations

## Integration Points
- Receives validated requirements from Business Analyst
- Provides architectural context to Technical Analyzer
- Reviews implementation plans for architectural compliance
```

```markdown
<!-- templates/agents/technical-analyzer-prompt.md -->
# Technical Analyzer Agent

## Role
Implementation planning specialist that bridges architecture design with actionable development tasks.

## Process
1. **Technical Feasibility** - Assess implementation complexity and technical risks
2. **Implementation Strategy** - Plan step-by-step development approach
3. **Resource Planning** - Estimate time, effort, and technical dependencies  
4. **Quality Assurance** - Define testing strategy and quality gates
5. **Documentation Planning** - Plan technical documentation and knowledge transfer

## Output Templates  
- Technical Implementation Plan
- Development Task Breakdown
- Testing Strategy Document
- Technical Documentation Plan
- Risk Mitigation Strategies

## Integration Points
- Receives requirements from Business Analyst and architecture from Software Architect
- Provides detailed implementation plan to Implementation Planner
- Coordinates with development team throughout implementation
```

**Step 4: Write AgentManager implementation**

```typescript
// src/AgentManager.ts
import * as path from 'path';
import * as fs from 'fs';

export class AgentManager {
    constructor(private agentsDir: string) {}

    async getAgentTemplate(agentType: string): Promise<string | null> {
        const templatePath = path.join(this.agentsDir, `${agentType}-prompt.md`);
        
        if (fs.existsSync(templatePath)) {
            return this.readTemplate(templatePath);
        }
        
        // Fallback to built-in templates
        const builtinPath = path.join(__dirname, '..', 'templates', 'agents', `${agentType}-prompt.md`);
        if (fs.existsSync(builtinPath)) {
            return this.readTemplate(builtinPath);
        }
        
        return null;
    }

    private async readTemplate(templatePath: string): Promise<string> {
        return await fs.promises.readFile(templatePath, 'utf8');
    }

    async listAvailableAgents(): Promise<string[]> {
        const agents: string[] = [];
        
        // Check user agents directory
        if (fs.existsSync(this.agentsDir)) {
            const files = await fs.promises.readdir(this.agentsDir);
            agents.push(...files.filter(f => f.endsWith('-prompt.md')).map(f => f.replace('-prompt.md', '')));
        }
        
        // Check built-in templates
        const builtinDir = path.join(__dirname, '..', 'templates', 'agents');
        if (fs.existsSync(builtinDir)) {
            const files = await fs.promises.readdir(builtinDir);
            const builtinAgents = files.filter(f => f.endsWith('-prompt.md')).map(f => f.replace('-prompt.md', ''));
            agents.push(...builtinAgents.filter(a => !agents.includes(a)));
        }
        
        return agents;
    }
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- --testNamePattern="should load agent template"`
Expected: PASS

**Step 6: Commit**

```bash
git add tests/AgentManager.test.ts src/AgentManager.ts templates/agents/
git commit -m "feat: add AgentManager and core agent templates"
```

## Task 5: Bootstrap Integration with Extension

**Files:**
- Modify: `src/extension.ts:40-80`
- Create: `src/BootstrapManager.ts`
- Test: `tests/BootstrapManager.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/BootstrapManager.test.ts
import { BootstrapManager } from '../src/BootstrapManager';
import { ProjectContext } from '../src/types/ResourceTypes';

describe('BootstrapManager', () => {
    test('should suggest appropriate preset based on context', async () => {
        const bootstrap = new BootstrapManager('/test/workspace');
        
        const context: ProjectContext = {
            language: ['typescript'],
            frameworks: ['react'],
            projectType: 'frontend',
            recentActivity: [],
            teamIndicators: ['.editorconfig']
        };
        
        const suggestions = await bootstrap.suggestPresets(context);
        expect(suggestions).toContainEqual(
            expect.objectContaining({
                preset: 'frontend-development',
                confidence: expect.any(Number)
            })
        );
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testNamePattern="should suggest appropriate preset"`
Expected: FAIL with "BootstrapManager not defined"

**Step 3: Write BootstrapManager implementation**

```typescript
// src/BootstrapManager.ts
import { ResourceManager } from './ResourceManager';
import { ProfileManager } from './ProfileManager';
import { ContextDetector } from './ContextDetector';
import { ProjectContext } from './types/ResourceTypes';

interface PresetSuggestion {
    preset: string;
    confidence: number;
    reason: string;
}

export class BootstrapManager {
    private resourceManager: ResourceManager;
    private profileManager: ProfileManager;
    private contextDetector: ContextDetector;

    constructor(workspacePath: string) {
        this.resourceManager = new ResourceManager(workspacePath);
        this.contextDetector = new ContextDetector(workspacePath);
    }

    async initialize(): Promise<void> {
        const directories = await this.resourceManager.initializeDirectories();
        this.profileManager = new ProfileManager(directories.globalDir, directories.projectDir);
        
        // Create default profiles if they don't exist
        await this.createDefaultProfiles(directories.profilesDir);
    }

    async suggestPresets(context: ProjectContext): Promise<PresetSuggestion[]> {
        const suggestions: PresetSuggestion[] = [];
        
        // Frontend project detection
        if (context.frameworks.includes('react') || context.frameworks.includes('vue')) {
            suggestions.push({
                preset: 'frontend-development',
                confidence: 0.9,
                reason: 'Detected React/Vue framework'
            });
        }
        
        // Backend API detection
        if (context.frameworks.includes('express') || context.frameworks.includes('fastify')) {
            suggestions.push({
                preset: 'backend-api',
                confidence: 0.85,
                reason: 'Detected API framework'
            });
        }
        
        // Technical analysis context
        if (context.recentActivity.includes('planning') || context.recentActivity.includes('requirements')) {
            suggestions.push({
                preset: 'technical-analysis',
                confidence: 0.75,
                reason: 'Recent planning activity detected'
            });
        }
        
        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    private async createDefaultProfiles(profilesDir: string): Promise<void> {
        // Create default workflow profiles if they don't exist
        const defaultProfiles = [
            {
                name: 'frontend-development',
                description: 'Frontend development with React/Vue best practices',
                skills: ['test-driven-development', 'systematic-debugging'],
                agentTemplates: ['react-reviewer', 'accessibility-checker'],
                codingStandards: ['frontend-conventions.md'],
                autoActivate: {
                    filePatterns: ['*.tsx', '*.jsx', '*.vue'],
                    dependencies: ['react', 'vue'],
                    keywords: ['component', 'frontend']
                }
            },
            {
                name: 'technical-analysis',
                description: 'Comprehensive requirement analysis workflow',
                skills: ['brainstorming', 'writing-plans'],
                agentTemplates: ['business-analyst', 'software-architect', 'technical-analyzer'],
                codingStandards: ['analysis-template.md'],
                autoActivate: {
                    filePatterns: ['requirements*.md', 'specs/**/*.md'],
                    dependencies: [],
                    keywords: ['requirement', 'analysis', 'planning']
                }
            }
        ];
        
        // Implementation would save these profiles to files
    }
}
```

**Step 4: Integrate with extension activation**

```typescript
// Modify src/extension.ts around line 45
export async function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "cp-ninja" is now active!');

    extensionBasePath = context.extensionPath;
    
    // Initialize resource system
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspacePath) {
        const bootstrap = new BootstrapManager(workspacePath);
        await bootstrap.initialize();
        
        // Background context analysis
        setTimeout(async () => {
            const contextDetector = new ContextDetector(workspacePath);
            const projectContext = await contextDetector.analyzeProject();
            const suggestions = await bootstrap.suggestPresets(projectContext);
            
            // Show suggestions if high confidence
            const highConfidenceSuggestions = suggestions.filter(s => s.confidence > 0.8);
            if (highConfidenceSuggestions.length > 0) {
                const suggestion = highConfidenceSuggestions[0];
                vscode.window.showInformationMessage(
                    `CP-Ninja: ${suggestion.reason} - Apply ${suggestion.preset} preset?`,
                    'Apply', 'Later'
                ).then(selection => {
                    if (selection === 'Apply') {
                        // Apply preset logic
                    }
                });
            }
        }, 2000); // Delay to avoid blocking startup
    }

    const skillsDir = path.join(context.extensionPath, 'skills');
    // ... rest of existing activation code
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- --testNamePattern="should suggest appropriate preset"`
Expected: PASS

**Step 6: Commit**

```bash
git add tests/BootstrapManager.test.ts src/BootstrapManager.ts src/extension.ts
git commit -m "feat: add BootstrapManager with context-aware preset suggestions"
```

## Task 6: Chat Participant Enhancement for Profiles

**Files:**
- Create: `src/ProfileChatHandler.ts`
- Modify: `src/extension.ts:80-120`
- Test: `tests/ProfileChatHandler.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/ProfileChatHandler.test.ts
import { ProfileChatHandler } from '../src/ProfileChatHandler';

describe('ProfileChatHandler', () => {
    test('should handle profile switch command', async () => {
        const handler = new ProfileChatHandler('/test/workspace');
        
        const mockStream = {
            markdown: jest.fn()
        };
        
        const mockRequest = {
            command: 'switch-profile',
            prompt: 'frontend-development'
        };
        
        await handler.handleProfileCommand(mockRequest as any, mockStream as any);
        
        expect(mockStream.markdown).toHaveBeenCalledWith(
            expect.stringContaining('Switched to frontend-development profile')
        );
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testNamePattern="should handle profile switch command"`
Expected: FAIL with "ProfileChatHandler not defined"

**Step 3: Write ProfileChatHandler implementation**

```typescript
// src/ProfileChatHandler.ts
import * as vscode from 'vscode';
import { ProfileManager } from './ProfileManager';
import { AgentManager } from './AgentManager';

export class ProfileChatHandler {
    private profileManager: ProfileManager;
    private agentManager: AgentManager;

    constructor(
        workspacePath: string,
        globalDir: string,
        projectDir: string,
        agentsDir: string
    ) {
        this.profileManager = new ProfileManager(globalDir, projectDir);
        this.agentManager = new AgentManager(agentsDir);
    }

    async handleProfileCommand(
        request: vscode.ChatRequest, 
        stream: vscode.ChatResponseStream
    ): Promise<void> {
        if (request.command === 'switch-profile') {
            await this.handleSwitchProfile(request.prompt, stream);
        } else if (request.command === 'list-profiles') {
            await this.handleListProfiles(stream);
        } else if (request.command === 'technical-analysis') {
            await this.handleTechnicalAnalysis(request.prompt, stream);
        }
    }

    private async handleSwitchProfile(profileName: string, stream: vscode.ChatResponseStream): Promise<void> {
        try {
            await this.profileManager.setActiveProfile(profileName);
            const profile = await this.profileManager.resolveActiveProfile(profileName);
            
            if (profile) {
                stream.markdown(`✅ **Switched to ${profileName} profile**\n\n` +
                    `**Active Skills:** ${profile.skills.join(', ')}\n\n` +
                    `**Available Agents:** ${profile.agentTemplates.join(', ')}\n\n` +
                    `Use \`@cp-ninja:skill-name\` to activate skills from this profile.`);
            } else {
                stream.markdown(`❌ Profile "${profileName}" not found.`);
            }
        } catch (error) {
            stream.markdown(`❌ Error switching profile: ${error}`);
        }
    }

    private async handleListProfiles(stream: vscode.ChatResponseStream): Promise<void> {
        const activeProfile = await this.profileManager.getActiveProfileName();
        stream.markdown(`**Available Profiles:**\n\n` +
            `${activeProfile ? `*Current: ${activeProfile}*\n\n` : ''}` +
            `- \`frontend-development\` - React/Vue development preset\n` +
            `- \`backend-api\` - API development preset\n` +
            `- \`technical-analysis\` - Requirements analysis workflow\n` +
            `- \`tdd-workflow\` - Test-driven development preset\n\n` +
            `Use \`@cp-ninja switch-profile <name>\` to switch profiles.`);
    }

    private async handleTechnicalAnalysis(requirement: string, stream: vscode.ChatResponseStream): Promise<void> {
        stream.markdown(`🔍 **Starting Technical Analysis Workflow**\n\n` +
            `**Requirement:** ${requirement}\n\n` +
            `**Phase 1: Business Analysis** - Dispatching Business Analyst agent...`);
        
        const baTemplate = await this.agentManager.getAgentTemplate('business-analyst');
        if (baTemplate) {
            stream.markdown(`\n\n**Business Analyst Agent Activated**\n\n${baTemplate}`);
        }
    }
}
```

**Step 4: Integrate with extension chat handlers**

```typescript
// Modify src/extension.ts around line 80
export function activate(context: vscode.ExtensionContext) {
    // ... existing code ...
    
    let profileChatHandler: ProfileChatHandler;
    
    // Initialize profile chat handler after bootstrap
    if (workspacePath) {
        const bootstrap = new BootstrapManager(workspacePath);
        bootstrap.initialize().then(async () => {
            const directories = await new ResourceManager(workspacePath).initializeDirectories();
            profileChatHandler = new ProfileChatHandler(
                workspacePath,
                directories.globalDir,
                directories.projectDir,
                directories.agentsDir
            );
        });
    }

    // Enhanced main chat handler
    const enhancedMainChatHandler: vscode.ChatRequestHandler = async (
        request: vscode.ChatRequest, 
        context: vscode.ChatContext, 
        stream: vscode.ChatResponseStream
    ): Promise<vscode.ChatResult> => {
        
        // Handle profile commands
        if (['switch-profile', 'list-profiles', 'technical-analysis'].includes(request.command || '')) {
            if (profileChatHandler) {
                await profileChatHandler.handleProfileCommand(request, stream);
                return {};
            }
        }
        
        // Fall back to original handler
        return mainChatHandler(request, context, stream);
    };

    // Register enhanced chat participant
    const chatParticipant = vscode.chat.createChatParticipant('cp-ninja', enhancedMainChatHandler);
    chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');
    
    // Add commands
    chatParticipant.supportedCommands = [
        { name: 'switch-profile', description: 'Switch to a different profile' },
        { name: 'list-profiles', description: 'List available profiles' },
        { name: 'technical-analysis', description: 'Start technical analysis workflow' }
    ];

    // ... rest of existing code ...
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- --testNamePattern="should handle profile switch command"`
Expected: PASS

**Step 6: Commit**

```bash
git add tests/ProfileChatHandler.test.ts src/ProfileChatHandler.ts src/extension.ts
git commit -m "feat: add ProfileChatHandler with enhanced chat commands"
```

---

**Plan complete and saved to `docs/plans/2026-01-01-cp-ninja-resources-system.md`.**

## Execution Options

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints  

**Which approach would you prefer?**