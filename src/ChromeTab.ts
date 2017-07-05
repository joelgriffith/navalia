import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import * as debug from 'debug';

const log = debug('navalia:chrome-tab');

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

export interface navigateOpts {
  onload?: boolean
}

export const events = {
  done: 'done',
};

export class ChromeTab extends EventEmitter {
  private tab: any;
  private active: boolean;
  private targetId: string;

  constructor(tab: any, targetId: string) {
    super();
    this.active = true;
    this.tab = tab;
    this.targetId = targetId;
  }

  private async getSelectorId(selector: string): Promise<number | null> {
    const document = await this.tab.DOM.getDocument();

    const { nodeId } = await this.tab.DOM.querySelector({
      nodeId: document.root.nodeId,
      selector,
    });

    return nodeId;
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

  public async screenshot(filePath: string): Promise<any> {
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

  public async size(width:number, height:number): Promise<any> {
    log(`setting window size ${width}x${height}`);

    return this.tab.Emulation.setVisibleSize({ width: width, height: height });
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

    const { outerHTML } = await this.tab.DOM.getOuterHTML({ nodeId });

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

  public async type(selector:string, value:string) {
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

  public async visible(selector: string): Promise<void> {
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
    if (this.active) {
      log(`closing ${this.targetId}`);
      this.active = false;
      this.tab = null;
      this.emit(events.done, this.targetId);
    }
  }
}
