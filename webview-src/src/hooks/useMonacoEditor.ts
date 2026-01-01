import { useEffect, useRef } from 'react';
import { editor } from 'monaco-editor';

export interface UseMonacoEditorOptions {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: string;
  placeholder?: string;
}

export const useMonacoEditor = (options: UseMonacoEditorOptions) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Monaco Editor will be handled by @monaco-editor/react component
    // This hook is now just a placeholder for future custom Monaco logic
  }, [options.language, options.theme, options.placeholder]);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current && options.value !== editorRef.current.getValue()) {
      editorRef.current.setValue(options.value);
    }
  }, [options.value]);

  const handleEditorDidMount = (monacoEditor: editor.IStandaloneCodeEditor) => {
    editorRef.current = monacoEditor;
    
    // Set up change listener
    monacoEditor.onDidChangeModelContent(() => {
      const value = monacoEditor.getValue();
      options.onChange(value);
    });
  };

  return {
    containerRef,
    editor: editorRef.current,
    handleEditorDidMount
  };
};