---
title: .fetch
category: Chrome
---

The `fetch` method acts similarly as it does in the browser and allows you to make arbitrary fetch calls inside the Chrome instance. The API is exactly the same as the native fetch api, with one exception: this method will un-wrap any responses for you based on the `Content-Type` response. See [Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) at MDN networks for more information.

> This method is not intended to handle large file-blobs as it needs to serialize responses.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.my-blog.com')
.then(() => chrome.fetch('https://www.my-blog.com/api/authors', { credentials: 'include' }))
.then((response) => console.log(response))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function check() {
  await chrome.goto('https://www.my-blog.com');
  const response = await chrome.fetch('https://www.my-blog.com/api/authors', { credentials: 'include' });
  console.log(response);
  chrome.done();
}

check();
```
