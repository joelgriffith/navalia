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
  remote?: chromeUtil.remote;
  timeout?: number;
  username?: string;
  password?: string;
}

export interface domOpts {
  wait?: boolean;
  timeout?: number;
}

const defaultDomOpts: domOpts = {
  wait: true,
};

export class Chrome extends EventEmitter {
  private username: string;
  private password: string;
  private cdp?: chromeUtil.cdp;
  private flags?: chromeUtil.flags;
  private remote?: chromeUtil.remote;
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
    this.username = opts.username || '';
    this.password = opts.password || '';
    this.remote = opts.remote;
  }

  private async getChromeCDP(): Promise<chromeUtil.cdp> {
    if (this.cdp) {
      return this.cdp;
    }

    log(
      `:getChromeCDP() > ${this.remote
        ? `connecting to chrome at ${this.remote.host} on :${this.remote.port}`
        : `starting chrome`}`,
    );

    const { browser, cdp } = await chromeUtil.launch(
      this.flags || chromeUtil.defaultFlags,
      false,
      this.remote,
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
    // If supplying a number, we assume that
    // you want to wait that number in MS before
    // executing futher
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
          if (params.documentURL.includes(url.split('#')[0])) {
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

  public reload(ignoreCache: boolean): Chrome {
    this.actionQueue.push(async (): Promise<void> => {
      const cdp = await this.getChromeCDP();

      log(`:reload() > reloading the page`);

      return cdp.Page.reload({ ignoreCache });
    });

    return this;
  }

  public screenshot(selector?: string, opts: domOpts = defaultDomOpts): Chrome {
    this.actionQueue.push(async (): Promise<void | Buffer> => {
      const cdp = await this.getChromeCDP();
      let screenOpts = {};

      if (opts.wait && selector) {
        await this.waitNow(selector, opts.timeout);
      }

      log(
        `:screenshot() > saving screenshot${selector
          ? `of element '${selector}'`
          : 'page'}`,
      );

      if (selector) {
        const {
          root: { nodeId: documentNodeId },
        } = await cdp.DOM.getDocument();
        const { nodeId } = await cdp.DOM.querySelector({
          selector: selector,
          nodeId: documentNodeId,
        });

        const { model } = await cdp.DOM.getBoxModel({ nodeId });

        screenOpts = {
          clip: {
            x: model.content[0],
            y: model.content[1],
            width: model.width,
            height: model.height,
            scale: 1,
          },
        };
      }

      const base64Image = await cdp.Page.captureScreenshot(screenOpts);
      const buffer = new Buffer(base64Image.data, 'base64');

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

  public scroll(x: number = 0, y: number = 0): Chrome {
    this.actionQueue.push(async (): Promise<void> => {
      log(`:scroll() > scrolling to x = ${x} y = ${y}`);

      return this.evalNow(
        (x, y) => {
          return window.scrollTo(x, y);
        },
        x,
        y,
      );
    });

    return this;
  }

  public clear(): Chrome {
    this.actionQueue.push(async (): Promise<any[]> => {
      const cdp = await this.getChromeCDP();

      log(`:clear() > clearing cookies and cache`);

      return Promise.all([
        cdp.Network.clearBrowserCookies,
        cdp.Network.clearBrowserCache,
      ]);
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
        throw new Error(`:check() > selector ${selector} doesn't exist.`);
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

  public back(): Chrome {
    this.actionQueue.push(async (): Promise<void> => {
      log(`:back() > going back in history`);

      return this.evalNow(() => {
        return window.history.back();
      });
    });

    return this;
  }

  public forward(): Chrome {
    this.actionQueue.push(async (): Promise<void> => {
      log(`:forward() > going forward in history`);

      return this.evalNow(() => {
        return window.history.forward();
      });
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

  public auth(username: string = '', password: string = ''): Chrome {
    this.actionQueue.push(async () => {
      log(
        `:auth() > using username '${username}' and password '${password}' for auth requests`,
      );
      const cdp = await this.getChromeCDP();
      await cdp.Network.setRequestInterceptionEnabled({ enabled: true });

      cdp.Network.requestIntercepted(params => {
        cdp.Network.continueInterceptedRequest({
          interceptionId: params.interceptionId,
          authChallengeResponse: params.authChallenge
            ? {
                username: username,
                password: password,
                response: 'ProvideCredentials',
              }
            : undefined,
        });
      });
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
    const results: any[] = [];
    const actions = this.actionQueue.map((handler: () => Promise<any>) => ({
      handler,
      retries: 1,
    }));

    return new Promise((resolve, reject) => {
      log(`:then() > Executing ${this.actionQueue.length} actions`);
      const executePromiseAtIndex = idx => {
        return actions[idx]
          .handler()
          .then(res => {
            const nextIndex = idx + 1;
            results.push(res);
            if (!actions[nextIndex]) {
              this.actionQueue = []; // Drain the queue before resolving
              return resolve(
                handler(results.length === 1 ? results[0] : results),
              );
            }
            return executePromiseAtIndex(nextIndex);
          })
          .catch(error => {
            if (!actions[idx].retries) {
              return reject(error);
            }
            log(
              `:WARN > Retrying ${actions[idx]
                .retries} time(s) due to issue: '${error}'`,
            );
            actions[idx] = {
              retries: actions[idx].retries - 1,
              handler: actions[idx].handler,
            };
            return executePromiseAtIndex(idx);
          });
      };
      executePromiseAtIndex(0);
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
