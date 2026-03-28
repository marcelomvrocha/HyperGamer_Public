const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export interface HealthDataRow {
  date: string;
  bodyFatPercent?: number;
  bmi?: number;
  lbmKg?: number;
  weightKg: number;
}

export const HEALTH_TABLE_EXAMPLE = [
  'Date    Body Fat %    BMI    LBM (kg)    Weight (kg)',
  '2026-03-01    13.2%    22.4    64.3 kg    74.1 kg',
  '2026-03-08    13.0%    22.5    64.8 kg    74.5 kg',
  '2026-03-15    12.8%    22.6    65.0 kg    74.8 kg',
].join('\n');

function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function inferYear(monthIndex: number, day: number, fallbackYear: number, referenceDate: Date): number {
  const candidate = new Date(fallbackYear, monthIndex, day);
  const futureThreshold = normalizeDate(referenceDate);
  futureThreshold.setDate(futureThreshold.getDate() + 31);

  return candidate.getTime() > futureThreshold.getTime() ? fallbackYear - 1 : fallbackYear;
}

function buildDate(year: number, monthIndex: number, day: number): Date {
  const parsed = new Date(year, monthIndex, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== monthIndex ||
    parsed.getDate() !== day
  ) {
    throw new Error(`Invalid date value: ${year}-${monthIndex + 1}-${day}`);
  }
  return parsed;
}

/**
 * Supports ISO dates (`2026-03-15`) and Apple Health-style dates (`Mar 15`, `Mar 15 2026`).
 * When the year is omitted, dates are inferred from the current year and rolled back one year
 * if the inferred date would be more than 31 days in the future.
 */
export function parseHealthDate(
  dateStr: string,
  fallbackYear: number = new Date().getFullYear(),
  referenceDate: Date = new Date(),
): Date {
  const trimmed = dateStr.trim();
  if (!trimmed) {
    throw new Error('Date value cannot be empty.');
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(value => Number.parseInt(value, 10));
    return buildDate(year, month - 1, day);
  }

  const match = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?$/);
  if (!match) {
    throw new Error(`Unsupported date format: ${dateStr}`);
  }

  const [, monthToken, dayToken, explicitYear] = match;
  const monthIndex = MONTHS[monthToken.toLowerCase()];
  const day = Number.parseInt(dayToken, 10);

  if (monthIndex === undefined || Number.isNaN(day)) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  const year = explicitYear
    ? Number.parseInt(explicitYear, 10)
    : inferYear(monthIndex, day, fallbackYear, referenceDate);

  return buildDate(year, monthIndex, day);
}

function parseMetricValue(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/,/g, '').replace(/[^\d.+-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isHeaderLine(line: string): boolean {
  return /date/i.test(line) && /(weight|body fat|bmi|lbm)/i.test(line);
}

function splitColumns(line: string): string[] {
  return line
    .split(/\t| {2,}/)
    .map(column => column.trim())
    .filter(Boolean);
}

function mapMetrics(metricColumns: string[]): Omit<HealthDataRow, 'date' | 'weightKg'> & { weightKg?: number } {
  const [bodyFatColumn, bmiColumn, lbmColumn, weightColumn] = metricColumns;

  if (metricColumns.length >= 4) {
    return {
      bodyFatPercent: parseMetricValue(bodyFatColumn),
      bmi: parseMetricValue(bmiColumn),
      lbmKg: parseMetricValue(lbmColumn),
      weightKg: parseMetricValue(weightColumn),
    };
  }

  const mapped: Omit<HealthDataRow, 'date' | 'weightKg'> & { weightKg?: number } = {};
  const parsedColumns = metricColumns
    .map(raw => ({
      raw,
      value: parseMetricValue(raw),
    }))
    .filter((entry): entry is { raw: string; value: number } => entry.value !== undefined);

  if (parsedColumns.length === 0) {
    return mapped;
  }

  const weightEntry = parsedColumns.at(-1);
  mapped.weightKg = weightEntry?.value;

  for (const entry of parsedColumns.slice(0, -1)) {
    const raw = entry.raw.toLowerCase();

    if (raw.includes('%')) {
      mapped.bodyFatPercent = entry.value;
      continue;
    }

    if (raw.includes('kg') || raw.includes('lbm') || raw.includes('lean')) {
      mapped.lbmKg = entry.value;
      continue;
    }

    if (entry.value < 15 && mapped.bodyFatPercent === undefined) {
      mapped.bodyFatPercent = entry.value;
      continue;
    }

    if (entry.value <= 40 && mapped.bmi === undefined) {
      mapped.bmi = entry.value;
      continue;
    }

    if (mapped.lbmKg === undefined) {
      mapped.lbmKg = entry.value;
    }
  }

  return mapped;
}

export function parseHealthTable(tableText: string, fallbackYear: number = new Date().getFullYear()): HealthDataRow[] {
  const referenceDate = new Date();
  const lines = tableText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('```'));

  const dataLines = lines.filter(line => !isHeaderLine(line));
  const results: HealthDataRow[] = [];

  for (const line of dataLines) {
    const columns = splitColumns(line);
    if (columns.length < 2) {
      continue;
    }

    const [dateColumn, ...metricColumns] = columns;
    const { bodyFatPercent, bmi, lbmKg, weightKg } = mapMetrics(metricColumns);

    if (weightKg === undefined) {
      continue;
    }

    const date = parseHealthDate(dateColumn, fallbackYear, referenceDate);
    results.push({
      date: date.toISOString().split('T')[0],
      bodyFatPercent,
      bmi,
      lbmKg,
      weightKg,
    });
  }

  return results;
}
