---
title: .visible
category: Chrome
order: 13
---

The `visible` method returns a boolean indiciating if an element is visible. It accepts a single argument: the css-style of the selector you want to check.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.amazon.com')
.then(() => chrome.visible('.buy-now'))
.then((isVisible) => console.log(isVisible)) // false
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

await chrome.goto('https://www.amazon.com');
const isVisible = await chrome.visible('.buy-now');
console.log(isVisible); // false
chrome.done();
```
