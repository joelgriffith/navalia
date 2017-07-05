import * as _ from 'lodash';
import * as chromeLauncher from 'chrome-launcher';
import * as CDP from 'chrome-remote-interface';
import * as debug from 'debug';

import { ChromeTab, events } from './ChromeTab';

const log = debug('navalia:chrome');

export interface chromeOptions {
  [propName: string]: boolean | undefined;
}

export interface customOptions {
  maxActiveTabs?: number;
}

export class Chrome {
  private chrome: any;
  private host: any;
  private isExpired: boolean;
  private activeTabs: number;
  private maxActiveTabs: number;
  private browserStarted: boolean;
  private kill: Function;

  public chromeBootOptions: chromeOptions;
  public jobsComplete: number;
  public port: number;

  constructor(chromeBootOptions: chromeOptions = {}, customOptions: customOptions = {}) {
    this.isExpired = false;
    this.jobsComplete = 0;
    this.activeTabs = 0;
    this.maxActiveTabs = customOptions.maxActiveTabs || -1;
    this.chromeBootOptions ={
      headless: true,
      disableGpu: true,
      hideScrollbars: true,
      ...chromeBootOptions,
    };
  }

  public async launch(): Promise<ChromeTab> {
    // Want to remain idempotent
    if (this.browserStarted) {
      return this.getNewTab();
    }

    this.browserStarted = true;

    const chromeFlags = _.chain(this.chromeBootOptions)
      .pickBy((value) => value)
      .map((_value, key) => `--${_.kebabCase(key)}`)
      .value();

    log(`launching host with args ${chromeFlags.join(' ')}`);

    // Boot Chrome
    const browser = await chromeLauncher.launch({ chromeFlags });
    const cdp = await CDP({ target: `ws://localhost:${browser.port}/devtools/browser` });

    log(`launched host on port ${browser.port}`);

    this.kill = browser.kill;
    this.host = cdp;
    this.chrome = cdp;
    this.port = browser.port;

    return this.launch();
  }

  public async getNewTab() {
    const { browserContextId } = await this.host.Target.createBrowserContext();

    log(`creating new tab at ${browserContextId}`);

    const { targetId } = await this.host.Target.createTarget({
      url: 'about:blank',
      browserContextId
    });

    // connct to the new context
    const newTab = await CDP({ tab: `ws://localhost:${this.port}/devtools/page/${targetId}` });

    // Enable all the crazy domains
    await Promise.all([
      newTab.Page.enable(),
      newTab.Runtime.enable(),
      newTab.Network.enable(),
      newTab.DOM.enable(),
      newTab.CSS.enable(),
    ]);

    const tab = new ChromeTab(newTab, targetId);

    tab.on(events.done, this.onTabClose.bind(this));

    this.activeTabs++;
    return tab;
  }

  public onTabClose(targetId: string): void {
    this.chrome.Target.closeTarget({ targetId });
    log(`tab ${targetId} closed`);
    this.activeTabs--;
  }

  public async destroy(): Promise<void> {
    log(`killing instance`);
    this.activeTabs = 0;
    await this.chrome.close();
    return this.kill();
  }

  public setExpired(): void {
    log(`instance has been marked expired`);
    this.isExpired = true;
  }

  public getIsBusy(): boolean {
    return this.maxActiveTabs === this.activeTabs;
  }

  public getIsExpired(): boolean {
    return this.isExpired;
  }
}
