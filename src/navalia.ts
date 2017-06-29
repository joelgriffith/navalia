import * as os from 'os';
import Chrome, { chromeOptions } from './chrome';

export interface clusterParams {
  numInstances?: number
  maxJobs?: number
  workerTTL?: number
  chromeOptions?: chromeOptions
  verbose?: boolean
}

export interface jobFunc {
  (chrome: Chrome): Promise<any>;
}

const isBusy = (chrome: Chrome): boolean => chrome.getIsBusy();
const notBusy = (chrome: Chrome): boolean => !isBusy(chrome);

export default class {
  private chromeInstances: Chrome[];
  private queueList: jobFunc[];
  numInstances: number;
  maxJobs: number;
  workerTTL: number;
  verbose: boolean;
  defaultChromeOptions: chromeOptions;

  constructor(opts: clusterParams = {}) {
    this.numInstances = opts.numInstances || os.cpus().length;
    this.maxJobs = opts.maxJobs || -1;
    this.workerTTL = opts.workerTTL || -1;
    this.defaultChromeOptions = opts.chromeOptions || {};
    this.verbose = opts.verbose || false;

    this.chromeInstances = [];
    this.queueList = [];
  }

  private log(...args): void {
    if (this.verbose) {
      console.info.apply(console, args);
    }
  }

  private destroy(chrome: Chrome): void {
    const instanceIndex = this.chromeInstances.indexOf(chrome);

    if (chrome.getIsBusy()) {
      chrome.setExpired();
      this.log(`CHROME:${chrome.port} > Instance is busy, marking for expiration when complete`);
      return;
    }

    if (instanceIndex === -1) {
      return;
    }

    // Destroy chrome instance
    chrome.destroy();

    // Remove it from the instances collection
    this.chromeInstances.splice(instanceIndex, 1);

    // Launch a new on in its place
    this.launchInstance(this.defaultChromeOptions);

    this.log(`CHROME:${chrome.port} > Closed`);
  }

  private async execute(chrome: Chrome | undefined, job: jobFunc | undefined): Promise<any> {
    if (!chrome || !job) {
      throw new Error(`#execute was called with no instance of Chrome or a Job`);
    }
    this.log(`CHROME:${chrome.port} > Starting Job `);

    await job(chrome);

    this.log(`CHROME:${chrome.port} > Job Complete, cleaning up`);

    chrome.done();

    if (chrome.getIsExpired()) {
      this.log(`CHROME:${chrome.port} > Instance has expired, closing`);
      this.destroy(chrome);
      return;
    }

    if (chrome.jobsComplete === this.maxJobs) {
      this.log(`CHROME:${chrome.port} > Maximum number of jobs completed, closing`);
      this.destroy(chrome);
      return;
    }

    if (this.queueList.length) {
      return this.execute(chrome, this.queueList.shift());
    }

    this.log(`CHROME:${chrome.port} > Queue is complete, waiting`);
  }

  public async startup(): Promise<void> {
    const startupPromise: Promise<Chrome>[] = [];

    this.log(`NAVALIA: Launching ${this.numInstances} Chrome Applications`)

    for (let i = 0; i < this.numInstances; i++) {
      startupPromise.push(this.launchInstance(this.defaultChromeOptions));
    }

    return Promise.all(startupPromise).then(() => this.log('NAVALIA: Ready'));
  }

  public async launchInstance(chromeOptions: chromeOptions): Promise<any> {
    const chrome = new Chrome(chromeOptions);
    await chrome.launch();
    this.log(`CHROME:${chrome.port} Launched on port ${chrome.port}`);

    this.chromeInstances.push(chrome);

    if (this.queueList.length) {
      this.execute(chrome, this.queueList.shift());
    }

    if (this.workerTTL > 0) {
      setTimeout(() => {
        this.log(`CHROME:${chrome.port} > TTL expired, attempting to close if not busy`);
        this.destroy(chrome);
      }, this.workerTTL);
    }

    return chrome;
  }

  public register(job: jobFunc): void {
    if (!this.chromeInstances.length || this.chromeInstances.every(isBusy)) {
      this.log('NAVALIA: All instances busy or still booting, queueing job');
      this.queueList.push(job);
    // Otherwise just push it through
    } else {
      this.execute(this.chromeInstances.find(notBusy), job);
    }
  }
};
