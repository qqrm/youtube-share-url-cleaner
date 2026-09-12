let observer = null;
let cleanScheduled = false;

const cleanURL = (inputEl) => {
  if (!inputEl) return;
  try {
    const url = new URL(inputEl.value);
    if (url.searchParams.has('si')) {
      url.searchParams.delete('si');
      inputEl.value = url.toString();
    }
  } catch (_) {
    // silently fail
  }
};

const cleanShareURLs = () => {
  document.querySelectorAll('#share-url').forEach(cleanURL);
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
  }
};

const initializeScript = () => {
  if (observer) return;

  cleanShareURLs();

  observer = new MutationObserver(scheduleShareURLCleanup);

  observer.observe(document.body, { childList: true, subtree: true });
};

const cleanupScript = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

document.addEventListener('visibilitychange', () => {
  document.hidden ? cleanupScript() : initializeScript();
});
document.addEventListener('click', handleCopyClick, true);
document.addEventListener('yt-navigate-finish', scheduleShareURLCleanup);

if (!document.hidden) {
  initializeScript();
}

window.addEventListener('beforeunload', cleanupScript);
