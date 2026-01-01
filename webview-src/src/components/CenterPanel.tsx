import React from 'react';
import { TemplateGallery } from './TemplateGallery';
import { SkillTemplate } from '../types/skill';

declare const vscode: any;

export const CenterPanel: React.FC = () => {
    const handleTemplateSelect = (template: SkillTemplate) => {
        // Send message to VS Code to create new skill from template
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

    return (
        <div data-testid="center-panel" style={panelStyles}>
            <div style={contentStyles}>
                <div style={heroStyles}>
                    <h2 style={titleStyles}>🚀 CP-Ninja Skill Composer</h2>
                    <p style={subtitleStyles}>Create and organize your development skills with native VS Code integration</p>
                </div>

                {/* Template Gallery Section */}
                <div style={templateGallerySection}>
                    <h3 style={sectionHeaderStyles}>📚 Browse Skill Templates</h3>
                    <p style={sectionDescriptionStyles}>
                        Click any template card to create a new skill. Templates open in VS Code's native editor with full Copilot support.
                    </p>
                    <TemplateGallery onTemplateSelect={handleTemplateSelect} />
                </div>
            </div>
        </div>
    );
};

const panelStyles: React.CSSProperties = {
    width: '55%',
    height: '100%',
    borderRight: '1px solid var(--vscode-panel-border)',
    backgroundColor: 'var(--vscode-editor-background)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
};

const contentStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%',
    padding: '16px 20px',
    textAlign: 'center',
    overflow: 'hidden'
};

const heroStyles: React.CSSProperties = {
    marginBottom: '20px'
};

const titleStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--vscode-editor-foreground)',
    margin: '0 0 8px 0'
};

const subtitleStyles: React.CSSProperties = {
    fontSize: '14px',
    color: 'var(--vscode-descriptionForeground)',
    margin: '0',
    lineHeight: '1.5'
};

const templateGallerySection: React.CSSProperties = {
    marginTop: '20px',
    width: '100%',
    maxWidth: '100%',
    textAlign: 'left',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
};

const sectionHeaderStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'var(--vscode-editor-foreground)',
    margin: '0 0 8px 0',
    textAlign: 'center'
};

const sectionDescriptionStyles: React.CSSProperties = {
    fontSize: '14px',
    color: 'var(--vscode-descriptionForeground)',
    margin: '0 0 16px 0',
    textAlign: 'center',
    lineHeight: '1.5'
};