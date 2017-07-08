---
title: .html
category: Chrome
---

The `html` method returns the string of HTML for a particular selector. It accepts one argument: a css-style selector for the element you wish to extract html from.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.html('title'))
.then((result) => console.log(res)) // <title>Google</title>
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function html() {
  await chrome.goto('https://www.google.com');
  const result = await chrome.html('title');
  console.log(result); // <title>Google</title>
  chrome.done();
}

html();
```
