import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import * as debug from 'debug';

import * as chromeUtil from './util/chrome';
import { getPageURL, waitForElement, click, html } from './util/dom';

const log = debug('navalia:chrome');

export interface chromeConstructorOpts {
  flags?: chromeUtil.flags;
  cdp?: chromeUtil.cdp;
  timeout?: number;
}

export interface domOpts {
  wait?: boolean;
  timeout?: number;
}

const defaultDomOpts: domOpts = {
  wait: true,
};

export class Chrome extends EventEmitter {
  private cdp?: chromeUtil.cdp;
  private flags?: chromeUtil.flags;
  private kill: () => Promise<{}>;
  private defaultTimeout: number;
  private frameId: string;
  private styleSheetsLoaded: any[];
  private actionQueue: any[];

  constructor(opts: chromeConstructorOpts = {}) {
    super();

    this.styleSheetsLoaded = [];
    this.actionQueue = [];

    this.cdp = opts.cdp;
    this.flags = opts.flags || chromeUtil.defaultFlags;
    this.defaultTimeout = opts.timeout || 1000;
    this.frameId = '';
  }

  private async getChromeCDP(): Promise<chromeUtil.cdp> {
    if (this.cdp) {
      return this.cdp;
    }

    log(`:getChromeCDP() > starting chrome`);

    const { browser, cdp } = await chromeUtil.launch(
      this.flags || chromeUtil.defaultFlags,
    );

    log(`:getChromeCDP() > chrome launched on port ${browser.port}`);

    this.kill = browser.kill;
    this.cdp = cdp;

    return cdp;
  }

  private async runScript(
    script: string,
    async: boolean = false,
  ): Promise<any> {
    const cdp = await this.getChromeCDP();

    return await cdp.Runtime.evaluate({
      expression: script,
      returnByValue: true,
      awaitPromise: async,
    });
  }

  private async simulateKeyPress(
    type: string = 'char',
    key: string | null = null,
    modifiers: number = 0,
  ): Promise<any> {
    const cdp = await this.getChromeCDP();

    await cdp.Input.dispatchKeyEvent({
      type,
      modifiers,
      text: key,
    });
  }

  private async evalNow(expression: Function, ...args): Promise<any> {
    // Assume scripts are async, and if not wrap the result in a resolve calls
    const script = `
      (() => {
        const result = (${String(expression)}).apply(null, ${JSON.stringify(
      args,
    )});
        if (result && result.then) {
          result.catch((error) => { throw new Error(error); });
          return result;
        }
        return Promise.resolve(result);
      })();
    `;

    log(`:evaluate() > executing function '${expression.name}' in Chrome`);

    // Always eval scripts as if they were async
    const response = await this.runScript(script, true);

    if (response && response.exceptionDetails) {
      throw new Error(
        response.exceptionDetails.exception.value ||
          response.exceptionDetails.exception.description,
      );
    }

    if (response && response.result) {
      return response.result.value;
    }

    return null;
  }

  private async waitNow(
    waitParam: number | string,
    timeout?: number,
  ): Promise<any> {
    if (typeof waitParam === 'number') {
      log(`:wait() > waiting ${waitParam} ms`);

      return new Promise(resolve => {
        setTimeout(() => resolve(), waitParam);
      });
    }

    timeout = timeout || this.defaultTimeout;

    log(
      `:wait() > waiting for selector "${waitParam}" a maximum of ${timeout}ms`,
    );

    await this.evalNow(waitForElement, waitParam, timeout);

    return true;
  }

  private async focusNow(
    selector: string,
    opts: domOpts = defaultDomOpts,
  ): Promise<boolean> {
    const cdp = await this.getChromeCDP();

    if (opts.wait) {
      await this.waitNow(selector, opts.timeout);
    }

    log(`:focus() > focusing '${selector}'`);

    const { root: { nodeId } } = await cdp.DOM.getDocument();
    const node = await cdp.DOM.querySelector({
      selector,
      nodeId,
    });

    if (!node) {
      throw new Error(
        `:focus() > Couldn't find element '${selector}' on the page.`,
      );
    }

    await cdp.DOM.focus({ nodeId: node.nodeId });

    return true;
  }

  private async resolveQueue(
    items: Function[],
    results: any[],
  ): Promise<any[]> {
    const promiseReduction = items.reduce((prevPromise, nextPromise, idx) => {
      return prevPromise
        .then(async res => {
          if (idx !== 0) {
            results.push(res);
          }
          return nextPromise();
        })
        .catch(async error => {
          log(`:WARN > Retrying once due to issue: '${error}'`);
          return items[idx]();
        });
    }, Promise.resolve());

    return promiseReduction.then(res => {
      results.push(res);
      return results;
    });
  }

  public goto(
    url: string,
    opts: {
      coverage: boolean;
      onload: boolean;
      timeout?: number;
    } = {
      onload: true,
      coverage: false,
    },
  ): Chrome {
    this.actionQueue.push(async (): Promise<any> => {
      const cdp = await this.getChromeCDP();

      const waitForPageload = opts.onload === undefined ? true : opts.onload;
      const runCoverage = opts.coverage === undefined ? false : opts.coverage;

      if (runCoverage) {
        log(`:goto() > gathering coverage for ${url}`);
        await cdp.Profiler.enable();
        await cdp.Profiler.startPreciseCoverage();
        await cdp.CSS.startRuleUsageTracking();

        cdp.CSS.styleSheetAdded(param => {
          this.styleSheetsLoaded.push(param.header);
        });
      }

      log(`:goto() > going to ${url}`);

      return new Promise(async (resolve, reject) => {
        let hasResolved = false;
        let requestId = null;
        const timeoutId = setTimeout(
          () => reject(`Goto failed to load in the timeout specified`),
          opts.timeout || this.defaultTimeout,
        );

        cdp.Network.requestWillBeSent(params => {
          if (requestId) return;
          if (params.documentURL.includes(url)) {
            requestId = params.requestId;
          }
        });

        cdp.Network.loadingFailed(params => {
          if (hasResolved) return;
          if (params.requestId === requestId) {
            hasResolved = true;
            clearTimeout(timeoutId);
            reject(params.errorText);
          }
        });

        cdp.Network.loadingFinished(async params => {
          if (hasResolved) return;
          if (params.requestId === requestId) {
            hasResolved = true;
            clearTimeout(timeoutId);
            if (waitForPageload) {
              log(`:goto() > waiting for pageload on ${url}`);
              await cdp.Page.loadEventFired();
            }
            resolve(await this.evalNow(getPageURL));
          }
        });

        const { frameId } = await cdp.Page.navigate({ url });
        this.frameId = frameId;
      });
    });

    return this;
  }

  public evaluate(expression: Function, ...args): Chrome {
    this.actionQueue.push(async (): Promise<any> => {
      return this.evalNow(expression, ...args);
    });

    return this;
  }

  public screenshot(filePath?: string): Chrome {
    this.actionQueue.push(async (): Promise<void | Buffer> => {
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
    });

    return this;
  }

  public pdf(filePath: string): Chrome {
    this.actionQueue.push(async (): Promise<void | Buffer> => {
      const cdp = await this.getChromeCDP();

      log(`:pdf() > saving PDF to ${filePath}`);

      const base64Image = await cdp.Page.printToPDF();
      const buffer = new Buffer(base64Image.data, 'base64');

      if (filePath) {
        if (!path.isAbsolute(filePath)) {
          throw new Error(`Filepath is not absolute: ${filePath}`);
        }

        return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
      }

      return buffer;
    });

    return this;
  }

  public size(width: number, height: number): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
      const cdp = await this.getChromeCDP();

      log(`:size() > setting window size to ${width}x${height}`);

      await cdp.Emulation.setVisibleSize({ width, height });
      await cdp.Emulation.setDeviceMetricsOverride({
        width,
        height,
        deviceScaleFactor: 0,
        mobile: false,
        fitWindow: true,
      });

      return true;
    });

    return this;
  }

  public exists(selector: string, opts: domOpts = defaultDomOpts): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
      if (opts.wait) {
        try {
          await this.waitNow(selector, opts.timeout);
        } catch (error) {
          return false;
        }
      }

      log(`:exists() > checking if '${selector}' exists`);

      return this.evalNow(selector => {
        const ele = document.querySelector(selector);
        return !!ele;
      }, selector);
    });

    return this;
  }

  public html(
    selector: string = 'html',
    opts: domOpts = defaultDomOpts,
  ): Chrome {
    this.actionQueue.push(async (): Promise<string | null> => {
      if (opts.wait) {
        await this.waitNow(selector, opts.timeout);
      }

      log(`:html() > getting '${selector}' HTML`);

      return this.evalNow(html, selector);
    });

    return this;
  }

  public text(
    selector: string = 'body',
    opts: domOpts = defaultDomOpts,
  ): Chrome {
    this.actionQueue.push(async (): Promise<string> => {
      if (opts.wait) {
        await this.waitNow(selector, opts.timeout);
      }

      log(`:text() > getting '${selector}' text`);

      return this.evalNow(function getText(selector) {
        const ele = document.querySelector(selector);
        if (!ele) {
          throw new Error(`:text() > selector ${selector} wasn't found.`);
        }
        return ele.textContent;
      }, selector);
    });

    return this;
  }

  public fetch(...args): Chrome {
    this.actionQueue.push(async (): Promise<any> => {
      const cdp = await this.getChromeCDP();

      log(`:fetch() > fetching resource with args: ${JSON.stringify(args)}`);

      let requestFound = false;
      let requestHasResponded = false;
      let requestId = null;
      let response = {};

      // Might move these into a private helper...
      cdp.Network.requestWillBeSent(params => {
        if (requestFound) return;

        if (params.request.url === args[0]) {
          requestFound = true;
          requestId = params.requestId;
        }
      });

      cdp.Network.loadingFailed(params => {
        if (requestHasResponded) return;

        if (params.requestId === requestId) {
          response = Object.assign({}, response, {
            error: params.errorText,
          });
        }
      });

      cdp.Network.responseReceived(params => {
        if (requestHasResponded) return;

        if (params.requestId === requestId) {
          requestHasResponded = true;
          response = params.response;
        }
      });

      return new Promise(async resolve => {
        const body = await this.evalNow((...fetchArgs) => {
          return fetch
            .apply(null, fetchArgs)
            .then(res => {
              const contentType = res.headers.get('content-type');

              if (!res.ok) {
                throw res.statusText || res.status;
              }

              if (
                contentType &&
                contentType.indexOf('application/json') !== -1
              ) {
                return res.json();
              }

              return res.text();
            })
            .catch(() => {
              return null;
            });
        }, ...args);

        return resolve(Object.assign({}, response, body ? { body } : null));
      });
    });

    return this;
  }

  public save(filePath?: string): Chrome {
    this.actionQueue.push(async (): Promise<boolean | string | null> => {
      const htmlText: string = await this.evalNow(html, 'html');

      log(`:save() > saving page HTML to ${filePath}`);

      if (filePath) {
        try {
          fs.writeFileSync(filePath, htmlText);
          log(`:save() > page HTML saved successfully to ${filePath}`);
          return true;
        } catch (error) {
          log(`:save() > page HTML failed ${error.message}`);
          return false;
        }
      }

      return htmlText;
    });

    return this;
  }

  public click(selector: string, opts: domOpts = defaultDomOpts): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
      if (opts.wait) {
        await this.waitNow(selector, opts.timeout);
      }

      log(`:click() > clicking '${selector}'`);

      return this.evalNow(click, selector);
    });

    return this;
  }

  public focus(selector: string, opts: domOpts = defaultDomOpts): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
      return this.focusNow(selector, opts);
    });

    return this;
  }

  public header(headerObj: { [headerName: string]: string }): Chrome {
    this.actionQueue.push(async (): Promise<{
      [headerName: string]: string;
    }> => {
      const cdp = await this.getChromeCDP();

      log(`:header() > applying ${JSON.stringify(headerObj)} to all requests`);

      await cdp.Network.setExtraHTTPHeaders({
        headers: { headerObj },
      });

      return headerObj;
    });

    return this;
  }

  public type(
    selector: string,
    value: string,
    opts: domOpts = defaultDomOpts,
  ): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
      if (opts.wait) {
        await this.waitNow(selector, opts.timeout);
      }

      // Focus on the selector
      await this.focusNow(selector, { wait: false });

      log(`:type() > typing text '${value}' into '${selector}'`);

      const keys = value.split('') || [];

      await Promise.all(
        keys.map(async key => this.simulateKeyPress('char', key)),
      );

      return true;
    });

    return this;
  }

  public check(selector: string, opts: domOpts = defaultDomOpts): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
      if (opts.wait) {
        await this.waitNow(selector, opts.timeout);
      }

      log(`:check() > checking checkbox '${selector}'`);

      return this.evalNow(selector => {
        var element = document.querySelector(selector);
        if (element) {
          element.checked = true;
          return true;
        }
        return false;
      }, selector);
    });

    return this;
  }

  public uncheck(selector: string, opts: domOpts = defaultDomOpts): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
      if (opts.wait) {
        await this.waitNow(selector, opts.timeout);
      }

      log(`:uncheck() > un-checking checkbox '${selector}'`);

      return this.evalNow(selector => {
        var element = document.querySelector(selector);
        if (!element) {
          throw new Error(`:uncheck() > Couldn't find '${selector}' on page.`);
        }
        element.checked = false;
        return true;
      }, selector);
    });

    return this;
  }

  public select(
    selector: string,
    option: string,
    opts: domOpts = defaultDomOpts,
  ): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
      if (opts.wait) {
        await this.waitNow(selector, opts.timeout);
      }

      log(`:select() > selecting option '${option}' in '${selector}'`);

      return this.evalNow(selector => {
        var element = document.querySelector(selector);
        if (element) {
          element.value = option;
          return true;
        }
        return false;
      }, selector);
    });

    return this;
  }

  public visible(selector: string, opts: domOpts = defaultDomOpts): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
      if (opts.wait) {
        await this.waitNow(selector, opts.timeout);
      }

      log(`:visible() > seeing if '${selector}' is visible`);

      return this.evalNow(selector => {
        var element = document.querySelector(selector);

        if (!element) {
          throw new Error(`:visible() > Couldn't find '${selector}' on page.`);
        }

        let style;
        try {
          style = window.getComputedStyle(element);
        } catch (e) {
          return false;
        }
        if (style.visibility === 'hidden' || style.display === 'none') {
          return false;
        }
        if (
          style.display === 'inline' ||
          style.display === 'inline-block' ||
          style.display === 'flex'
        ) {
          return true;
        }
        return element.offsetWidth > 0 && element.offsetHeight > 0;
      }, selector);
    });

    return this;
  }

  public wait(waitParam: number | string, timeout?: number): Chrome {
    this.actionQueue.push(async (): Promise<any> => {
      if (typeof waitParam === 'number') {
        log(`:wait() > waiting ${waitParam} ms`);

        return new Promise(resolve => {
          setTimeout(() => resolve(), waitParam);
        });
      }

      timeout = timeout || this.defaultTimeout;

      log(
        `:wait() > waiting for selector "${waitParam}" a maximum of ${timeout}ms`,
      );

      await this.evalNow(waitForElement, waitParam, timeout);

      return true;
    });

    return this;
  }

  public inject(src: string): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
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
        await this.evalNow(cssInjectScript, fileContents);
        return true;
      }

      throw new Error(`:inject() > Unknown extension ${extension}`);
    });

    return this;
  }

  public pageload(): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
      const cdp = await this.getChromeCDP();

      log(`:pageload() > waiting for pageload to be called`);

      await cdp.Page.loadEventFired();

      return true;
    });

    return this;
  }

  public cookie(name?: string, value?: string): Chrome {
    this.actionQueue.push(async (): Promise<any> => {
      const cdp = await this.getChromeCDP();

      log(
        `:cookie() > ${value
          ? `setting cookie ${name} to ${value}`
          : name ? `getting cookie ${name}` : `getting all cookies`}`,
      );

      const { cookies } = await cdp.Network.getAllCookies();

      if (value) {
        const url = await this.evalNow(() => window.location.href);
        const isSet = await cdp.Network.setCookie({ url, name, value });
        return isSet ? [{ name, value }] : null;
      }

      if (name) {
        const cookie = cookies.find(cookie => cookie.name === name);
        return cookie ? [{ name, value: cookie.value }] : null;
      }

      return cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
      }));
    });

    return this;
  }

  public attr(
    selector: string,
    attribute: string,
    opts: domOpts = defaultDomOpts,
  ): Chrome {
    this.actionQueue.push(async (): Promise<string | null> => {
      if (opts.wait) {
        await this.waitNow(selector, opts.timeout);
      }

      log(`:attr() > getting '${selector}' attribute '${attribute}'`);

      return this.evalNow(
        (selector, attribute) => {
          const ele = document.querySelector(selector);

          if (ele) {
            return ele.getAttribute(attribute);
          }

          return null;
        },
        selector,
        attribute,
      );
    });

    return this;
  }

  public coverage(src: string): Chrome {
    this.actionQueue.push(async (): Promise<{
      total: number;
      unused: number;
      percentUnused: number;
    }> => {
      const cdp = await this.getChromeCDP();

      log(`:coverage() > getting coverage stats for ${src}`);

      // JS and CSS have similar data-structs, but are
      // retrieved via different mechanisms
      const jsCoverages = await cdp.Profiler.takePreciseCoverage();
      const jsCoverage = jsCoverages.result.find(
        scriptCoverage => scriptCoverage.url === src,
      );

      const styleSheet = this.styleSheetsLoaded.find(
        css => css.sourceURL === src,
      );
      const { coverage: cssCoverages } = await cdp.CSS.takeCoverageDelta();

      const startingResults = { total: 0, unused: 0 };

      // Stop monitors
      await cdp.Profiler.stopPreciseCoverage();
      await cdp.CSS.stopRuleUsageTracking();

      if (!jsCoverage && !styleSheet) {
        throw new Error(`Couldn't locate script ${src} on the page.`);
      }

      if (styleSheet && styleSheet.styleSheetId) {
        const coverageCollection = cssCoverages.filter(
          coverage => coverage.styleSheetId === styleSheet.styleSheetId,
        );
        const usedInfo = coverageCollection.reduce(
          (rangeAccum, range) => {
            const total =
              range.endOffset > rangeAccum.total
                ? range.endOffset
                : rangeAccum.total;
            const used = range.used ? range.endOffset - range.startOffset : 0;

            return {
              total,
              used: rangeAccum.used + used,
            };
          },
          { total: 0, used: 0 },
        );

        return {
          total: usedInfo.total,
          unused: usedInfo.total - usedInfo.used,
          percentUnused: (usedInfo.total - usedInfo.used) / usedInfo.total,
        };
      }

      if (jsCoverage && jsCoverage.functions && jsCoverage.functions.length) {
        const coverageData = jsCoverage.functions.reduce(
          (fnAccum, coverageStats) => {
            const functionStats = coverageStats.ranges.reduce(
              (rangeAccum, range) => {
                return {
                  total:
                    range.endOffset > rangeAccum.total
                      ? range.endOffset
                      : rangeAccum.total,
                  unused:
                    rangeAccum.unused +
                    (range.count === 0
                      ? range.endOffset - range.startOffset
                      : 0),
                };
              },
              startingResults,
            );

            return {
              total:
                functionStats.total > fnAccum.total
                  ? functionStats.total
                  : fnAccum.total,
              unused: fnAccum.unused + functionStats.unused,
            };
          },
          startingResults,
        );

        return {
          ...coverageData,
          percentUnused: coverageData.unused / coverageData.total,
        };
      }

      throw new Error(`Couldn't parse code coverge for script ${src}`);
    });

    return this;
  }

  public async then(handler: (any) => any): Promise<any | void> {
    return new Promise(async (resolve, reject) => {
      try {
        const results = await this.resolveQueue(this.actionQueue, []);
        resolve(handler(results.length === 1 ? results[0] : results));
      } catch (error) {
        reject(error);
      }
      this.actionQueue = [];
      return null;
    });
  }

  public end(): Chrome {
    this.actionQueue.push(async (): Promise<boolean> => {
      await this.done();
      return true;
    });

    return this;
  }

  public done(): void {
    log(`:done() > finished`);

    this.actionQueue = [];

    if (this.kill) {
      log(`:done() > closing chrome`);
      this.kill();
    }

    this.emit('done');
  }
}
