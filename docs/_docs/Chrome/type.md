---
title: .type
category: Chrome
---

The `type` method allows you to type text into an element. It accepts two arguments: the css-style selector of the element you want to enter text into, and a string of text to input.

Accepts a 3rd parameter of options for granular control: `wait`, a boolean to inform Chrome to wait for it's apperance before executing (defaults to `true`), and a `timeout` number in milliseconds to throw when it doesn't appear.

Returns a `boolean` indicating success.

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

async function type() {
  await chrome.goto('https://www.google.com');
  await chrome.type('input[type="text"]', 'Navalia');
  chrome.done();
}

type();
```
