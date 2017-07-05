// Domain Mocks
const Page = {
  enable: jest.fn(),
};

const Runtime = {
  enable: jest.fn(),
};

const Network = {
  enable: jest.fn(),
};

const DOM = {
  enable: jest.fn(),
};

const CSS = {
  enable: jest.fn(),
};

const Target = {
  createBrowserContext: jest.fn().mockReturnValue({
    browserContextId: '123',
  }),
  createTarget: jest.fn().mockReturnValue({
    targetId: '456',
  }),
};

jest.mock('chrome-launcher', () => ({
  launch: jest.fn(() => ({
    port: 1234,
    kill: jest.fn(),
  })),
}));

jest.mock('chrome-remote-interface', () => {
  return jest.fn(() => ({
    Page,
    Runtime,
    Network,
    DOM,
    CSS,
    Target,
  }));
});

const chromeLauncher = require('chrome-launcher');

import { Chrome } from '../Chrome';

describe('Chrome', () => {
  describe('#launch', () => {
    it('launches an instance of chrome', async() => {
      const chrome = new Chrome();
      await chrome.start();

      expect(chromeLauncher.launch).toHaveBeenCalled();
    });

    it('passes through the CLI flags', async() => {
      const chrome = new Chrome({ headless: true });
      await chrome.start();

      expect(chromeLauncher.launch.mock.calls[0][0].chromeFlags).toContain('--headless');
    });
  });
});
