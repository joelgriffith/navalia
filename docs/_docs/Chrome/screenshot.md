---
title: .screenshot
category: Chrome
order: 3
---

The `screenshot` method takes a single argument: a file-path (absolute) of where to save the screenshot. The output is always `.png`:

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
