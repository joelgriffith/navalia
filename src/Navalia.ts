import * as debug from 'debug';

import { Chrome } from './Chrome';
import { ChromeHelper, options as chromeOptions } from './util/ChromeHelper';

const log = debug('navalia');

interface queueItem {
  handler: jobFunc;
  resolve: Function;
  reject: Function;
}

export interface constructorOpts {
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
  private queueList: queueItem[];
  private numInstances: number;
  private maxJobs: number;
  private workerTTL: number;
  private chromeOptions: chromeOptions;

  constructor(opts: constructorOpts = {}) {
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
      log(
        `instance ${chrome.port} still has active work, waiting till finished`,
      );
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

  private async execute(
    chromeHelper: ChromeHelper | undefined,
    queueItem: queueItem | undefined,
  ): Promise<any> {
    if (!chromeHelper || (!queueItem || !queueItem.handler)) {
      throw new Error(
        `#execute was called with no instance of Chrome or a Job`,
      );
    }

    chromeHelper.start(async (chrome: Chrome) => {
      log(`instance ${chromeHelper.port} is starting work`);

      try {
        const result = await queueItem.handler(chrome);
        queueItem.resolve(result);
      } catch (error) {
        queueItem.reject(error);
      }

      chrome.done();

      log(`instance ${chromeHelper.port} has completed work`);

      if (chromeHelper.isFull()) {
        log(
          `instance ${chromeHelper.port} at max capacity, not taking work from queue`,
        );
        this.destroy(chromeHelper);
        return;
      }

      if (chromeHelper.getIsExpired()) {
        log(
          `instance ${chromeHelper.port} is expired and isn't taking new work`,
        );
        this.destroy(chromeHelper);
        return;
      }

      if (chromeHelper.getJobsComplete() === this.maxJobs) {
        log(
          `instance ${chromeHelper.port} has completed maximum jobs and is closing`,
        );
        this.destroy(chromeHelper);
        return;
      }

      if (this.queueList.length) {
        log(`instance ${chromeHelper.port} is taking work from the queue`);
        return this.execute(chromeHelper, this.queueList.shift());
      }
    });
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

  public async kill(): Promise<void[]> {
    log(`:kill() > killing all instances regardless of work-in-progress`);
    return Promise.all(this.chromeInstances.map(chrome => chrome.quit()));
  }

  public run(handler: jobFunc): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.chromeInstances.length || this.chromeInstances.every(isBusy)) {
        log('queueing work as all instances are busy');
        this.queueList.push({
          handler,
          resolve,
          reject,
        });
        return;
      }

      // Otherwise just push it through
      log('instances are available and starting');
      this.execute(this.chromeInstances.find(notBusy), {
        handler,
        resolve,
        reject,
      });
    });
  }
}
