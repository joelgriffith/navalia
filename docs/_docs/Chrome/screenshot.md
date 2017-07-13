---
title: .screenshot
category: Chrome
---

The `screenshot` method takes an optional single argument: a file-path (absolute) of where to save the screenshot. If no filepath is supplied the method will return a `Buffer` of `base64` encoded data.

> The screenshot method generates a png file.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();
const filepath = process.cwd() + 'google.png';

chrome.goto('https://www.google.com')
.then(() => chrome.screenshot(filepath))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();
const filepath = process.cwd() + 'google.png';

async function screenshot() {
  await chrome.goto('https://www.google.com');
  await chrome.screenshot(filepath);
  chrome.done();
}

screenshot();
```
