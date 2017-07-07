---
title: .uncheck
category: Chrome
order: 11
---

The `uncheck` method un-checks a checkbox. It accepts a single argument: the css-style selector of the checkbox you want to un-check

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.uncheck('input[type="checkbox"]'))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

await chrome.goto('https://www.google.com');
await chrome.uncheck('input[type="checkbox"]');
chrome.done();
```
