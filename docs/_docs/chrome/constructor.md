---
title: Constructor
category: Chrome
order: 1
---

The `Chrome` module provides programatic access to an instance of Chrome, and implements the browser-api. It doesn't do any work queueing, but instead offers a simple way to script against a live browser.

It's important to call `done` at the end of your script so that the browser exists and the process is freed. Otherwise the program will continue to be active.

- [Flags](#flags)
- [Timeout](#timeout)
- [Remote](#remote)

> You can view the chrome logs by setting the DEBUG environment variable to contain 'navalia:chrome' > `DEBUG=navalia:chrome node my-script.js`

## timeout

A time in milliseconds to use as a default for various asyncronous actions. This generally effects most DOM API's, where Chrome will wait for a selector before executing.

*JavaScript*
```js
const { Chrome } = require('navalia');

const chrome = new Chrome({
  timeout: 60000,
});
```

*TypeScript*
```ts
import { Chrome } from 'navalia';

// Translates to `chrome --disable-sync --headless`
const chrome:Chrome = new Chrome({
  timeout: 60000,
});
```

## flags

An optional parameter of flags to pass the chrome execution. This should be a hash of `parameter: boolean`. By default, Chrome will boot with these flags: `--headless --disable-gpu --hide-scrollbars`. If you wish to disables these, you can do by setting them to `false` in the constructor.

A [large list of options is published here](https://peter.sh/experiments/chromium-command-line-switches/).

*JavaScript*
```js
const { Chrome } = require('navalia');

// Translates to `chrome --disable-sync --headless`
const chrome = new Chrome({
  flags: {
    headless: false,
    disableSync: true,
  },
});
```

*TypeScript*
```ts
import { Chrome } from 'navalia';

// Translates to `chrome --disable-sync --headless`
const chrome:Chrome = new Chrome({
  flags: {
    headless: false,
    disableSync: true,
  },
});
```

## remote

The `remote` propery allows you to specify an already-running Chrome instance to connect to. It accepts two parameters: a `host` property and a `port` to connect with. This allows you to drive a Chrome instance in, say, AWS GCP and more.

*JavaScript*
```js
const { Chrome } = require('navalia');

// Connect to a local running instance on port 9222
const chrome = new Chrome({
  remote: {
    host: 'localhost',
    port: 9222,
  }
});
```

*TypeScript*
```ts
import { Chrome } from 'navalia';

// Connect to a local running instance on port 9222
const chrome:Chrome = new Chrome({
  remote: {
    host: 'localhost',
    port: 9222,
  }
});
```
