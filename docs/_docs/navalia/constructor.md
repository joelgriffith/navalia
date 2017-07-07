---
title: Constructor
category: Navalia
order: 1
---

The `Navalia` module is a high-level manager that is used to balance and queue jobs against a browser (currently only Chrome is supported). This document details the parameters you can use in constructing this module, which accepts a single argument: an object detailing the configuration.

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

The options to pass into each `Chrome` instance when started. These are translated into the flags you can pass when booting chrome from a command-line. A [large list of options is published here](https://peter.sh/experiments/chromium-command-line-switches/).

*JavaScript*
```js
const { Navalia } = require('navalia');

const navalia = new Navalia({
  chromeOptions: {
    disableSync: true,
  },
});
```

*TypeScript*
```ts
import { Navalia, chromeOptions } from 'navalia';

const navalia:Navalia = new Navalia({
  chromeOptions: {
    disableSync: true,
  },
});
```
