---
title: .check
category: Chrome
---

The `check` method checks a checkbox. It accepts a single argument: the css-style selector of the checkbox you want to check

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.check('input[type="checkbox"]'))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function check() {
  await chrome.goto('https://www.google.com');
  await chrome.check('input[type="checkbox"]');
  chrome.done();
}

check();
```
