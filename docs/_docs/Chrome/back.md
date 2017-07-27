---
title: .back
category: Chrome
---

The `back` method has Chrome go back in history. Returns `undefined`.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome
  .goto('https://joelgriffith.github.io/navalia/')
  .goto('https://www.google.com')
  .back()
  .screenshot()
  .then((res) => {
    // res[3] is buffer data of the github link
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
    .screenshot()
    .then((res) => {
      // res[3] is buffer data of the github link
    });
}

navigateAndScreenshot();
```
