import * as fs from 'fs';
import * as _ from 'lodash';
import * as chromeLauncher from 'lighthouse/chrome-launcher/chrome-launcher';
import * as CDP from 'chrome-remote-interface';

export interface chromeOptions {
  headless?: boolean
  disableGpu?: boolean
  hideScrollbars?: boolean
}

export interface navigateOpts {
  onload?: boolean
}

export default class {
  readonly chromeBootOptions: chromeOptions;
  private chrome: any;

  public busy: boolean;
  public jobsComplete: number;
  public port: number;

  constructor(chromeBootOptions: chromeOptions | undefined) {
    this.busy = false;
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

    // Boot Chrome
    const browser = await chromeLauncher.launch({ chromeFlags });
    console.info(`CHROME Launched: ${chromeFlags.join(' ')} :${browser.port}`);

    this.port = browser.port;

    const cdp = await CDP({ port: browser.port });

    await Promise.all([cdp.Page.enable(), cdp.Runtime.enable()]);

    this.chrome = cdp;
  }

  public async navigate(url: string, opts: navigateOpts = { onload: true }): Promise<void> {
    this.chrome.busy = true;
    await this.chrome.Page.navigate({ url });

    if (opts.onload) {
      await this.chrome.Page.loadEventFired();
      return;
    }

    return;
  }

  public async evaluate(expression: string): Promise<any> {
    this.chrome.busy = true;

    return this.chrome.Runtime.evaluate({ expression });
  }

  public async screenShot(filePath: string) {
    this.chrome.busy = true;

    const base64Image = await this.chrome.Page.captureScreenshot();
    const buffer = new Buffer(base64Image.data, 'base64');

    return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
  }

  public async setWindowSize(width:number, height:number): Promise<any> {
    this.chrome.busy = true;

    return this.chrome.Emulation.setVisibleSize({ width: width, height: height });
  }

  public done(): void {
    this.busy = false;
    this.jobsComplete++;
  }

  public async destroy(): Promise<void> {
    await this.chrome.close();
  }

  public getBusy(): boolean {
    return this.chrome.busy;
  }
}
