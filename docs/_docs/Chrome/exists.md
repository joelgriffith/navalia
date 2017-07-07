---
title: .exists
category: Chrome
order: 6
---

The `exists` method returns if the Element selector exists on the page. Accepts a `string` of a css-style selector.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.exists('title'))
.then((result) => console.log(result)) // true
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

function exists() {
  await chrome.goto('https://www.google.com');
  const result = await chrome.exists('title');
  console.log(result); // true
  chrome.done();
}

exists();
```
