import React, { useState } from 'react';
import { SkillEditor } from './SkillEditor';

interface Tab {
    id: string;
    label: string;
    icon: string;
    content: React.ReactNode;
}

export const CenterPanel: React.FC = () => {
    const [skillContent, setSkillContent] = useState('');
    const [activeEditorTab, setActiveEditorTab] = useState('editor');
    const [activePreviewTab, setActivePreviewTab] = useState('preview');

    const editorTabs: Tab[] = [
        {
            id: 'editor',
            label: 'Editor',
            icon: '📝',
            content: (
                <SkillEditor 
                    value={skillContent}
                    onChange={setSkillContent}
                    height="100%"
                />
            )
        },
        {
            id: 'visual-builder',
            label: 'Visual Builder',
            icon: '🎨',
            content: (
                <div style={placeholderContainerStyles}>
                    <p style={placeholderStyles}>
                        🎨 Visual Builder coming soon...
                        <br />
                        <small>Drag-and-drop interface for creating skills</small>
                    </p>
                </div>
            )
        }
    ];

    const previewTabs: Tab[] = [
        {
            id: 'preview',
            label: 'Preview',
            icon: '👁️',
            content: (
                <div style={placeholderContainerStyles}>
                    <p style={placeholderStyles}>
                        👁️ Live Preview
                        <br />
                        <small>Preview of your skill as it will appear</small>
                    </p>
                </div>
            )
        },
        {
            id: 'test',
            label: 'Test',
            icon: '🧪',
            content: (
                <div style={placeholderContainerStyles}>
                    <p style={placeholderStyles}>
                        🧪 Skill Testing
                        <br />
                        <small>Test your skill with sample inputs</small>
                    </p>
                </div>
            )
        }
    ];

    return (
        <div data-testid="center-panel" style={panelStyles}>
            {/* Editor Section - 60% */}
            <div data-testid="editor-section" style={editorStyles}>
                <div style={tabBarStyles}>
                    {editorTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveEditorTab(tab.id)}
                            style={{
                                ...tabButtonStyles,
                                ...(activeEditorTab === tab.id ? activeTabStyles : inactiveTabStyles)
                            }}
                            data-testid={`editor-tab-${tab.id}`}
                        >
                            <span style={tabIconStyles}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div style={tabContentStyles}>
                    {editorTabs.find(tab => tab.id === activeEditorTab)?.content}
                </div>
            </div>

            {/* Preview Section - 40% */}
            <div data-testid="preview-section" style={previewStyles}>
                <div style={tabBarStyles}>
                    {previewTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActivePreviewTab(tab.id)}
                            style={{
                                ...tabButtonStyles,
                                ...(activePreviewTab === tab.id ? activeTabStyles : inactiveTabStyles)
                            }}
                            data-testid={`preview-tab-${tab.id}`}
                        >
                            <span style={tabIconStyles}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div style={tabContentStyles}>
                    {previewTabs.find(tab => tab.id === activePreviewTab)?.content}
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

const tabBarStyles: React.CSSProperties = {
    display: 'flex',
    backgroundColor: 'var(--vscode-editorGroupHeader-tabsBackground)',
    borderBottom: '1px solid var(--vscode-tab-border)',
    overflow: 'hidden'
};

const tabButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontFamily: 'var(--vscode-font-family)',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    minWidth: '120px',
    justifyContent: 'center'
};

const activeTabStyles: React.CSSProperties = {
    backgroundColor: 'var(--vscode-tab-activeBackground)',
    color: 'var(--vscode-tab-activeForeground)',
    borderBottom: '2px solid var(--vscode-tab-activeBorder)'
};

const inactiveTabStyles: React.CSSProperties = {
    backgroundColor: 'var(--vscode-tab-inactiveBackground)',
    color: 'var(--vscode-tab-inactiveForeground)'
};

const tabIconStyles: React.CSSProperties = {
    fontSize: '14px'
};

const tabContentStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'var(--vscode-editor-background)',
    position: 'relative'
};

const placeholderContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '20px'
};

const placeholderStyles: React.CSSProperties = {
    color: 'var(--vscode-descriptionForeground)',
    fontSize: '14px',
    textAlign: 'center',
    margin: 0,
    lineHeight: '1.5'
};