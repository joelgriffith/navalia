import * as fs from 'fs';
import * as _ from 'lodash';
import * as chromeLauncher from 'lighthouse/chrome-launcher/chrome-launcher';
import * as CDP from 'chrome-remote-interface';
import * as path from 'path';

export interface chromeOptions {
  headless?: boolean
  disableGpu?: boolean
  hideScrollbars?: boolean
}

export interface navigateOpts {
  onload?: boolean
}

export default class {
  private chrome: any;
  private kill: Function;
  private isBusy: boolean;
  private isExpired: boolean;

  public chromeBootOptions: chromeOptions;
  public jobsComplete: number;
  public port: number;

  constructor(chromeBootOptions: chromeOptions | undefined) {
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

    // Boot Chrome
    const browser = await chromeLauncher.launch({ chromeFlags });

    this.port = browser.port;
    this.kill = browser.kill;

    const cdp = await CDP({ port: browser.port });

    await Promise.all([cdp.Page.enable(), cdp.Runtime.enable()]);

    this.chrome = cdp;
  }

  public async navigate(url: string, opts: navigateOpts = { onload: true }): Promise<void> {
    this.isBusy = true;
    await this.chrome.Page.navigate({ url });

    if (opts.onload) {
      await this.chrome.Page.loadEventFired();
      return;
    }

    return;
  }

  public async evaluate(expression: string): Promise<any> {
    this.isBusy = true;

    return this.chrome.Runtime.evaluate({ expression });
  }

  public async screenShot(filePath: string): Promise<any> {
    if (!path.isAbsolute(filePath)) {
      throw new Error(`Filepath is not absolute: ${filePath}`);
    }
    this.isBusy = true;

    const base64Image = await this.chrome.Page.captureScreenshot();
    const buffer = new Buffer(base64Image.data, 'base64');

    return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
  }

  public async pdf(filePath: string): Promise<any> {
    if (!path.isAbsolute(filePath)) {
      throw new Error(`Filepath is not absolute: ${filePath}`);
    }
    this.isBusy = true;

    const base64Image = await this.chrome.Page.printToPDF();
    const buffer = new Buffer(base64Image.data, 'base64');

    return fs.writeFileSync(filePath, buffer, { encoding: 'base64' });
  }

  public async setWindowSize(width:number, height:number): Promise<any> {
    this.isBusy = true;

    return this.chrome.Emulation.setVisibleSize({ width: width, height: height });
  }

  public done(): void {
    this.isBusy = false;
    this.jobsComplete++;
  }

  public async destroy(): Promise<void> {
    await this.chrome.close();
    this.kill();
  }

  public setExpired(): void {
    this.isExpired = true;
  }

  public getIsBusy(): boolean {
    return this.isBusy;
  }

  public getIsExpired(): boolean {
    return this.isExpired;
  }
}
