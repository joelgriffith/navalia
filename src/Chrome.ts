import * as fs from 'fs';
import * as _ from 'lodash';
import * as chromeLauncher from 'lighthouse/chrome-launcher/chrome-launcher';
import * as CDP from 'chrome-remote-interface';
import * as path from 'path';
import * as debug from 'debug';

const log = debug('chrome');

export interface chromeOptions {
  [propName: string]: boolean | undefined;
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

export class Chrome {
  private chrome: any;
  private kill: Function;
  private isBusy: boolean;
  private isExpired: boolean;

  public chromeBootOptions: chromeOptions;
  public jobsComplete: number;
  public port: number;

  constructor(chromeBootOptions: chromeOptions = {}) {
    this.isBusy = false;
    this.isExpired = false;
    this.jobsComplete = 0;
    this.chromeBootOptions ={
      headless: true,
      disableGpu: true,
      hideScrollbars: true,
      ...chromeBootOptions,
    };
  }

  public async launch(): Promise<void> {
    const chromeFlags = _.chain(this.chromeBootOptions)
      .pickBy((value) => value)
      .map((_value, key) => `--${_.kebabCase(key)}`)
      .value();

    log(`launching with args ${chromeFlags.join(' ')}`);

    // Boot Chrome
    const browser = await chromeLauncher.launch({ chromeFlags });

    this.port = browser.port;
    this.kill = browser.kill;

    const cdp = await CDP({ port: browser.port });

    // Enable all the crazy domains
    await Promise.all([
      cdp.Page.enable(),
      cdp.Runtime.enable(),
      cdp.Network.enable(),
      cdp.DOM.enable(),
      cdp.CSS.enable(),
    ]);

    log(`launched on port ${this.port}`);

    this.chrome = cdp;
  }

  public async navigate(url: string, opts: navigateOpts = { onload: true }): Promise<void> {
    log(`navigating to ${url}`);
    this.isBusy = true;
    await this.chrome.Page.navigate({ url });

    if (opts.onload) {
      await this.chrome.Page.loadEventFired();
      return;
    }

    return;
  }

  public async evaluate(expression: Function, ...args): Promise<any> {
    this.isBusy = true;

    const stringifiedArgs = args.map((arg) => JSON.stringify(arg)).join(',');
    const script = `(${expression.toString()})(${stringifiedArgs})`;
    
    log(`executing script: ${script}`);
    
    return this.chrome.Runtime.evaluate({ expression: script, returnValue: true });
  }

  private async getSelectorId(selector: string): Promise<number | null> {
    log(`getting selector '${selector}'`);
    this.isBusy = true;
    const document = await this.chrome.DOM.getDocument();

    const { nodeId } = await this.chrome.DOM.querySelector({
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
    this.isBusy = true;

    const base64Image = await this.chrome.Page.captureScreenshot();
    const buffer = new Buffer(base64Image.data, 'base64');

    return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
  }

  public async pdf(filePath: string): Promise<any> {
    if (!path.isAbsolute(filePath)) {
      throw new Error(`Filepath is not absolute: ${filePath}`);
    }
    log(`capturing PDF ${filePath}`);
    this.isBusy = true;

    const base64Image = await this.chrome.Page.printToPDF();
    const buffer = new Buffer(base64Image.data, 'base64');

    return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
  }

  public async setWindowSize(width:number, height:number): Promise<any> {
    log(`setting window size ${width}x${height}`);
    this.isBusy = true;

    return this.chrome.Emulation.setVisibleSize({ width: width, height: height });
  }

  public async exists(selector: string): Promise<boolean> {
    log(`checking if '${selector}' exists`);
    this.isBusy = true;
    
    return !!await this.getSelectorId(selector);
  }

  public async getHTML(selector: string): Promise<string | null> {
    log(`getting '${selector}' HTML`);
    this.isBusy = true;

    const nodeId = await this.getSelectorId(selector);

    if (!nodeId) {
      return null;
    }

    const { outerHTML } = await this.chrome.DOM.getOuterHTML({ nodeId });

    return outerHTML;
  }

  public async trigger(eventName: triggerEvents, selector: string): Promise<any> {
    log(`triggering '${eventName}' on '${selector}'`);
    this.isBusy = true;
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
    log(`cleaning up chrome`);
    this.isBusy = false;
    this.jobsComplete++;
  }

  public async destroy(): Promise<void> {
    log(`killing instance`);
    await this.chrome.close();
    this.kill();
  }

  public setExpired(): void {
    log(`instance has been marked expired`);
    this.isExpired = true;
  }

  public getIsBusy(): boolean {
    return this.isBusy;
  }

  public getIsExpired(): boolean {
    return this.isExpired;
  }
}
