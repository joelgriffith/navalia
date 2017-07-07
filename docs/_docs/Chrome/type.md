---
title: .type
category: Chrome
order: 9
---

The `type` method allows you to type text into an element. It accepts two arguments: the css-style selector of the element you want to enter text into, and a string of text to input.

> It's not necessary to focus prior to entering text

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.type('input[type="text"]', 'Navalia'))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

await chrome.goto('https://www.google.com');
await chrome.type('input[type="text"]', 'Navalia');
chrome.done();
```
