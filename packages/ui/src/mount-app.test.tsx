import { act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountApp } from './mount-app';

const Page = () => <p>sahifa</p>;

afterEach(() => {
  document.body.innerHTML = '';
  delete window.Telegram;
});

describe('mountApp', () => {
  it('renders the page and tells Telegram it is ready', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const webApp = { ready: vi.fn(), expand: vi.fn() };
    window.Telegram = { WebApp: webApp };
    await act(async () => mountApp(Page));
    expect(document.body.textContent).toContain('sahifa');
    expect(webApp.ready).toHaveBeenCalledOnce();
    expect(webApp.expand).toHaveBeenCalledOnce();
  });

  it('works outside Telegram', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    await act(async () => mountApp(Page));
    expect(document.body.textContent).toContain('sahifa');
  });

  it('fails without a root element', () => {
    expect(() => mountApp(Page)).toThrow('ui.root_missing');
  });
});
