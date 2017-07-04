import * as fs from 'fs';
import * as _ from 'lodash';
import * as chromeLauncher from 'chrome-launcher';
import * as CDP from 'chrome-remote-interface';
import * as path from 'path';
import * as debug from 'debug';
import { EventEmitter } from 'events';

const events = {
  done: 'done',
};

const log = debug('chrome');

export interface chromeOptions {
  [propName: string]: boolean | undefined;
}

export interface customOptions {
  maxActiveTabs?: number;
}

export interface navigateOpts {
  onload?: boolean
}

export type triggerEvents =
  'click' |
  'mousedown' |
  'mouseup' |
  'mouseover' |
  'touchstart' |
  'touchend' |
  'focus' |
  'touchcancel' |
  'touchmove' |
  'change' |
  'blur' |
  'select'
;

export class ChromeTab extends EventEmitter {
  private tab: any;
  private active: boolean;

  constructor(tab: any) {
    super();
    this.active = true;
    this.tab = tab;
  }

  public async navigate(url: string, opts: navigateOpts = { onload: true }): Promise<void> {
    log(`navigating to ${url}`);
    await this.tab.Page.navigate({ url });

    if (opts.onload) {
      await this.tab.Page.loadEventFired();
      return;
    }

    return;
  }

  public async evaluate(expression: Function, ...args): Promise<any> {
    const stringifiedArgs = args.map((arg) => JSON.stringify(arg)).join(',');
    const script = `(${expression.toString()})(${stringifiedArgs})`;
    
    log(`executing script: ${script}`);
    
    return this.tab.Runtime.evaluate({ expression: script, returnValue: true });
  }

  private async getSelectorId(selector: string): Promise<number | null> {
    log(`getting selector '${selector}'`);
    const document = await this.tab.DOM.getDocument();

    const { nodeId } = await this.tab.DOM.querySelector({
      nodeId: document.root.nodeId,
      selector,
    });

    return nodeId;
  }

  public async screenShot(filePath: string): Promise<any> {
    if (!path.isAbsolute(filePath)) {
      throw new Error(`Filepath is not absolute: ${filePath}`);
    }
    log(`capturing screenshot ${filePath}`);

    const base64Image = await this.tab.Page.captureScreenshot();
    const buffer = new Buffer(base64Image.data, 'base64');

    return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
  }

  public async pdf(filePath: string): Promise<any> {
    if (!path.isAbsolute(filePath)) {
      throw new Error(`Filepath is not absolute: ${filePath}`);
    }
    log(`capturing PDF ${filePath}`);

    const base64Image = await this.tab.Page.printToPDF();
    const buffer = new Buffer(base64Image.data, 'base64');

    return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
  }

  public async setWindowSize(width:number, height:number): Promise<any> {
    log(`setting window size ${width}x${height}`);

    return this.tab.Emulation.setVisibleSize({ width: width, height: height });
  }

  public async exists(selector: string): Promise<boolean> {
    log(`checking if '${selector}' exists`);
    
    return !!await this.getSelectorId(selector);
  }

  public async getHTML(selector: string): Promise<string | null> {
    log(`getting '${selector}' HTML`);

    const nodeId = await this.getSelectorId(selector);

    if (!nodeId) {
      return null;
    }

    const { outerHTML } = await this.tab.DOM.getOuterHTML({ nodeId });

    return outerHTML;
  }

  public async trigger(eventName: triggerEvents, selector: string): Promise<any> {
    log(`triggering '${eventName}' on '${selector}'`);
    let eventClass = '';

    switch (eventName) {
      case 'click':
      case 'mousedown':
      case 'mouseup':
      case 'mouseover':
        eventClass = 'MouseEvents';
        break;

      case 'touchstart':
      case 'touchend':
      case 'touchcancel':
      case 'touchmove':
        eventClass = 'TouchEvents';
        break;

      case 'focus':
      case 'change':
      case 'blur':
      case 'select':
        eventClass = 'HTMLEvents';
        break;

      default:
        throw `chrome#trigger: Couldn't handle event ${eventName} on selector ${selector}.`;
    }

    const expression = function(selector, eventName, eventClass) {
      const node = document.querySelector(selector);
      const doc = node && node.ownerDocument ? node.ownerDocument : node;
      const e = doc && doc.createEvent(eventClass);
      e.initEvent(eventName, true);
      e.synthetic = true;
      node.dispatchEvent(e, true);
    };

    return this.evaluate(expression, selector, eventName, eventClass);
  }

  public done(): void {
    if (this.active) {
      log(`clearing tab`);
      this.active = false;
      this.tab = null;
      this.emit(events.done);
    }
  }
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

    log(`launching with args ${chromeFlags.join(' ')}`);

    // Boot Chrome
    const browser = await chromeLauncher.launch({ chromeFlags });
    const cdp = await CDP({ target: `ws://localhost:${browser.port}/devtools/browser` });

    log(`launched on port ${browser.port}`);

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

    const tab = new ChromeTab(newTab);

    tab.on(events.done, this.onTabClose);

    this.activeTabs++;
    return tab;
  }

  public onTabClose(): void {
    log(`tab closed`);
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
    const isBusy:boolean = this.maxActiveTabs === this.activeTabs;

    log(`instance ${isBusy ? 'still has' : 'has no'} capacity`);

    return isBusy;
  }

  public getIsExpired(): boolean {
    return this.isExpired;
  }
}
