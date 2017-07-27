---
title: .clear
category: Chrome
---

The `clear` method clears out the browser cache and cookies.

> NOTE: You cannot undo the results of this method

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

// Specifying auth before navigation
chrome
  .goto('https://google.com')
  .clear()
  .then(() => {
    console.log('DONE');
  });
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function getAll() {
const { Chrome } = require('navalia');
const chrome = new Chrome();

// Specifying auth before navigation
async function getAll() {
  await chrome
    .goto('https://google.com')
    .clear();
}
```
