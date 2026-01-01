import React, { useState } from 'react';
import { TemplateGallery } from './TemplateGallery';
import { SkillTemplate, QuickStartMode } from '../types/skill';

export const LeftPanel: React.FC = () => {
    const [quickStartMode, setQuickStartMode] = useState<QuickStartMode>('template');

    const handleTemplateSelect = (template: SkillTemplate) => {
        // TODO: Implement template selection logic
        console.log('Selected template:', template.name);
    };

    const handleQuickStartAction = (mode: QuickStartMode) => {
        setQuickStartMode(mode);
        // TODO: Implement quick start actions
        console.log('Quick start mode:', mode);
    };

    const renderContent = () => {
        switch (quickStartMode) {
            case 'template':
                return <TemplateGallery onTemplateSelect={handleTemplateSelect} />;
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