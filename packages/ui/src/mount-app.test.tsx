import { act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountApp } from './mount-app';

const Page = () => <p>sahifa</p>;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('mountApp', () => {
  it('renders the page with the brand title and sends analytics when hidden', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const fetch = vi.spyOn(window, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    await act(async () => mountApp('driver', Page));
    expect(document.body.textContent).toContain('sahifa');
    expect(document.title).toBeTruthy();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fetch).toHaveBeenCalledTimes(0);
  });

  it('fails without a root element', () => {
    expect(() => mountApp('driver', Page)).toThrow('ui.root_missing');
  });
});
