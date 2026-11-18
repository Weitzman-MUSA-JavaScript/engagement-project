// Keep native form submission unavailable until all application handlers exist.
// A failed import must leave a visible explanation, not reload the entry page.
export async function startApp({ load = () => import('./app.js'), root = document } = {}) {
  const buttons = [...root.querySelectorAll('#join-form button[type="submit"], #resume-form button[type="submit"]')];
  const status = root.querySelector('#startup-status');
  try {
    await load();
    buttons.forEach((button) => { button.disabled = false; });
    status.hidden = true;
    return true;
  } catch {
    buttons.forEach((button) => { button.disabled = true; });
    status.hidden = true;
    root.querySelector('#entry-error').textContent = 'The page could not finish loading. Reload to get the latest version. If this continues, try a hard refresh (Command–Shift–R on Mac; Ctrl–Shift–R on Windows/Linux). Your saved code and draft have not been cleared.';
    return false;
  }
}

if (typeof document !== 'undefined') void startApp();
