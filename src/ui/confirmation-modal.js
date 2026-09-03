const STYLESHEET_ID = 'wm-frontend-shell-styles';

function ensureStylesheet() {
  if (document.getElementById(STYLESHEET_ID)) return;
  const link = document.createElement('link');
  link.id = STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = new URL('./frontend-shell.css?v=4', import.meta.url).href;
  document.head.append(link);
}

export function showConfirmationModal({
  kicker = 'WRECKMARCH // CONFIRM',
  title = 'CONFIRM ACTION?',
  body = 'This action cannot be undone.',
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  danger = false,
} = {}) {
  ensureStylesheet();

  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'wm-confirm-overlay';

    const dialog = document.createElement('section');
    dialog.className = `wm-confirm-dialog${danger ? ' is-danger' : ''}`;
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'wm-confirm-title');
    dialog.setAttribute('aria-describedby', 'wm-confirm-copy');

    const top = document.createElement('span');
    top.className = 'wm-shell-kicker';
    top.textContent = kicker;

    const heading = document.createElement('h2');
    heading.id = 'wm-confirm-title';
    heading.textContent = title;

    const copy = document.createElement('p');
    copy.id = 'wm-confirm-copy';
    copy.textContent = body;

    const actions = document.createElement('div');
    actions.className = 'wm-confirm-actions';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'wm-confirm-button';
    cancel.dataset.confirmAction = 'cancel';
    cancel.textContent = cancelLabel;

    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = `wm-confirm-button is-confirm${danger ? ' is-danger' : ''}`;
    confirm.dataset.confirmAction = 'confirm';
    confirm.textContent = confirmLabel;

    const finish = confirmed => {
      window.removeEventListener('keydown', onKeyDown);
      overlay.remove();
      resolve(Boolean(confirmed));
    };

    const onKeyDown = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      finish(false);
    };

    cancel.addEventListener('click', () => finish(false));
    confirm.addEventListener('click', () => finish(true));
    window.addEventListener('keydown', onKeyDown);

    actions.append(cancel, confirm);
    dialog.append(top, heading, copy, actions);
    overlay.append(dialog);
    document.body.append(overlay);
    cancel.focus({ preventScroll: true });
  });
}
