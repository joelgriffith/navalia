---
title: .header
category: Chrome
---

This method allows you to inject custom headers into every request Chrome makes. It takes a single argument: a key-value object where keys are header names, and the values their respective values.

> NOTE: This method will apply headers to ALL requests

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com')
  .header({ Authorization: 'abc:123' })
  .click('.my-link')
  .then((responses) => {
    console.log(responses);
    chrome.done();
  });
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async login() {
  const results = await chrome
    .goto('https://www.google.com')
    .header({ Authorization: 'abc:123' })
    .click('.my-link')
  
  console.log(results);
  chrome.done();
}

login();
```
