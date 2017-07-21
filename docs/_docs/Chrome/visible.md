---
title: .visible
category: Chrome
---

The `visible` method returns a boolean indiciating if an element is visible. It accepts a single argument: the css-style of the selector you want to check.

Accepts a 2nd parameter of options for granular control: `wait`, a boolean to inform Chrome to wait for it's apperance before executing (defaults to `true`), and a `timeout` number in milliseconds to throw when it doesn't appear.

Returns a `boolean` indicating item is viewable.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.amazon.com')
.then(() => chrome.visible('.buy-now'))
.then((isVisible) => console.log(isVisible)) // false
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function visible() {
  await chrome.goto('https://www.amazon.com');
  const isVisible = await chrome.visible('.buy-now');
  console.log(isVisible); // false
  chrome.done();
}

visible();
```
