---
title: .inject
category: Chrome
---

The `inject` method injects a JavaScript or CSS file into the page. It accpets a single-argument: a string of the filepath to inject.

It will return a `boolean` indicating succes, or throw on failure.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.inject('./my-cool-js.js'))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function inject() {
  await chrome.goto('https://www.google.com');
  await chrome.inject('./my-cool-css.css');
  chrome.done();
}

inject();
```
