import React from 'react';
import { SkillComposerLayout } from './components/SkillComposerLayout';
import { SkillComposerProvider } from './context/SkillComposerContext';

const App: React.FC = () => {
  return (
    <SkillComposerProvider>
      <SkillComposerLayout />
    </SkillComposerProvider>
  );
};

export default App;