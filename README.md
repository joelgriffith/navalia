![Navalia](./assets/logo-color.png)

[![npm version](https://badge.fury.io/js/navalia.svg)](https://badge.fury.io/js/navalia)
[![Build Status](https://travis-ci.org/joelgriffith/navalia.svg?branch=master)](https://travis-ci.org/joelgriffith/navalia)
[![dependencies Status](https://david-dm.org/joelgriffith/navalia/status.svg)](https://david-dm.org/joelgriffith/navalia)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

`npm install --save navalia`

[View the documentation here](https://joelgriffith.github.io/navalia/)

Automate and scale browser workflows with a sane API. Navalia exports a handy `Navalia` module that acts as browser-load balancer, as well as a `Chrome` module that you can use for an easier experience.

## Usage

- [Functional Testing](https://codeburst.io/composable-end-to-end-tests-for-react-apps-2ec82170af62)

- [Website Code Coverage](https://codeburst.io/capturing-unused-application-code-2b7594a9fe06)

**BETA WARNING**
This project heavily relies on bleeding-edge technology, as such the API and internals will likely change from time to time. I heavily recommend that you install `Chrome Canary` to capture the latest and greatest the browser has to offer.

## Features

- Runs and controls multiple instances of particular browser (currently Chrome).
- Capture screenshots, pdfs, execute javascript, insert text, and more.
- Queue work automatically when all instances are busy.
- Uses a simple, easy to understand API.
- Work can easily span over multiple pages or complex interactions.
- Set timers and max-jobs limitations on browsers, forcing them to reboot for easier memory management.

## Navalia Example
```javascript
// Navalia manages browser instances
// and can jobs can be queued against it
const { Navalia } = require('Navalia');
const navalia = new Navalia();

navalia.register((chrome) => {
  return chrome.goto('http://www.google.com/')
    .then(() => chrome.pdf('/Users/jgriffith/Downloads/google.pdf'));
});

navalia.register((chrome) => {
  return chrome.goto('http://www.facebook.com/')
    .then(() => chrome.pdf('/Users/jgriffith/Downloads/facebook.pdf'));
});
```

## Chrome Example
```ts
// Simple, easy to use Chrome wrapper
import { Chrome } from 'navalia';

const chrome = new Chrome();

async function screenshotHN() {
  await chrome.goto('https://news.ycombinator.com/');
  await chrome.click('a')
  await chrome.wait(500);
  await chrome.screenshot('/Users/jgriffith/Downloads/hn.png');
  return chrome.done();
}

screenshotHN();
```

## More Examples

Looking for more? [Check out the docs](https://joelgriffith.github.io/navalia/).

## Roadmap

In no particular order, this is the vision of navalia going forward:

- [X] Expanded browser API (pdf rendering, network watching, more).
- [ ] Bring more vendors onto the framework.
- [ ] Better typings around externals with no @type support.
- [ ] Parameterization on killing long-running jobs.
- [ ] Unit testing all features.
- [ ] Integration testing with the various vendors so our API's don't break when theirs do.
- [X] Travis, coveralls, greenkeeper, and other handy-dandy tools to automate chore tasks.
