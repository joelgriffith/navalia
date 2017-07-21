---
title: .html
category: Chrome
---

The `html` method returns the string of HTML for a particular selector. It accepts one argument: a css-style selector for the element you wish to extract html from.

Accepts a 2nd parameter of options for granular control: `wait`, a boolean to inform Chrome to wait for it's apperance before executing (defaults to `true`), and a `timeout` number in milliseconds to throw when it doesn't appear.

Returns the HTML as a `string`.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.html('title'))
.then((result) => console.log(res)) // <title>Google</title>
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function html() {
  await chrome.goto('https://www.google.com');
  const result = await chrome.html('title');
  console.log(result); // <title>Google</title>
  chrome.done();
}

html();
```
