import { Chrome } from '../Chrome';

export interface handler {
  (chromeTab: Chrome): Promise<any>;
}

interface action {
  handler: handler;
  resolve: Function;
  reject: Function;
}

// This is a helper class for "sleeping"
// requests from a graphql-backend and then
// running them in serial on the next event loop
export class ChromeLoader {
  private actions: action[] = [];
  private timerId: number = 0;
  private delay: number = 0;
  private chrome: Chrome;

  constructor({ delay = 0 } = {}) {
    this.delay = delay;
    this.chrome = new Chrome();
  }

  run(fn) {
    clearTimeout(this.timerId);

    return new Promise((resolve, reject) => {
      this.actions.push({
        handler: fn,
        resolve,
        reject,
      });

      this.timerId = setTimeout(this.serial.bind(this), this.delay);
    });
  }

  serial() {
    return this.actions.reduce((promise, action, idx, array) => {
      return promise.then(async () => {
        let res;
        try {
          res = await action.handler(this.chrome);
          action.resolve(res);
        } catch (error) {
          action.reject(error);
        }
        if (idx === array.length - 1) this.chrome.done();
        return res;
      });
    }, Promise.resolve());
  }
}
