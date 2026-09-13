let observer = null;
let cleanScheduled = false;
let cleanFrameRequest = null;
let remainingCleanFrames = 0;

const SHARE_URL_SELECTOR = 'input#share-url';
const SHARE_CONTROL_SELECTOR = [
  '#share-button',
  '.ytp-share-button',
  '[aria-label="Share"]',
  '[title="Share"]',
  // Menu items are included for localized YouTube interfaces, where the
  // accessible name is not necessarily "Share".
  'ytd-menu-service-item-renderer',
  'yt-menu-service-item-renderer',
].join(', ');
const CLEAN_RETRY_FRAMES = 120;

const cleanURL = (inputEl) => {
  if (!inputEl) return;
  try {
    const url = new URL(inputEl.value);
    if (url.searchParams.has('si')) {
      url.searchParams.delete('si');
      const cleanedURL = url.toString();

      // Keep the current value and the HTML attribute in sync. YouTube's
      // subscription share panel may populate either one after it is mounted.
      inputEl.value = cleanedURL;
      inputEl.defaultValue = cleanedURL;
    }
  } catch (_) {
    // silently fail
  }
};

const cleanShareURLs = () => {
  document.querySelectorAll(SHARE_URL_SELECTOR).forEach(cleanURL);
};

const cleanShareURLsForFrames = () => {
  remainingCleanFrames = Math.max(remainingCleanFrames, CLEAN_RETRY_FRAMES);
  if (cleanFrameRequest !== null) return;

  const cleanOnFrame = () => {
    cleanFrameRequest = null;
    cleanShareURLs();
    remainingCleanFrames -= 1;

    if (remainingCleanFrames > 0) {
      cleanFrameRequest = requestAnimationFrame(cleanOnFrame);
    }
  };

  cleanFrameRequest = requestAnimationFrame(cleanOnFrame);
};

const scheduleShareURLCleanup = () => {
  if (cleanScheduled) return;

  cleanScheduled = true;
  queueMicrotask(() => {
    cleanScheduled = false;
    cleanShareURLs();
  });
};

const handleCopyClick = (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.closest('#copy-button, .ytp-copylink-button')) {
    cleanShareURLs();
    cleanShareURLsForFrames();
  }
};

const handleShareOpen = (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.closest(SHARE_CONTROL_SELECTOR)) {
    cleanShareURLs();
    cleanShareURLsForFrames();
  }
};

const isShareURLNode = (node) =>
  node instanceof Element &&
  (node.matches(SHARE_URL_SELECTOR) || node.querySelector(SHARE_URL_SELECTOR));

const hasShareURLMutation = (records) =>
  records.some(
    (record) =>
      (record.type === 'attributes' && isShareURLNode(record.target)) ||
      (record.type === 'childList' && [...record.addedNodes].some(isShareURLNode)),
  );

const initializeScript = () => {
  if (observer) return;

  cleanShareURLs();

  observer = new MutationObserver((records) => {
    if (!hasShareURLMutation(records)) return;

    scheduleShareURLCleanup();
    // The subscriptions page can assign the share URL after attaching the
    // panel. Property assignment is not observable as a DOM mutation, so keep
    // checking briefly while YouTube finishes rendering the panel.
    cleanShareURLsForFrames();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['value'],
  });
};

const cleanupScript = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (cleanFrameRequest !== null) {
    cancelAnimationFrame(cleanFrameRequest);
    cleanFrameRequest = null;
  }
  remainingCleanFrames = 0;
};

document.addEventListener('visibilitychange', () => {
  document.hidden ? cleanupScript() : initializeScript();
});
document.addEventListener('pointerdown', handleShareOpen, true);
document.addEventListener('click', handleShareOpen, true);
document.addEventListener('pointerdown', handleCopyClick, true);
document.addEventListener('click', handleCopyClick, true);
document.addEventListener('yt-navigate-finish', scheduleShareURLCleanup);

if (!document.hidden) {
  initializeScript();
}

window.addEventListener('beforeunload', cleanupScript);
