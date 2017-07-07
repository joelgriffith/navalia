---
title: .done
category: Chrome
order: 20
---

The `done` method cleans up chrome and exists the process. It accepts no arguments.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.amazon.com')
.then(() => chrome.done()); // Process will close
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function quit() {
  await chrome.goto('https://www.amazon.com');
  chrome.done();
}

quit();
```
