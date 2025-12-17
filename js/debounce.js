// Debounce by Josh Comeau
// https://www.joshwcomeau.com/snippets/javascript/debounce/

function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, wait);
    };
  }


export { debounce };