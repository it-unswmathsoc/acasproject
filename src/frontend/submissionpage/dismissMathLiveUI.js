const SHARED_OVERLAY_IDS = [
  'mathlive-environment-popover',
  'mathlive-suggestion-popover',
  'mathlive-keystroke-caption-panel',
];

/** Tear down MathLive keyboard, menu, and other global overlays. */
export function dismissMathLiveUI(field) {
  if (field) {
    try {
      field.blur();
    } catch (_) {
      // ignore
    }
    try {
      field.executeCommand('hideVirtualKeyboard');
    } catch (_) {
      // ignore
    }
  }

  if (typeof window !== 'undefined' && window.mathVirtualKeyboard) {
    try {
      window.mathVirtualKeyboard.hide({ animate: false });
    } catch (_) {
      // ignore
    }
  }

  SHARED_OVERLAY_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.classList.remove('is-visible');
    el.style.visibility = 'hidden';
    el.style.pointerEvents = 'none';
  });

  document.querySelectorAll('.ML__keyboard').forEach((el) => {
    el.classList.remove('is-visible');
    el.remove();
  });
}
