---
title: .scroll
category: Chrome
---

The `scroll` method scrolls Chrome to the `x` and `y` coordinates provided. Returns `undefined`.

> Both arguments are optional, and default to 0 when not present.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();
const fs = require('fs');

chrome.goto('https://joelgriffith.github.io/navalia/')
.then(() => chrome.scroll(0, 200)) // Scroll down 200px
.then(() => chrome.screenshot())
.then((buffer) => fs.writeFileSync(buffer,...))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();
import fs from 'fs';

// Getting an attribute
async function scrollAndScreenshot() {
  await chrome.goto('https://joelgriffith.github.io/navalia/');
  await chrome.scroll(0, 200);
  const buffer = chrome.screenshot();
  fs.writeFileSync(buffer,...);
  chrome.done();
}

scrollAndScreenshot();
```
