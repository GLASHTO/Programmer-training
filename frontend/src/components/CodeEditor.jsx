import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ value, onChange }) => {
  return (
    <div className="w-full h-96 border border-green-900 shadow-[0_0_10px_rgba(0,255,0,0.1)]">
      <Editor
        height="100%"
        defaultLanguage="python"
        theme="vs-dark"
        value={value}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          fontFamily: 'monospace',
          cursorBlinking: 'smooth',
        }}
      />
    </div>
  );
};

export default CodeEditor;