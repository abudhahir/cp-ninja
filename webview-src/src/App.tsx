import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ 
      fontFamily: 'var(--vscode-font-family)', 
      fontSize: 'var(--vscode-font-size)',
      color: 'var(--vscode-foreground)',
      backgroundColor: 'var(--vscode-editor-background)',
      padding: '20px',
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--vscode-titleBar-activeForeground)', marginBottom: '20px' }}>
          Skill Composer
        </h1>
        <p>Welcome to the Copilot Ninja Skill Composer!</p>
        <p>This React application is now running inside the VS Code webview panel.</p>
        <div style={{
          padding: '10px',
          border: '1px solid var(--vscode-panel-border)',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h3>React Environment Status:</h3>
          <ul>
            <li>✅ React 18</li>
            <li>✅ TypeScript</li>
            <li>✅ Webpack bundling</li>
            <li>✅ VS Code theming</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;