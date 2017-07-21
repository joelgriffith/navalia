---
title: .select
category: Chrome
---

The `select` method selects an option inside a dropdown selector. It accepts two arguments: the css-style selector of the dropdown you want to select, and the option you wish to select.

Accepts a 2nd parameter of options for granular control: `wait`, a boolean to inform Chrome to wait for it's apperance before executing (defaults to `true`), and a `timeout` number in milliseconds to throw when it doesn't appear.

Returns a boolean indicating success.

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
