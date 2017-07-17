---
title: .cookie
category: Chrome
---

The `cookie` method acts as a getter/setter for accessing and setting cookies.

When executed with no arguments, the `cookie` method will return an objects representing the browser cookies. They will contain a `name` property (the name of the cookie) and it's respective value.

When called with a single argument, or the cookie name, this method will return the value for the cookie requested.

When called wth two arguments (representing the name and value of a cookie), this method will set the cookie name to the respective value and return the value it set.

*JavaScript*
```js
// Getting all cookies
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
.then(() => chrome.cookie())
.then((cookies) => console.log(cookies))
.then(() => chrome.done());

// Getting a single cookie
chrome.goto('https://www.google.com')
.then(() => chrome.cookie('session_id'))
.then((cookie) => console.log(cookie))
.then(() => chrome.done());

// Setting a cookie
chrome.goto('https://www.google.com')
.then(() => chrome.cookie('session_id', '1234'))
.then((cookie) => console.log(cookie)) // '1234'
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

// Getting all cookies
async function getAll() {
  await chrome.goto('https://www.google.com');
  const cookies = await chrome.cookie();
  console.log(cookies);
  chrome.done();
}

async function getSessionId() {
  await chrome.goto('https://www.google.com');
  const cookie = await chrome.cookie('session_id');
  console.log(cookie);
  chrome.done();
}

async function setSession() {
  await chrome.goto('https://www.google.com');
  const cookie = await chrome.cookie('session_id', '1234');
  console.log(cookie); // 1234
  chrome.done();
}
```
