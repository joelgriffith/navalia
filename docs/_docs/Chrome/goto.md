---
title: .goto
category: Chrome
---

The async `goto` method navigates Chrome to a webpage. By default, it waits for the pageload event, but can be overriden. Below is an example of going to google.com.

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
