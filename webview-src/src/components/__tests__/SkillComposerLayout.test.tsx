import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkillComposerLayout } from '../SkillComposerLayout';

describe('SkillComposerLayout', () => {
    test('should render three panels with correct proportions', () => {
        render(<SkillComposerLayout />);
        
        expect(screen.getByTestId('left-panel')).toBeInTheDocument();
        expect(screen.getByTestId('center-panel')).toBeInTheDocument();
        expect(screen.getByTestId('right-panel')).toBeInTheDocument();
        
        const leftPanel = screen.getByTestId('left-panel');
        expect(leftPanel).toHaveStyle({ width: '25%' });
    });
});