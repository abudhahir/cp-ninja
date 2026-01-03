import React, { useState } from 'react';
import { CenterPanel } from './CenterPanel';
import { SkillPreview } from './SkillPreview';
import { SkillTemplate } from '../types/skill';

export const SkillComposerLayout: React.FC = () => {
    const [selectedSkill, setSelectedSkill] = useState<SkillTemplate | null>(null);

    const handleSkillSelect = (skill: SkillTemplate) => {
        setSelectedSkill(skill);
    };

    const handleBack = () => {
        setSelectedSkill(null);
    };

    return (
        <div className="skill-composer-layout" style={containerStyles}>
            {selectedSkill ? (
                <SkillPreview skill={selectedSkill} onBack={handleBack} />
            ) : (
                <CenterPanel onSkillSelect={handleSkillSelect} />
            )}
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