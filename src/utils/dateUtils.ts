export interface FormattedDayInfo {
  dayCategory: 'today' | 'yesterday' | 'earlier';
  dayLabel: string; // 'Today' | 'Yesterday' | '30 Sep 2026'
  dayLabelHindi: string; // 'Today' | 'Yesterday' | '30 Sep 2026'
  timeStr: string; // '10:45 AM'
  fullDateStr: string; // '02 Oct 2026'
  isoDate: string; // '2026-10-02'
  displayString: string; // 'Today, 10:45 AM' or 'Yesterday, 04:30 PM' or '30 Sep 2026, 02:15 PM'
}

/**
 * Extracts or parses a timestamp in ms from a transaction object or string
 */
export function parseTransactionTimestamp(tx: {
  id?: string;
  timestamp?: number;
  date?: string;
  taskDate?: string;
}): number {
  if (tx.timestamp && typeof tx.timestamp === 'number' && tx.timestamp > 1500000000000) {
    return tx.timestamp;
  }

  // Try extracting 13-digit epoch milliseconds from tx.id (e.g., tx_1727823485712, sub_srv_1727823485712)
  if (tx.id) {
    const match = tx.id.match(/\d{12,14}/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (!isNaN(parsed) && parsed > 1600000000000 && parsed < 2500000000000) {
        return parsed;
      }
    }
  }

  // If taskDate is YYYY-MM-DD
  if (tx.taskDate && /^\d{4}-\d{2}-\d{2}$/.test(tx.taskDate)) {
    const d = new Date(tx.taskDate + 'T12:00:00');
    if (!isNaN(d.getTime())) return d.getTime();
  }

  // If date contains text like 'Yesterday' or 'Today'
  if (tx.date) {
    const lower = tx.date.toLowerCase();
    if (lower.includes('yesterday')) {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return y.getTime();
    }
    if (lower.includes('today') || lower.includes('just now')) {
      return Date.now();
    }

    const parsed = Date.parse(tx.date);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  return Date.now();
}

/**
 * Returns detailed relative day info (Today, Yesterday, or exact Date)
 */
export function getFormattedDayInfo(
  timestampOrTx: number | { id?: string; timestamp?: number; date?: string; taskDate?: string }
): FormattedDayInfo {
  const ts =
    typeof timestampOrTx === 'number'
      ? timestampOrTx
      : parseTransactionTimestamp(timestampOrTx);
  const itemDate = new Date(ts);
  const now = new Date();

  // Normalize to local midnight for accurate day comparison
  const itemMidnight = new Date(
    itemDate.getFullYear(),
    itemDate.getMonth(),
    itemDate.getDate()
  ).getTime();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const oneDayMs = 86400000;
  const yesterdayMidnight = todayMidnight - oneDayMs;

  const timeStr = itemDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const fullDateStr = itemDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const isoDate = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(itemDate.getDate()).padStart(2, '0')}`;

  if (itemMidnight === todayMidnight) {
    return {
      dayCategory: 'today',
      dayLabel: 'Today',
      dayLabelHindi: 'Today',
      timeStr,
      fullDateStr,
      isoDate,
      displayString: `Today, ${timeStr}`,
    };
  } else if (itemMidnight === yesterdayMidnight) {
    return {
      dayCategory: 'yesterday',
      dayLabel: 'Yesterday',
      dayLabelHindi: 'Yesterday',
      timeStr,
      fullDateStr,
      isoDate,
      displayString: `Yesterday, ${timeStr}`,
    };
  } else {
    return {
      dayCategory: 'earlier',
      dayLabel: fullDateStr,
      dayLabelHindi: fullDateStr,
      timeStr,
      fullDateStr,
      isoDate,
      displayString: `${fullDateStr}, ${timeStr}`,
    };
  }
}
