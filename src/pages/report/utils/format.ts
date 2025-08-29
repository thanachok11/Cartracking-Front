export function Report_formatDate(input?: string | number): string {
    if (!input) return '';
    const d = typeof input === 'number' ? new Date(input) : new Date(input);
    if (isNaN(d.getTime())) return String(input);
    return d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function Report_getTimeRangeText(hours = 4): string {
    const now = new Date();
    const past = new Date(Date.now() - hours * 60 * 60 * 1000);
    return `${past.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

