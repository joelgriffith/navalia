---
title: .pageload
category: Chrome
---

The `pageload` returns a promise that is resolved when the pageload event is fired. This can be effectively used to block further actions until a pageload has hit (for instance multi-page workflows).

> Note: nearly all methods will await pageload before executing, so it's not necessary to call this between page-transition events (IE: clicking an anchor).

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://duckduckgo.com/');
  .then(() => chrome.type('input[type="text"]', 'navalia github'))
  .then(() => chrome.click('#search_button_homepage'))
  .then(() => chrome.pageload()) // Wait for the new page to load before proceedin)
  .then(() => chrome.wait('#links > .result'))
  .then(() => chrome.html('h2 a'))
  .then((firstLink) => console.log(`First link is: ${firstLink}`))
  .then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function checkPageRank() {
  await chrome.goto('https://duckduckgo.com/');
  await chrome.type('input[type="text"]', 'navalia github');
  await chrome.click('#search_button_homepage');
  await chrome.pageload(); // Wait for the new page to load before proceeding
  await chrome.wait('#links > .result');
  const firstLink = await chrome.html('h2 a');
  console.log(`First link is: ${firstLink}`);
  return chrome.done();
}

checkPageRank();
```
