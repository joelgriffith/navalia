process.env.DEBUG = '';

jest.mock('chrome-launcher');
jest.mock('axios');
jest.mock('chrome-remote-interface', () => () =>
  Promise.resolve({
    Page: {
      enable: jest.fn(),
    },
    Runtime: {
      enable: jest.fn(),
    },
    Network: {
      enable: jest.fn(),
    },
    DOM: {
      enable: jest.fn(),
    },
    CSS: {
      enable: jest.fn(),
    },
  })
);

import * as chromeLauncher from 'chrome-launcher';
import axios from 'axios';
import {
  createTab,
  defaultFlags,
  launch,
  transformChromeFlags,
} from '../chrome';

describe('chrome utils', () => {
  beforeEach(() => {
    axios.get.mockImplementation(() =>
      Promise.resolve({
        data: {
          webSocketDebuggerUrl: 'ws://127.0.0.1/mocked/debugger/',
        },
      })
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('#createTab', () => {
    const cdp = {
      Page: {},
      Runtime: {},
      Network: {},
      DOM: {},
      CSS: {},
      Target: {
        createBrowserContext: jest.fn(),
        createTarget: jest.fn(),
      },
      Emulation: {},
      Profiler: {},
      Input: {},
    };

    it('should return the tab and targetId', () => {
      cdp.Target.createBrowserContext = jest.fn(() => ({
        browserContextId: 1234,
      }));
      cdp.Target.createTarget = jest.fn(() => ({ targetId: 'targetId' }));

      return createTab(cdp, 8000).then(({ tab, targetId }) => {
        expect(cdp.Target.createBrowserContext).toHaveBeenCalled();
        expect(cdp.Target.createTarget).toHaveBeenCalledWith({
          url: 'about:blank',
          browserContextId: 1234,
        });

        expect(tab.Page.enable).toHaveBeenCalledTimes(1);
        expect(tab.Runtime.enable).toHaveBeenCalledTimes(1);
        expect(tab.Network.enable).toHaveBeenCalledTimes(1);
        expect(tab.DOM.enable).toHaveBeenCalledTimes(1);
        expect(tab.CSS.enable).toHaveBeenCalledTimes(1);

        expect(targetId).toEqual('targetId');
      });
    });
  });

  describe('#launch', () => {
    it('should return the launched browser and cdp instance if `isHost` is false', () => {
      const mockBrowser = { port: 1243 };
      chromeLauncher.launch = jest.fn(() => Promise.resolve(mockBrowser));

      return launch(defaultFlags).then(({ browser, cdp }) => {
        expect(chromeLauncher.launch).toHaveBeenCalledWith({
          chromeFlags: transformChromeFlags(defaultFlags),
          logLevel: 'silent',
        });

        expect(cdp.Page.enable).toHaveBeenCalledTimes(1);
        expect(cdp.Runtime.enable).toHaveBeenCalledTimes(1);
        expect(cdp.Network.enable).toHaveBeenCalledTimes(1);
        expect(cdp.DOM.enable).toHaveBeenCalledTimes(1);
        expect(cdp.CSS.enable).toHaveBeenCalledTimes(1);

        expect(browser).toEqual(mockBrowser);
      });
    });

    it('should return the launched browser and cdp instance if `isHost` is true', () => {
      const mockBrowser = { port: 1243 };
      chromeLauncher.launch = jest.fn(() => Promise.resolve(mockBrowser));

      return launch(defaultFlags, true).then(({ browser, cdp }) => {
        expect(chromeLauncher.launch).toHaveBeenCalledWith({
          chromeFlags: transformChromeFlags(defaultFlags),
          logLevel: 'silent',
        });

        expect(cdp.Page.enable).not.toHaveBeenCalled();
        expect(cdp.Runtime.enable).not.toHaveBeenCalled();
        expect(cdp.Network.enable).not.toHaveBeenCalled();
        expect(cdp.DOM.enable).not.toHaveBeenCalled();
        expect(cdp.CSS.enable).not.toHaveBeenCalled();

        expect(browser).toEqual(mockBrowser);
      });
    });
  });
});
