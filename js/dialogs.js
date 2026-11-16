export function containTabFocus(dialog) {
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button, summary, input, select, textarea, a[href], [tabindex="0"]')]
      .filter((control) => !control.disabled && control.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  });
}

export function createConfirmationDialog(dialog) {
  const cancel = dialog.querySelector('[data-confirm-cancel]');
  const confirm = dialog.querySelector('[data-confirm-accept]');
  let resolveChoice = null;
  let returnFocus = null;
  containTabFocus(dialog);
  cancel.addEventListener('click', () => dialog.close('cancel'));
  confirm.addEventListener('click', () => dialog.close('confirm'));
  dialog.addEventListener('close', () => {
    const resolve = resolveChoice;
    resolveChoice = null;
    if (returnFocus?.isConnected) returnFocus.focus();
    resolve?.(dialog.returnValue === 'confirm');
  });
  return ({ title, description, confirmLabel, cancelLabel }) => {
    if (dialog.open) return Promise.resolve(false);
    dialog.querySelector('[data-confirm-title]').textContent = title;
    dialog.querySelector('[data-confirm-description]').textContent = description;
    confirm.textContent = confirmLabel;
    cancel.textContent = cancelLabel;
    dialog.returnValue = 'cancel';
    returnFocus = document.activeElement;
    return new Promise((resolve) => {
      resolveChoice = resolve;
      dialog.showModal();
      cancel.focus();
    });
  };
}
