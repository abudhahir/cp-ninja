import React, { useState } from 'react';

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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div 
      className="skill-editor"
      data-testid="skill-editor"
      style={{
        height,
        width: '100%',
        position: 'relative',
        backgroundColor: 'var(--vscode-editor-background)',
        border: '1px solid var(--vscode-widget-border)',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: '12px',
          fontSize: '14px',
          fontFamily: 'var(--vscode-editor-font-family, Consolas, monospace)',
          lineHeight: '1.4',
          color: 'var(--vscode-editor-foreground)',
          backgroundColor: 'transparent',
          borderRadius: '4px',
          boxSizing: 'border-box'
        }}
      />
      {!value && !isFocused && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          color: 'var(--vscode-input-placeholderForeground)',
          pointerEvents: 'none',
          fontSize: '14px',
          fontFamily: 'var(--vscode-editor-font-family, Consolas, monospace)',
          whiteSpace: 'pre-line'
        }}>
          {placeholder}
        </div>
      )}
    </div>
  );
};