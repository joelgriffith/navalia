---
title: .start
category: Navalia
order: 2
---

The `start` method is called after construction of the `Navalia` instance. This is an asyncronous function that will start up the browser instances and return when everything is in a ready state. Jobs can still be registered immediately after calling as well.

*JavaScript*
```js
const { Navalia } = require('navalia');
const navalia = new Navalie();

navalia.start.then(() => {
  console.log('navalia is ready!');
});
```

*TypeScript*
```ts
import { Navalia } from 'navalia';
const navalia:Navalia = new Navalia();

async const boot = () => {
  await navalia.start();
  console.log('navalia is ready!');
};

boot();
```
