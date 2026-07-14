import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Portal from './Portal';

describe('Portal', () => {
  it('renders children in a dedicated body container and removes it on unmount', () => {
    const { unmount } = render(
      <Portal>
        <div>Portal content</div>
      </Portal>,
    );

    const portal = document.body.querySelector('[data-portal="true"]');
    expect(portal).not.toBeNull();
    expect(portal.textContent).toBe('Portal content');

    unmount();

    expect(document.body.querySelector('[data-portal="true"]')).toBeNull();
  });
});
