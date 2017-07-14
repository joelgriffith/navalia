---
title: .fetch
category: Chrome
---

The `fetch` method acts similarly as it does in the browser and allows you to make arbitrary fetch calls inside the Chrome instance. The API is exactly the same as the native fetch api with the only exception being that the response will include all the meta-data around the request, and a `body` based on the content-type. See [Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) at MDN for more information on how to query.

The returned body contains all the meta-data about the request. It's simple JSON hash that contains at least these properties: `url`, `status`, `statusText`, `headers`, `mimeType`, `timing`, and a `body`. There's no need to call `json()` or other fetch-related API's as Navalia does all the unwrapping for you.

If an error occurs, an `error` property will be present with text pertaining to the source of the error.

> This method is not intended to handle large file-blobs as it needs to serialize responses.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.my-blog.com')
.then(() => chrome.fetch('https://www.my-blog.com/api/authors', { credentials: 'include' }))
.then((response) => console.log(response.headers, response.body))
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function check() {
  await chrome.goto('https://www.my-blog.com');
  const response = await chrome.fetch('https://www.my-blog.com/api/authors', { credentials: 'include' });
  console.log(response.headers, response.body);
  chrome.done();
}

check();
```
