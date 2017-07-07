---
title: .focus
category: Chrome
order: 8
---

The `focus` method focuses an element on the page. It accepts a css-style selector of the element you wish to focus.

> It's not necessary to focus prior to entering text

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.focus('input[type="text"]'))
.then(() => chrome.done());
```

*TypeScript*
```ts
async function focus() {
  import { Chrome } from 'navalia';
  const chrome = new Chrome();

  await chrome.goto('https://www.google.com');
  await chrome.focus('input[type="text"]');
  chrome.done();
}

focus();
```
