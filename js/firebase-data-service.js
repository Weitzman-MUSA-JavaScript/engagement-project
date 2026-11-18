import { loadFirebaseSdk } from './firebase-sdk.js';
import { SESSIONS, EXAMPLES, validateContribution, validateResponse, responseQuestion, summarize } from './domain.js';
import { COORDINATE_CRS, isPhiladelphiaPoint } from './geography.js';
import { searchLocations } from './locations.js';
import { exportCsv } from './csv.js';
import { exportGeoJSON } from './geojson.js';

const iso = (value) => value?.toDate ? value.toDate().toISOString() : value || null;
const abort = (signal) => { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); };
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
async function emailFor(token) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return `${[...new Uint8Array(bytes)].map((n) => n.toString(16).padStart(2, '0')).join('')}@practice.invalid`;
}
function publicPin(snapshot, uid) {
  const { ownerUid, withdrawn, ...pin } = snapshot.data();
  const geometry = pin.geometry && isPhiladelphiaPoint(pin.geometry.coordinates) ? pin.geometry : null;
  return { ...pin, id: snapshot.id, geometry, locationStatus: geometry ? 'placed' : 'unconfirmed', locationSource: geometry ? pin.locationSource : 'description', createdAt: iso(pin.createdAt), updatedAt: iso(pin.updatedAt), reviewEnteredAt: iso(pin.reviewEnteredAt), mine: ownerUid === uid, fixture: false };
}

export function createFirebaseDataService(context, config, { loadSdk = loadFirebaseSdk, emulators, lookupLocations = searchLocations } = {}) {
  let runtimePromise, currentToken;
  let authQueue = Promise.resolve(), identityEpoch = 0;
  const current = (epoch) => { if (epoch !== identityEpoch) throw new DOMException('Participant changed', 'AbortError'); };
  const withAuth = (action) => { const next = authQueue.then(action); authQueue = next.catch(() => {}); return next; };
  const ready = () => {
    if (!config?.apiKey || !config?.projectId || !config?.appId) {
      fail('Firebase is not configured for this site. Add your dedicated project’s web configuration to js/firebase-config.js and publish its access rules. See FIREBASE-SETUP.md.', 503);
    }
    runtimePromise ||= loadSdk().then((sdk) => {
      const app = sdk.initializeApp(config, `community-safety-${crypto.randomUUID()}`);
      const auth = sdk.initializeAuth(app, { persistence: sdk.inMemoryPersistence });
      const db = sdk.getFirestore(app);
      if (emulators) {
        sdk.connectAuthEmulator(auth, emulators.auth, { disableWarnings: true });
        sdk.connectFirestoreEmulator(db, emulators.firestore.host, emulators.firestore.port);
      }
      return { sdk, app, auth, db };
    }).catch((error) => { runtimePromise = null; throw error; });
    return runtimePromise;
  };
  const ref = (runtime, ...path) => runtime.sdk.doc(runtime.db, ...path);
  const collection = (runtime, ...path) => runtime.sdk.collection(runtime.db, ...path);
  const get = (runtime, ...path) => runtime.sdk.getDocFromServer(ref(runtime, ...path));
  const list = (runtime, path, ...filters) => runtime.sdk.getDocsFromServer(runtime.sdk.query(collection(runtime, ...path), ...filters.map(([field, value]) => runtime.sdk.where(field, '==', value))));
  async function authenticate(runtime, token, epoch) {
    if (!/^[a-f0-9]{64}$/.test(token || '')) fail('Enter a valid practice return code, or start a new participant.', 401);
    return withAuth(async () => {
      current(epoch);
      if (currentToken !== token || !runtime.auth.currentUser) {
        await runtime.sdk.signInWithEmailAndPassword(runtime.auth, await emailFor(token), token);
        currentToken = token;
      }
      current(epoch);
      return runtime.auth.currentUser.uid;
    });
  }
  async function actor(runtime, uid) {
    const value = await get(runtime, 'participants', uid);
    if (!value.exists()) fail('This participant has not finished starting. Start a new practice participant.', 401);
    return value.data();
  }
  async function requireReview(runtime, uid) {
    const participant = await actor(runtime, uid);
    if (participant.phase !== 'review') fail('Enter review before reading other practice accounts or exporting.', 403);
    return participant;
  }
  async function findPin(runtime, uid, id) {
    const example = EXAMPLES.find((pin) => pin.id === id);
    if (example) { await requireReview(runtime, uid); return { ...example, mine: false }; }
    const snapshot = await get(runtime, 'contributions', id);
    if (!snapshot.exists() || snapshot.data().withdrawn) fail('This account was withdrawn or is unavailable.', 404);
    return publicPin(snapshot, uid);
  }
  async function cleanup(runtime, id) {
    for (const child of ['responses', 'openings']) {
      const records = await list(runtime, ['contributions', id, child]);
      for (let i = 0; i < records.docs.length; i += 400) {
        const batch = runtime.sdk.writeBatch(runtime.db);
        for (const document of records.docs.slice(i, i + 400)) batch.delete(document.ref);
        await batch.commit();
      }
    }
  }
  async function state(runtime, uid) {
    const participant = await actor(runtime, uid);
    const own = await list(runtime, ['contributions'], ['ownerUid', uid]);
    for (const document of own.docs.filter((d) => d.data().withdrawn)) await cleanup(runtime, document.id);
    const records = participant.phase === 'review' ? await list(runtime, ['contributions'], ['withdrawn', false]) : own;
    const pins = records.docs.filter((d) => !d.data().withdrawn).map((d) => publicPin(d, uid)).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    return { phase: participant.phase, sessionId: participant.sessionId, contributions: participant.phase === 'review' ? [...EXAMPLES.map((p) => ({ ...p, mine: false })), ...pins] : pins };
  }
  async function detail(runtime, uid, pin) {
    const key = `${pin.version}_${uid}`;
    const [answer, opening] = await Promise.all([get(runtime, 'contributions', pin.id, 'responses', key), get(runtime, 'contributions', pin.id, 'openings', key)]);
    const response = answer.exists() ? answer.data() : null;
    return {
      contribution: pin,
      response: response ? { answer: response.answer, note: response.note, sawTotals: response.sawTotals, firstAnsweredAt: iso(response.firstAnsweredAt), firstAnswerBeforeTotals: response.firstAnswerBeforeTotals, updatedAt: iso(response.updatedAt) } : null,
      totalsFirstOpenedAt: opening.exists() ? iso(opening.data().totalsFirstOpenedAt) : null,
      question: responseQuestion(pin.kind), canRespond: !pin.mine,
    };
  }
  async function responses(runtime, pin) {
    return (await list(runtime, ['contributions', pin.id, 'responses'])).docs.map((d) => d.data());
  }
  async function readSummary(runtime, pin) {
    const all = await responses(runtime, pin), current = all.filter((a) => a.version === pin.version);
    return { ...summarize(current, pin.version), question: responseQuestion(pin.kind), comments: current.filter((a) => a.note).map((a) => ({ answer: a.answer, note: a.note, sessionId: a.sessionId })), earlierVersionAnswers: all.length - current.length, denominator: 'Recorded practice answers to this version, across responding sessions. Not a count of verified people.' };
  }
  async function transactionPin(runtime, transaction, id) {
    const example = EXAMPLES.find((p) => p.id === id);
    if (example) return example;
    const value = await transaction.get(ref(runtime, 'contributions', id));
    if (!value.exists() || value.data().withdrawn) fail('This account was withdrawn or is unavailable.', 404);
    return { ...value.data(), id };
  }
  async function route(runtime, uid, activeSession, path, method, body, signal) {
    const { sdk } = runtime;
    const url = new URL(path, 'https://practice.invalid/');
    const name = url.pathname.slice(1);
    if (name === 'state' && method === 'GET') return state(runtime, uid);
    if (name === 'locations/search' && method === 'POST') return lookupLocations(body?.query, { signal });
    if (name === 'phase' && method === 'POST') {
      if (body?.phase !== 'review') fail('Start a new practice participant to begin independently again.');
      await sdk.runTransaction(runtime.db, async (transaction) => {
        const participant = ref(runtime, 'participants', uid), value = (await transaction.get(participant)).data();
        if (value.phase !== 'review') transaction.update(participant, { phase: 'review', reviewEnteredAt: sdk.serverTimestamp() });
      });
      return { phase: 'review' };
    }
    if (name === 'contributions' && method === 'POST') {
      if (!/^[a-f0-9-]{36}$/.test(body?.id || '')) fail('A valid draft ID is required.');
      const value = validateContribution(body), target = ref(runtime, 'contributions', body.id);
      await sdk.runTransaction(runtime.db, async (transaction) => {
        const participant = (await transaction.get(ref(runtime, 'participants', uid))).data();
        const existing = await transaction.get(target);
        if (existing.exists()) {
          const record = existing.data();
          if (record.withdrawn || record.ownerUid !== uid || Object.entries(value).some(([key, v]) => JSON.stringify(canonical(record[key])) !== JSON.stringify(canonical(v)))) fail('This draft has already changed. Refresh before retrying.', 409);
          return;
        }
        transaction.set(target, { ...value, ownerUid: uid, sessionId: activeSession, version: 1, createdAt: sdk.serverTimestamp(), updatedAt: sdk.serverTimestamp(), createdPhase: participant.phase, revisionPhase: participant.phase, reviewEnteredAt: participant.reviewEnteredAt, withdrawn: false });
      });
      return findPin(runtime, uid, body.id);
    }
    const match = name.match(/^contributions\/([a-zA-Z0-9-]+)(?:\/(response|summary))?$/);
    if (match) {
      const [, id, action] = match;
      const pin = await findPin(runtime, uid, id), key = `${pin.version}_${uid}`;
      const answerRef = ref(runtime, 'contributions', id, 'responses', key), openingRef = ref(runtime, 'contributions', id, 'openings', key);
      if (!action && method === 'GET') return detail(runtime, uid, pin);
      if (!action && method === 'PATCH') {
        if (!pin.mine) fail('Only this contribution’s practice author can edit it.', 403);
        const value = validateContribution(body);
        await sdk.runTransaction(runtime.db, async (transaction) => {
          const current = await transactionPin(runtime, transaction, id);
          const participant = (await transaction.get(ref(runtime, 'participants', uid))).data();
          if (current.version !== body.expectedVersion) fail('This contribution changed. Refresh before saving.', 409);
          transaction.update(ref(runtime, 'contributions', id), { ...value, version: current.version + 1, updatedAt: sdk.serverTimestamp(), revisionPhase: participant.phase, reviewEnteredAt: participant.reviewEnteredAt });
        });
        return findPin(runtime, uid, id);
      }
      if (!action && method === 'DELETE') {
        if (!pin.mine) fail('Only this contribution’s practice author can withdraw it.', 403);
        await sdk.updateDoc(ref(runtime, 'contributions', id), { withdrawn: true, description: '', placeLabel: '', context: '', geometry: null, locationSource: 'description', locationStatus: 'unconfirmed', precision: 'approximate', updatedAt: sdk.serverTimestamp() });
        await cleanup(runtime, id);
        return { withdrawn: true };
      }
      if (action === 'response' && ['PUT', 'DELETE'].includes(method)) {
        if (pin.mine) fail('Respond to another practice author’s account.', 403);
        const value = method === 'PUT' ? validateResponse(body, pin.kind) : null;
        await sdk.runTransaction(runtime.db, async (transaction) => {
          const current = await transactionPin(runtime, transaction, id);
          const [previous, opening] = await Promise.all([transaction.get(answerRef), transaction.get(openingRef)]);
          if (current.version !== body?.version) fail('The account changed. Read its current version before responding.', 409);
          if (method === 'DELETE') { transaction.delete(answerRef); return; }
          transaction.set(answerRef, { ownerUid: uid, sessionId: activeSession, version: pin.version, ...value, sawTotals: opening.exists(), totalsFirstOpenedAt: opening.exists() ? opening.data().totalsFirstOpenedAt : null, firstAnsweredAt: previous.exists() ? previous.data().firstAnsweredAt : sdk.serverTimestamp(), firstAnswerBeforeTotals: previous.exists() ? previous.data().firstAnswerBeforeTotals : !opening.exists(), updatedAt: sdk.serverTimestamp() });
        });
        return method === 'DELETE' ? { removed: true } : { saved: true };
      }
      if (action === 'summary' && ['POST', 'GET'].includes(method)) {
        await requireReview(runtime, uid);
        if (method === 'POST') await sdk.runTransaction(runtime.db, async (transaction) => {
          const current = await transactionPin(runtime, transaction, id);
          const [opening, answer] = await Promise.all([transaction.get(openingRef), transaction.get(answerRef)]);
          if (current.version !== body?.version) fail('The account changed. Read its current version before opening answers.', 409);
          if (!opening.exists()) {
            transaction.set(openingRef, { ownerUid: uid, sessionId: activeSession, version: pin.version, totalsFirstOpenedAt: sdk.serverTimestamp() });
            if (answer.exists()) transaction.update(answerRef, { sawTotals: true, totalsFirstOpenedAt: sdk.serverTimestamp() });
          }
        });
        return readSummary(runtime, pin);
      }
    }
    if (name === 'export' && method === 'GET') {
      await requireReview(runtime, uid);
      const pins = (await state(runtime, uid)).contributions;
      const format = url.searchParams.get('format');
      if (format === 'geojson') return exportGeoJSON(pins);
      const all = await Promise.all(pins.map(async (pin) => ({ pin, answers: await responses(runtime, pin) })));
      const answers = all.flatMap(({ pin, answers: values }) => values.filter((a) => a.version === pin.version).map((a) => ({ contribution_id: pin.id, version: a.version, session_id: a.sessionId, answer: a.answer, question_id: a.questionId, saw_totals: a.sawTotals, first_answered_at: iso(a.firstAnsweredAt), first_answer_before_totals: a.firstAnswerBeforeTotals, totals_first_opened_at: iso(a.totalsFirstOpenedAt), updated_at: iso(a.updatedAt), demo: true })));
      if (format === 'csv') {
        const dataset = url.searchParams.get('dataset') || 'contributions';
        if (!['contributions', 'answers'].includes(dataset)) fail('Choose contributions or answers for CSV export.');
        return exportCsv(dataset, pins, answers);
      }
      return { format: 'community-safety-demo-v2', coordinateReferenceSystem: COORDINATE_CRS, demo: true, exportedAt: new Date().toISOString(), sessions: SESSIONS, contributions: pins.map(({ mine, ...p }) => p), answers, excludedHistoricalAnswers: all.reduce((n, { pin, answers: values }) => n + values.filter((a) => a.version !== pin.version).length, 0), limitations: 'Only current-version answers are exported. Earlier wording is not retained. Openings record in-app requests, not proof of reading or unique people.', omitted: 'Participant credentials, identity IDs, response comments, and historical answers. These are practice records, not community findings.' };
    }
    fail('This data operation does not exist.', 404);
  }
  const service = async (path, { method = 'GET', body, signal, readOnly = method === 'GET' } = {}) => {
    const { token, activeSession } = context();
    const epoch = identityEpoch;
    abort(signal);
    try {
      if (!SESSIONS.some((s) => s.id === activeSession && s.accepting)) fail('Choose a valid practice session.');
      const runtime = await ready();
      current(epoch);
      abort(signal);
      let result;
      if (path === 'participants' && method === 'POST') {
        if (body?.sessionId !== activeSession) fail('Choose a valid practice session.');
        const token = [...crypto.getRandomValues(new Uint8Array(32))].map((n) => n.toString(16).padStart(2, '0')).join('');
        await withAuth(async () => {
          current(epoch);
          const credential = await runtime.sdk.createUserWithEmailAndPassword(runtime.auth, await emailFor(token), token);
          currentToken = token;
          await runtime.sdk.setDoc(ref(runtime, 'participants', credential.user.uid), { sessionId: activeSession, phase: 'contribute', reviewEnteredAt: null, createdAt: runtime.sdk.serverTimestamp() });
        });
        result = { token, phase: 'contribute', sessionId: activeSession };
      } else result = await route(runtime, await authenticate(runtime, token, epoch), activeSession, path, method, body, signal);
      current(epoch);
      abort(signal);
      return result;
    } catch (error) {
      if (error.name === 'AbortError' || error.status || error.errors) throw error;
      if (/auth\/(invalid-credential|invalid-login-credentials|user-not-found|wrong-password|invalid-email)/.test(error.code)) fail('This return code is not valid for this Firebase project. Previous server-demo codes do not transfer; start a new practice participant.', 401);
      if (error.code === 'auth/operation-not-allowed') fail('Firebase sign-in is not enabled. Enable Email/Password in the dedicated project’s Authentication settings.', 503);
      if (error.code === 'permission-denied') fail('Firebase access rules rejected this action. Check that this project has the supplied firestore.rules deployed. Your input is kept.', 403);
      if (error.code === 'failed-precondition') fail('Firebase is not ready for this query. Deploy the supplied Firestore rules and indexes. Your input is kept.', 503);
      throw new Error(readOnly ? 'Could not read the shared Firebase data. Your input is still here; check the connection and project setup, then retry.' : 'The Firebase save could not be confirmed. Your input is still here. Check for new input before retrying.', { cause: error });
    }
  };
  service.finish = async () => {
    identityEpoch += 1;
    await withAuth(async () => { if (runtimePromise) { const runtime = await runtimePromise; await runtime.sdk.signOut(runtime.auth); currentToken = null; } });
  };
  service.dispose = async () => { if (runtimePromise) { const runtime = await runtimePromise; await runtime.sdk.deleteApp(runtime.app); runtimePromise = null; currentToken = null; } };
  return service;
}
