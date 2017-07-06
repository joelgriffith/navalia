---
title: .register
category: Navalia
order: 3
---

The register method is used to queue jobs. The register function simply takes a `function` that will be called with one argument: `chrome` which is an instance of `Chrome`, and contains the browser-api. This method also takes care of cleanup, so there's no need to call any done methods in this workflow.

*JavaScript*
```js
const { Navalia } = require('navalia');
const navalia = new Navalie();

navalia.start().then(() => {
  navalia.register((chrome) => {
    return chrome.navigate('http://joelgriffith.net');
  });
});
```

*TypeScript*
```ts
import { Navalia } from 'navalia';
const navalia:Navalia = new Navalia();

async const boot = () => {
  await navalia.start();
  navalia.register(async (chrome) => {
    return chrome.navigate('http://joelgriffith.net');
  });
};

boot();
```

> You can also register jobs immediately without blocking based on start.

*JavaScript*
```js
const { Navalia } = require('navalia');
const navalia = new Navalie();

navalia.start();
navalia.register((chrome) => {
  return chrome.navigate('http://joelgriffith.net');
});
```

*TypeScript*
```ts
import { Navalia } from 'navalia';
const navalia:Navalia = new Navalia();

navalia.start();

navalia.register(async (chrome) => {
  return chrome.navigate('http://joelgriffith.net');
});
```
