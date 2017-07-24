---
title: .done
category: Chrome
---

The `done` method cleans up chrome and exits the process. It accepts no arguments.

> This call runs immediately! Don't chain this with other actions if using the chain pattern (instead use `.end`)

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
