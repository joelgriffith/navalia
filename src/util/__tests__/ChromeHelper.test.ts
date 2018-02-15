jest.mock('../chrome', () => ({
  launch: jest.fn(),
}));

jest.mock('../../Chrome');

import { ChromeHelper } from '../ChromeHelper';
import * as chromeUtil from '../chrome';

const getMockedBrowser = () => ({
  browser: {
    kill: jest.fn(),
    port: 8675,
  },
  cdp: {
    close: jest.fn(),
    Target: {
      closeTarget: jest.fn(),
    },
  },
});

const getMockedTab = targetId => () => ({
  tab: {},
  targetId,
});

describe('ChromeHelper', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('#start', () => {
    it('should not start the browser again if it has already been started', done => {
      const mockedBrowser = getMockedBrowser();
      chromeUtil.defaultFlags = {};
      chromeUtil.launch = jest.fn(() => Promise.resolve(mockedBrowser));
      chromeUtil.createTab = jest.fn(getMockedTab('targetId'));

      const helper = new ChromeHelper({});

      helper.start(() => {
        helper.start(() => {
          helper.onTabClose('tabTargetId');
          expect(chromeUtil.launch).toHaveBeenCalledWith(
            chromeUtil.defaultFlags,
            true
          );
          expect(chromeUtil.launch).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });
  });

  describe('#onTabClose', () => {
    // TODO: probably want a better error message for this case?
    it("should throw an error if it hasn't started yet", () => {
      const helper = new ChromeHelper({});
      expect(() => helper.onTabClose('target')).toThrowErrorMatchingSnapshot();
    });

    it('should call `closeTarget` with the provided `targetId`', done => {
      const mockedBrowser = getMockedBrowser();
      chromeUtil.launch = jest.fn(() => Promise.resolve(mockedBrowser));
      chromeUtil.createTab = jest.fn(getMockedTab('targetId'));

      const helper = new ChromeHelper({});
      helper.start(() => {
        helper.onTabClose('tabTargetId');
        expect(mockedBrowser.cdp.Target.closeTarget).toHaveBeenCalledWith({
          targetId: 'tabTargetId',
        });
        done();
      });
    });
  });

  describe('#quit', () => {
    it('should close the cdp connection and kill the browser', done => {
      const mockedBrowser = getMockedBrowser();
      chromeUtil.launch = jest.fn(() => Promise.resolve(mockedBrowser));
      chromeUtil.createTab = jest.fn(getMockedTab('targetId'));

      const helper = new ChromeHelper({});

      helper.start(() => {
        return helper.quit().then(() => {
          expect(mockedBrowser.cdp.close).toHaveBeenCalled();
          expect(mockedBrowser.browser.kill).toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe('#setExpired', () => {
    it('should set `isExpired` to true', () => {
      const helper = new ChromeHelper({});
      helper.setExpired();

      expect(helper.getIsExpired()).toBe(true);
    });
  });

  describe('#isIdle', () => {
    it('should return true when the number of active tabs has been reduced to 0', done => {
      const helper = new ChromeHelper({});
      chromeUtil.launch = jest.fn(() => Promise.resolve(getMockedBrowser()));
      chromeUtil.createTab = jest.fn(getMockedTab('targetId'));

      helper.start(() => {
        expect(helper.isIdle()).toBe(false);

        return helper.quit().then(() => {
          expect(helper.isIdle()).toBe(true);
          done();
        });
      });
    });
  });

  describe('#isFull', () => {
    it('should return true when the number of active tabs equals the `maxActiveTabs`', done => {
      const helper = new ChromeHelper({ maxActiveTabs: 1 });
      chromeUtil.launch = jest.fn(() => Promise.resolve(getMockedBrowser()));
      chromeUtil.createTab = jest.fn(getMockedTab('targetId'));

      helper.start(() => {
        expect(helper.isFull()).toBe(true);

        return helper.quit().then(() => {
          expect(helper.isFull()).toBe(false);
          done();
        });
      });
    });
  });

  describe('#getIsExpired', () => {
    it('should return false after initial constructor', () => {
      const helper = new ChromeHelper({});

      expect(helper.getIsExpired()).toBe(false);
    });
  });

  describe('#getJobsComplete', () => {
    it('should return 0 if no jobs have been completed', () => {
      const helper = new ChromeHelper({});

      expect(helper.getJobsComplete()).toEqual(0);
    });

    it('should return 1 if one job has been completed', done => {
      const helper = new ChromeHelper({ maxActiveTabs: 1 });
      chromeUtil.launch = jest.fn(() => Promise.resolve(getMockedBrowser()));
      chromeUtil.createTab = jest.fn(getMockedTab('targetId'));

      helper.start(() => {
        helper.onTabClose('tabTargetId');
        expect(helper.getJobsComplete()).toEqual(1);
        done();
      });
    });
  });
});
