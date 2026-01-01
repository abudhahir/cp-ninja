import React, { useState } from 'react';
import { TemplateGallery } from './TemplateGallery';
import { SkillTemplate, QuickStartMode } from '../types/skill';
import { useSkillComposer } from '../context/SkillComposerContext';

export const LeftPanel: React.FC = () => {
    const [quickStartMode, setQuickStartMode] = useState<QuickStartMode>('template');
    const { loadTemplate } = useSkillComposer();

    const handleTemplateSelect = (template: SkillTemplate) => {
        // Send template to VS Code to create new file
        if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
            const vscode = (window as any).acquireVsCodeApi();
            vscode.postMessage({
                command: 'createNewSkill',
                content: template.content,
                templateName: template.name,
                mode: 'template'
            });
        }
    };

    const handleQuickStartAction = (mode: QuickStartMode) => {
        setQuickStartMode(mode);
        
        if (mode === 'scratch') {
            // Create new skill from template with placeholders
            const templateContent = `# [SKILL_NAME]

## Summary
[Brief description of what this skill does and when to use it]

## When to Use
- [Specific scenario 1]
- [Specific scenario 2]  
- [Specific scenario 3]

## Prerequisites
- [Required knowledge or setup]
- [Dependencies or tools needed]

## Process

### Step 1: [First Step Name]
[Detailed description of the first step]

\`\`\`[LANGUAGE]
// [Code example or template]
[CODE_PLACEHOLDER]
\`\`\`

### Step 2: [Second Step Name]
[Detailed description of the second step]

### Step 3: [Third Step Name]
[Detailed description of the third step]

## Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

## Common Pitfalls
- **[Pitfall 1]**: [Description and how to avoid]
- **[Pitfall 2]**: [Description and how to avoid]

## Related Skills
- [Link to related skill 1]
- [Link to related skill 2]

## Examples

### Example 1: [Scenario Name]
[Context for this example]

\`\`\`[LANGUAGE]
[Example code or configuration]
\`\`\`

### Example 2: [Another Scenario]
[Context for this example]

\`\`\`[LANGUAGE]
[Another example]
\`\`\`

## Tips and Best Practices
- [Tip 1]
- [Tip 2]
- [Tip 3]

## Troubleshooting
| Problem | Solution |
|---------|----------|
| [Common issue 1] | [How to fix it] |
| [Common issue 2] | [How to fix it] |

## Resources
- [External documentation link]
- [Helpful tutorial or guide]
- [Official docs or reference]`;

            // Send message to VS Code to create new file with template
            if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
                const vscode = (window as any).acquireVsCodeApi();
                vscode.postMessage({
                    command: 'createNewSkill',
                    content: templateContent,
                    mode: 'scratch'
                });
            }
        } else if (mode === 'import') {
            // Send message to VS Code to show file picker
            if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
                const vscode = (window as any).acquireVsCodeApi();
                vscode.postMessage({
                    command: 'importSkill'
                });
            }
        }
        
        console.log('Quick start mode:', mode);
    };

    const renderContent = () => {
        switch (quickStartMode) {
            case 'template':
                return (
                    <div style={placeholderContentStyles}>
                        <p style={placeholderTextStyles}>Browse templates in the center panel</p>
                        <p style={descriptionTextStyles}>
                            Template gallery has been moved to the main area for better browsing experience.
                        </p>
                    </div>
                );
            case 'scratch':
                return (
                    <div style={placeholderContentStyles}>
                        <p style={placeholderTextStyles}>Create a new skill from scratch</p>
                        <p style={descriptionTextStyles}>
                            Start with a blank skill template and build your workflow from the ground up.
                        </p>
                    </div>
                );
            case 'import':
                return (
                    <div style={placeholderContentStyles}>
                        <p style={placeholderTextStyles}>Import existing skill</p>
                        <p style={descriptionTextStyles}>
                            Import a skill from a file or another source to customize and use.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div data-testid="left-panel" style={panelStyles}>
            <div style={headerStyles}>
                <h3 style={titleStyles}>Quick Start & Navigation</h3>
            </div>
            
            {/* Quick Start Buttons */}
            <div style={quickStartContainerStyles}>
                <button
                    onClick={() => handleQuickStartAction('template')}
                    style={{
                        ...quickStartButtonStyles,
                        ...(quickStartMode === 'template' ? activeButtonStyles : {})
                    }}
                >
                    📋 Start from Template
                </button>
                <button
                    onClick={() => handleQuickStartAction('scratch')}
                    style={{
                        ...quickStartButtonStyles,
                        ...(quickStartMode === 'scratch' ? activeButtonStyles : {})
                    }}
                >
                    ✨ Start from Scratch
                </button>
                <button
                    onClick={() => handleQuickStartAction('import')}
                    style={{
                        ...quickStartButtonStyles,
                        ...(quickStartMode === 'import' ? activeButtonStyles : {})
                    }}
                >
                    📂 Import Existing
                </button>
            </div>

            {/* Content Area */}
            <div style={contentStyles}>
                {renderContent()}
            </div>
        </div>
    );

    function handleSaveAction(location: 'user' | 'project') {
        // Send save command to VS Code
        if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
            const vscode = (window as any).acquireVsCodeApi();
            vscode.postMessage({
                command: 'saveActiveSkill',
                location: location
            });
        }
    }
};

const panelStyles: React.CSSProperties = {
    width: '25%',
    height: '100%',
    borderRight: '1px solid var(--vscode-panel-border)',
    backgroundColor: 'var(--vscode-sideBar-background)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
};

const headerStyles: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    backgroundColor: 'var(--vscode-sideBarSectionHeader-background)'
};

const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'var(--vscode-sideBarSectionHeader-foreground)'
};

const quickStartContainerStyles: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
};

const quickStartButtonStyles: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '4px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--vscode-font-family)',
    textAlign: 'left',
    transition: 'all 0.2s ease'
};

const activeButtonStyles: React.CSSProperties = {
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    borderColor: 'var(--vscode-focusBorder)'
};

const contentStyles: React.CSSProperties = {
    padding: '12px',
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
};

const placeholderContentStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: '32px 16px'
};

const placeholderTextStyles: React.CSSProperties = {
    color: 'var(--vscode-editor-foreground)',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0 0 8px 0'
};

const descriptionTextStyles: React.CSSProperties = {
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '12px',
    lineHeight: '1.4',
    margin: 0
};

const saveActionsContainerStyles: React.CSSProperties = {
    padding: '12px',
    borderTop: '1px solid var(--vscode-panel-border)',
    backgroundColor: 'var(--vscode-sideBarSectionHeader-background)',
    marginTop: 'auto' // Push to bottom
};

const sectionHeaderStyles: React.CSSProperties = {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'var(--vscode-sideBarSectionHeader-foreground)'
};

const saveActionButtonStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    margin: '4px 0',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '4px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--vscode-font-family)',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    display: 'block'
};