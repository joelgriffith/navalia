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

jest.mock('lighthouse/chrome-launcher/chrome-launcher', () => ({
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
    CSS
  }));
});

const chromeLauncher = require('lighthouse/chrome-launcher/chrome-launcher');

import { default as Chrome } from '../Chrome';

describe('Chrome', () => {
  describe('#launch', () => {
    it('launches an instance of chrome', async() => {
      const chrome = new Chrome();
      await chrome.launch();

      expect(chromeLauncher.launch).toHaveBeenCalled();
    });

    it('passes through the CLI flags', async() => {
      const chrome = new Chrome({ headless: true });
      await chrome.launch();

      expect(chromeLauncher.launch.mock.calls[0][0].chromeFlags).toContain('--headless');
    });
  });
});
