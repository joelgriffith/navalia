---
title: Constructor
category: Navalia
order: 1
---

The `Navalia` module is a high-level manager that is used to balance and queue jobs against a browser (currently only Chrome is supported). Similar to web frameworks, the `Navalia` module doesn't exit after all jobs are executed, but will hold onto the process until it's terminated manually (CTRL+C). This allows for jobs to be ran against it asyncronously.

This document details the parameters you can use in constructing this module, which accepts a single argument: an object detailing the configuration.

> You can view logs when the 'DEBUG' environment variable contains 'navalia' `DEBUG=navalia node my-script.js`

- [Number of Instances](#numinstances)
- [Max Jobs](#maxjobs)
- [Worker time-to-live](#workerttl)
- [Chrome Options](#chromeoptions)

### numInstances

An optional parameter which is used to launch a number of instances for Navalia to manage. Defaults to `1`. Navalia keeps these browsers open regardless of load due to high-latency when starting them.

*JavaScript*
```js
const { Navalia } = require('navalia');

const navalia = new Navalia({
  numInstances: 2,
});
```

*TypeScript*
```ts
import { Navalia } from 'navalia';

const navalia:Navalia = new Navalia({
  numInstances: 2,
});
```

### maxJobs

The maximum number of jobs that a browser can execute before being rebooted. This parameter defaults to `-1`, or no maximum.

*JavaScript*
```js
const { Navalia } = require('navalia');

const navalia = new Navalia({
  maxJobs: 50,
});
```

*TypeScript*
```ts
import { Navalia } from 'navalia';

const navalia:Navalia = new Navalia({
  maxJobs: 50,
});
```

### workerTTL

The time-to-live in milliseconds that a browser can operate before being rebooted. This parameter defaults to `-1`, or no TTL.

*JavaScript*
```js
const { Navalia } = require('navalia');

const navalia = new Navalia({
  workerTTL: 1000 * 60 * 60 * 2, // 2 hours
});
```

*TypeScript*
```ts
import { Navalia } from 'navalia';

const navalia:Navalia = new Navalia({
  workerTTL: 1000 * 60 * 60 * 2, // 2 hours
});
```

### chromeOptions

The options to pass into each `Chrome` instance when started. The available options are:

- `flags`: An object of key-value pairs where the keys are camel-case Chrome flags and values are a boolean representing whether or not to pass the flags. A [large list of flag options is published here](https://peter.sh/experiments/chromium-command-line-switches/). Defaults to: `--headless --disable-gpu --hide-scrollbars`.

- `timeout`: A Global default timeout for individual actions. This is a timer in `ms`, and will fail the action if the timeout is breached. You can also specify a per-action timeout as well. Defaults to `1000`.

- `maxActiveTabs`: The maximum number of concurrent tabs that can be open at any given time. Defaults to `-1` (Infinity).

*JavaScript*
```js
const { Navalia } = require('navalia');

const navalia = new Navalia({
  chromeOptions: {
    maxActiveTabs: 10,
    timeout: 5000,
    flags: {
      disableSync: true,
    },
  },
});
```

*TypeScript*
```ts
import { Navalia, chromeOptions } from 'navalia';

const navalia:Navalia = new Navalia({
  chromeOptions: {
    maxActiveTabs: 10,
    timeout: 5000,
    flags: {
      disableSync: true,
    },
  },
});
```
