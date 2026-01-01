import React, { useState } from 'react';
import { SkillTemplate } from '../types/skill';
import { SKILL_CATEGORIES, SKILL_TEMPLATES } from '../data/templates';

interface TemplateGalleryProps {
    onTemplateSelect?: (template: SkillTemplate) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onTemplateSelect }) => {
    const [selectedCategory, setSelectedCategory] = useState('development');
    const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

    const filteredTemplates = SKILL_TEMPLATES.filter(
        template => template.category === selectedCategory
    );

    const handleTemplateClick = (template: SkillTemplate) => {
        onTemplateSelect?.(template);
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
                            {template.tags.map(tag => (
                                <span key={tag} style={tagStyles}>
                                    {tag}
                                </span>
                            ))}
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
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px',
    padding: '0 4px'
};

const categoryButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '4px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--vscode-font-family)',
    transition: 'all 0.2s ease',
    textAlign: 'left'
} as const;

const activeCategoryButtonStyles: React.CSSProperties = {
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    borderColor: 'var(--vscode-focusBorder)'
};

const categoryIconStyles: React.CSSProperties = {
    fontSize: '14px',
    minWidth: '14px'
};

const templatesContainerStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '0 4px'
};

const templateCardStyles: React.CSSProperties = {
    padding: '12px',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '6px',
    backgroundColor: 'var(--vscode-editor-background)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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
    lineHeight: '1.4'
};

const tagsContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px'
};

const tagStyles: React.CSSProperties = {
    padding: '2px 6px',
    backgroundColor: 'var(--vscode-badge-background)',
    color: 'var(--vscode-badge-foreground)',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: 'normal'
};