---
title: .reload
category: Chrome
---

The `reload` method reloads the page in Chrome, and accepts an option `boolean` to load the page fresh (not from cached resources).

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome
  .goto('https://www.google.com')
  .reload(true);
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function getAll() {
const { Chrome } = require('navalia');
const chrome = new Chrome();

async function fetchAndReload() {
  await chrome
    .goto('https://www.google.com')
    .reload(true);
}

fetchAndReload().then((res) => console.log(res[1])); // Final URL
```
