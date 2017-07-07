---
title: Constructor
category: Chrome
order: 1
---

The `Chrome` module provides programatic access to an instance of Chrome, and uses `Targets` (you can think of incognito-tabs) for each execution. It doesn't do any work queueing, but instead offers a simple way to script against a live browser when you don't really need any work queueing.

> You can view logs when the 'DEBUG' environment variable contains 'navalia:chrome' `DEBUG=navalia:chrome node my-script.js`

- [Flags](#flags)
- [Max Active Tabs](#maxactivetabs)

### flags

An optional parameter of flags to pass the chrome execution. This should be a hash of `parameter: boolean`. By default, Chrome will boot with these flags: `--headless --disable-gpu --hide-scrollbars`. If you wish to disables these, you can do by setting them to `false` in the constructor.

A [large list of options is published here](https://peter.sh/experiments/chromium-command-line-switches/).

*JavaScript*
```js
const { Chrome } = require('navalia');

// Translates to `chrome --disable-sync`
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

// Translates to `chrome --disable-sync`
const chrome:Chrome = new Chrome({
  flags: {
    headless: false,
    disableSync: true,
  },
});
```

### maxActiveTabs

The `maxActiveTabs` is a limit on the concurrent number of tabs that Chrome can execute against. When this limit is reached, an exception will be thrown when trying to execute more work than tabs available. You should check the `isBusy()` method prior to launching more work (Navalia does this for you automatically and will queue work based on this result).

This defaults to `-1`, which indicicates that there is no limit on the number of concurrent tabs.

*JavaScript*
```js
const { Chrome } = require('navalia');

const chrome = new Chrome({
  maxActiveTabs: 20,
});
```

*TypeScript*
```ts
import { Chrome } from 'navalia';

const chrome:Chrome = new Chrome({
  maxActiveTabs: 20,
});
```
