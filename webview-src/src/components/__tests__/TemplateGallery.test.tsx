import React from 'react';
import { render, screen } from '@testing-library/react';
import { TemplateGallery } from '../TemplateGallery';

describe('TemplateGallery', () => {
    test('should display template categories', () => {
        render(<TemplateGallery />);
        
        expect(screen.getByText('Development Workflows')).toBeInTheDocument();
        expect(screen.getByText('Project Management')).toBeInTheDocument();
        expect(screen.getByText('Documentation')).toBeInTheDocument();
    });
    
    test('should display templates in each category', () => {
        render(<TemplateGallery />);
        
        expect(screen.getByText('Debugging Process')).toBeInTheDocument();
        expect(screen.getByText('Code Review Checklist')).toBeInTheDocument();
    });
});