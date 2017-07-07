import * as debug from 'debug';

import { Chrome } from './Chrome';
import { ChromeHelper } from './util/ChromeHelper';

const log = debug('navalia');

export interface clusterParams {
  numInstances?: number
  maxJobs?: number
  workerTTL?: number
  chromeOptions?: chromeOptions
}

export interface jobFunc {
  (chromeTab: ChromeTab): Promise<any>;
}

const isBusy = (chrome: Chrome): boolean => chrome.getIsBusy();
const notBusy = (chrome: Chrome): boolean => !isBusy(chrome);

export class Navalia {
  private chromeInstances: Chrome[];
  private queueList: jobFunc[];
  private numInstances: number;
  private maxJobs: number;
  private workerTTL: number;
  private defaultChromeOptions: chromeOptions;

  constructor(opts: clusterParams = {}) {
    this.numInstances = opts.numInstances || 1;
    this.maxJobs = opts.maxJobs || -1;
    this.workerTTL = opts.workerTTL || -1;
    this.defaultChromeOptions = opts.chromeOptions || {};

    this.chromeInstances = [];
    this.queueList = [];
  }

  private destroy(chrome: Chrome): void {
    const instanceIndex = this.chromeInstances.indexOf(chrome);

    if (chrome.getIsBusy()) {
      chrome.setExpired();
      log(`instance ${chrome.port} is busy, marking for expiration when complete`);
      return;
    }

    if (instanceIndex === -1) {
      return;
    }

    // Destroy chrome instance
    chrome.quit();

    // Remove it from the instances collection
    this.chromeInstances.splice(instanceIndex, 1);

    // Launch a new on in its place
    this.launchInstance(this.defaultChromeOptions);

    log(`instance ${chrome.port} successfully closed`);
  }

  private async execute(chrome: Chrome | undefined, job: jobFunc | undefined): Promise<any> {
    if (!chrome || !job) {
      throw new Error(`#execute was called with no instance of Chrome or a Job`);
    }
    log(`instance ${chrome.port} is starting work`);

    const tab = await chrome.start();

    await job(tab);

    log(`instance ${chrome.port} has completed work`);

    tab.done();

    if (chrome.getIsExpired()) {
      log(`instance ${chrome.port} is expired and is closing`);
      this.destroy(chrome);
      return;
    }

    if (chrome.jobsComplete === this.maxJobs) {
      log(`instance ${chrome.port} has completed maximum jobs and is closing`);
      this.destroy(chrome);
      return;
    }

    if (this.queueList.length) {
      log(`instance ${chrome.port} is taking work from the queue`);
      return this.execute(chrome, this.queueList.shift());
    }

    log(`instance ${chrome.port} is idle`);
  }

  private async launchInstance(chromeOptions: chromeOptions): Promise<any> {
    const chrome = new Chrome(chromeOptions);
    await chrome.start();
    log(`instance ${chrome.port} is captured`);

    this.chromeInstances.push(chrome);

    if (this.queueList.length) {
      this.execute(chrome, this.queueList.shift());
    }

    if (this.workerTTL > 0) {
      setTimeout(() => {
        log(`instance ${chrome.port} has reached expiration`);
        this.destroy(chrome);
      }, this.workerTTL);
    }

    return chrome;
  }

  public async start(): Promise<void> {
    const startupPromise: Promise<Chrome>[] = [];

    log(`launching ${this.numInstances} instances`)

    for (let i = 0; i < this.numInstances; i++) {
      startupPromise.push(this.launchInstance(this.defaultChromeOptions));
    }

    return Promise.all(startupPromise).then(() => log(`is online and ready`));
  }

  public register(job: jobFunc): void {
    if (!this.chromeInstances.length || this.chromeInstances.every(isBusy)) {
      log('queueing work as all instances are busy');
      this.queueList.push(job);
    // Otherwise just push it through
    } else {
      log('instances are available and starting');
      this.execute(this.chromeInstances.find(notBusy), job);
    }
  }
};
