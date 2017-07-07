import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import * as debug from 'debug';
import * as chrome from './util/chrome';

const log = debug('navalia:chrome');

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

export interface options {
  flags: chrome.flags,
  cdp: chrome.cdp,
}

export interface navigateOpts {
  onload?: boolean
}

export const events = {
  done: 'done',
};

export class Chrome extends EventEmitter {
  private cdp: chrome.cdp;
  private kill: () => Promise<{}>;
  private flags: chrome.flags;

  constructor(options) {
    super();
    
    if (options.cdp) {
      this.cdp = options.cdp;
    }

    if (options.flags) {
      this.flags = options.flags;
    }
  }

  private async getSelectorId(selector: string): Promise<number | null> {
    const document = await this.cdp.DOM.getDocument();

    const { nodeId } = await this.cdp.DOM.querySelector({
      nodeId: document.root.nodeId,
      selector,
    });

    return nodeId;
  }

  private async boot(): Promise<void> {
    if (this.cdp) {
      return;
    }
    log(`starting chrome`);
    const { browser, cdp } = await chrome.launch(this.flags);

    this.kill = browser.kill;
    this.cdp = cdp;

    return;
  }

  private async trigger(eventName: triggerEvents, selector: string): Promise<any> {
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

  public async navigate(url: string, opts: navigateOpts = { onload: true }): Promise<void> {
    await this.boot();

    log(`navigating to ${url}`);

    await this.cdp.Page.navigate({ url });

    if (opts.onload) {
      await this.cdp.Page.loadEventFired();
      return;
    }

    return;
  }

  public async evaluate(expression: Function, ...args): Promise<any> {
    const stringifiedArgs = args.map((arg) => JSON.stringify(arg)).join(',');
    const script = `(${expression.toString()})(${stringifiedArgs})`;
    
    log(`executing script: ${script}`);
    
    return this.cdp.Runtime.evaluate({ expression: script, returnValue: true });
  }

  public async screenshot(filePath: string): Promise<any> {
    if (!path.isAbsolute(filePath)) {
      throw new Error(`Filepath is not absolute: ${filePath}`);
    }
    log(`capturing screenshot ${filePath}`);

    const base64Image = await this.cdp.Page.captureScreenshot();
    const buffer = new Buffer(base64Image.data, 'base64');

    return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
  }

  public async pdf(filePath: string): Promise<any> {
    if (!path.isAbsolute(filePath)) {
      throw new Error(`Filepath is not absolute: ${filePath}`);
    }
    log(`capturing PDF ${filePath}`);

    const base64Image = await this.cdp.Page.printToPDF();
    const buffer = new Buffer(base64Image.data, 'base64');

    return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
  }

  public async size(width:number, height:number): Promise<any> {
    log(`setting window size ${width}x${height}`);

    return this.cdp.Emulation.setVisibleSize({ width: width, height: height });
  }

  public async exists(selector: string): Promise<boolean> {
    log(`checking if '${selector}' exists`);
    
    return !!await this.getSelectorId(selector);
  }

  public async html(selector: string): Promise<string | null> {
    log(`getting '${selector}' HTML`);

    const nodeId = await this.getSelectorId(selector);

    if (!nodeId) {
      return null;
    }

    const { outerHTML } = await this.cdp.DOM.getOuterHTML({ nodeId });

    return outerHTML;
  }

  public async click(selector: string): Promise<void> {
    log(`clicking '${selector}'`);
    return this.trigger('click', selector);
  }

  public async focus(selector: string): Promise<void> {
    log(`focusing '${selector}'`);
    return this.trigger('focus', selector);
  }

  public async type(selector:string, value:string): Promise<void> {
    log(`typing'${value}' into '${selector}'`);
    return this.evaluate((selector, value) => {
      var element = document.querySelector(selector);
      if (element) {
        element.value = value;
      }
    }, selector, value);
  }

  public async check(selector:string): Promise<void> {
    log(`checking checkbox '${selector}'`);
    return this.evaluate((selector) => {
      var element = document.querySelector(selector);
      if (element) {
        element.checked = true;
      }
    }, selector);
  }

  public async uncheck(selector:string): Promise<void> {
    log(`un-checking checkbox '${selector}'`);
    return this.evaluate((selector) => {
      var element = document.querySelector(selector);
      if (element) {
        element.checked = false;
      }
    }, selector);
  }

  public async select(selector: string, option:string): Promise<void> {
    log(`selecting option '${option}' in '${selector}'`);
    return this.evaluate((selector) => {
      var element = document.querySelector(selector);
      if (element) {
        element.value = option;
      }
    }, selector);
  }

  public async visible(selector: string): Promise<boolean> {
    log(`seeing if '${selector}' is visible`);
    return this.evaluate((selector) => {
      var element = document.querySelector(selector);
      if (element) {
        return (element.offsetWidth > 0 && element.offsetHeight > 0);
      }
      else return false;
    }, selector);
  }

  public async wait(time: number): Promise<object> {
    log(`waiting ${time} ms`);
    return new Promise((resolve) => { 
      setTimeout(() => resolve(), time);
    });
  }

  public done(): void {
    log(`finished`);

    if (this.kill) {
      log(`closing chrome`);
      this.kill();
    }

    this.emit(events.done);
  }
}
