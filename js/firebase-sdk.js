const VERSION = '13.3.0';
let sdk;
export function loadFirebaseSdk() {
  sdk ||= Promise.all([
    import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-firestore.js`),
  ]).then((modules) => Object.assign({}, ...modules)).catch((error) => { sdk = null; throw error; });
  return sdk;
}
