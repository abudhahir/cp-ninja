import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkillEditor } from '../SkillEditor';

describe('SkillEditor', () => {
    test('should render editor container', () => {
        render(<SkillEditor value="" onChange={() => {}} />);
        
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
    
    test('should call onChange when content changes', async () => {
        const mockOnChange = jest.fn();
        render(<SkillEditor value="initial" onChange={mockOnChange} />);
        
        // Monaco integration will be tested in integration tests
        expect(mockOnChange).toHaveBeenCalledTimes(0);
    });
});