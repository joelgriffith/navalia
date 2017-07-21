---
title: .focus
category: Chrome
---

The `focus` method focuses an element on the page. It accepts a css-style selector of the element you wish to focus.

Accepts a 2nd parameter of options for granular control: `wait`, a boolean to inform Chrome to wait for it's apperance before executing (defaults to `true`), and a `timeout` number in milliseconds to throw when it doesn't appear.

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
