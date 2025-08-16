export function formatDate(inputDate: string | undefined) {
  if (!inputDate) return '-';
  const d = new Date(inputDate);
  return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'medium' });
}

export function getTimeRangeText(hours = 4): string {
  const now = new Date();
  const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
  const fmt = (date: Date) =>
    date.toLocaleString('th-TH', { timeStyle: 'short', dateStyle: 'short' });
  return `${fmt(from)} - ${fmt(now)}`;
}