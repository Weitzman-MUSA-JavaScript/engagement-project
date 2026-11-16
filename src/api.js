import { exportCsv } from './csv.js';
import { exportGeoJSON } from './geojson.js';
import { searchLocations } from './locations.js';
import { COORDINATE_CRS } from '../public/js/geography.js';
import { SESSIONS, EXAMPLES, ValidationError, validateContribution, validateResponse, responseQuestion, summarize } from '../public/js/domain.js';

const sessions = new Map(SESSIONS.map((s) => [s.id, s]));
const examples = new Map(EXAMPLES.map((p) => [p.id, p]));
const session = (id) => sessions.get(id);
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
function fail(message, status = 400) { const e = new Error(message); e.status = status; throw e; }
async function digest(token) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))].map((n) => n.toString(16).padStart(2, '0')).join(''); }
const rows = async (db, sql, ...args) => (await db.prepare(sql).bind(...args).all()).results;
const first = (db, sql, ...args) => db.prepare(sql).bind(...args).first();
const run = (db, sql, ...args) => db.prepare(sql).bind(...args).run();
async function actor(request, db) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  if (!/^[a-f0-9]{64}$/.test(token)) fail('Start a practice participant before continuing.', 401);
  const hash = await digest(token);
  if (!await first(db, 'SELECT token_hash FROM participants WHERE token_hash = ?', hash)) fail('This practice participant code is not valid.', 401);
  return hash;
}
async function body(request) {
  const text = await request.text();
  if (text.length > 12000) fail('This request is too large.', 413);
  try { const b = JSON.parse(text); if (!b || typeof b !== 'object' || Array.isArray(b)) fail('Expected an object.'); return b; } catch { fail('Could not read this request.'); }
}
function publicPin(row, owner) {
  return { ...JSON.parse(row.payload), id: row.id, sessionId: row.session_id, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at, createdPhase: row.created_phase, revisionPhase: row.revision_phase, reviewEnteredAt: row.review_entered_at, mine: row.owner_hash === owner, fixture: false };
}
async function pinById(db, id, owner) {
  const fixture = examples.get(id);
  if (fixture) return { ...fixture, mine: false };
  const row = await first(db, 'SELECT * FROM contributions WHERE id = ? AND withdrawn = 0', id);
  if (!row) fail('This contribution has been withdrawn or could not be found.', 404);
  return publicPin(row, owner);
}
async function phaseFor(db, owner, id) {
  return (await phaseState(db, owner, id)).phase;
}
async function phaseState(db, owner, id) { return await first(db, 'SELECT phase, review_entered_at FROM session_state WHERE owner_hash = ? AND session_id = ?', owner, id) || { phase: 'contribute', review_entered_at: null }; }
async function summary(db, pin) {
  const current = await rows(db, 'SELECT version, answer, note, session_id FROM responses WHERE contribution_id = ? AND version = ?', pin.id, pin.version);
  const older = await first(db, 'SELECT COUNT(*) AS total FROM responses WHERE contribution_id = ? AND version != ?', pin.id, pin.version);
  return { ...summarize(current, pin.version), comments: current.filter((r) => r.note).map((r) => ({ answer: r.answer, note: r.note, sessionId: r.session_id })), earlierVersionAnswers: older.total, question: responseQuestion(pin.kind), denominator: 'Recorded practice answers to this version, across responding sessions. Not a count of verified people.' };
}
async function requireVisible(db, owner, id, pin) {
  if (!session(id)) fail('Choose a valid responding session.');
  if (!pin.mine && await phaseFor(db, owner, id) !== 'review') fail('Enter the review phase to read earlier contributions.', 403);
}

export async function handleApi(request, db, { lookupLocations = searchLocations } = {}) {
  const url = new URL(request.url);
  const path = url.pathname;
  try {
    if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(request.method)) {
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin) fail('Cross-site changes are not permitted.', 403);
      if (request.headers.get('sec-fetch-site') === 'cross-site') fail('Cross-site changes are not permitted.', 403);
    }
    if (path === '/api/info' && request.method === 'GET') return json({ sessions: SESSIONS, coordinateReferenceSystem: COORDINATE_CRS, demo: true, storage: 'shared', message: 'Development demonstration. No human or group consultation has occurred.' });
    if (path === '/api/participants' && request.method === 'POST') {
      const b = await body(request);
      if (!session(b.sessionId)?.accepting) fail('This session does not accept practice contributions.');
      const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
      const hash = await digest(token);
      await run(db, 'INSERT INTO participants (token_hash, created_at) VALUES (?, ?)', hash, new Date().toISOString());
      return json({ token, phase: 'contribute', sessionId: b.sessionId }, 201);
    }
    const owner = await actor(request, db);
    const activeSession = url.searchParams.get('activeSession') || 'practice-current';
    if (!session(activeSession)?.accepting) fail('Choose a valid practice session.');
    if (path === '/api/locations/search' && request.method === 'POST') {
      const b = await body(request);
      return json(await lookupLocations(b.query, { signal: request.signal }));
    }
    if (path === '/api/state' && request.method === 'GET') {
      const phase = await phaseFor(db, owner, activeSession);
      const stored = phase === 'review'
        ? await rows(db, 'SELECT * FROM contributions WHERE withdrawn = 0 ORDER BY created_at ASC')
        : await rows(db, 'SELECT * FROM contributions WHERE withdrawn = 0 AND owner_hash = ? AND session_id = ? ORDER BY created_at ASC', owner, activeSession);
      const pins = stored.map((r) => publicPin(r, owner));
      return json({ phase, sessionId: activeSession, contributions: phase === 'review' ? [...EXAMPLES.map((p) => ({ ...p, mine: false })), ...pins] : pins.filter((p) => p.mine && p.sessionId === activeSession) });
    }
    if (path === '/api/phase' && request.method === 'POST') {
      const b = await body(request);
      if (b.phase !== 'review') fail('This action enters the review phase. Start a new practice participant to begin independently again.');
      await run(db, "INSERT INTO session_state (owner_hash, session_id, phase, review_entered_at) VALUES (?, ?, 'review', ?) ON CONFLICT(owner_hash, session_id) DO UPDATE SET review_entered_at = CASE WHEN session_state.phase = 'review' THEN session_state.review_entered_at ELSE excluded.review_entered_at END, phase = 'review'", owner, activeSession, new Date().toISOString());
      return json({ phase: 'review' });
    }
    if (path === '/api/contributions' && request.method === 'POST') {
      const b = await body(request);
      if (!/^[a-f0-9-]{36}$/.test(b.id || '')) fail('A valid draft ID is required.');
      const value = validateContribution(b);
      const existing = await first(db, 'SELECT * FROM contributions WHERE id = ?', b.id);
      if (existing) {
        if (existing.owner_hash !== owner || existing.withdrawn || existing.payload !== JSON.stringify(value)) fail('This draft has already changed. Refresh before retrying.', 409);
        return json(publicPin(existing, owner));
      }
      const now = new Date().toISOString();
      const phase = await phaseState(db, owner, activeSession);
      await run(db, 'INSERT INTO contributions (id, owner_hash, session_id, payload, created_at, updated_at, created_phase, revision_phase, review_entered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', b.id, owner, activeSession, JSON.stringify(value), now, now, phase.phase, phase.phase, phase.review_entered_at);
      return json(await pinById(db, b.id, owner), 201);
    }
    const match = path.match(/^\/api\/contributions\/([a-zA-Z0-9-]+)(?:\/(response|summary))?$/);
    if (match) {
      const [, id, action] = match;
      const pin = await pinById(db, id, owner);
      await requireVisible(db, owner, activeSession, pin);
      if (!action && request.method === 'GET') {
        const mine = await first(db, 'SELECT answer, note, saw_totals, first_answered_at, first_answer_before_totals, updated_at FROM responses WHERE owner_hash = ? AND contribution_id = ? AND version = ? AND session_id = ?', owner, id, pin.version, activeSession);
        const exposure = await first(db, 'SELECT totals_first_opened_at FROM response_exposure WHERE owner_hash = ? AND contribution_id = ? AND version = ? AND session_id = ?', owner, id, pin.version, activeSession);
        return json({ contribution: pin, response: mine ? { answer: mine.answer, note: mine.note, sawTotals: Boolean(mine.saw_totals || exposure), firstAnsweredAt: mine.first_answered_at, firstAnswerBeforeTotals: mine.first_answer_before_totals === null ? null : Boolean(mine.first_answer_before_totals), updatedAt: mine.updated_at } : null, totalsFirstOpenedAt: exposure?.totals_first_opened_at || null, question: responseQuestion(pin.kind), canRespond: !pin.mine });
      }
      if (!action && request.method === 'PATCH') {
        if (!pin.mine) fail('Only this contribution’s practice author can edit it.', 403);
        const b = await body(request);
        if (b.expectedVersion !== pin.version) fail('This contribution changed. Refresh and review it before saving.', 409);
        const value = validateContribution(b);
        const phase = await phaseState(db, owner, activeSession);
        const result = await run(db, 'UPDATE contributions SET payload = ?, version = version + 1, updated_at = ?, revision_phase = ?, review_entered_at = ? WHERE id = ? AND owner_hash = ? AND version = ? AND withdrawn = 0', JSON.stringify(value), new Date().toISOString(), phase.phase, phase.review_entered_at, id, owner, pin.version);
        if (!result.meta.changes) fail('Another edit was saved first. Refresh before retrying.', 409);
        return json(await pinById(db, id, owner));
      }
      if (!action && request.method === 'DELETE') {
        if (!pin.mine) fail('Only this contribution’s practice author can withdraw it.', 403);
        await db.batch([
          db.prepare('UPDATE contributions SET payload = ?, withdrawn = 1, updated_at = ? WHERE id = ? AND owner_hash = ?').bind('{}', new Date().toISOString(), id, owner),
          db.prepare('DELETE FROM responses WHERE contribution_id = ?').bind(id),
          db.prepare('DELETE FROM response_exposure WHERE contribution_id = ?').bind(id),
        ]);
        return json({ withdrawn: true });
      }
      if (action === 'response' && request.method === 'PUT') {
        if (pin.mine) fail('Respond to another practice author’s account, rather than your own.', 403);
        const b = await body(request);
        if (b.version !== pin.version) fail('The account was edited. Read its current version before responding.', 409);
        const value = validateResponse(b, pin.kind);
        const now = new Date().toISOString();
        const result = await run(db, `INSERT INTO responses (owner_hash, contribution_id, version, session_id, answer, note, question_id, saw_totals, first_answered_at, first_answer_before_totals, updated_at)
          SELECT ?, ?, ?, ?, ?, ?, ?, EXISTS(SELECT 1 FROM response_exposure WHERE owner_hash = ? AND contribution_id = ? AND version = ? AND session_id = ?), ?, NOT EXISTS(SELECT 1 FROM response_exposure WHERE owner_hash = ? AND contribution_id = ? AND version = ? AND session_id = ?), ?
          WHERE ? OR EXISTS(SELECT 1 FROM contributions WHERE id = ? AND version = ? AND withdrawn = 0)
          ON CONFLICT(owner_hash, contribution_id, version, session_id) DO UPDATE SET answer = excluded.answer, note = excluded.note, question_id = excluded.question_id, saw_totals = MAX(responses.saw_totals, excluded.saw_totals), updated_at = excluded.updated_at`, owner, id, pin.version, activeSession, value.answer, value.note, value.questionId, owner, id, pin.version, activeSession, now, owner, id, pin.version, activeSession, now, pin.fixture ? 1 : 0, id, pin.version);
        if (!result.meta.changes) fail('The account changed. Read the current version before responding.', 409);
        return json({ saved: true });
      }
      if (action === 'response' && request.method === 'DELETE') {
        const b = await body(request);
        if (b.version !== pin.version) fail('Read the current version before removing an answer.', 409);
        await run(db, 'DELETE FROM responses WHERE owner_hash = ? AND contribution_id = ? AND version = ? AND session_id = ?', owner, id, pin.version, activeSession);
        return json({ removed: true });
      }
      if (action === 'summary' && ['GET', 'POST'].includes(request.method)) {
        if (request.method === 'POST') {
          const b = await body(request);
          if (b.version !== pin.version) fail('The account changed. Read the current version before opening answers.', 409);
          // Record an opening, not proof of reading. INSERT OR IGNORE preserves its first time.
          const result = await run(db, 'INSERT INTO response_exposure (owner_hash, contribution_id, version, session_id, totals_first_opened_at) SELECT ?, ?, ?, ?, ? WHERE ? OR EXISTS(SELECT 1 FROM contributions WHERE id = ? AND version = ? AND withdrawn = 0) ON CONFLICT DO NOTHING', owner, id, pin.version, activeSession, new Date().toISOString(), pin.fixture ? 1 : 0, id, pin.version);
          if (!result.meta.changes && !await first(db, 'SELECT 1 FROM response_exposure WHERE owner_hash = ? AND contribution_id = ? AND version = ? AND session_id = ?', owner, id, pin.version, activeSession)) fail('The account changed. Refresh before opening answers.', 409);
        }
        return json(await summary(db, pin));
      }
    }
    if (path === '/api/export' && request.method === 'GET') {
      if (await phaseFor(db, owner, activeSession) !== 'review') fail('Enter review before exporting the practice dataset.', 403);
      const stored = await rows(db, 'SELECT * FROM contributions WHERE withdrawn = 0 ORDER BY created_at ASC');
      const pins = [...EXAMPLES, ...stored.map((r) => publicPin(r, owner))];
      if (url.searchParams.get('format') === 'geojson') {
        if (url.searchParams.has('dataset') && url.searchParams.get('dataset') !== 'contributions') fail('GeoJSON exports contributions only.');
        return new Response(JSON.stringify(exportGeoJSON(pins)), { headers: { 'content-type': 'application/geo+json; charset=utf-8', 'content-disposition': 'attachment; filename="community-safety-contributions.geojson"', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
      }
      const answers = await rows(db, `SELECT r.contribution_id, r.version, r.session_id, r.answer, r.question_id, MAX(r.saw_totals, CASE WHEN e.totals_first_opened_at IS NULL THEN 0 ELSE 1 END) AS saw_totals, r.first_answered_at, r.first_answer_before_totals, e.totals_first_opened_at, r.updated_at FROM responses r
        LEFT JOIN contributions c ON c.id = r.contribution_id AND c.withdrawn = 0
        LEFT JOIN response_exposure e ON e.owner_hash = r.owner_hash AND e.contribution_id = r.contribution_id AND e.version = r.version AND e.session_id = r.session_id
        WHERE r.version = c.version OR (c.id IS NULL AND r.version = 1 AND r.contribution_id IN (${EXAMPLES.map(() => '?').join(',')}))`, ...EXAMPLES.map((p) => p.id));
      const historical = await first(db, 'SELECT COUNT(*) AS total FROM responses r JOIN contributions c ON c.id = r.contribution_id AND c.withdrawn = 0 WHERE r.version != c.version');
      if (url.searchParams.get('format') === 'csv') {
        const dataset = url.searchParams.get('dataset') || 'contributions';
        if (!['contributions', 'answers'].includes(dataset)) fail('Choose contributions or answers for CSV export.');
        return new Response(exportCsv(dataset, pins, answers), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="community-safety-${dataset}.csv"`, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
      }
      return json({ format: 'community-safety-demo-v2', coordinateReferenceSystem: COORDINATE_CRS, demo: true, exportedAt: new Date().toISOString(), sessions: SESSIONS, contributions: pins.map(({ mine, ...p }) => p), answers, excludedHistoricalAnswers: historical.total, limitations: 'Only current-version answers are exported. Earlier wording is not retained. Legacy phase/timing fields may be unknown. Openings record in-app requests, not proof of reading or unique people; outside exposure is unknown. Answers pool responding sessions; identity hashes are omitted, preventing deduplication.', omitted: 'Participant tokens, token hashes, free-text response comments, and historical answers. These are practice records, not community findings.' });
    }
    return json({ message: 'This API route does not exist.' }, 404);
  } catch (error) {
    if (error instanceof ValidationError) return json({ message: error.message, errors: error.errors }, 422);
    if (error.status) return json({ message: error.message }, error.status);
    return json({ message: 'The data service could not complete this action. Your input has not been cleared. Please try again.' }, 500);
  }
}
