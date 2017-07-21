---
title: .text
category: Chrome
---

The `text` method returns the inside-text of a DOM node (including its children's text) as a string. It accepts one argument: a css-selector string, and defaults to `body` when none is present.

Accepts a 2nd parameter of options for granular control: `wait`, a boolean to inform Chrome to wait for it's apperance before executing (defaults to `true`), and a `timeout` number in milliseconds to throw when it doesn't appear.

Returns a string of text inside the element.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.text('title'))
.then((result) => console.log(res)) // Google
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function html() {
  await chrome.goto('https://www.google.com');
  const result = await chrome.text('title');
  console.log(result); // Google
  chrome.done();
}

html();
```
