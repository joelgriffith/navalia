---
title: .select
category: Chrome
order: 12
---

The `select` method selects an option inside a dropdown selector. It accepts two arguments: the css-style selector of the dropdown you want to select, and the option you wish to select.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.amazon.com')
.then(() => chrome.select('.shipping', 'next-day'))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function select() {
  await chrome.goto('https://www.amazon.com');
  await chrome.select('.shipping', 'next-day');
  chrome.done();
}

select();
```
