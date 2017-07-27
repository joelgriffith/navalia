---
title: .forward
category: Chrome
---

The `forward` method has Chrome go forward in history. Returns `undefined`.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome
  .goto('https://joelgriffith.github.io/navalia/')
  .goto('https://www.google.com')
  .back()
  .forward()
  .screenshot()
  .then((res) => {
    // res[4] is buffer data of the github link
  });
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function navigateAndScreenshot() {
  chrome
    .goto('https://joelgriffith.github.io/navalia/')
    .goto('https://www.google.com')
    .back()
    .forward()
    .screenshot()
    .then((res) => {
      // res[4] is buffer data of the github link
    });
}

navigateAndScreenshot();
```
