---
title: .size
category: Chrome
order: 5
---

The `size` method resizes the frame of the browser, and is suitable for capturing screenshots. For small screens, results are best if the site is responsive.

The `size` method takes two arguments: a `width` (number) and a `height` (number).

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.size(320, 960))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

await chrome.goto('https://www.google.com');
await chrome.size(320, 960);
chrome.done();
```
