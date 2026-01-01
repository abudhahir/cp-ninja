import React, { useState } from 'react';
import { SkillTemplate } from '../types/skill';
import { SKILL_CATEGORIES, SKILL_TEMPLATES } from '../data/templates';

interface TemplateGalleryProps {
    onTemplateSelect?: (template: SkillTemplate) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onTemplateSelect }) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

    const filteredTemplates = selectedCategory === 'all' 
        ? SKILL_TEMPLATES 
        : SKILL_TEMPLATES.filter(template => template.category === selectedCategory);

    const handleTemplateClick = (template: SkillTemplate) => {
        // Default behavior: create as user skill
        handleTemplateAction(template, 'user');
    };

    const handleTemplateAction = (template: SkillTemplate, location: 'user' | 'project') => {
        if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi) {
            const vscode = (window as any).acquireVsCodeApi();
            vscode.postMessage({
                command: 'createNewSkill',
                content: template.content,
                templateName: template.name,
                mode: 'template',
                saveLocation: location
            });
        }
        
        // Also call the original handler for compatibility
        onTemplateSelect?.(template);
    };

    const getTagColor = (tag: string): { bg: string; text: string; border: string } => {
        const tagColors = {
            'react': { bg: '#61dafb', text: '#000000', border: '#4ac5e8' },
            'typescript': { bg: '#3178c6', text: '#ffffff', border: '#2565a6' }, 
            'javascript': { bg: '#f7df1e', text: '#000000', border: '#e6c91a' },
            'development': { bg: '#28a745', text: '#ffffff', border: '#1e7e34' },
            'testing': { bg: '#ff6347', text: '#ffffff', border: '#dc3545' },
            'documentation': { bg: '#0ea5e9', text: '#ffffff', border: '#0284c7' },
            'planning': { bg: '#9b59b6', text: '#ffffff', border: '#8e44ad' },
            'workflow': { bg: '#fd7e14', text: '#ffffff', border: '#e8690b' },
            'debugging': { bg: '#dc3545', text: '#ffffff', border: '#c82333' },
            'beginner': { bg: '#28a745', text: '#ffffff', border: '#1e7e34' },
            'intermediate': { bg: '#fd7e14', text: '#ffffff', border: '#e8690b' },
            'advanced': { bg: '#dc3545', text: '#ffffff', border: '#c82333' }
        };
        const normalizedTag = tag.toLowerCase();
        return tagColors[normalizedTag as keyof typeof tagColors] || { 
            bg: 'var(--vscode-badge-background)', 
            text: 'var(--vscode-badge-foreground)', 
            border: 'var(--vscode-panel-border)' 
        };
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Beginner': return 'var(--vscode-charts-green)';
            case 'Intermediate': return 'var(--vscode-charts-orange)';
            case 'Advanced': return 'var(--vscode-charts-red)';
            default: return 'var(--vscode-foreground)';
        }
    };

    return (
        <div style={containerStyles}>
            {/* Category Buttons */}
            <div style={categoryContainerStyles}>
                {SKILL_CATEGORIES.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        style={{
                            ...categoryButtonStyles,
                            ...(selectedCategory === category.id ? activeCategoryButtonStyles : {})
                        }}
                    >
                        <span style={categoryIconStyles}>{category.icon}</span>
                        {category.name}
                    </button>
                ))}
            </div>

            {/* Template Cards */}
            <div style={templatesContainerStyles}>
                {filteredTemplates.map(template => (
                    <div
                        key={template.id}
                        style={{
                            ...templateCardStyles,
                            ...(hoveredTemplate === template.id ? hoveredTemplateCardStyles : {})
                        }}
                        onClick={() => handleTemplateClick(template)}
                        onMouseEnter={() => setHoveredTemplate(template.id)}
                        onMouseLeave={() => setHoveredTemplate(null)}
                    >
                        <div style={templateHeaderStyles}>
                            <h4 style={templateTitleStyles}>{template.name}</h4>
                            <span 
                                style={{
                                    ...difficultyBadgeStyles,
                                    backgroundColor: getDifficultyColor(template.difficulty) + '20',
                                    color: getDifficultyColor(template.difficulty)
                                }}
                            >
                                {template.difficulty}
                            </span>
                        </div>
                        
                        <p style={templateDescriptionStyles}>{template.description}</p>
                        
                        <div style={tagsContainerStyles}>
                            {template.tags.slice(0, 3).map(tag => {
                                const colors = getTagColor(tag);
                                return (
                                    <span key={tag} style={{
                                        ...tagStyles,
                                        backgroundColor: colors.bg,
                                        color: colors.text,
                                        borderColor: colors.border
                                    }}>
                                        {tag}
                                    </span>
                                );
                            })}
                            {template.tags.length > 3 && (
                                <span style={{
                                    ...tagStyles,
                                    backgroundColor: 'var(--vscode-badge-background)',
                                    color: 'var(--vscode-badge-foreground)',
                                    borderColor: 'var(--vscode-panel-border)'
                                }}>+{template.tags.length - 3}</span>
                            )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div style={actionButtonsContainerStyles}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleTemplateAction(template, 'user');
                                }}
                                style={userSkillButtonStyles}
                                title="Create as User Skill"
                            >
                                👤 User
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleTemplateAction(template, 'project');
                                }}
                                style={projectSkillButtonStyles}
                                title="Create as Project Skill"
                            >
                                📁 Project
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Styles
const containerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
};

const categoryContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '16px',
    padding: '0 4px'
};

const categoryButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '16px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: 'var(--vscode-font-family)',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    fontWeight: '500'
} as const;

const activeCategoryButtonStyles: React.CSSProperties = {
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    borderColor: 'var(--vscode-focusBorder)',
    fontWeight: '600'
};

const categoryIconStyles: React.CSSProperties = {
    fontSize: '12px',
    minWidth: '12px'
};

const templatesContainerStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    padding: '0 4px'
};

const templateCardStyles: React.CSSProperties = {
    padding: '12px',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '6px',
    backgroundColor: 'var(--vscode-editor-background)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
};

const hoveredTemplateCardStyles: React.CSSProperties = {
    borderColor: 'var(--vscode-focusBorder)',
    backgroundColor: 'var(--vscode-list-hoverBackground)',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
};

const templateHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    gap: '8px'
};

const templateTitleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: '13px',
    fontWeight: 'bold',
    color: 'var(--vscode-editor-foreground)',
    lineHeight: '1.2',
    flex: 1
};

const difficultyBadgeStyles: React.CSSProperties = {
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    flexShrink: 0
};

const templateDescriptionStyles: React.CSSProperties = {
    margin: '0 0 8px 0',
    fontSize: '11px',
    color: 'var(--vscode-descriptionForeground)',
    lineHeight: '1.4',
    flex: 1,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical'
};

const tagsContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: 'auto'
};

const tagStyles: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600',
    border: '1px solid',
    whiteSpace: 'nowrap',
    textTransform: 'lowercase' as const,
    letterSpacing: '0.02em',
    lineHeight: '1.2'
};

const actionButtonsContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid var(--vscode-panel-border)'
};

const userSkillButtonStyles: React.CSSProperties = {
    flex: 1,
    padding: '4px 8px',
    fontSize: '10px',
    fontFamily: 'var(--vscode-font-family)',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '3px',
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};

const projectSkillButtonStyles: React.CSSProperties = {
    flex: 1,
    padding: '4px 8px',
    fontSize: '10px',
    fontFamily: 'var(--vscode-font-family)',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '3px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};