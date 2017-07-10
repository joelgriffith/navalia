---
title: .kill
category: Navalia
order: 3
---

The `kill` method is used to shut-down Navalia. Any running jobs will be immediately closed, so it's important to ensure all your current work is captured and completed before calling `kill`.

*JavaScript*
```js
const { Navalia } = require('navalia');
const navalia = new Navalia();

navalia
.run((chrome) => chrome.navigate('http://joelgriffith.net'))
.then(() => navalia.kill());
```

*TypeScript*
```ts
import { Navalia } from 'navalia';
const navalia:Navalia = new Navalia();

async function visitMe() {
  await navalia.run(async (chrome) => chrome.navigate('http://joelgriffith.net'));
  navalia.kill();
}
```

> You can also run multiple jobs in parallel.

*JavaScript*
```js
const { Navalia } = require('navalia');
const navalia = new Navalie();

Promise.all([
  navalia.run((chrome) => {
    return chrome.navigate('http://joelgriffith.net');
  }),

  navalia.run((chrome) => {
    return chrome.navigate('https://news.ycombinator.net');
  }),
]).then(() => navalia.kill());
```

*TypeScript*
```ts
import { Navalia } from 'navalia';
const navalia:Navalia = new Navalia();

async function doJobs() {
  await Promise.all([
    navalia.run(async (chrome) => {
      return chrome.navigate('http://joelgriffith.net');
    }),

    navalia.run(async (chrome) => {
      return chrome.navigate('https://news.ycombinator.net');
    }),
  ]);

  navalia.kill();
}

doJobs();
```
