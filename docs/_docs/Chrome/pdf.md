---
title: .pdf
category: Chrome
order: 4
---

The `pdf` method takes a single argument: a file-path (absolute) of where to save the pdf.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();
const filepath = process.cwd() + 'google.pdf';

chrome.goto('https://www.google.com')
.then(() => chrome.pdf(filepath))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();
const filepath = process.cwd() + 'google.pdf';

async function pdf() {
  await chrome.goto('https://www.google.com');
  await chrome.pdf(filepath);
  chrome.done();
}

pdf();
```
