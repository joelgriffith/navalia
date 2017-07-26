import { Chrome } from '../src';

describe('Chrome', () => {
  let chrome = null;

  beforeEach(() => {
    chrome = new Chrome();
  });

  afterEach(() => {
    chrome.done();
  });

  describe('#evaluate', () => {
    it('should run an expression and return the value', async () => {
      const res = await chrome.evaluate(() => window.location.href);
      expect(res).toEqual('about:blank');
    });

    it('should handle async functions', async () => {
      const res = await chrome.evaluate(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(window.location.href);
          }, 10);
        });
      });
      expect(res).toEqual('about:blank');
    });

    it('should throw when errors happen in Chrome', async () => {
      return chrome
        .evaluate(() => {
          throw new Error('I should propogate');
        })
        .end()
        .then(res => {
          expect(res).toBeNull();
        })
        .catch(error => {
          expect(error).toMatchSnapshot();
        });
    });

    it('should allow variables to be passed in', async () => {
      const res = await chrome.evaluate(
        (a, b, c) => {
          return [a, b, c];
        },
        'foo',
        'bar',
        'baz',
      );
      expect(res).toEqual(['foo', 'bar', 'baz']);
    });
  });

  describe('#exists', () => {
    it('should return true if something exists', async () => {
      const exists = await chrome.exists('body');
      expect(exists).toEqual(true);
    });

    it('should return false if it does not', async () => {
      const exists = await chrome.exists('.i-am-not-there', { wait: false });
      expect(exists).toEqual(false);
    });

    it('should wait for items to appear', async () => {
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
      expect(exists).toEqual(true);
    });

    it('should wait for items to appear and return false', async () => {
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
      expect(exists).toEqual(false);
    });
  });

  describe('#html', () => {
    it('should return the html of the page with no args', async () => {
      const html = await chrome.html();
      expect(html).toEqual('<html><head></head><body></body></html>');
    });
  });

  describe('#text', () => {
    it('should return the text an element', async () => {
      const text = `All my life I've been searching for something`;
      await chrome.evaluate(text => {
        var div = document.createElement('div');
        div.innerHTML = `<div>${text}</div>`;

        while (div.children.length > 0) {
          document.body.appendChild(div.children[0]);
        }
      }, text);
      const textRes = await chrome.text('div');
      expect(textRes).toEqual(text);
    });

    it('should wait for the element before trying', async () => {
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
      expect(textRes).toEqual(text);
    });

    it("should throw an error if the element isn't found", async () => {
      return chrome
        .text('div', { wait: false })
        .then(textRes => {
          expect(textRes).toEqual(null);
        })
        .catch(error => {
          expect(error).toMatchSnapshot();
        });
    });
  });

  describe('#click"', () => {
    it('should click elements', async () => {
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
      expect(exists).toEqual(true);
    });

    it('should wait for elements by default', async () => {
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
        });
    });

    it('should throw an error for elements that are not there', async () => {
      return chrome
        .click('.nope', { wait: false })
        .then(res => expect(res).toBe(null))
        .catch(error => {
          expect(error).toMatchSnapshot();
        });
    });
  });

  describe('#focus', () => {
    it('should focus an input', () => {
      return chrome
        .evaluate(() => {
          var div = document.createElement('div');
          div.innerHTML = `<input type="text" />`;

          while (div.children.length > 0) {
            document.body.appendChild(div.children[0]);
          }
        })
        .focus('input')
        .evaluate(() => {
          return document.activeElement === document.querySelector('input');
        })
        .then(results => {
          expect(results[2]).toEqual(true);
        });
    });

    it('should wait for the element then focus', () => {
      return chrome
        .evaluate(() => {
          setTimeout(() => {
            var div = document.createElement('div');
            div.innerHTML = `<input type="text" />`;

            while (div.children.length > 0) {
              document.body.appendChild(div.children[0]);
            }
          }, 5);
        })
        .focus('input')
        .evaluate(() => {
          return document.activeElement === document.querySelector('input');
        })
        .then(results => {
          expect(results[2]).toEqual(true);
        });
    });

    it("should throw an error if the element isn't there", () => {
      return chrome
        .focus('input', { wait: false })
        .then(results => {
          expect(results).toEqual(null);
        })
        .catch(error => {
          expect(error).toMatchSnapshot();
        });
    });
  });

  describe('#type', () => {
    it('should type text into an element', () => {
      const text = 'Hello Goodbye';
      return chrome
        .evaluate(() => {
          var div = document.createElement('div');
          div.innerHTML = `<input type="text" />`;

          while (div.children.length > 0) {
            document.body.appendChild(div.children[0]);
          }
        })
        .type('input', text)
        .evaluate(() => {
          return document.querySelector('input').value;
        })
        .then(results => {
          expect(results[2]).toEqual(text);
        });
    });

    it('should wait to type text into an element', () => {
      const text = 'Hello Goodbye';
      return chrome
        .evaluate(() => {
          setTimeout(() => {
            var div = document.createElement('div');
            div.innerHTML = `<input type="text" />`;

            while (div.children.length > 0) {
              document.body.appendChild(div.children[0]);
            }
          }, 5);
        })
        .type('input', text)
        .evaluate(() => {
          return document.querySelector('input').value;
        })
        .then(results => {
          expect(results[2]).toEqual(text);
        });
    });

    it('should should throw if the element never shows up', () => {
      const text = 'Hello Goodbye';
      return chrome
        .type('input', text, { wait: false })
        .then(results => {
          expect(results).toEqual(null);
        })
        .catch(error => {
          expect(error).toMatchSnapshot();
        });
    });
  });

  describe('#check', () => {
    it('should check a checkbox', () => {
      return chrome
        .evaluate(() => {
          var div = document.createElement('div');
          div.innerHTML = `<input type="checkbox" />`;

          while (div.children.length > 0) {
            document.body.appendChild(div.children[0]);
          }
        })
        .check('input')
        .evaluate(() => {
          return document.querySelector('input').checked;
        })
        .then(results => {
          expect(results[2]).toEqual(true);
        });
    });

    it('should wait to check a checkbox', () => {
      return chrome
        .evaluate(() => {
          setTimeout(() => {
            var div = document.createElement('div');
            div.innerHTML = `<input type="checkbox" />`;

            while (div.children.length > 0) {
              document.body.appendChild(div.children[0]);
            }
          }, 5);
        })
        .check('input')
        .evaluate(() => {
          return document.querySelector('input').checked;
        })
        .then(results => {
          expect(results[2]).toEqual(true);
        });
    });

    it('should throw if the element is not found', () => {
      return chrome
        .check('input', { wait: false })
        .then(res => {
          expect(res).toEqual(null);
        })
        .catch(error => {
          expect(error).toMatchSnapshot();
        });
    });
  });

  describe('#uncheck', () => {
    it('should uncheck a checkbox', () => {
      return chrome
        .evaluate(() => {
          var div = document.createElement('div');
          div.innerHTML = `<input type="checkbox" checked/>`;

          while (div.children.length > 0) {
            document.body.appendChild(div.children[0]);
          }
        })
        .uncheck('input')
        .evaluate(() => {
          return document.querySelector('input').checked;
        })
        .then(results => {
          expect(results[2]).toEqual(false);
        });
    });

    it('should wait to check a checkbox', () => {
      return chrome
        .evaluate(() => {
          setTimeout(() => {
            var div = document.createElement('div');
            div.innerHTML = `<input type="checkbox" checked/>`;

            while (div.children.length > 0) {
              document.body.appendChild(div.children[0]);
            }
          }, 5);
        })
        .uncheck('input')
        .evaluate(() => {
          return document.querySelector('input').checked;
        })
        .then(results => {
          expect(results[2]).toEqual(false);
        });
    });

    it('should throw if the element is not found', () => {
      return chrome
        .uncheck('input', { wait: false })
        .then(results => {
          expect(results).toEqual(null);
        })
        .catch(error => {
          expect(error).toMatchSnapshot();
        });
    });
  });
});
