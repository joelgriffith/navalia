---
title: Introduction
---

Navalia is an easy-to-use browser automation framework that can also scale with just about any project. It has two primary objects: simplicity and performance. Browser automation should be an enjoyable experience and not a painful one.

> Fork or view the source [here](https://github.com/joelgriffith/navalia).

### Features

Navalia is a "batteries-included" framework that offers all of the following features:

- A simple, human-readable API.
- A GraphQL front-end.
- Massive parallelization by using tabs and multiple browser instances.
- Ability to capture screenshots, pdfs, execute javascript, insert text, and more on a webpage.
- Build multi-page workflows with complex user-interactions.
- Set thresholds like timers or TTL's for scripts so nothing blocks your execution.

### Getting Started

You'll need some software already installed on your system before using Navalia:

1. Chrome installed (more vendors to come soon) on your system.
2. Node.js needs to be  installed as well. You can install [node here](https://nodejs.org/en/).
3. If you wish to use a more strongly-typed experience, you can also install [typescript](https://www.typescriptlang.org/).

> Feel free to [open an issue on GitHub](https://github.com/joelgriffith/navalia/issues).

### Usage

The API for interacting with a browser is simple and chainable. You can call the methods individually and `await`/`then` the resulting value, or chain multiple together and collect their responses in a single result.

*Chaining*

```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome
  .goto('https://amazon.com')
  .type('input', 'Kindle')
  .click('.buy-now')
  .end()
  .then((responses) => {
    console.log(responses); // ['https://www.amazon.com/', true, true, true]
  });
```

*Await*

```js
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function buyItOnAmazon() {
  const url = await chrome.goto('https://amazon.com');
  const typed = await chrome.type('input', 'Kindle');
  const clicked = await chrome.click('.buy-now');

  chrome.done();

  console.log(url, typed, clicked);
}

buyItOnAmazon();
```
