import * as debug from 'debug';

import * as chromeUtil from './chrome';
import { Chrome, events } from '../Chrome';

const log = debug('navalia:chrome-helper');

export interface options {
  maxActiveTabs?: number;
  flags?: chromeUtil.flags;
}

export class ChromeHelper {
  private cdp: any;
  private isExpired: boolean;
  private activeTabs: number;
  private maxActiveTabs: number;
  private browserStartingPromise: Promise<any>;
  private kill: Function;
  private flags: chromeUtil.flags;
  private jobsComplete: number;

  public port: number;

  constructor(options: options) {
    this.isExpired = false;
    this.jobsComplete = 0;
    this.activeTabs = 0;
    this.maxActiveTabs = options.maxActiveTabs || -1;
    this.flags = options.flags || chromeUtil.defaultFlags;

    log(
      `using up to ${this.maxActiveTabs === -1
        ? 'infinite'
        : this.maxActiveTabs} tabs`,
    );
  }

  public async start(): Promise<Chrome> {
    this.activeTabs++;

    if (!this.browserStartingPromise) {
      log(`starting chrome`);
      this.browserStartingPromise = chromeUtil.launch(this.flags, true);
    }

    const launched = await this.browserStartingPromise;

    this.kill = launched.browser.kill;
    this.port = launched.browser.port;
    this.cdp = launched.cdp;

    log(`chrome on ${this.port} is running`);

    const { tab, targetId } = await chromeUtil.createTab(this.cdp, this.port);

    log(
      `chrome on ${this
        .port} launched a new tab at ${targetId}. current tabs: ${this
        .activeTabs}`,
    );

    const newTab = new Chrome({
      cdp: tab,
      flags: this.flags || chromeUtil.defaultFlags,
    });

    newTab.on(events.done, this.onTabClose.bind(this, targetId));

    return newTab;
  }

  public onTabClose(targetId: string): void {
    this.cdp.Target.closeTarget({ targetId });
    this.activeTabs--;
    this.jobsComplete++;
    log(
      `chrome on ${this.port} tab ${targetId} has closed. active tabs: ${this
        .activeTabs}, completed jobs: ${this.jobsComplete}`,
    );
  }

  public async quit(): Promise<void> {
    log(`closing chrome ${this.port}, completed jobs: ${this.jobsComplete}`);
    this.activeTabs = 0;
    await this.cdp.close();
    return this.kill();
  }

  public setExpired(): void {
    log(
      `chrome on ${this.port} has been set expired, active tabs: ${this
        .activeTabs}`,
    );
    this.isExpired = true;
  }

  public isIdle(): boolean {
    return this.activeTabs === 0;
  }

  public isFull(): boolean {
    return this.maxActiveTabs === this.activeTabs || this.isExpired;
  }

  public getIsExpired(): boolean {
    return this.isExpired;
  }

  public getJobsComplete(): number {
    return this.jobsComplete;
  }
}
