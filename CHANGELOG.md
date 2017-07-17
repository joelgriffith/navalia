# 0.0.22

## Features
- New `attr` API that follows the same signature as jQuery's.
- New `cookie` API that allows for interacting with site cookies.

# 0.0.21

## Features
- `coverage` now works for CSS!
- We now use `prettier`, and this _will_ run on commits to ensure some level of formatting/consistency is there.

## Fixes
- Some small bugfixes and better logging.

# 0.0.20

## Features
- New `.text` API for getting the `text` inside of an element (and it's children).

## Bugfix
- Small fix in `evaluate` when a `null` is returned (no longer throws).

# 0.0.19

## Features
- More tests! Thanks @mute!
- `fetch` API now returns all the data that comes with a network request.

## Breaking
- `fetch`: Prior to 0.0.19, fetch simply returned the response body. You can refernce that data in the `body` property of the response going forward:

```
// before
const it = await chrome.fetch('myurl');
console.log(it)

// after
const it = await chrome.fetch('myurl');
console.log(it.body);
```

# 0.0.18

## Features
- `fetch`-like API for running arbitrary network requests with familiar interface

## Fixes
- Turning back on tests :)

# 0.0.17

## Features
- `screenshot` now returns a Buffer of base64 encoded data when supplied with no path.
- Links to external DOCS in the README.

# 0.0.16

## Fixes
- `focus` and `type` now emit native events and not synthetic JavaScript ones.

# 0.0.15

## Features
- `Navalia.kill` is now exposed so that it can be shutdown.
- `Navalia.run` returns a `Promise` for better orchestration around jobs.
- `chrome.pageload` to wait for pageload on multi-page scripts.

# 0.0.14

## Features
- `wait` now accepts a dom-node selector to wait on.
- `evaluate` can now run async functions as Navalia instruments Chrome properly.

# 0.0.13

## Fixes
- README logo fixes and npm meta data.

# 0.0.12

## Features
- New `save` method to capture page HTML (useful for SEO generation).
- Package updates
- Minor logging improvements

# 0.0.11

## Features
- New `coverage` method on browser-api. Automate runtime coverage in an easy way
- New `inject` method to inject css or js into a page.
- Lots of docs and visual updates.

# 0.0.10

## Features
- No need to call `start` on either `Chrome` or `Navalia` as they lazily begin execution.
- New docs page at https://joelgriffith.github.io/navalia/
- Tighter error handling inside the browser API when things go wrong.
- Consolidated typings into a chrome-utility.

## Breaking
- `chrome.navigate` is now `chrome.goto`
- `navalia.register` is now `navalia.run`
- Both `chrome` and `navalia` no longer have `start` methods, just construct them and start using them.

# 0.0.9

## Features
- `Chrome` now parallelizes requests internally using tabs.
- `ChromeTab` module for consolidating Browser API (not exported).
- More verbose logging for debugging purposes.
- Lots of new browser API's: `type`, `click`, `check`, `uncheck`, `select`, and `visible`. More still to come.

## Breaking Changes
- ALL browser API's have moved from their prior names to ALL lowercase. EG: `screenShot => screenshot`. This was done to help prevent fat-fingering.
- `navalia.startup` is now `navalia.start`.
- Debug logs now use `navalia:` prepended to better scope to this package.
- `chrome.trigger` is no longer available. Look into methods like `chrome.click` to replace prior behavior.
- `chome.launch` now returns a Promise with a `tab` instance. It's this `tab` instance that contains the browser API. This change was necessary to allow parallelization through tabs.
- `chrome.destroy` is now `chrome.quit` to help onboard unfamiliar consumers since it's easier to reason about.

## Bugfixes
- `chrome.done` now cleans-up properly.
- `Navalia` better handles cleanup internally when jobs are done.
