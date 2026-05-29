import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { curriculum } from '../../data/curriculum';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('exposes the selected curriculum domain button to assistive tech', () => {
    render(
      <AppShell
        domains={curriculum}
        onSelectDomain={vi.fn()}
        practiceRail={<aside />}
        selectedDomainId="physiology"
      >
        <div />
      </AppShell>,
    );

    expect(screen.getByRole('button', { name: /physiology/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /foundations/i })).toHaveAttribute('aria-pressed', 'false');
  });
});
