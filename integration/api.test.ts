import { Chrome } from '../src';

describe('Chrome', () => {
  describe('#evaluate', () => {
    it('should run an expression and return the value', async () => {
      const chrome = new Chrome();
      const res = await chrome.evaluate(() => window.location.href);
      chrome.done();
      expect(res).toEqual('about:blank');
    });

    it('should handle async functions', async () => {
      const chrome = new Chrome();
      const res = await chrome.evaluate(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(window.location.href);
          }, 10);
        });
      });
      chrome.done();
      expect(res).toEqual('about:blank');
    });

    it('should throw when errors happen in Chrome', async () => {
      const chrome = new Chrome();

      return chrome
        .evaluate(() => {
          throw new Error('I should propogate');
        })
        .end()
        .then(res => {
          expect(res).toBeNull();
        })
        .catch(error => {
          chrome.done();
          expect(error).toMatchSnapshot();
        });
    });

    it('should allow variables to be passed in', async () => {
      const chrome = new Chrome();
      const res = await chrome.evaluate(
        (a, b, c) => {
          return [a, b, c];
        },
        'foo',
        'bar',
        'baz',
      );
      chrome.done();
      expect(res).toEqual(['foo', 'bar', 'baz']);
    });
  });

  describe('#exists', () => {
    it('should return true if something exists', async () => {
      const chrome = new Chrome();
      const exists = await chrome.exists('body');
      chrome.done();
      expect(exists).toEqual(true);
    });

    it('should return false if it does not', async () => {
      const chrome = new Chrome();
      const exists = await chrome.exists('.i-am-not-there', { wait: false });
      chrome.done();
      expect(exists).toEqual(false);
    });

    it('should wait for items to appear', async () => {
      const chrome = new Chrome();
      await chrome.evaluate(() => {
        setTimeout(() => {
          var div = document.createElement('div');
          div.innerHTML = '<div class="arriving-late"></div>';

          while (div.children.length > 0) {
            document.body.appendChild(div.children[0]);
          }
        }, 10);
      });
      const exists = await chrome.exists('.arriving-late');
      chrome.done();
      expect(exists).toEqual(true);
    });

    it('should wait for items to appear and return false', async () => {
      const chrome = new Chrome();
      await chrome.evaluate(() => {
        setTimeout(() => {
          var div = document.createElement('div');
          div.innerHTML = '<div class="arriving-late"></div>';

          while (div.children.length > 0) {
            document.body.appendChild(div.children[0]);
          }
        }, 10);
      });
      const exists = await chrome.exists('.arriving-late', { timeout: 5 });
      chrome.done();
      expect(exists).toEqual(false);
    });
  });

  describe('#html', () => {
    it('should return the html of the page with no args', async () => {
      const chrome = new Chrome();
      const html = await chrome.html();
      chrome.done();
      expect(html).toEqual('<html><head></head><body></body></html>');
    });
  });

  describe('#text', () => {
    it('should return the text an element', async () => {
      const chrome = new Chrome();
      const text = `All my life I've been searching for something`;
      await chrome.evaluate(text => {
        var div = document.createElement('div');
        div.innerHTML = `<div>${text}</div>`;

        while (div.children.length > 0) {
          document.body.appendChild(div.children[0]);
        }
      }, text);
      const textRes = await chrome.text('div');
      chrome.done();
      expect(textRes).toEqual(text);
    });

    it('should wait for the element before trying', async () => {
      const chrome = new Chrome();
      const text = `All my life I've been searching for something`;
      await chrome.evaluate(text => {
        setTimeout(() => {
          var div = document.createElement('div');
          div.innerHTML = `<div>${text}</div>`;

          while (div.children.length > 0) {
            document.body.appendChild(div.children[0]);
          }
        }, 5);
      }, text);
      const textRes = await chrome.text('div');
      chrome.done();
      expect(textRes).toEqual(text);
    });

    it("should throw an error if the element isn't found", async () => {
      const chrome = new Chrome();
      return chrome
        .text('div', { wait: false })
        .then(textRes => {
          expect(textRes).toEqual(null);
        })
        .catch(error => {
          expect(error).toMatchSnapshot();
          chrome.done();
        });
    });
  });

  describe('#click"', () => {
    it('should click elements', async () => {
      const chrome = new Chrome();
      await chrome.evaluate(() => {
        var div = document.createElement('div');
        div.innerHTML = `
          <button class="clickable" onclick="javascript:document.body.appendChild(document.createElement('span'))">Click Me!</button>
        `;

        while (div.children.length > 0) {
          document.body.appendChild(div.children[0]);
        }
      });
      await chrome.click('.clickable');
      const exists = await chrome.exists('span');
      chrome.done();
      expect(exists).toEqual(true);
    });

    it('should wait for elements by default', async () => {
      const chrome = new Chrome();
      return chrome
        .evaluate(() => {
          setTimeout(() => {
            var div = document.createElement('div');
            div.innerHTML = `<button class="clickable">Click Me!</button>`;

            while (div.children.length > 0) {
              document.body.appendChild(div.children[0]);
            }
          }, 5);
        })
        .click('.clickable')
        .then(([evResult, click]) => {
          expect(click).toEqual(true);
          chrome.done();
        });
    });

    it('should throw an error for elements that are not there', async () => {
      const chrome = new Chrome();
      return chrome
        .click('.nope', { wait: false })
        .then(res => expect(res).toBe(null))
        .catch(error => {
          expect(error).toMatchSnapshot();
          chrome.done();
        });
    });
  });
});
