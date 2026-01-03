import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SkillTemplate } from '../types/skill';
import { vsCodeApi } from '../services/vsCodeApiService';

interface SkillComposerState {
    selectedTemplate: SkillTemplate | null;
    skillContent: string;
    isDirty: boolean;
}

interface SkillComposerContextType extends SkillComposerState {
    setSelectedTemplate: (template: SkillTemplate | null) => void;
    setSkillContent: (content: string) => void;
    setIsDirty: (dirty: boolean) => void;
    loadTemplate: (template: SkillTemplate) => void;
}

const SkillComposerContext = createContext<SkillComposerContextType | undefined>(undefined);

export const useSkillComposer = (): SkillComposerContextType => {
    const context = useContext(SkillComposerContext);
    if (!context) {
        throw new Error('useSkillComposer must be used within a SkillComposerProvider');
    }
    return context;
};

interface SkillComposerProviderProps {
    children: ReactNode;
}

export const SkillComposerProvider: React.FC<SkillComposerProviderProps> = ({ children }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<SkillTemplate | null>(null);
    const [skillContent, setSkillContent] = useState<string>('');
    const [isDirty, setIsDirty] = useState<boolean>(false);

    const loadTemplate = (template: SkillTemplate) => {
        setSelectedTemplate(template);
        setSkillContent(template.content);
        setIsDirty(false);
        
        // Send message to VS Code extension
        vsCodeApi.postMessage({
            command: 'templateSelected',
            template: template
        });
    };

    const handleSetSkillContent = (content: string) => {
        setSkillContent(content);
        setIsDirty(content !== (selectedTemplate?.content || ''));
    };

    return (
        <SkillComposerContext.Provider
            value={{
                selectedTemplate,
                skillContent,
                isDirty,
                setSelectedTemplate,
                setSkillContent: handleSetSkillContent,
                setIsDirty,
                loadTemplate
            }}
        >
            {children}
        </SkillComposerContext.Provider>
    );
};