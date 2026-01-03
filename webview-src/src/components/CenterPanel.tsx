import React from 'react';
import { TemplateGallery } from './TemplateGallery';
import { SkillTemplate } from '../types/skill';

interface CenterPanelProps {
    onSkillSelect: (skill: SkillTemplate) => void;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({ onSkillSelect }) => {
    const handleTemplateSelect = (template: SkillTemplate) => {
        // Show skill preview instead of creating new file
        onSkillSelect(template);
    };

    return (
        <div data-testid="center-panel" style={panelStyles}>
            <div style={contentStyles}>
                <div style={heroStyles}>
                    <h2 style={titleStyles}>🚀 CP-Ninja Skills & Instructions</h2>
                    <p style={subtitleStyles}>Browse and explore development skills, instructions, and agents</p>
                </div>

                {/* Template Gallery Section */}
                <div style={templateGallerySection}>
                    <h3 style={sectionHeaderStyles}>📚 Available Skills</h3>
                    <p style={sectionDescriptionStyles}>
                        Click any skill card to view its detailed content and instructions.
                    </p>
                    <TemplateGallery onTemplateSelect={handleTemplateSelect} />
                </div>
            </div>
        </div>
    );
};

const panelStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
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