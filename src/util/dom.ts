export function waitForElement(
  selector: string,
  timeout: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeOutId = setTimeout(() => {
      reject(`Selector "${selector}" failed to appear in ${timeout} ms`);
    }, timeout);

    if (document.querySelector(selector)) return resolve();

    const observer = new MutationObserver(function(_mutations, observation) {
      const found = document.querySelector(selector);
      if (found) {
        observation.disconnect();
        clearTimeout(timeOutId);
        return resolve();
      }
    });

    // start observing
    observer.observe(document, {
      childList: true,
      subtree: true,
    });
  });
}

export function getPageURL(): string {
  return document.location.href;
}

export function click(selector: string): boolean {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(
      `:click() > Unable to find element by selector: ${selector}`
    );
  }
  const event = document.createEvent('MouseEvent');
  event.initEvent('click', true, true);
  element.dispatchEvent(event);
  return true;
}

export function html(selector: string): string {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(
      `:html() > Unable to find element by selector: ${selector}`
    );
  }
  return element.outerHTML;
}
