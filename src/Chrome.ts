import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import * as debug from 'debug';
import * as chromeUtil from './util/chrome';

const log = debug('navalia:chrome');

// 10 second default timeout
const defaultTimeout = 1000 * 10;

type triggerEvents =
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

export interface httpRequest {
  url: string,
  method: string,
  headers: object,
  postData: string,
}

export interface options {
  flags?: chromeUtil.flags,
  cdp?: chromeUtil.cdp,
}

export interface navigateOpts {
  onload?: boolean
  coverage?: boolean
}

export const events = {
  done: 'done',
};

export const pageloadOpts = {
  onload: true,
  coverage: false,
};

function waitForElement(selector, timeout) {
  return new Promise((resolve, reject) => {
    const timeOutId = setTimeout(() => {
      reject(`Selector "${selector}" failed to appear in ${timeout} ms`);
    }, timeout);
    const observer = new MutationObserver(function (_mutations, observation) {
      const found = document.querySelector(selector);
      if (found) {
        observation.disconnect();
        clearTimeout(timeOutId);
        return resolve();
      }
    });

    // start observing
    observer.observe(document, {
      childList: true,
      subtree: true
    });
  });
}

export class Chrome extends EventEmitter {
  private cdp?: chromeUtil.cdp;
  private flags?: chromeUtil.flags;
  private styleSheetsLoaded: any[];
  private kill: () => Promise<{}>;

  constructor(opts: options = {}) {
    super();

    this.cdp = opts.cdp;
    this.flags = opts.flags || chromeUtil.defaultFlags;
    this.styleSheetsLoaded = [];
  }

  private async getChromeCDP(): Promise<chromeUtil.cdp> {
    if (this.cdp) {
      return this.cdp;
    }

    log(`:getChromeCDP() > starting chrome`);

    const { browser, cdp } = await chromeUtil.launch(this.flags || chromeUtil.defaultFlags);

    log(`:getChromeCDP() > chrome launched on port ${browser.port}`);

    this.kill = browser.kill;
    this.cdp = cdp;

    return cdp;
  }

  private async getSelectorId(selector: string): Promise<number | null> {
    const cdp = await this.getChromeCDP();

    const document = await cdp.DOM.getDocument();

    const { nodeId } = await cdp.DOM.querySelector({
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

  private async runScript(script: string, async: boolean = false): Promise<any> {
    const cdp = await this.getChromeCDP();

    return await cdp.Runtime.evaluate({
      expression: script,
      returnByValue: true,
      awaitPromise: async,
    });
  }

  private async simulateKeyPress(type:string = 'char', key: string | null = null, modifiers:number = 0): Promise<any> {
    const cdp = await this.getChromeCDP();

    await cdp.Input.dispatchKeyEvent({
      type,
      modifiers,
      text: key
    });
  }

  public async goto(url: string, opts: navigateOpts = pageloadOpts): Promise<void> {
    const cdp = await this.getChromeCDP();

    const waitForPageload = opts.onload === undefined ? true : opts.onload;
    const runCoverage = opts.coverage === undefined ? false : opts.coverage;

    if (runCoverage) {
      log(`:goto() > gathering coverage for ${url}`);
      await cdp.Profiler.enable();
      await cdp.Profiler.startPreciseCoverage();
      await cdp.CSS.startRuleUsageTracking();

      cdp.CSS.styleSheetAdded((param) => {
        this.styleSheetsLoaded.push(param.header);
      });
    }

    log(`:goto() > going to ${url}`);

    await cdp.Page.navigate({ url });

    if (waitForPageload) {
      log(`:goto() > waiting for pageload on ${url}`);
      await cdp.Page.loadEventFired();
    }

    return;
  }

  public async evaluate(expression: Function, ...args): Promise<any> {
    // Assume scripts are async, and if not wrap the result in a resolve calls
    const script = `
      (() => {
        const result = (${String(expression)}).apply(null, ${JSON.stringify(args)});
        if (result.then) {
          result.catch((error) => { throw new Error(error); });
          return result;
        }
        return Promise.resolve(result);
      })();
    `;

    log(`:evaluate() > executing script: ${script}`);

    // Always eval scripts as if they were async
    const response = await this.runScript(script, true);

    if (response) {
      if (response.exceptionDetails) {
        return new Error(
          response.exceptionDetails.exception.description ||
          response.exceptionDetails.text
        );
      }

      if (response.result && response.result.value) {
        return response.result.value;
      }
    }

    return null;
  }

  public async screenshot(filePath?: string): Promise<void | Buffer> {
    const cdp = await this.getChromeCDP();

    log(`:screenshot() > saving screenshot to ${filePath}`);

    const base64Image = await cdp.Page.captureScreenshot();
    const buffer = new Buffer(base64Image.data, 'base64');

    if (filePath) {
      if (!path.isAbsolute(filePath)) {
        throw new Error(`Filepath is not absolute: ${filePath}`);
      }

      return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
    }

    return buffer;
  }

  public async pdf(filePath: string): Promise<any> {
    if (!path.isAbsolute(filePath)) {
      throw new Error(`Filepath is not absolute: ${filePath}`);
    }
    const cdp = await this.getChromeCDP();

    log(`:pdf() > saving PDF to ${filePath}`);

    const base64Image = await cdp.Page.printToPDF();
    const buffer = new Buffer(base64Image.data, 'base64');

    return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
  }

  public async size(width:number, height:number): Promise<any> {
    const cdp = await this.getChromeCDP();

    log(`:size() > setting window size to ${width}x${height}`);

    await cdp.Emulation.setVisibleSize({ width, height });
    return cdp.Emulation.setDeviceMetricsOverride({
      width,
      height,
      deviceScaleFactor: 0,
      mobile: false,
      fitWindow: true,
    });
  }

  public async exists(selector: string): Promise<boolean> {
    log(`:exists() > checking if '${selector}' exists`);
    
    return !!await this.getSelectorId(selector);
  }

  public async html(selector: string = 'html'): Promise<string | null> {
    const cdp = await this.getChromeCDP();

    log(`:html() > getting '${selector}' HTML`);

    const nodeId = await this.getSelectorId(selector);

    if (!nodeId) {
      return null;
    }

    const { outerHTML } = await cdp.DOM.getOuterHTML({ nodeId });

    return outerHTML;
  }

  public async fetch(...args): Promise<any> {
    const cdp = await this.getChromeCDP();

    log(`:fetch() > fetching resource with args: ${JSON.stringify(args)}`)
    
    let requestFound = false;
    let requestHasResponded = false;
    let requestId = null;
    let response = {};

    // Might move these into a private helper...
    cdp.Network.requestWillBeSent((params) => {
      if (requestFound) return;

      if (params.request.url === args[0]) {
        requestFound = true;
        requestId = params.requestId;
      }
    });

    cdp.Network.loadingFailed((params) => {
      if (requestHasResponded) return;

      if (params.requestId === requestId) {
        response = Object.assign({}, response, {
          error: params.errorText,
        });
      }
    });

    cdp.Network.responseReceived((params) => {
      if (requestHasResponded) return;

      if (params.requestId === requestId) {
        requestHasResponded = true;
        response = params.response;
      }
    });

    return new Promise(async(resolve) => {
      const body = await this.evaluate(
        (...fetchArgs) => {
          return fetch.apply(null, fetchArgs).then((res) => {
            const contentType = res.headers.get('content-type');

            if (!res.ok) {
              throw (res.statusText || res.status);
            }

            if (contentType && contentType.indexOf('application/json') !== -1) {
              return res.json();
            }

            return res.text();
          }).catch(() => {
            return null;
          });
        },
        ...args
      );

      return resolve(Object.assign({}, response, body ? { body } : null));
    });
  }

  public async save(filePath: string): Promise<boolean> {
    if (!path.isAbsolute(filePath)) {
      throw new Error(`Filepath is not absolute: ${filePath}`);
    }
    log(`:save() > saving page HTML to ${filePath}`);

    const html = await this.html();

    try {
      fs.writeFileSync(filePath, html);
      log(`:save() > page HTML saved successfully to ${filePath}`);
      return true;
    } catch (error) {
      log(`:save() > page HTML failed ${error.message}`);
      return false;
    }
  }

  public async click(selector: string): Promise<void> {
    log(`:click() > clicking '${selector}'`);

    return this.trigger('click', selector);
  }

  public async focus(selector: string): Promise<void> {
    const cdp = await this.getChromeCDP();

    log(`:focus() > focusing '${selector}'`);

    const { root: { nodeId }} = await cdp.DOM.getDocument();
    const { nodeId: foundNode } = await cdp.DOM.querySelector({ selector, nodeId });

    return cdp.DOM.focus({ nodeId: foundNode });
  }

  public async type(selector:string, value:string): Promise<{}> {
    log(`:type() > typing'${value}' into '${selector}'`);

      // Focus on the selector
    await this.focus(selector);

    const keys = value.split('') || [];

    return Promise.all(
      keys.map(async (key) => this.simulateKeyPress('char', key))
    );
  }

  public async check(selector:string): Promise<void> {
    log(`:check() > checking checkbox '${selector}'`);

    return this.evaluate((selector) => {
      var element = document.querySelector(selector);
      if (element) {
        element.checked = true;
      }
    }, selector);
  }

  public async uncheck(selector:string): Promise<void> {
    log(`:uncheck() > un-checking checkbox '${selector}'`);

    return this.evaluate((selector) => {
      var element = document.querySelector(selector);
      if (element) {
        element.checked = false;
      }
    }, selector);
  }

  public async select(selector: string, option:string): Promise<void> {
    log(`:select() > selecting option '${option}' in '${selector}'`);

    return this.evaluate((selector) => {
      var element = document.querySelector(selector);
      if (element) {
        element.value = option;
      }
    }, selector);
  }

  public async visible(selector: string): Promise<boolean> {
    log(`:visible() > seeing if '${selector}' is visible`);

    return this.evaluate((selector) => {
      var element = document.querySelector(selector);
      if (element) {
        let style;
        try {
          style = window.getComputedStyle(element);
        } catch (e) {
          return false;
        }
        if (style.visibility === 'hidden' || style.display === 'none') {
          return false
        }
        if (style.display === 'inline' || style.display === 'inline-block') {
          return true
        }
        return (element.offsetWidth > 0 && element.offsetHeight > 0);
      }
      return false;
    }, selector);
  }

  public async wait(waitParam: number | string): Promise<any> {
    if (typeof waitParam === 'number') {
      log(`:wait() > waiting ${waitParam} ms`);

      return new Promise((resolve) => { 
        setTimeout(() => resolve(), waitParam);
      });
    }

    log(`:wait() > waiting for selector "${waitParam}" to be inserted`);

    return this.evaluate(waitForElement, waitParam, defaultTimeout);
  }

  public async inject(src: string): Promise<boolean> {
    const fileContents = fs.readFileSync(src, { encoding: 'utf-8' });
    const extension = path.extname(src);

    if (extension === '.js') {
      log(`:inject() > injecting JavaScript file from ${src}`);
      await this.runScript(fileContents);
      return true;
    }

    if (extension === '.css') {
      log(`:inject() > injecting CSS file from ${src}`);
      const cssInjectScript = function(content) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.innerHTML = content;
        document.body.appendChild(link);
      };
      await this.evaluate(cssInjectScript, fileContents);
      return true;
    }

    log(`:inject() > Unknown extension ${extension}`);

    return false;
  }

  public async pageload(): Promise<void> {
    const cdp = await this.getChromeCDP();

    log(`:pageload() > waiting for pageload to be called`);

    return cdp.Page.loadEventFired();
  }

  public async coverage(src: string): Promise<{ total: number, unused: number, percentUnused: number } | Error> {
    const cdp = await this.getChromeCDP();
    log(`:coverage() > getting coverage stats for ${src}`);

    const jsCoverages = await cdp.Profiler.takePreciseCoverage();
    const cssCoverages = await cdp.CSS.stopRuleUsageTracking();
    console.log(cssCoverages);
    await cdp.Profiler.stopPreciseCoverage();

    const scriptCoverage = jsCoverages.result.find((scriptCoverage) => scriptCoverage.url === src);

    if (!scriptCoverage) {
      log(`:coverage() > ${src} not found on the page.`);
      return new Error(`Couldn't locat script ${src} on the page.`);
    }

    if (scriptCoverage && scriptCoverage.functions && scriptCoverage.functions.length) {
      const coverageData = scriptCoverage.functions.reduce((fnAccum, coverageStats) => {
        const functionStats = coverageStats.ranges.reduce((rangeAccum, range) => {
          return {
            total: range.endOffset > rangeAccum.total ? range.endOffset : rangeAccum.total,
            unused: rangeAccum.unused + (range.count === 0 ? (range.endOffset - range.startOffset) : 0),
          };
        }, {
          total: 0,
          unused: 0,
        });

        return {
          total: functionStats.total > fnAccum.total ? functionStats.total : fnAccum.total,
          unused: fnAccum.unused + functionStats.unused,
        };
      }, {
        total: 0,
        unused: 0,
      });
      
      return {
        ...coverageData,
        percentUnused: coverageData.unused / coverageData.total,
      }
    }

    return new Error(`Couldn't parse code coverge for script ${src}`);
  }

  public done(): void {
    log(`:done() > finished`);

    if (this.kill) {
      log(`:done() > closing chrome`);
      this.kill();
    }

    this.emit(events.done);
  }
}
