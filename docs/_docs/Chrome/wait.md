---
title: .wait
category: Chrome
order: 14
---

The `wait` simple sleeps any further requests for a set amount of time before resuming execution. It accepts a single arugment: the time in `ms`.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.amazon.com')
.then(() => chrome.wait(1000)) // waits one second
.then(() => chrome.visible('.buy-now'))
.then((isVisible) => console.log(isVisible))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

await chrome.goto('https://www.amazon.com');
await chrome.wait(1000); // waits one second
const isVisible = await chrome.visible('.buy-now');
console.log(isVisible);
chrome.done();
```
