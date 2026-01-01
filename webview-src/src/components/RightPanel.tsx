import React from 'react';

export const RightPanel: React.FC = () => {
    return (
        <div data-testid="right-panel" style={panelStyles}>
            <div style={headerStyles}>
                <h3 style={titleStyles}>Metadata & Tools</h3>
            </div>
            <div style={contentStyles}>
                <div style={sectionStyles}>
                    <h4 style={sectionTitleStyles}>Skill Properties</h4>
                    <p style={placeholderStyles}>Skill metadata will be displayed here</p>
                </div>
                <div style={sectionStyles}>
                    <h4 style={sectionTitleStyles}>Tools</h4>
                    <ul style={listStyles}>
                        <li>Validate</li>
                        <li>Format</li>
                        <li>Export</li>
                        <li>Settings</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const panelStyles: React.CSSProperties = {
    width: '20%',
    height: '100%',
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

const sectionStyles: React.CSSProperties = {
    marginBottom: '24px'
};

const sectionTitleStyles: React.CSSProperties = {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'var(--vscode-sideBar-foreground)',
    textTransform: 'uppercase'
};

const placeholderStyles: React.CSSProperties = {
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '12px',
    margin: '0 0 12px 0'
};

const listStyles: React.CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    color: 'var(--vscode-sideBar-foreground)',
    fontSize: '13px'
};