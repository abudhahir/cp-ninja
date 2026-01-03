import React from 'react';
import { SkillTemplate } from '../types/skill';
import { vsCodeApi } from '../services/vsCodeApiService';

interface SkillPreviewProps {
    skill: SkillTemplate;
    onBack: () => void;
}

export const SkillPreview: React.FC<SkillPreviewProps> = ({ skill, onBack }) => {
    const handleUseSkill = () => {
        vsCodeApi.postMessage({
            command: 'useSkill',
            skillName: skill.name.toLowerCase().replace(/\s+/g, '-'),
            participantId: `cp-ninja:${skill.name.toLowerCase().replace(/\s+/g, '-')}`
        });
    };

    // Simple markdown-to-html converter for basic rendering
    const renderMarkdown = (content: string) => {
        return content
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold and italic
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            // Code blocks
            .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/gim, '<code>$1</code>')
            // Lists
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            // Line breaks
            .replace(/\n/gim, '<br>');
    };

    return (
        <div style={containerStyles}>
            {/* Header with back button */}
            <div style={headerStyles}>
                <button 
                    onClick={onBack}
                    style={backButtonStyles}
                    onMouseOver={(e) => Object.assign(e.currentTarget.style, backButtonHoverStyles)}
                    onMouseOut={(e) => Object.assign(e.currentTarget.style, backButtonStyles)}
                >
                    ← Back to Skills
                </button>
                <h1 style={titleStyles}>{skill.name}</h1>
                <button 
                    onClick={handleUseSkill}
                    style={useSkillButtonStyles}
                    onMouseOver={(e) => Object.assign(e.currentTarget.style, useSkillButtonHoverStyles)}
                    onMouseOut={(e) => Object.assign(e.currentTarget.style, useSkillButtonStyles)}
                >
                    🚀 Use Skill
                </button>
            </div>

            {/* Tags */}
            <div style={tagsContainerStyles}>
                {skill.tags.map((tag, index) => (
                    <span key={index} style={tagStyles}>{tag}</span>
                ))}
            </div>

            {/* Content */}
            <div 
                style={contentStyles}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(skill.content) }}
            />
        </div>
    );
};

const containerStyles: React.CSSProperties = {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--vscode-editor-background)',
    overflow: 'hidden'
};

const headerStyles: React.CSSProperties = {
    padding: '20px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    backgroundColor: 'var(--vscode-sideBar-background)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    justifyContent: 'space-between'
};

const backButtonStyles: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'var(--vscode-font-family)',
    transition: 'background-color 0.2s ease'
};

const backButtonHoverStyles: React.CSSProperties = {
    backgroundColor: 'var(--vscode-button-hoverBackground)'
};

const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--vscode-foreground)',
    flex: 1
};

const tagsContainerStyles: React.CSSProperties = {
    padding: '0 20px 16px 20px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    backgroundColor: 'var(--vscode-sideBar-background)',
    borderBottom: '1px solid var(--vscode-panel-border)'
};

const tagStyles: React.CSSProperties = {
    padding: '4px 8px',
    backgroundColor: 'var(--vscode-badge-background)',
    color: 'var(--vscode-badge-foreground)',
    fontSize: '12px',
    borderRadius: '12px',
    fontWeight: 500
};

const contentStyles: React.CSSProperties = {
    flex: 1,
    padding: '20px',
    overflow: 'auto',
    lineHeight: '1.6',
    fontSize: '14px',
    color: 'var(--vscode-foreground)'
};

const useSkillButtonStyles: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'var(--vscode-font-family)',
    fontWeight: 500,
    transition: 'background-color 0.2s ease'
};

const useSkillButtonHoverStyles: React.CSSProperties = {
    backgroundColor: 'var(--vscode-button-hoverBackground)'
};