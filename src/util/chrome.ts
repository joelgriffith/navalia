import * as _ from 'lodash';
import * as chromeLauncher from 'chrome-launcher';
import * as CDP from 'chrome-remote-interface';

// Need to flush these out at some point
export interface flags {
  [propName: string]: boolean;
}

export interface cdp {
  Page: any,
  Runtime: any,
  Network: any,
  DOM: any,
  CSS: any,
  Target: any,
  Emulation: any,
}

export interface tab {
  tab: any,
  targetId: string,
}

export interface chromeInstance {
  browser: chromeLauncher.LaunchedChrome,
  cdp: any
}

// Contains all the business 
export const launch = async(flags: flags): Promise<chromeInstance> => {
  const chromeFlags:string[] = _.chain(flags)
    .pickBy((value) => value)
    .map((_value, key) => `--${_.kebabCase(key)}`)
    .value();

  // Boot Chrome
  const browser:chromeLauncher.LaunchedChrome = await chromeLauncher.launch({ chromeFlags });
  const cdp = await CDP({ target: `ws://localhost:${browser.port}/devtools/browser` });

  // Enable all the domains
  await Promise.all([
    cdp.Page.enable(),
    cdp.Runtime.enable(),
    cdp.Network.enable(),
    cdp.DOM.enable(),
    cdp.CSS.enable(),
  ]);
  
  // Return both the browser and the CDP instance
  return {
    browser,
    cdp,
  }
}

export const createTab = async (cdp: cdp): Promise<tab> => {
  const { browserContextId } = cdp.Target.createBrowserContext();

  const { targetId } = await cdp.Target.Target.createTarget({
    url: 'about:blank',
    browserContextId
  });

  // connct to the new context
  const tab = await CDP({ tab: `ws://localhost:${this.port}/devtools/page/${targetId}` });

  // Enable all the domains
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
}
