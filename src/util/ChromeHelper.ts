import * as debug from 'debug';

import * as chrome from './chrome';
import { Chrome, events } from '../Chrome';

const log = debug('navalia:chrome-helper');

export interface options {
  maxActiveTabs?: number;
  flags?: chrome.flags;
}

export class ChromeHelper {
  private cdp: any;
  private isExpired: boolean;
  private activeTabs: number;
  private maxActiveTabs: number;
  private browserStartingPromise: Promise<any> | boolean;
  private kill: Function;
  private flags: chrome.flags;
  private jobsComplete: number;

  constructor(options: options) {
    this.browserStartingPromise = false;
    this.isExpired = false;
    this.jobsComplete = 0;
    this.activeTabs = 0;
    this.maxActiveTabs = options.maxActiveTabs || -1;
    this.flags = options.flags || {
      headless: true,
      disableGpu: true,
      hideScrollbars: true,
    };
  }

  public async start(): Promise<Chrome> {
    if (this.browserStartingPromise) {
      this.browserStartingPromise = chrome.launch(this.flags);
    }

    await this.browserStartingPromise;

    const { tab, targetId } = await chrome.createTab(this.cdp);
    const newTab = new Chrome({ cdp: tab });

    newTab.on(events.done, this.onTabClose.bind(this, targetId));

    return newTab;
  }

  public onTabClose(targetId: string): void {
    this.cdp.Target.closeTarget({ targetId });
    log(`tab ${targetId} closed`);
    this.activeTabs--;
    this.jobsComplete++;
  }

  public async quit(): Promise<void> {
    log(`killing instance`);
    this.activeTabs = 0;
    await this.cdp.close();
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
