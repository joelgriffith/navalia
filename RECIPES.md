# Recipes

Below is a list of common web tasks in Navalia. These are used for illustration purposes, and much more elaborate workflows can be accomplished when necessary

- [Screenshot a website](#screenshot)
- [Save a website to PDF](#pdf)
- [Click a button](#click)
- [See if an element exists](#exists)
- [Run arbitrary javascript](#evaluate)

## Screenshot

Use the `Chrome` constructor to navigate to a page and screenshot it locally (Using Promises).

```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome
  .start()
  .then((tab) => 
    tab.navigate('http://www.reddit.com/')
      .then(() => tab.screenshot('/Users/jgriffith/Downloads/google.png'))
      .then(() => tab.done())
  );
```

## PDF

Use the `Chrome` constructor to navigate to a page and pdf it locally (Using async/await).

```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

async function savePDF() {
  const tab = await chrome.start();
  await tab.navigate('http://www.medium.com/');
  await tab.pdf('/Users/jgriffith/Downloads/medium.pdf');
  return tab.done();
}

savePDF();
```

## Click

Use the `Chrome` constructor to load a page and click a link (Using TypeScript);

```ts
import { Chrome } from 'navalia';

const chrome: Chrome = new Chrome();

async function clickAThing(): Promise<any> {
  const tab = await chrome.start();
  await tab.navigate('http://news.ycombinator.com');
  await tab.click('.athing');
  return tab.done();
}

clickAThing();
```

## Exists

Use the `Chrome` constructor to navigate to a page and see if an element exists (Promises).

```js
const { Chrome } = require('navalia');
const chrome = new Chrome();

chrome
  .start()
  .then((tab) => 
    tab.navigate('http://www.reddit.com/')
      .then(() => tab.exists('button.buy-now'))
      .then((exists) => {
        if (!exists) {
          throw new Error('Can\'t find buy-it-now button!');
        }
        return console.log('Its still there!');
      })
      .then(() => tab.done())
      .catch(() => tab.done());
);
```

## Evaluate

Use the `Chrome` constructor to navigate to a page and run some custom javascript (async/await).

```js
const { Chrome } = require('navalia');
const chrome = new Chrome();
const buyButton = 'button.buy-now';

async function getTitle() {
  const tab = await chrome.start();
  await tab.navigate('http://www.reddit.com/');
  const res = await tab.evaluate((selector) => {
    return document.querySelector(selector);
  }, buyButton);
  console.log(res);
}
getTitle();
```
