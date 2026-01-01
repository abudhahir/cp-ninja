import React from 'react';
import Editor from '@monaco-editor/react';
import { useMonacoEditor } from '../hooks/useMonacoEditor';

interface SkillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

export const SkillEditor: React.FC<SkillEditorProps> = ({
  value,
  onChange,
  placeholder = "# Skill Name\n\n**Goal:** What this skill accomplishes\n\n**Steps:**\n1. First step\n2. Second step\n3. Third step\n\n**Example:**\n```\nExample usage or code\n```",
  height = "100%"
}) => {
  const { handleEditorDidMount } = useMonacoEditor({
    value,
    onChange,
    language: 'markdown',
    theme: 'vs-dark',
    placeholder
  });

  return (
    <div 
      className="skill-editor"
      data-testid="monaco-editor"
      style={{
        height,
        width: '100%',
        position: 'relative',
        backgroundColor: 'var(--vscode-editor-background)',
        border: '1px solid var(--vscode-widget-border)',
        borderRadius: '4px'
      }}
    >
      <Editor
        height={height}
        language="markdown"
        theme="vs-dark"
        value={value || placeholder}
        onChange={(newValue) => onChange(newValue || '')}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: 'active',
            indentation: true
          },
          readOnly: false
        }}
      />
    </div>
  );
};