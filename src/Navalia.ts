import * as debug from 'debug';

import { Chrome } from './Chrome';
import { ChromeHelper, options as chromeOptions } from './util/ChromeHelper';

const log = debug('navalia');

export interface clusterParams {
  numInstances?: number;
  maxJobs?: number;
  workerTTL?: number;
  chromeOptions?: chromeOptions;
}

export interface jobFunc {
  (chromeTab: Chrome): Promise<any>;
}

const isBusy = (chrome: ChromeHelper): boolean => chrome.isFull();
const notBusy = (chrome: ChromeHelper): boolean => !isBusy(chrome);

export class Navalia {
  private chromeInstances: ChromeHelper[];
  private queueList: jobFunc[];
  private numInstances: number;
  private maxJobs: number;
  private workerTTL: number;
  private chromeOptions: chromeOptions;

  constructor(opts: clusterParams = {}) {
    this.numInstances = opts.numInstances || 1;
    this.maxJobs = opts.maxJobs || -1;
    this.workerTTL = opts.workerTTL || -1;
    this.chromeOptions = opts.chromeOptions || {};

    this.chromeInstances = [];
    this.queueList = [];

    log(`starting, using up to ${this.numInstances} instances`);

    for (let i = 0; i < this.numInstances; i++) {
      this.launchInstance(this.chromeOptions);
    }
    
    return;
  }

  private destroy(chrome: ChromeHelper): void {
    const instanceIndex = this.chromeInstances.indexOf(chrome);

    if (!chrome.isIdle()) {
      log(`instance ${chrome.port} still has active work, waiting till finished`);
      chrome.setExpired();
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
    this.launchInstance(this.chromeOptions);

    log(`instance ${chrome.port} successfully closed`);
  }

  private async execute(chrome: ChromeHelper | undefined, job: jobFunc | undefined): Promise<any> {
    if (!chrome || !job) {
      throw new Error(`#execute was called with no instance of Chrome or a Job`);
    }

    const tab = await chrome.start();

    log(`instance ${chrome.port} is starting work`);

    await job(tab);

    tab.done();

    log(`instance ${chrome.port} has completed work`);

    if (chrome.isFull()) {
      log(`instance ${chrome.port} at max capacity, not taking work from queue`);
      this.destroy(chrome);
      return;
    }

    if (chrome.getIsExpired()) {
      log(`instance ${chrome.port} is expired and isn't taking new work`);
      this.destroy(chrome);
      return;
    }

    if (chrome.getJobsComplete() === this.maxJobs) {
      log(`instance ${chrome.port} has completed maximum jobs and is closing`);
      this.destroy(chrome);
      return;
    }

    if (this.queueList.length) {
      log(`instance ${chrome.port} is taking work from the queue`);
      return this.execute(chrome, this.queueList.shift());
    }
  }

  private async launchInstance(chromeOptions: chromeOptions): Promise<void> {
    const chromeHelper = new ChromeHelper(chromeOptions);

    this.chromeInstances.push(chromeHelper);

    if (this.queueList.length) {
      this.execute(chromeHelper, this.queueList.shift());
    }

    if (this.workerTTL > 0) {
      setTimeout(() => {
        log(`instance ${chromeHelper.port} has reached expiration`);
        this.destroy(chromeHelper);
      }, this.workerTTL);
    }
  }

  public run(job: jobFunc): void {
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
