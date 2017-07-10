---
title: .wait
category: Chrome
---

The `wait` method accepts either a selector to wait for, or time in MS, before allowing Chrome to continue execution. If a string is passed in it's assumed to be a selector, whilst a number indicates a time to wait.

> When using a selector, Navalia will fail after waiting for 10 seconds

### Using a selector

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.amazon.com')
.then(() => chrome.wait('.buy-now'))
.then(() => chrome.visible('.buy-now'))
.then((isVisible) => console.log(isVisible))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function wait() {
  await chrome.goto('https://www.amazon.com');
  await chrome.wait('.buy-now'); // waits one second
  const isVisible = await chrome.visible('.buy-now');
  console.log(isVisible);
  chrome.done();
}

wait();
```

### Using a number

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

async function wait() {
  await chrome.goto('https://www.amazon.com');
  await chrome.wait(1000); // waits one second
  const isVisible = await chrome.visible('.buy-now');
  console.log(isVisible);
  chrome.done();
}

wait();
```
