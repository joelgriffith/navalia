---
title: .goto
category: Chrome
---

The async `goto` method navigates Chrome to a webpage. By default, it waits for the pageload event, but can be overriden. `goto` considers practically any response a success, except for network errors or timeouts. Redirects and other mechanisms for navigation are considered successful.

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com');
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

chrome.goto('https://www.google.com');
```

And overriding pageload can be achieved by:

*JavaScript*
```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.goto('https://www.google.com', { onload: false });
```

*TypeScript*
```ts
import { Chrome } from 'navalia';
const chrome = new Chrome();

chrome.goto('https://www.google.com', { onload: false });
```
