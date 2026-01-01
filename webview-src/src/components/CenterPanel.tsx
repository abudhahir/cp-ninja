import React from 'react';

export const CenterPanel: React.FC = () => {
    return (
        <div data-testid="center-panel" style={panelStyles}>
            <div data-testid="editor-section" style={editorStyles}>
                <div style={headerStyles}>
                    <h3 style={titleStyles}>Editor</h3>
                </div>
                <div style={editorContentStyles}>
                    <p style={placeholderStyles}>Skill editor goes here (60% of center panel)</p>
                </div>
            </div>
            <div data-testid="preview-section" style={previewStyles}>
                <div style={headerStyles}>
                    <h3 style={titleStyles}>Preview</h3>
                </div>
                <div style={previewContentStyles}>
                    <p style={placeholderStyles}>Skill preview goes here (40% of center panel)</p>
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

const editorStyles: React.CSSProperties = {
    height: '60%',
    display: 'flex',
    flexDirection: 'column',
    borderBottom: '1px solid var(--vscode-panel-border)'
};

const previewStyles: React.CSSProperties = {
    height: '40%',
    display: 'flex',
    flexDirection: 'column'
};

const headerStyles: React.CSSProperties = {
    padding: '8px 16px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    backgroundColor: 'var(--vscode-editorGroupHeader-tabsBackground)'
};

const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: '13px',
    fontWeight: 'normal',
    color: 'var(--vscode-tab-activeForeground)'
};

const editorContentStyles: React.CSSProperties = {
    flex: 1,
    padding: '16px',
    overflow: 'auto',
    backgroundColor: 'var(--vscode-editor-background)'
};

const previewContentStyles: React.CSSProperties = {
    flex: 1,
    padding: '16px',
    overflow: 'auto',
    backgroundColor: 'var(--vscode-editor-background)'
};

const placeholderStyles: React.CSSProperties = {
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '12px',
    margin: 0
};