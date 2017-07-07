---
title: .start
category: Chrome
order: 2
---

The `start` method will launch Chrome and return with browser-api compatible instance. It's on this instance that you can access all of the browser methods (like screenshot and pdf).

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();
let browser = {};

chrome
  .start()
  .then((tab) => {
    browser = tab;
    return browser.navigate('http://www.google.com');
  })
  .then(() => browser.done());
  .then(() => chrome.quit());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

function async loadGoogle() {
  const browser = await chrome.start();
  await browser.navigate('http://www.google.com');
  await browser.done();
  chrome.quit();
}

loadGoogle();
```
