import React from 'react';

export const LeftPanel: React.FC = () => {
    return (
        <div data-testid="left-panel" style={panelStyles}>
            <div style={headerStyles}>
                <h3 style={titleStyles}>Quick Start & Navigation</h3>
            </div>
            <div style={contentStyles}>
                <p style={placeholderStyles}>Left panel content goes here</p>
                <ul style={listStyles}>
                    <li>Create New Skill</li>
                    <li>Browse Skills</li>
                    <li>Templates</li>
                    <li>Recent Files</li>
                </ul>
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

const contentStyles: React.CSSProperties = {
    padding: '16px',
    flex: 1,
    overflow: 'auto'
};

const placeholderStyles: React.CSSProperties = {
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '12px',
    marginBottom: '16px'
};

const listStyles: React.CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    color: 'var(--vscode-sideBar-foreground)'
};