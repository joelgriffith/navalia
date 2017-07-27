---
title: .screenshot
category: Chrome
---

The `screenshot` method takes an optional single argument: a css-like selector of the element you want to capture.

It returns a `base64` encoded buffer of the result.

> The screenshot method generates a png file.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.screenshot('body'))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function screenshot() {
  await chrome.goto('https://www.google.com');
  await chrome.screenshot('body');
  chrome.done();
}

screenshot();
```
