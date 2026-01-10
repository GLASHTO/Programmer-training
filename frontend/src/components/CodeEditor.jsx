import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ value, onChange }) => {
  return (
    <Editor
      height="100%"
      defaultLanguage="python"
      theme="vs-dark"
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 20 }
      }}
    />
  );
};

export default CodeEditor;