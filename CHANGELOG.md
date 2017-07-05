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
