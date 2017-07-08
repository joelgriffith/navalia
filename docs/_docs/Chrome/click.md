---
title: .click
category: Chrome
---

The `click` method clicks on an element in the page. It accepts a css-style selector for the element you want to click.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.click('input[type="button"]'))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function click() {
  await chrome.goto('https://www.google.com');
  await chrome.click('input[type="button"]');
  chrome.done();
}

click();
```
