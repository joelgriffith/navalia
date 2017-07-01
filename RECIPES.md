# Recipes

Below is a list of common web tasks in Navalia. These are used for illustration purposes, and much more elaborate workflows can be accomplished when necessary

- [Screenshot a website](#screenshot)
- [Save a website to PDF](#pdf)
- [Click a button](#events)
- [See if an element exists](#exists)
- [Run arbitrary javascript](#evaluate)

## Screenshot

Use the `Chrome` constructor to navigate to a page and screenshot it locally (Using Promises).

```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.launch().then(() => {
  return chrome.navigate('http://www.reddit.com/')
    .then(() => chrome.screenShot('/Users/jgriffith/Downloads/google.png'))
    .then(() => chrome.done());
});
```

## PDF

Use the `Chrome` constructor to navigate to a page and pdf it locally (Using async/await).

```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

async function savePDF() {
  await chrome.launch();
  await chrome.navigate('http://www.medium.com/');
  await chrome.pdf('/Users/jgriffith/Downloads/medium.pdf');
  return chrome.done();
}

savePDF();
```

## Events

Use the `Chrome` constructor to load a page and click a link (Using TypeScript);

```ts
import { Chrome } from 'navalia';

const chrome: Chrome = new Chrome();

async function clickAThing(): Promise<any> {
  await chrome.launch();
  await chrome.navigate('http://news.ycombinator.com');
  await chrome.trigger('click', '.athing');
  return chrome.done();
}

clickAThing();
```

## Exists

Use the `Chrome` constructor to navigate to a page and see if an element exists (Promises).

```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome.launch().then(() => {
  return chrome.navigate('http://www.reddit.com/')
    .then(() => chrome.exists('button.buy-now'))
    .then((exists) => {
      if (!exists) {
        throw new Error('Can\'t find buy-it-now button!');
      }
      return console.log('Its still there!');
    })
    .then(() => chrome.done());
});
```

## Evaluate

Use the `Chrome` constructor to navigate to a page and run some custom javascript (async/await).

```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

async function getTitle() {
  await chrome.launch();
  await chrome.navigate('http://www.reddit.com/');
  const res = await chrome.evaluate('document.querySelector("title").text;');
  console.log(res);
}
getTitle();
```
