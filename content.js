let observer = null;

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

const initializeScript = () => {
  if (observer) return;

  observer = new MutationObserver(() => {
    const shareInput = document.getElementById('share-url');
    if (shareInput && shareInput.value) {
      cleanURL(shareInput);
    }
  });

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

if (!document.hidden) {
  initializeScript();
}

window.addEventListener('beforeunload', cleanupScript);
