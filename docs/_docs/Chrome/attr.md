---
title: .attr
category: Chrome
---

The `attr` method operates similarly to the jQuery `attr` method, and return the value of an attribute of a DOM element. It's called with 2 parameters: the css-style selector of the element you wish to query, and the attribute you want to retrieve.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://joelgriffith.github.io/navalia/')
.then(() => chrome.attr('meta[property="og:title"]', 'content'))
.then((openGraphTitle) => console.log(openGraphTitle))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

// Getting all cookies
async function getAll() {
  await chrome.goto('https://joelgriffith.github.io/navalia/');
  const openGraphTitle = await chrome.attr('meta[property="og:title"]', 'content');
  console.log(openGraphTitle);
  chrome.done();
}

click();
```
