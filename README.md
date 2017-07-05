# Navalia

[![npm version](https://badge.fury.io/js/navalia.svg)](https://badge.fury.io/js/navalia)
[![Build Status](https://travis-ci.org/joelgriffith/navalia.svg?branch=master)](https://travis-ci.org/joelgriffith/navalia)

`npm install --save navalia`

Automate and scale browser workflows with a sane API. Navalia exports a handy `Navalia` module that acts as browser-load balancer, as well as a `Chrome` module that you can consume for scripting or CI purposes.

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
const navalia = new Navalia({ numInstances: 1 });

const snapshotFavPages = async() => {
  await navalia.start();

  navalia.register(async(chrome) => {
    await chrome.navigate('http://www.google.com/');
    await chrome.pdf('/Users/jgriffith/Downloads/google.pdf');
  });

  navalia.register(async(chrome) => {
    await chrome.navigate('http://www.facebook.com/');
    await chrome.pdf('/Users/jgriffith/Downloads/facebook.pdf');
  });
};

snapshotFavPages();
```

## Chrome Example
```ts
// Single chrome instance, no queueing or job handling
// even though it does parallelize with tabs
import { Chrome } from 'navalia';

const chrome = new Chrome();

async function screenshotHN() {
  const tab = await chrome.start();

  await tab.navigate('https://news.ycombinator.com/');
  await tab.click('a')
  await tab.wait(500);
  await tab.screenshot('/Users/jgriffith/Downloads/hn.png');
  return tab.done();
}

async function searchNavalia() {
  const tab = await chrome.start();

  await tab.navigate('https://duckduckgo.com/');
  await tab.type('#search_form_input_homepage', 'navalia');
  await tab.click('#search_button_homepage');
  await tab.wait(1500)
  await tab.screenshot('/Users/jgriffith/Downloads/ddg.png')
  await tab.done();
}

// Runs all work in parallel then closes Chrome
Promise.all([
  screenshotHN(),
  searchNavalia()
]).then(() => chrome.quit());
```

## More Examples

Looking for more? [Check out the Recipes](RECIPES.md).

## API

#### new Navalia(options: NavaliaOptions)

Sets up a new `Navalia` instance. This instance manages all the jobs, and queues those when resources aren't available. The following options are below:

`numInstances?: number`
The number of running browser applications. Defaults 1 since `Chrome` utilizes tabs for executing work in parallel.

`maxJobs?: number`
The number of "jobs" an instance should can run before it reboots. Defaults to `-1`, which means that the instance will never reboot based on the number of jobs it runs

`workerTTL?: number`
The total-time-of-life an instance should run before it's rebooted. Defaults to `-1`, which means that the instance will never reboot based on a time expiration.

`chromeOptions?: object`
An object of options to pass into the startup of Chrome. These are all the hashes one would use on the CLI, but are instead snakeCased. For instances `--headless` becomes `headless: true`, and `--hide-scrollbars` becomes `noScrollbars: true`. Defaults to `{ headless: true, disableGpu: true, hideScrollbars: true }`

#### register: Function((chrome: chromeInstance): Promise<any>): void

Registers a function, to be called with an instance of chrome (or whatever browser in the future). This function will execute immediately if there's an available instance. If not, the function is queued and will be handled by the next available browser. See the below docs on the browser API.

The registered function _must_ either return a `Promise`, or a value when using `await`. Internally, Navalia waits for this function to resolve so it can begin other work.

#### start: Function(): Promise<void>

Starts the browser(s) and sets them up for work. Since this action is asyncrounous, it's recommended that you delay queueing jobs until this method returns.

#### launchInstance: Function(options:object): Promise<instance>

Launches a new instance, which can begin to immediately work if there's a queue already formed. If not, this instance will be kept around for futher jobs.

## Browser API

#### navigate: Function(url: string, opts: object): Promise<void>
```js
await chrome.navigate('http://www.cnn.com');
```
Navigates the browser to a particular URL. Can supply a second argument, which is a hash that currently supports only `onload`, fired when the browsers `window.onload` event takes place.

#### evaluate: Function(expression: function, ...args?: array<any>): Promise<any>
```js
await chrome.evaluate(() => window.location.href); // http://cnn.com
```
Executes the function and returns its value. You can optionally add any number of arguments needed for your function to execute. This happens in a _separate_ context from Node, so you must pass in all parameters that the function needs in the `#evaluate` call. IE: `chrome.evaluate((selector) => document.querySelector(selector), '.buy-now')`

#### screenshot: Function(filePath: string): Promise<any>
```js
await chrome.screenshot('/Users/me/Downloads/site.png');
```
Saves a PNG of the current page's viewport. file-path should be the absolute-path where this file will will be saved.

#### pdf: Function(filePath: string): Promise<any>
```js
await chrome.pdf('/Users/me/Downloads/site.pdf');
```
Saves a PDF of the current page. file-path should be the absolute-path where this file will will be saved.

#### size: Function(width: number, height: number): Promise<any>
```js
await chrome.size(960, 320);
```

Sets the window size of the browser by width and height.

#### exists: Function(selector: string): Promise<boolean>
```js
await chrome.exists('.my-button'); // true
```

Accepts a `querySelector` css-string (example: chrome.exists('.some-class')), and returns a boolean if the selector exists on the page.

#### html: Function(selector: string): Promise<string>
```js
await chrome.html('.my-button'); // <button class="my-button">Click Me!</button>
```

Accepts a `querySelector` css-string (example: chrome.exists('.some-class')), and the HTML of the node.

#### click: Function(selector: string): Promise<void>
```js
await chrome.click('.my-button');
```
Clicks on an element by executing `querySelector` on the supplied selector.

#### focus: Function(selector: string): Promise<void>
```js
await chrome.focus('.my-button');
```
Focuses on an element by executing `querySelector` on the supplied selector.

#### type: Function(selector: string, value: string): Promise<void>
```js
await chrome.type('.search-input', 'navalia github');
```
Types text into an element using `querySelector`.

#### check: Function(selector: string): Promise<void>
```js
await chrome.check('.signup-email');
```
Sets the checkbox to checked via the supplied selector.

#### uncheck: Function(selector: string): Promise<void>
```js
await chrome.uncheck('.new-offers');
```
Sets the checkbox to unchecked via the supplied selector.

#### select: Function(selector: string, option: string): Promise<void>
```js
await chrome.select('.car', 'model-3');
```
Selectes the `<option>` of the `<select>` element where `value === option`.

#### visible: Function(selector: string): Promise<boolean>
```js
await chrome.visible('.call-to-action');
```
Returns if the element, via the selector, is visible or not.

#### wait: Function(time: number): Promise<void>
```js
await chrome.wait(500);
```
Forces chrome to wait before executing the next action, where time is in milliseconds. This can be useful for async actions.

#### done: Function(): Promise<void>
```js
await chrome.done();
```
Exists the current Chrome session. `Navalia` does this for you automatically, so it's not necessary to call it when `register`ing jobs. However, if you're using the `Chrome` module it's important to call `done` so that the target can be closed.

## Debugging

Navalia prints nearly every interaction by using the module `debug`. To get debug information, launch your script with:

```bash
# Log all messages. Omit `navalia` or `chrome` to filter out messages
$ DEBUG=navalia,chrome node index.js
```

## Roadmap

In no particular order, this is the vision of navalia going forward:

- [X] Expanded browser API (pdf rendering, network watching, more).
- [ ] Bring more vendors onto the framework.
- [ ] Better typings around externals with no @type support.
- [ ] Parameterization on killing long-running jobs.
- [ ] Unit testing all features.
- [ ] Integration testing with the various vendors so our API's don't break when theirs do.
- [X] Travis, coveralls, greenkeeper, and other handy-dandy tools to automate chore tasks.
