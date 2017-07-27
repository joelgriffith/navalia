import * as _ from 'lodash';
import * as chromeLauncher from 'chrome-launcher';
import * as CDP from 'chrome-remote-interface';

export interface flags {
  [propName: string]: boolean | string | number;
}

export interface cdp {
  Page: any;
  Runtime: any;
  Network: any;
  DOM: any;
  CSS: any;
  Target: any;
  Emulation: any;
  Profiler: any;
  Input: any;
}

export interface remote {
  host: string;
  port: number;
}

export interface tab {
  tab: any;
  targetId: string;
}

export interface chromeInstance {
  browser: chromeLauncher.LaunchedChrome;
  cdp: cdp;
}

export const defaultFlags: flags = {
  headless: true,
  disableGpu: true,
  hideScrollbars: true,
};

export const transformChromeFlags = (flags: flags) => {
  return _.chain(flags)
    .pickBy(value => value)
    .map((value, key) => {
      const cliSwitch = `--${_.kebabCase(key)}`;
      if (_.isBoolean(value) && value) {
        return cliSwitch;
      }
      return `${cliSwitch}=${value}`;
    })
    .value();
};

// Contains all the business
export const launch = async (
  flags: flags,
  isHost: boolean = false,
  remote?: remote,
): Promise<chromeInstance> => {
  const logLevel =
    process.env.DEBUG &&
    (process.env.DEBUG.includes('ChromeLauncher') ||
      process.env.DEBUG.includes('*'))
      ? 'info'
      : 'silent';

  const chromeFlags = transformChromeFlags(flags);

  // Boot Chrome
  const browser = remote
    ? Object.assign({}, remote, { kill: function() {}, pid: null })
    : await chromeLauncher.launch({
        chromeFlags,
        logLevel,
      });

  const cdp: cdp = isHost
    ? await CDP(
        remote || { target: `ws://localhost:${browser.port}/devtools/browser` },
      )
    : await CDP(remote || { port: browser.port });

  await Promise.all(
    isHost
      ? []
      : [
          cdp.Page.enable(),
          cdp.Runtime.enable(),
          cdp.Network.enable(),
          cdp.DOM.enable(),
          cdp.CSS.enable(),
        ],
  );

  // Return both the browser and the CDP instance
  return {
    browser,
    cdp,
  };
};

export const createTab = async (cdp: cdp, port: number): Promise<tab> => {
  const { browserContextId } = cdp.Target.createBrowserContext();

  const { targetId } = await cdp.Target.createTarget({
    url: 'about:blank',
    browserContextId,
  });

  // connct to the new context
  const tab: cdp = await CDP({
    tab: `ws://localhost:${port}/devtools/page/${targetId}`,
  });

  // Enable all the domains on the tab
  await Promise.all([
    tab.Page.enable(),
    tab.Runtime.enable(),
    tab.Network.enable(),
    tab.DOM.enable(),
    tab.CSS.enable(),
  ]);

  return {
    tab,
    targetId,
  };
};
