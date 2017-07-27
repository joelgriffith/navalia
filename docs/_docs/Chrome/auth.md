---
title: .auth
category: Chrome
---

The `auth` method allows you to specify a username/password for sites that use basic auth. Any request that returns a HTTP challenge will be supplied these credentials in response.

> Call the `.auth` method prior to `.goto` in order to ensure your credentials will be injected for you!

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

// Specifying auth before navigation
chrome
  .auth('username', 'password')
  .goto('https://some-site-with-basic-auth.com')
  .then((res) => {
    console.log(res[1]); // Final URL
  });
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

// Getting an attribute
async function getAll() {
const { Chrome } = require('navalia');
const chrome = new Chrome();

// Specifying auth before navigation
async function getAll() {
  await chrome
    .auth('username', 'password')
    .goto('https://some-site-with-basic-auth.com');
}

getAll().then((res) => console.log(res[1])); // Final URL
```
