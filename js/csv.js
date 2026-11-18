export function csvCell(value) {
  let text = value == null ? '' : String(value);
  // Include leading control characters so spreadsheet formula prefixes cannot bypass escaping.
  // eslint-disable-next-line no-control-regex
  if (typeof value === 'string' && /^[\s\u0000-\u001f]*[=+@-]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportCsv(dataset, contributions, answers) {
  const columns = dataset === 'contributions'
    ? ['id', 'sessionId', 'version', 'kind', 'topic', 'placeLabel', 'description', 'context', 'longitude', 'latitude', 'coordinateReferenceSystem', 'locationStatus', 'locationSource', 'precision', 'createdAt', 'updatedAt', 'createdPhase', 'revisionPhase', 'reviewEnteredAt', 'fixture', 'demo']
    : ['contribution_id', 'version', 'session_id', 'answer', 'question_id', 'saw_totals', 'first_answered_at', 'first_answer_before_totals', 'totals_first_opened_at', 'updated_at', 'demo'];
  const records = dataset === 'contributions' ? contributions.map((p) => ({ ...p, longitude: p.geometry?.coordinates[0], latitude: p.geometry?.coordinates[1], coordinateReferenceSystem: 'EPSG:4326', demo: true })) : answers.map((a) => ({ ...a, demo: true }));
  return '\uFEFF' + [columns.map(csvCell).join(','), ...records.map((row) => columns.map((key) => csvCell(row[key])).join(','))].join('\r\n') + '\r\n';
}
