# FAQ

Below are some common tricks and fixes for things you might encounter when running Navalia.

### I'm getting `ECONNREFUSED` when starting, what gives?

If you're seeing this error, and are running chrome manually, you'll need to open a port for remote debuggers to connect with. For windows, this looks like `chrome.exe --remote-debugging-port=9222`. On linux systems, you might also need to disable sandboxing as well `--no-sandbox` (or, in the constructor of Chrome, pass in `{ flags: { noSandbox: true } }`).

### Nothing's happening when I run my script, how can I fix this?

It's likely that either something is erroring or not connecting properly. Navalia logs verbose information, you just need to start the program with `DEBUG=navalia:chrome` or even `DEBUG=*` to see these logs.

### I want XYZ API!

Please file an issue! Even if you want to just discuss things more broadly.
