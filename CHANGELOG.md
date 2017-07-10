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
