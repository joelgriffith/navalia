---
title: .end
category: Chrome
---

The `end` method cleans up chrome and exits the process. It's identical to `.done`, but can be called in a chain since it won't run immediately.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome
  .goto('https://www.amazon.com')
  .click('.buy-now')
  .end()
  .then((responses) => {
    console.log(responses);
  });
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function quit() {
  const responses = await chrome
    .goto('https://www.amazon.com')
    .click('.buy-now')
    .end();

  console.log(responses);
}

quit();
```
