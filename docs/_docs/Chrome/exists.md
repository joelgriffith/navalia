---
title: .exists
category: Chrome
---

The `exists` method returns if the Element selector exists on the page. Accepts a `string` of a css-style selector.

Accepts a 2nd parameter of options for granular control: `wait`, a boolean to inform Chrome to wait for it's apperance before executing (defaults to `true`), and a `timeout` number in milliseconds to throw when it doesn't appear.

Returns a `boolean` indicating existence.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.exists('title'))
.then((result) => console.log(result)) // true
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

function exists() {
  await chrome.goto('https://www.google.com');
  const result = await chrome.exists('title');
  console.log(result); // true
  chrome.done();
}

exists();
```
