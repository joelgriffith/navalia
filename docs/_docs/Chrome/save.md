---
title: .save
category: Chrome
---

The `save` method captures the webpage HTML and saves it to the provided location. It accepts a single arugment: the absolute-path of where to save the file. If no file-path is provided, the `save` method will return a string of the page.

> This method can be used to snapshot pages for SEO purposes.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://joelgriffith.github.io/navalia/')
.then(() => chrome.save(process.cwd() + '/navalia.html'))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from '../src';
const chrome = new Chrome();

async function savePageHTML() {
  await chrome.goto('https://joelgriffith.github.io/navalia/');
  await chrome.save(process.cwd() + '/navalia.html');
  return chrome.done();
}

savePageHTML();
```
