import * as os from 'os';
import Chrome, { chromeOptions } from './chrome';

export interface clusterParams {
  numInstances?: number
  maxJobs?: number
  workerTTL?: number
  chromeOptions?: chromeOptions
}

export interface jobFunc {
  (chrome: Chrome): Promise<any>;
}

const isBusy = (chrome: Chrome): boolean => chrome.getBusy();
const notBusy = (chrome: Chrome): boolean => !isBusy(chrome);

export default class {
  private chromeInstances: Chrome[];
  private queueList: jobFunc[];
  numInstances: number;
  maxJobs: number;
  workerTTL: number;
  defaultChromeOptions: chromeOptions;

  constructor(opts: clusterParams = {}) {
    this.numInstances = opts.numInstances || os.cpus().length;
    this.maxJobs = opts.maxJobs || -1;
    this.workerTTL = opts.workerTTL || -1;
    this.defaultChromeOptions = opts.chromeOptions || {};

    this.chromeInstances = [];
    this.queueList = [];
  }

  private destroy(chromeInstance: Chrome): void {
    const instanceIndex = this.chromeInstances.indexOf(chromeInstance);

    if (instanceIndex === -1) {
      return;
    }

    // Destroy chrome instance
    chromeInstance.destroy();

    // Remove it from the instances collection
    this.chromeInstances.splice(instanceIndex, 1);

    // Launch a new on in its place
    this.launchInstance(this.defaultChromeOptions);
  }

  private async execute(chrome: Chrome | undefined, job: jobFunc | undefined): Promise<any> {
    if (!chrome || !job) {
      throw new Error(`#execute was called with no instance of Chrome or a Job`);
    }
    console.log(`CHROME:${chrome.port} > Starting Job `);

    await job(chrome);

    console.log(`CHROME:${chrome.port} > Job Complete, cleaning up`);

    chrome.done();

    if (chrome.jobsComplete === this.maxJobs) {
      this.destroy(chrome);
    }

    if (this.queueList.length) {
      return this.execute(chrome, this.queueList.shift());
    }

    console.log(`CHROME:${chrome.port} > Queue is complete, waiting`);
  }

  public async startup(): Promise<void> {
    const startupPromise: Promise<Chrome>[] = [];

    console.info(`NAVALIA: Launching ${this.numInstances} Chrome Applications`)

    for (let i = 0; i < this.numInstances; i++) {
      startupPromise.push(this.launchInstance(this.defaultChromeOptions));
    }

    return Promise.all(startupPromise).then(() => console.log('NAVALIA: Ready'));
  }

  public async launchInstance(chromeOptions: chromeOptions): Promise<any> {
    const chrome = new Chrome(chromeOptions);
    await chrome.launch();

    this.chromeInstances.push(chrome);

    if (this.queueList.length) {
      this.execute(chrome, this.queueList.shift());
    }

    if (this.workerTTL !== -1) {
      setTimeout(() => {
        this.destroy(chrome);
      }, this.workerTTL);
    }

    return chrome;
  }

  public reigster(job: jobFunc): void {
    if (this.chromeInstances.every(isBusy)) {
      console.info('NAVALIA: All instances busy, queueing');
      this.queueList.push(job);
    // Otherwise just push it through
    } else {
      this.execute(this.chromeInstances.find(notBusy), job);
    }
  }
};
