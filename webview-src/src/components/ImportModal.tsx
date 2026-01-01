import React, { useState, useEffect } from 'react';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (config: ImportConfig) => void;
}

export interface ImportConfig {
    sourceType: 'git' | 'folder';
    location: string;
    destination: 'user' | 'project';
    skillPath?: string; // For folder imports, specific skill file
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [sourceType, setSourceType] = useState<'git' | 'folder'>('folder');
    const [location, setLocation] = useState('');
    const [destination, setDestination] = useState<'user' | 'project'>('user');
    const [skillPath, setSkillPath] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState('');
    const [pendingMessageId, setPendingMessageId] = useState<number | null>(null);

    // Handle folder selection responses
    useEffect(() => {
        if (!isOpen) return;
        
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.command === 'folderSelected' && message.messageId === pendingMessageId) {
                setLocation(message.path);
                setPendingMessageId(null);
            }
        };
        
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isOpen, pendingMessageId]);

    if (!isOpen) return null;

    const handleImport = () => {
        setError('');
        
        if (!location.trim()) {
            setError('Please enter a valid location');
            return;
        }

        if (sourceType === 'git' && !isValidGitUrl(location)) {
            setError('Please enter a valid Git repository URL');
            return;
        }

        const config: ImportConfig = {
            sourceType,
            location: location.trim(),
            destination,
            skillPath: sourceType === 'folder' ? skillPath : undefined
        };

        onImport(config);
        handleClose();
    };

    const handleClose = () => {
        setLocation('');
        setSkillPath('');
        setError('');
        setPendingMessageId(null);
        onClose();
    };

    const isValidGitUrl = (url: string): boolean => {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:' || 
                   url.startsWith('git@') || url.endsWith('.git');
        } catch {
            return url.startsWith('git@') || url.endsWith('.git');
        }
    };

    const handleBrowseFolder = () => {
        // Send message to VS Code to open folder dialog
        if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
            const vscode = (window as any).acquireVsCodeApi();
            const messageId = Date.now();
            setPendingMessageId(messageId);
            vscode.postMessage({
                command: 'browseFolder',
                messageId: messageId
            });
        }
    };

    return (
        <div style={overlayStyles}>
            <div style={modalStyles}>
                <div style={headerStyles}>
                    <h3 style={titleStyles}>📥 Import Skill</h3>
                    <button onClick={handleClose} style={closeButtonStyles}>✕</button>
                </div>

                <div style={contentStyles}>
                    {/* Source Type Selection */}
                    <div style={fieldGroupStyles}>
                        <label style={labelStyles}>Import Source</label>
                        <div style={radioGroupStyles}>
                            <label style={radioLabelStyles}>
                                <input
                                    type="radio"
                                    value="folder"
                                    checked={sourceType === 'folder'}
                                    onChange={(e) => setSourceType(e.target.value as 'folder')}
                                    style={radioStyles}
                                />
                                📁 Local Folder
                            </label>
                            <label style={radioLabelStyles}>
                                <input
                                    type="radio"
                                    value="git"
                                    checked={sourceType === 'git'}
                                    onChange={(e) => setSourceType(e.target.value as 'git')}
                                    style={radioStyles}
                                />
                                🌐 Git Repository
                            </label>
                        </div>
                    </div>

                    {/* Location Input */}
                    <div style={fieldGroupStyles}>
                        <label style={labelStyles}>
                            {sourceType === 'git' ? 'Repository URL' : 'Folder Path'}
                        </label>
                        <div style={inputGroupStyles}>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder={sourceType === 'git' 
                                    ? 'https://github.com/user/repo.git or git@github.com:user/repo.git'
                                    : 'C:\\path\\to\\skills\\folder or /path/to/skills/folder'
                                }
                                style={inputStyles}
                            />
                            {sourceType === 'folder' && (
                                <button onClick={handleBrowseFolder} style={browseButtonStyles}>
                                    Browse...
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Skill Path for Folder Import */}
                    {sourceType === 'folder' && (
                        <div style={fieldGroupStyles}>
                            <label style={labelStyles}>Skill File (optional)</label>
                            <input
                                type="text"
                                value={skillPath}
                                onChange={(e) => setSkillPath(e.target.value)}
                                placeholder="skills/my-skill/SKILL.md (leave empty to browse all skills)"
                                style={inputStyles}
                            />
                            <small style={helpTextStyles}>
                                Specify a specific skill file path, or leave empty to import all skills from the folder
                            </small>
                        </div>
                    )}

                    {/* Destination Selection */}
                    <div style={fieldGroupStyles}>
                        <label style={labelStyles}>Import Destination</label>
                        <div style={radioGroupStyles}>
                            <label style={radioLabelStyles}>
                                <input
                                    type="radio"
                                    value="user"
                                    checked={destination === 'user'}
                                    onChange={(e) => setDestination(e.target.value as 'user')}
                                    style={radioStyles}
                                />
                                👤 User Skills (~/.cp-ninja/skills)
                            </label>
                            <label style={radioLabelStyles}>
                                <input
                                    type="radio"
                                    value="project"
                                    checked={destination === 'project'}
                                    onChange={(e) => setDestination(e.target.value as 'project')}
                                    style={radioStyles}
                                />
                                📁 Project Skills (.cp-ninja/skills)
                            </label>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div style={errorStyles}>
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                <div style={footerStyles}>
                    <button onClick={handleClose} style={cancelButtonStyles}>
                        Cancel
                    </button>
                    <button 
                        onClick={handleImport} 
                        disabled={!location.trim() || isValidating}
                        style={{
                            ...importButtonStyles,
                            ...((!location.trim() || isValidating) ? disabledButtonStyles : {})
                        }}
                    >
                        {isValidating ? '⏳ Validating...' : '📥 Import Skills'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Styles
const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const modalStyles: React.CSSProperties = {
    backgroundColor: 'var(--vscode-editor-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '6px',
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
};

const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--vscode-panel-border)'
};

const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'var(--vscode-editor-foreground)'
};

const closeButtonStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: 'var(--vscode-icon-foreground)',
    padding: '4px',
    borderRadius: '2px'
};

const contentStyles: React.CSSProperties = {
    padding: '20px'
};

const fieldGroupStyles: React.CSSProperties = {
    marginBottom: '16px'
};

const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'var(--vscode-editor-foreground)',
    marginBottom: '6px'
};

const radioGroupStyles: React.CSSProperties = {
    display: 'flex',
    gap: '16px'
};

const radioLabelStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--vscode-editor-foreground)',
    cursor: 'pointer'
};

const radioStyles: React.CSSProperties = {
    margin: 0
};

const inputGroupStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px'
};

const inputStyles: React.CSSProperties = {
    flex: 1,
    padding: '6px 8px',
    fontSize: '12px',
    fontFamily: 'var(--vscode-font-family)',
    backgroundColor: 'var(--vscode-input-background)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '2px',
    color: 'var(--vscode-input-foreground)'
};

const browseButtonStyles: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '11px',
    fontFamily: 'var(--vscode-font-family)',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '2px',
    color: 'var(--vscode-button-secondaryForeground)',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
};

const helpTextStyles: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    color: 'var(--vscode-descriptionForeground)',
    fontStyle: 'italic',
    marginTop: '4px'
};

const errorStyles: React.CSSProperties = {
    padding: '8px',
    backgroundColor: 'var(--vscode-errorBackground)',
    color: 'var(--vscode-errorForeground)',
    borderRadius: '3px',
    fontSize: '11px',
    border: '1px solid var(--vscode-errorBorder)'
};

const footerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '16px 20px',
    borderTop: '1px solid var(--vscode-panel-border)'
};

const cancelButtonStyles: React.CSSProperties = {
    padding: '6px 16px',
    fontSize: '11px',
    fontFamily: 'var(--vscode-font-family)',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '2px',
    color: 'var(--vscode-button-secondaryForeground)',
    cursor: 'pointer'
};

const importButtonStyles: React.CSSProperties = {
    padding: '6px 16px',
    fontSize: '11px',
    fontFamily: 'var(--vscode-font-family)',
    backgroundColor: 'var(--vscode-button-background)',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '2px',
    color: 'var(--vscode-button-foreground)',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const disabledButtonStyles: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed'
};