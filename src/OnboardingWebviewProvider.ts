import * as vscode from 'vscode';
import * as path from 'path';

export class OnboardingWebviewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private readonly extensionUri: vscode.Uri;
    private currentStep: number = 0;

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
    }

    /**
     * Show the onboarding tutorial webview
     */
    public async show(): Promise<void> {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (this.panel) {
            this.panel.reveal(column);
            return;
        }

        // Create a new panel
        this.panel = vscode.window.createWebviewPanel(
            'cpNinjaOnboarding',
            '🥷 CP-Ninja Tutorial',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [this.extensionUri],
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'navigate':
                        this.currentStep = message.step;
                        break;
                    case 'openChat':
                        await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                        break;
                    case 'openSkillsExplorer':
                        await vscode.commands.executeCommand('cp-ninja.showDetails');
                        break;
                    case 'createSkill': {
                        await vscode.commands.executeCommand('cp-ninja.createSkill');
                        break;
                    }
                    case 'viewAgents': {
                        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                        if (workspaceFolder) {
                            const agentsPath = path.join(workspaceFolder.uri.fsPath, '.github', 'prompts');
                            const uri = vscode.Uri.file(agentsPath);
                            await vscode.commands.executeCommand('revealFileInOS', uri);
                        }
                        break;
                    }
                    case 'viewInstructions': {
                        const wsFolder = vscode.workspace.workspaceFolders?.[0];
                        if (wsFolder) {
                            const instructionsPath = path.join(wsFolder.uri.fsPath, '.github', 'copilot-instructions.md');
                            const uri = vscode.Uri.file(instructionsPath);
                            try {
                                await vscode.workspace.fs.stat(uri);
                                await vscode.commands.executeCommand('vscode.open', uri);
                            } catch {
                                vscode.window.showInformationMessage('No .github/copilot-instructions.md file found in workspace');
                            }
                        }
                        break;
                    }
                    case 'tryExample':
                        await vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
                        vscode.window.showInformationMessage('Try typing: @cp-ninja /brainstorming');
                        break;
                    case 'close':
                        this.panel?.dispose();
                        break;
                }
            },
            undefined,
            []
        );

        // Clean up when panel is closed
        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
                this.currentStep = 0;
            },
            undefined,
            []
        );
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>CP-Ninja Tutorial</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            line-height: 1.6;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.8;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background-color: var(--vscode-input-background);
            border-radius: 3px;
            margin: 30px 0;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.3s ease;
            border-radius: 3px;
        }

        .nav-buttons {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin-top: 30px;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1em;
            font-family: var(--vscode-font-family);
            transition: all 0.2s;
        }

        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .step {
            display: none;
            animation: fadeIn 0.4s ease-in;
        }

        .step.active {
            display: block;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .content-section {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid var(--vscode-focusBorder);
        }

        .content-section h2 {
            font-size: 1.8em;
            margin-bottom: 15px;
            color: var(--vscode-textLink-foreground);
        }

        .content-section h3 {
            font-size: 1.3em;
            margin: 20px 0 10px 0;
            color: var(--vscode-textPreformat-foreground);
        }

        .content-section p {
            margin-bottom: 15px;
            line-height: 1.8;
        }

        .content-section ul, .content-section ol {
            margin-left: 25px;
            margin-bottom: 15px;
        }

        .content-section li {
            margin-bottom: 8px;
            line-height: 1.6;
        }

        .code-block {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.95em;
            overflow-x: auto;
            border: 1px solid var(--vscode-panel-border);
        }

        .highlight-box {
            background-color: var(--vscode-inputValidation-infoBorder);
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid var(--vscode-charts-blue);
        }

        .warning-box {
            background-color: var(--vscode-inputValidation-warningBorder);
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid var(--vscode-charts-orange);
        }

        .comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        .comparison-table th,
        .comparison-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .comparison-table th {
            background-color: var(--vscode-input-background);
            font-weight: 600;
        }

        .comparison-table tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .emoji {
            font-size: 1.3em;
            margin-right: 8px;
        }

        .action-button {
            display: inline-block;
            margin: 10px 10px 10px 0;
        }

        .steps-indicator {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
        }

        .step-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: var(--vscode-input-background);
            transition: all 0.3s;
        }

        .step-dot.active {
            background-color: var(--vscode-focusBorder);
            transform: scale(1.3);
        }

        .visual-diagram {
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            background-color: var(--vscode-input-background);
            border-radius: 8px;
        }

        .diagram-row {
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin: 15px 0;
            flex-wrap: wrap;
        }

        .diagram-box {
            background-color: var(--vscode-editor-background);
            padding: 15px 20px;
            border-radius: 6px;
            border: 2px solid var(--vscode-focusBorder);
            min-width: 150px;
            margin: 5px;
        }

        .arrow {
            font-size: 2em;
            color: var(--vscode-focusBorder);
            margin: 0 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🥷 Welcome to CP-Ninja</h1>
            <p>Master AI-powered development with Skills, Agents, Prompts & Instructions</p>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 14%"></div>
        </div>

        <div class="steps-indicator" id="stepsIndicator">
            <div class="step-dot active"></div>
            <div class="step-dot"></div>
            <div class="step-dot"></div>
            <div class="step-dot"></div>
            <div class="step-dot"></div>
            <div class="step-dot"></div>
            <div class="step-dot"></div>
            <div class="step-dot"></div>
        </div>

        <!-- Step 0: Overview -->
        <div class="step active" data-step="0">
            <div class="content-section">
                <h2><span class="emoji">🎯</span>What You'll Learn</h2>
                <p>This interactive tutorial will guide you through the four core concepts that power CP-Ninja:</p>
                
                <ol>
                    <li><strong>Skills</strong> - Reusable workflows and methodologies that guide AI behavior</li>
                    <li><strong>Agents</strong> - Autonomous AI workers that execute specific tasks</li>
                    <li><strong>Prompts</strong> - Templates that define agent roles and behaviors</li>
                    <li><strong>Instructions</strong> - Global guidelines for GitHub Copilot in your workspace</li>
                </ol>

                <div class="visual-diagram">
                    <h3>The CP-Ninja Ecosystem</h3>
                    <div class="diagram-row">
                        <div class="diagram-box">📚 Skills<br/><small>Methodologies</small></div>
                        <span class="arrow">→</span>
                        <div class="diagram-box">🤖 Agents<br/><small>Workers</small></div>
                    </div>
                    <div class="diagram-row">
                        <div class="diagram-box">📝 Prompts<br/><small>Agent Templates</small></div>
                        <span class="arrow">+</span>
                        <div class="diagram-box">📋 Instructions<br/><small>Global Context</small></div>
                    </div>
                </div>

                <div class="highlight-box">
                    <strong>💡 Pro Tip:</strong> Understanding these concepts will transform how you work with AI in VS Code. Each builds on the others to create a powerful development workflow.
                </div>
            </div>
        </div>

        <!-- Step 1: Skills -->
        <div class="step" data-step="1">
            <div class="content-section">
                <h2><span class="emoji">📚</span>Skills: Your Development Playbook</h2>
                
                <h3>What are Skills?</h3>
                <p>Skills are <strong>structured methodologies</strong> stored as markdown files that define HOW to approach development tasks. Think of them as proven playbooks that guide both you and AI through complex workflows.</p>

                <h3>Structure of a Skill</h3>
                <div class="code-block">---
name: skill-name
description: "When to use this skill"
---
# Skill Title

## Overview
Brief description of the methodology...

## The Process
1. Step one
2. Step two
3. Step three...</div>

                <h3>Key Characteristics</h3>
                <ul>
                    <li>📁 <strong>Location:</strong> <code>skills/</code> (packaged) or <code>~/.cp-ninja/skills/</code> (personal)</li>
                    <li>🔄 <strong>Reusable:</strong> Apply the same methodology across different projects</li>
                    <li>📖 <strong>Static:</strong> Define processes and best practices</li>
                    <li>💬 <strong>Usage:</strong> Activated via <code>@cp-ninja /skill-name</code> in chat</li>
                </ul>

                <h3>Real Examples</h3>
                <div class="code-block">• brainstorming - Structured ideation process
• systematic-debugging - Methodical bug investigation
• test-driven-development - TDD workflow
• subagent-driven-development - Coordinating multiple agents</div>

                <div class="highlight-box">
                    <strong>🎯 Use Skills When:</strong> You need a proven methodology or workflow to guide your approach to a task. Skills tell you WHAT to do and WHEN to do it.
                </div>

                <div class="action-button">
                    <button class="btn btn-primary" id="btnBrowseSkills">
                        <span class="emoji">👀</span> Browse Available Skills
                    </button>
                </div>
            </div>
        </div>

        <!-- Step 2: Agents -->
        <div class="step" data-step="2">
            <div class="content-section">
                <h2><span class="emoji">🤖</span>Agents: Your AI Workforce</h2>
                
                <h3>What are Agents?</h3>
                <p>Agents are <strong>autonomous AI instances</strong> dispatched to execute specific tasks independently. They're like specialized team members - each focused on their own work, running in parallel.</p>

                <h3>Agent Lifecycle</h3>
                <div class="visual-diagram">
                    <div class="diagram-row">
                        <div class="diagram-box">1. Dispatch<br/><small>Create agent</small></div>
                        <span class="arrow">→</span>
                        <div class="diagram-box">2. Execute<br/><small>Do the work</small></div>
                        <span class="arrow">→</span>
                        <div class="diagram-box">3. Report<br/><small>Return results</small></div>
                        <span class="arrow">→</span>
                        <div class="diagram-box">4. Complete<br/><small>Agent ends</small></div>
                    </div>
                </div>

                <h3>Key Characteristics</h3>
                <ul>
                    <li>⚡ <strong>Autonomous:</strong> Work independently on focused tasks</li>
                    <li>🎯 <strong>Task-specific:</strong> Each agent has one clear objective</li>
                    <li>⏱️ <strong>Ephemeral:</strong> Created for a task, complete, then done</li>
                    <li>🔀 <strong>Parallel:</strong> Multiple agents can work simultaneously</li>
                    <li>🚫 <strong>Stateless:</strong> No memory between invocations</li>
                </ul>

                <h3>Using Agents</h3>
                <div class="code-block">// Dispatch agent using runSubagent tool
runSubagent({
  description: "Implement login feature",
  prompt: "Create a secure login component with form validation..."
})</div>

                <h3>Agent Examples</h3>
                <table class="comparison-table">
                    <tr>
                        <th>Agent Task</th>
                        <th>Purpose</th>
                    </tr>
                    <tr>
                        <td>Implementation Agent</td>
                        <td>Write code for specific features</td>
                    </tr>
                    <tr>
                        <td>Review Agent</td>
                        <td>Check code quality and compliance</td>
                    </tr>
                    <tr>
                        <td>Debugging Agent</td>
                        <td>Investigate specific test failures</td>
                    </tr>
                    <tr>
                        <td>Documentation Agent</td>
                        <td>Generate API docs or guides</td>
                    </tr>
                </table>

                <div class="warning-box">
                    <strong>⚠️ Important:</strong> Agents cannot communicate with each other. Each agent works independently and reports back to you. Use skills to coordinate multiple agents effectively.
                </div>
            </div>
        </div>

        <!-- Step 3: Skills vs Agents -->
        <div class="step" data-step="3">
            <div class="content-section">
                <h2><span class="emoji">⚖️</span>Skills vs Agents: The Key Difference</h2>
                
                <h3>The Mental Model</h3>
                <p><strong>Skills are the brain</strong> (strategy, planning, coordination)<br/>
                <strong>Agents are the hands</strong> (execution, implementation, action)</p>

                <table class="comparison-table">
                    <tr>
                        <th>Aspect</th>
                        <th>Skills 📚</th>
                        <th>Agents 🤖</th>
                    </tr>
                    <tr>
                        <td><strong>Nature</strong></td>
                        <td>Static methodologies</td>
                        <td>Active executors</td>
                    </tr>
                    <tr>
                        <td><strong>Purpose</strong></td>
                        <td>Define HOW to work</td>
                        <td>DO the actual work</td>
                    </tr>
                    <tr>
                        <td><strong>Lifetime</strong></td>
                        <td>Persistent (saved as files)</td>
                        <td>Ephemeral (task-based)</td>
                    </tr>
                    <tr>
                        <td><strong>Usage</strong></td>
                        <td>@cp-ninja /skill-name</td>
                        <td>runSubagent tool</td>
                    </tr>
                    <tr>
                        <td><strong>Scope</strong></td>
                        <td>Broad workflows</td>
                        <td>Focused tasks</td>
                    </tr>
                    <tr>
                        <td><strong>Reusability</strong></td>
                        <td>Reused across projects</td>
                        <td>Created per task</td>
                    </tr>
                </table>

                <h3>How They Work Together</h3>
                <div class="visual-diagram">
                    <h4>Example: Implementing a Feature</h4>
                    <div class="diagram-row">
                        <div class="diagram-box">📚 Skill<br/><small>subagent-driven-development</small></div>
                        <span class="arrow">→</span>
                        <div class="diagram-box">Defines Strategy<br/><small>Break into tasks</small></div>
                    </div>
                    <div class="diagram-row">
                        <div class="diagram-box">🤖 Agent 1<br/><small>Backend API</small></div>
                        <div class="diagram-box">🤖 Agent 2<br/><small>Frontend UI</small></div>
                        <div class="diagram-box">🤖 Agent 3<br/><small>Tests</small></div>
                    </div>
                    <div class="diagram-row">
                        <span class="arrow">↓</span>
                    </div>
                    <div class="diagram-row">
                        <div class="diagram-box">📚 Skill<br/><small>verification-before-completion</small></div>
                        <span class="arrow">→</span>
                        <div class="diagram-box">Verify Integration</div>
                    </div>
                </div>

                <div class="highlight-box">
                    <strong>💡 Real World Analogy:</strong>
                    <ul>
                        <li><strong>Skills</strong> = Architecture blueprint (shows HOW to build)</li>
                        <li><strong>Agents</strong> = Construction workers (DO the building)</li>
                    </ul>
                </div>

                <h3>Practical Example</h3>
                <div class="code-block">1. Use "subagent-driven-development" skill
   ↓ Skill guides you to break work into tasks
   
2. Dispatch agents for each task:
   - Agent A: Implement authentication
   - Agent B: Create user dashboard
   - Agent C: Write unit tests
   
3. Agents work in parallel, each produces results

4. Use "verification" skill to integrate and test</div>
            </div>
        </div>
When to Use What -->
        <div class="step" data-step="4">
            <div class="content-section">
                <h2><span class="emoji">🤔</span>When to Use What: Decision Guide</h2>
                
                <h3>The Decision Framework</h3>
                <p>Understanding <strong>what</strong> each tool does is important, but knowing <strong>when</strong> to use each one is the key to mastery.</p>

                <div class="visual-diagram">
                    <h4>Quick Decision Tree</h4>
                    <div class="diagram-row">
                        <div class="diagram-box">Need a process?<br/><small>→ Skill</small></div>
                        <div class="diagram-box">Need work done?<br/><small>→ Agent</small></div>
                        <div class="diagram-box">Need role definition?<br/><small>→ Prompt</small></div>
                        <div class="diagram-box">Need project context?<br/><small>→ Instructions</small></div>
                    </div>
                </div>

                <h3>📚 Use Skills When...</h3>
                <table class="comparison-table">
                    <tr>
                        <th>Scenario</th>
                        <th>Why Skill?</th>
                        <th>Example</th>
                    </tr>
                    <tr>
                        <td>Starting new feature work</td>
                        <td>Need structured approach</td>
                        <td><code>@cp-ninja /brainstorming</code></td>
                    </tr>
                    <tr>
                        <td>Have a complex bug</td>
                        <td>Need systematic investigation</td>
                        <td><code>@cp-ninja /systematic-debugging</code></td>
                    </tr>
                    <tr>
                        <td>Multiple independent tasks</td>
                        <td>Need coordination strategy</td>
                        <td><code>@cp-ninja /subagent-driven-development</code></td>
                    </tr>
                    <tr>
                        <td>Writing new code</td>
                        <td>Need TDD methodology</td>
                        <td><code>@cp-ninja /test-driven-development</code></td>
                    </tr>
                    <tr>
                        <td>Finishing feature branch</td>
                        <td>Need cleanup checklist</td>
                        <td><code>@cp-ninja /verification-before-completion</code></td>
                    </tr>
                </table>

                <div class="highlight-box">
                    <strong>💡 Rule of Thumb:</strong> If you're thinking "I need a PROCESS to follow" → Use a Skill
                </div>

                <h3>🤖 Use Agents When...</h3>
                <table class="comparison-table">
                    <tr>
                        <th>Scenario</th>
                        <th>Why Agent?</th>
                        <th>Example</th>
                    </tr>
                    <tr>
                        <td>Implement authentication</td>
                        <td>Specific, focused task</td>
                        <td>Dispatch agent for auth module</td>
                  6: Instructions -->
        <div class="step" data-step="6
                        <td>Write unit tests for file</td>
                        <td>Independent, parallelizable</td>
                        <td>Dispatch agent for test suite</td>
                    </tr>
                    <tr>
                        <td>Create API endpoint</td>
                        <td>Self-contained feature</td>
                        <td>Dispatch agent for endpoint</td>
                    </tr>
                    <tr>
                        <td>Refactor component</td>
                        <td>Isolated code change</td>
                        <td>Dispatch agent for refactor</td>
                    </tr>
                    <tr>
                        <td>Generate documentation</td>
                        <td>Can work independently</td>
                        <td>Dispatch agent for docs</td>
                    </tr>
                </table>

                <div class="highlight-box">
                    <strong>💡 Rule of Thumb:</strong> If you're thinking "I need THIS DONE" → Use an Agent
                </div>

                <h3>Agent vs Skill Decision Matrix</h3>
                <div class="code-block"><strong>Question: "I need to implement a new user registration feature"</strong>

❌ DON'T: Ask agent directly
   "Please implement user registration"
   → Too broad, no structure

✅ DO: Use skill + agents
   1. @cp-ninja /brainstorming → Define approach
   2. @cp-ninja /writing-plans → Create implementation plan
   3. @cp-ninja /subagent-driven-development
      → Dispatch agents for:
         - Backend registration endpoint
         - Frontend registration form
         - Validation logic
         - Unit tests
   4. @cp-ninja /verification-before-completion</div>

                <h3>📝 Use Prompts When...</h3>
                <ul>
                    <li>✅ Creating specialized agent roles (e.g., SecurityReviewerAgent)</li>
                    <li>✅ Defining consistent agent behavior across uses</li>
                    <li>✅ Need agents with specific expertise domains</li>
                    <li>✅ Want reusable agent templates for your team</li>
                    <li>❌ NOT for one-off agent instructions (just describe in dispatch)</li>
                </ul>

                <div class="code-block"><strong>Example Prompt Use Case:</strong>

You frequently need agents to review security:
1. Create: .github/prompts/security-reviewer-prompt.md
2. Define role, checklist, and output format
3. Reuse across all security review tasks</div>

                <h3>📋 Use Instructions When...</h3>
                <ul>
                    <li>✅ Setting up project-wide coding standards</li>
                    <li>✅ Defining architectural patterns for project</li>
                    <li>✅ Establishing team conventions</li>
                    <li>✅ Documenting critical constraints</li>
                  7: How to Customize -->
        <div class="step" data-step="7ution logic (use Agents)</li>
                </ul>

                <h3>Real-World Scenarios</h3>

                <div class="warning-box">
                    <h4>Scenario 1: Building New Feature</h4>
                    <strong>1. Instructions</strong> (background - always active)<br/>
                    → Copilot knows your architecture, conventions<br/><br/>
                    
                    <strong>2. Skill: brainstorming</strong><br/>
                    → Define feature approach, break down work<br/><br/>
                    
                    <strong>3. Skill: subagent-driven-development</strong><br/>
                    → Coordinate parallel implementation<br/><br/>
                    
                    <strong>4. Agents</strong> (dispatched by skill)<br/>
                    → Each agent implements one piece<br/><br/>
                    
                    <strong>5. Prompts</strong> (optional)<br/>
                    → If using specialized agents (e.g., API designer)
                </div>

                <div class="warning-box">
                    <h4>Scenario 2: Fixing Complex Bug</h4>
                    <strong>1. Skill: systematic-debugging</strong><br/>
                    → Follow investigation methodology<br/><br/>
                    
                    <strong>2. Agents</strong> (if needed)<br/>
                    → Dispatch agents to investigate different areas<br/><br/>
                    
                    <strong>3. Instructions</strong> (background)<br/>
                    → Copilot understands your codebase structure
                </div>

                <h3>Common Mistakes to Avoid</h3>
                <table class="comparison-table">
                    <tr>
                        <th>❌ Wrong</th>
                        <th>✅ Right</th>
                    </tr>
                    <tr>
                        <td>Using agents without a skill to coordinate</td>
                        <td>Use skill to define strategy, then dispatch agents</td>
                    </tr>
                    <tr>
                        <td>Creating instructions for task workflows</td>
                        <td>Instructions for context, skills for workflows</td>
                    </tr>
                    <tr>
                        <td>Using skills to do actual implementation</td>
                        <td>Skills guide process, agents do implementation</td>
                    </tr>
                    <tr>
                        <td>Creating prompts for one-time use</td>
                        <td>Prompts for reusable roles, inline for one-offs</td>
                    </tr>
                </table>

                <div class="highlight-box">
                    <strong>🎯 Golden Rule:</strong> Skills orchestrate → Agents execute → Prompts specialize → Instructions provide context
                </div>
            </div>
        </div>

        <!-- Step 5: Prompts -->
        <div class="step" data-step="5
        <div class="step" data-step="4">
            <div class="content-section">
                <h2><span class="emoji">📝</span>Prompts: Agent Templates</h2>
                
                <h3>What are Prompts?</h3>
                <p>Prompts are <strong>reusable templates</strong> stored in <code>.github/prompts/</code> that define specialized agent roles and behaviors. They're like job descriptions for different types of agents.</p>

                <h3>Structure of a Prompt</h3>
                <div class="code-block"># Software Architect Agent

## Role
System design and architectural decision specialist

## Process
1. Architecture Design
2. Technology Stack Selection
3. Component Specification
4. Quality Attributes
5. Technical Documentation

## Output Templates
- System Architecture Document
- API Design Guidelines
- Technical Specifications

## Integration Points
- Receives requirements from Business Analyst
- Provides specs to Technical Analyzer</div>

                <h3>Key Characteristics</h3>
                <ul>
                    <li>📁 <strong>Location:</strong> <code>.github/prompts/</code> in your workspace</li>
                    <li>🎭 <strong>Role-based:</strong> Define specific agent personas</li>
                    <li>🔄 <strong>Reusable:</strong> Same template for similar tasks</li>
                    <li>📋 <strong>Structured:</strong> Consistent role, process, outputs</li>
                </ul>

                <h3>Built-in Prompts</h3>
                <d8: Try It Out -->
        <div class="step" data-step="8ecialist
  
• business-analyst-prompt.md
  └─ Requirements gathering and analysis
  
• technical-analyzer-prompt.md
  └─ Technical feasibility and implementation planning</div>

                <h3>Using Prompts</h3>
                <p>Prompts are referenced when creating agents to give them specific expertise and behavior patterns.</p>

                <div class="highlight-box">
                    <strong>🎯 Prompts vs Skills:</strong>
                    <ul>
                        <li><strong>Prompts</strong> define WHAT ROLE an agent plays</li>
                        <li><strong>Skills</strong> define HOW a workflow progresses</li>
                    </ul>
                </div>

                <div class="action-button">
                    <button class="btn btn-primary" id="btnViewAgents">
                        <span class="emoji">📂</span> View Agent Prompts
                    </button>
                </div>
            </div>
        </div>

        <!-- Step 5: Instructions -->
        <div class="step" data-step="5">
            <div class="content-section">
                <h2><span class="emoji">📋</span>Instructions: Global AI Context</h2>
                
                <h3>What are Instructions?</h3>
                <p><strong>Copilot Instructions</strong> are a special file (<code>.github/copilot-instructions.md</code>) that provides global context and guidelines to GitHub Copilot for your entire workspace.</p>

                <h3>Purpose</h3>
                <ul>
                    <li>🌍 <strong>Workspace-wide:</strong> Applies to ALL Copilot interactions</li>
                    <li>📖 <strong>Project Context:</strong> Describe your architecture, patterns, conventions</li>
                    <li>🎯 <strong>Guidelines:</strong> Define coding standards and preferences</li>
                    <li>🚫 <strong>Constraints:</strong> Specify what to avoid or be careful about</li>
                </ul>

                <h3>Structure</h3>
                <div class="code-block"># Project Name - Copilot Instructions

## Project Overview
Description of what the project does...

## Architecture
- Component structure
- Design patterns used
- Key technologies

## Coding Conventions
- Code style preferences
- Naming conventions
- File organization

## Critical Guidelines
- Important constraints
- Security considerations
- Performance requirements

## Avoid
- Anti-patterns to prevent
- Deprecated approaches</div>

                <h3>Location</h3>
                <div class="code-block">.github/
  └── copilot-instructions.md   ← GitHub Copilot reads this automatically</div>

                <div class="warning-box">
                    <strong>⚠️ Key Difference:</strong> Instructions are always active for Copilot, while Skills are explicitly invoked when needed via <code>@cp-ninja</code>.
                </div>

                <h3>When to Use Instructions</h3>
                <ul>
                    <li>✅ Project-specific architecture patterns</li>
                    <li>✅ Team coding standards</li>
                    <li>✅ Technology stack context</li>
                    <li>✅ Security or compliance requirements</li>
                    <li>❌ Step-by-step workflows (use Skills instead)</li>
                    <li>❌ Task execution logic (use Agents instead)</li>
                </ul>

                <div class="action-button">
                    <button class="btn btn-primary" id="btnViewInstructions">
                        <span class="emoji">📄</span> View This Project's Instructions
                    </button>
                </div>
            </div>
        </div>8

        <!-- Step 6: How to Customize -->
        <div class="step" data-step="6">
            <div class="content-section">
                <h2><span class="emoji">🎨</span>Customization Guide</h2>
                
                <h3>1. Creating Custom Skills</h3>
                <p>Store your personal skills in <code>~/.cp-ninja/skills/</code></p>
                
                <div class="code-block">~/.cp-ninja/skills/
  └── my-skill/
      └── SKILL.md

# Inside SKILL.md:
---
name: my-skill
description: "My custom workflow"
---
# My Custom Skill

## The Process
1. First step
2. Second step...</div>

                <div class="action-button">
                    <button class="btn btn-secondary" id="btnCreateSkill">
                        <span class="emoji">➕</span> Create a New Skill
                    </button>
                </div>

                <h3>2. Creating Custom Agent Prompts</h3>
                <p>Add specialized agent templates to your workspace</p>
                
                <div class="code-block">.github/prompts/
  ├── software-architect-prompt.md    (built-in)
  └── my-custom-agent-prompt.md       (your custom agent)

# Template structure:
# Agent Name

## Role
What this agent specializes in...

## Process
How this agent works...

## Output Templates
What this agent produces...</div>

                <h3>3. Customizing Copilot Instructions</h3>
                <p>Edit or create <code>.github/copilot-instructions.md</code> in your workspace</p>
                
                <div class="code-block"># Add project-specific context
- Architecture details
- Coding standards
- Technology preferences
- Critical constraints</div>

                <h3>4. Configuration Settings</h3>
                <p>Customize CP-Ninja behavior in VS Code settings:</p>
                
                <div class="code-block">{
  "cpNinja.personalSkillsDirectory": "~/my-skills",
  "cpNinja.enableSuggestions": true,
  "cpNinja.favoriteSkills": ["brainstorming", "my-skill"]
}</div>

                <h3>Quick Reference: Where Things Go</h3>
                <table class="comparison-table">
                    <tr>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Scope</th>
                    </tr>
                    <tr>
                        <td>Packaged Skills</td>
                        <td><code>skills/</code></td>
                        <td>All users</td>
                    </tr>
                    <tr>
                        <td>Personal Skills</td>
                        <td><code>~/.cp-ninja/skills/</code></td>
                        <td>Your machine</td>
                    </tr>
                    <tr>
                        <td>Agent Prompts</td>
                        <td><code>.github/prompts/</code></td>
                        <td>Workspace</td>
                    </tr>
                    <tr>
                        <td>Copilot Instructions</td>
                        <td><code>.github/copilot-instructions.md</code></td>
                        <td>Workspace</td>
                    </tr>
                </table>

                <div class="highlight-box">
                    <strong>💡 Best Practice:</strong>
                    <ul>
                        <li>Use <strong>Skills</strong> for workflows you repeat across projects</li>
                        <li>Use <strong>Prompts</strong> for specialized agent roles</li>
                        <li>Use <strong>Instructions</strong> for project-specific context</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Step 7: Try It Out -->
        <div class="step" data-step="7">
            <div class="content-section">
                <h2><span class="emoji">🚀</span>Ready to Get Started!</h2>
                
                <h3>Quick Start Checklist</h3>
                <div class="highlight-box">
                    <h4>✅ What You've Learned:</h4>
                    <ul>
                        <li><strong>Skills</strong> - Methodologies that guide workflows</li>
                        <li><strong>Agents</strong> - AI workers that execute tasks</li>
                        <li><strong>Prompts</strong> - Templates that define agent roles</li>
                        <li><strong>Instructions</strong> - Global Copilot context</li>
                    </ul>
                </div>

                <h3>Try These Examples</h3>
                
                <div class="code-block"><strong>Example 1: Use a Skill</strong>
Open chat and type: @cp-ninja /brainstorming
→ Activates brainstorming methodology

<strong>Example 2: Browse Skills</strong>
Click "Browse Available Skills" below
→ See all available workflows

<strong>Example 3: Create Custom Skill</strong>
Click "Create a New Skill"
→ Start building your own workflow

<strong>Example 4: Check Instructions</strong>
Open: .github/copilot-instructions.md
→ See global project context</div>

                <h3>Next Steps</h3>
                <ol>
                    <li><strong>Explore existing skills</strong> - Try different workflows to see what fits</li>
                    <li><strong>Create your first custom skill</strong> - Capture your own methodology</li>
                    <li><strong>Set up project instructions</strong> - Add workspace-specific context</li>
                    <li><strong>Experiment with agents</strong> - Use subagent skills to coordinate work</li>
                </ol>

                <div class="visual-diagram">
                    <h4>Your Development Workflow</h4>
                    <div class="diagram-row">
                        <div class="diagram-box">1. Choose Skill<br/><small>Select methodology</small></div>
                        <span class="arrow">→</span>
                        <div class="diagram-box">2. Follow Process<br/><small>Execute workflow</small></div>
                    </div>
                    <div class="diagram-row">
                        <span class="arrow">↓</span>
                    </div>
                    <div class="diagram-row">
                        <div class="diagram-box">3. Dispatch Agents<br/><small>Parallel execution</small></div>
                        <span class="arrow">→</span>
                        <div class="diagram-box">4. Verify & Ship<br/><small>Quality check</small></div>
                    </div>
                </div>

                <h3>Quick Actions</h3>
                <div class="action-button">
                    <button class="btn btn-primary" id="btnOpenChat">
                        <span class="emoji">💬</span> Open Copilot Chat
                    </button>
                </div>
                <div class="action-button">
                    <button class="btn btn-primary" id="btnBrowseSkills2">
                        <span class="emoji">📚</span> Browse Skills
                    </button>
                </div>
                <div class="action-button">
                    <button class="btn btn-secondary" id="btnTryExample">
                        <span class="emoji">✨</span> Try Example Skill
                    </button>
                </div>

                <div class="warning-box">
                    <strong>📖 Need Help?</strong> You can always reopen this tutorial via command: <code>CP-Ninja: Show Tutorial</code>
                </div>
            </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="nav-buttons">
            <button class="btn btn-secondary" id="prevBtn" disabled>← Previous</button>
            <button class="btn btn-secondary" id="closeBtn">Close Tutorial</button>
            <button class="btn btn-primary" id="nextBtn">Next →</button>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let currentStep = 0;
        const totalSteps = 7;

        function updateUI() {
            // Hide all steps
            document.querySelectorAll('.step').forEach(step => {
                step.classList.remove('active');
            });

            // Show current step
            const activeStep = document.querySelector(\`[data-step="\${currentStep}"]\`);
            if (activeStep) {
                activeStep.classList.add('active');
            }

            // Update progress bar
            const progress = ((currentStep + 1) / (totalSteps + 1)) * 100;
            document.getElementById('progressFill').style.width = progress + '%';

            // Update step indicator dots
            const dots = document.querySelectorAll('.step-dot');
            dots.forEach((dot, index) => {
                if (index === currentStep) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });

            // Update button states
            document.getElementById('prevBtn').disabled = currentStep === 0;
            const nextBtn = document.getElementById('nextBtn');
            if (currentStep === totalSteps) {
                nextBtn.textContent = '🎉 Finish';
            } else {
                nextBtn.textContent = 'Next →';
            }

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Notify extension of navigation
            vscode.postMessage({ type: 'navigate', step: currentStep });
        }

        function navigate(direction) {
            const newStep = currentStep + direction;
            
            if (newStep < 0 || newStep > totalSteps) {
                if (newStep > totalSteps) {
                    closePanel();
                }
                return;
            }

            currentStep = newStep;
            updateUI();
        }

        function openChat() {
            vscode.postMessage({ type: 'openChat' });
        }

        function openSkillsExplorer() {
            vscode.postMessage({ type: 'openSkillsExplorer' });
        }

        function createSkill() {
            vscode.postMessage({ type: 'createSkill' });
        }

        function viewAgents() {
            vscode.postMessage({ type: 'viewAgents' });
        }

        function viewInstructions() {
            vscode.postMessage({ type: 'viewInstructions' });
        }

        function tryExample() {
            vscode.postMessage({ type: 'tryExample' });
        }

        function closePanel() {
            vscode.postMessage({ type: 'close' });
        }

        // Initialize on load
        updateUI();

        // Add event listeners for navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => navigate(-1));
        document.getElementById('nextBtn').addEventListener('click', () => navigate(1));
        document.getElementById('closeBtn').addEventListener('click', closePanel);

        // Add event listeners for action buttons
        const btnBrowseSkills = document.getElementById('btnBrowseSkills');
        if (btnBrowseSkills) {
            btnBrowseSkills.addEventListener('click', openSkillsExplorer);
        }
        
        const btnBrowseSkills2 = document.getElementById('btnBrowseSkills2');
        if (btnBrowseSkills2) {
            btnBrowseSkills2.addEventListener('click', openSkillsExplorer);
        }
        
        const btnViewAgents = document.getElementById('btnViewAgents');
        if (btnViewAgents) {
            btnViewAgents.addEventListener('click', viewAgents);
        }
        
        const btnViewInstructions = document.getElementById('btnViewInstructions');
        if (btnViewInstructions) {
            btnViewInstructions.addEventListener('click', viewInstructions);
        }
        
        const btnCreateSkill = document.getElementById('btnCreateSkill');
        if (btnCreateSkill) {
            btnCreateSkill.addEventListener('click', createSkill);
        }
        
        const btnOpenChat = document.getElementById('btnOpenChat');
        if (btnOpenChat) {
            btnOpenChat.addEventListener('click', openChat);
        }
        
        const btnTryExample = document.getElementById('btnTryExample');
        if (btnTryExample) {
            btnTryExample.addEventListener('click', tryExample);
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                navigate(-1);
            } else if (e.key === 'ArrowRight') {
                navigate(1);
            } else if (e.key === 'Escape') {
                closePanel();
            }
        });
    </script>
</body>
</html>`;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
