export function formatSessionDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'numeric', day: 'numeric', year: 'numeric' }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value('month')}-${value('day')}-${value('year')}`;
}
