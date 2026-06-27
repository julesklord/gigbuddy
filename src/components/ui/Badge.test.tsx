import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies the correct default classes', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badgeElement = container.firstChild as HTMLElement;
    
    // Check for base class and default variant/size
    expect(badgeElement).toHaveClass('tag');
    expect(badgeElement).toHaveClass('secondary'); // gray variant maps to secondary
  });

  it('applies the brand variant classes', () => {
    const { container } = render(<Badge variant="brand">Brand</Badge>);
    const badgeElement = container.firstChild as HTMLElement;
    expect(badgeElement).toHaveClass('primary'); // brand maps to primary
  });
});
