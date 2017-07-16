---
title: .coverage
category: Chrome
---

The `coverage` method checks the coverage info for a particular resource (JS or CSS). In order to collect coverage, you must call `goto` with a second parameter of `{ coverage: true }`. This is so that Navalia can properly instrument Chrome to collect coverage.

This async method will return an object with these properties:

- `total` The total bytes of the script.
- `unused` The total unused bytes.
- `percentUnused` A floating-point number representing the percentage unused.

> It's likely that the Chrome browsers's Coverage tab will report different percent numbers than Navalia. This is largely due to _when_ you collect coverage information as more interactions on a page will return lower percentage of unused code. If see wildly different percentages please file an issue.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('http://joelgriffith.net/', { coverage: true })
.then(() => chrome.coverage('http://joelgriffith.net/main.bundle.js'))
.then((stats) => console.log(stats)) // Prints { total: 45913, unused: 5572, percentUnused: 0.12135996340905626 }
.then(() => chrome.done());
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

async function checkCoverage() {
  await chrome.goto('http://joelgriffith.net/', { coverage: true });
  const stats = await chrome.coverage('http://joelgriffith.net/main.bundle.js');
  console.log(stats); // Prints { total: 45913, unused: 5572, percentUnused: 0.12135996340905626 }
  chrome.done();
}

checkCoverage();
```
