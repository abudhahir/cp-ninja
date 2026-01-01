import React from 'react';
import { LeftPanel } from './LeftPanel';
import { CenterPanel } from './CenterPanel';
import { RightPanel } from './RightPanel';

export const SkillComposerLayout: React.FC = () => {
    return (
        <div className="skill-composer-layout" style={containerStyles}>
            <LeftPanel />
            <CenterPanel />
            <RightPanel />
        </div>
    );
};

const containerStyles: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    height: '100vh',
    fontFamily: 'var(--vscode-font-family)',
    fontSize: 'var(--vscode-font-size)',
    color: 'var(--vscode-foreground)',
    backgroundColor: 'var(--vscode-editor-background)',
    overflow: 'hidden'
};