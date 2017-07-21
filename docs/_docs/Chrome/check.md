---
title: .check
category: Chrome
---

The `check` method checks a checkbox. It accepts a single argument: the css-style selector of the checkbox you want to check

Accepts a 2nd parameter of options for granular control: `wait`, a boolean to inform Chrome to wait for it's apperance before executing (defaults to `true`), and a `timeout` number in milliseconds to throw when it doesn't appear.

Returns a `boolean` indicating success.

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
