'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPath } from '@/lib/app-paths';
import { HEALTH_TABLE_EXAMPLE, parseHealthTable, type HealthDataRow } from '@/lib/health-import';

const EXAMPLE_PREVIEW_ROWS = parseHealthTable(HEALTH_TABLE_EXAMPLE);

export default function ImportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [mode, setMode] = useState<'manual' | 'single'>('manual');

  async function importManualData(data: HealthDataRow[]) {
    setLoading(true);
    try {
      const response = await fetch(apiPath('/api/biometrics/bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biometrics: data.map(row => ({
            date: row.date,
            weightKg: row.weightKg,
            bfPercent: row.bodyFatPercent,
            lbmKg: row.lbmKg,
            bmi: row.bmi,
          })),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setImported(true);
        setImportCount(result.imported || 0);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Import Biometric Data</h1>
        <p className="text-sm sm:text-base text-gray-300 dark:text-gray-300">
          Bring in your own Apple Health measurements without bundling any private sample data into the app.
          Paste a table or log a single day manually.
        </p>
      </div>

      {imported ? (
        <div className="surface-card border border-green-500 p-6">
          <h2 className="text-xl font-semibold text-green-300 dark:text-green-300 mb-2">Import Complete</h2>
          <p className="text-gray-200 dark:text-gray-200 mb-4">
            Successfully imported {importCount} biometric entries.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push('/progress')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              View Progress
            </button>
            <button
              type="button"
              onClick={() => {
                setImported(false);
                setImportCount(0);
              }}
              className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-gray-200 dark:text-gray-200 rounded hover:bg-gray-700 dark:hover:bg-gray-600"
            >
              Import More
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-left sm:text-center ${
                mode === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 dark:bg-gray-700 text-gray-200 dark:text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600'
              }`}
            >
              Paste Table
            </button>
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium text-left sm:text-center ${
                mode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 dark:bg-gray-700 text-gray-200 dark:text-gray-200 hover:bg-gray-600 dark:hover:bg-gray-600'
              }`}
            >
              Enter Single Day
            </button>
          </div>

          {mode === 'manual' ? (
            <ManualImportForm onImport={importManualData} loading={loading} />
          ) : (
            <SingleDayEntryForm
              onSave={() => {
                setImported(true);
                setImportCount(1);
              }}
              loading={loading}
            />
          )}

          <div className="surface-card border border-blue-500 p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-300 dark:text-blue-300 mb-2">
                Expected Paste Format
              </h3>
              <p className="text-sm text-gray-200 dark:text-gray-200">
                Use tab-separated values or align columns with multiple spaces. ISO dates are supported, and
                month-name dates such as <code className="bg-gray-700 dark:bg-gray-700 px-1 rounded text-gray-200">Mar 15</code> also work.
              </p>
            </div>
            <BiometricPreview rows={EXAMPLE_PREVIEW_ROWS} />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/20 p-4 text-xs text-gray-300">
              <code>{HEALTH_TABLE_EXAMPLE}</code>
            </pre>
          </div>

          <div className="surface-card border border-blue-500 p-6">
            <h3 className="text-lg font-semibold text-blue-300 dark:text-blue-300 mb-3">
              How to Export from Apple Health
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-200 dark:text-gray-200">
              <li>Open the <strong>Health</strong> app on your iPhone.</li>
              <li>Tap your <strong>profile picture</strong> in the top-right corner.</li>
              <li>Tap <strong>Export All Health Data</strong>.</li>
              <li>Save the archive to Files, AirDrop, or your Mac.</li>
              <li>Extract the relevant measurements into a simple table and paste them here.</li>
            </ol>
            <p className="text-xs text-gray-300 dark:text-gray-300 mt-4">
              Direct HealthKit sync is outside the scope of this standalone web app, so imports are intentionally manual.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function ManualImportForm({
  onImport,
  loading,
}: {
  onImport: (data: HealthDataRow[]) => void;
  loading: boolean;
}) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<HealthDataRow[]>([]);

  function parseText() {
    try {
      const data = parseHealthTable(text);
      setParsed(data);
      if (data.length === 0) {
        alert('No valid data found. Check the date and column formatting, then try again.');
      }
    } catch (error) {
      console.error('Parse error:', error);
      alert('Error parsing data. Check the format and try again.');
    }
  }

  return (
    <div className="surface-card p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-100">Paste a Biometric Table</h2>
          <p className="text-sm text-gray-200 dark:text-gray-200">
            Expected order: Date, Body Fat %, BMI, LBM (kg), Weight (kg).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setText(HEALTH_TABLE_EXAMPLE);
            setParsed(parseHealthTable(HEALTH_TABLE_EXAMPLE));
          }}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          Load Example
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={HEALTH_TABLE_EXAMPLE}
        className="glass-input w-full h-56 px-4 py-3 rounded-lg font-mono text-base placeholder-gray-500 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={parseText}
          className="px-4 py-2 bg-gray-600 dark:bg-gray-600 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-700"
        >
          Parse Data
        </button>
        <button
          type="button"
          onClick={() => {
            setText('');
            setParsed([]);
          }}
          className="px-4 py-2 border border-white/15 text-gray-200 rounded hover:bg-white/5"
        >
          Clear
        </button>
      </div>

      {parsed.length > 0 && (
        <div className="space-y-4">
          <div className="bg-green-900/30 dark:bg-green-900/30 border border-green-500 dark:border-green-500 p-4 rounded">
            <p className="text-sm font-medium text-green-200 dark:text-green-200">
              Parsed {parsed.length} entr{parsed.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
          <BiometricPreview rows={parsed.slice(0, 10)} remainingCount={Math.max(0, parsed.length - 10)} scrollable />
          <button
            type="button"
            onClick={() => onImport(parsed)}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Importing...' : `Import ${parsed.length} Entr${parsed.length === 1 ? 'y' : 'ies'}`}
          </button>
        </div>
      )}
    </div>
  );
}

function BiometricPreview({
  rows,
  remainingCount = 0,
  scrollable = false,
}: {
  rows: HealthDataRow[];
  remainingCount?: number;
  scrollable?: boolean;
}) {
  return (
    <div className={`glass-panel p-4 text-sm font-mono ${scrollable ? 'max-h-64 overflow-y-auto' : ''}`}>
      <div className="space-y-3 sm:hidden">
        {rows.map((row, index) => (
          <div
            key={`${row.date}-${index}`}
            className="rounded-lg border border-white/10 bg-black/10 p-3 text-xs text-gray-300 dark:text-gray-300"
          >
            <div className="mb-2 text-sm font-semibold text-gray-100 dark:text-gray-100">{row.date}</div>
            <div className="grid grid-cols-2 gap-2">
              <div>Weight: {row.weightKg}</div>
              <div>BF%: {row.bodyFatPercent ?? '-'}</div>
              <div>LBM: {row.lbmKg ?? '-'}</div>
              <div>BMI: {row.bmi ?? '-'}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-5 gap-2 whitespace-nowrap font-semibold mb-2 pb-2 border-b border-white/10 text-gray-200 dark:text-gray-200">
            <div>Date</div>
            <div>Weight (kg)</div>
            <div>BF%</div>
            <div>LBM (kg)</div>
            <div>BMI</div>
          </div>
          {rows.map((row, index) => (
            <div
              key={`${row.date}-${index}`}
              className="grid grid-cols-5 gap-2 whitespace-nowrap text-xs text-gray-300 dark:text-gray-300"
            >
              <div>{row.date}</div>
              <div>{row.weightKg}</div>
              <div>{row.bodyFatPercent ?? '-'}</div>
              <div>{row.lbmKg ?? '-'}</div>
              <div>{row.bmi ?? '-'}</div>
            </div>
          ))}
        </div>
      </div>

      {remainingCount > 0 && (
        <div className="text-xs text-gray-400 dark:text-gray-400 mt-3">
          ... and {remainingCount} more entries
        </div>
      )}
    </div>
  );
}

function SingleDayEntryForm({
  onSave,
  loading,
}: {
  onSave: () => void;
  loading: boolean;
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState('');
  const [bfPercent, setBfPercent] = useState('');
  const [lbmKg, setLbmKg] = useState('');
  const [bmi, setBmi] = useState('');
  const [saved, setSaved] = useState(false);

  async function saveEntry() {
    if (!date || !weightKg) {
      alert('Date and Weight are required fields.');
      return;
    }

    try {
      const response = await fetch(apiPath('/api/biometrics'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          weightKg: Number.parseFloat(weightKg),
          bfPercent: bfPercent ? Number.parseFloat(bfPercent) : null,
          lbmKg: lbmKg ? Number.parseFloat(lbmKg) : null,
          bmi: bmi ? Number.parseFloat(bmi) : null,
        }),
      });

      if (response.ok) {
        setSaved(true);
        onSave();
        setTimeout(() => {
          setDate(new Date().toISOString().split('T')[0]);
          setWeightKg('');
          setBfPercent('');
          setLbmKg('');
          setBmi('');
          setSaved(false);
        }, 2000);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to save entry'}`);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving entry');
    }
  }

  return (
    <div className="surface-card p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-100 dark:text-gray-100">Enter a Single Day</h2>
      <p className="text-sm text-gray-200 dark:text-gray-200">
        Weight is required. Body-fat, lean-mass, and BMI fields are optional.
      </p>

      {saved && (
        <div className="bg-green-900/30 dark:bg-green-900/30 border border-green-500 dark:border-green-500 p-4 rounded">
          <p className="text-sm font-medium text-green-200 dark:text-green-200">
            Entry saved successfully.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
            Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="glass-input w-full px-4 py-3 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
            Weight (kg) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g., 74.8"
            className="glass-input w-full px-4 py-3 rounded-lg text-base placeholder-gray-500 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
            Body Fat % (optional)
          </label>
          <input
            type="number"
            step="0.1"
            value={bfPercent}
            onChange={(e) => setBfPercent(e.target.value)}
            placeholder="e.g., 13.0"
            className="glass-input w-full px-4 py-3 rounded-lg text-base placeholder-gray-500 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
            LBM - Lean Body Mass (kg) (optional)
          </label>
          <input
            type="number"
            step="0.1"
            value={lbmKg}
            onChange={(e) => setLbmKg(e.target.value)}
            placeholder="e.g., 65.0"
            className="glass-input w-full px-4 py-3 rounded-lg text-base placeholder-gray-500 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1">
            BMI (optional)
          </label>
          <input
            type="number"
            step="0.1"
            value={bmi}
            onChange={(e) => setBmi(e.target.value)}
            placeholder="e.g., 22.6"
            className="glass-input w-full px-4 py-3 rounded-lg text-base placeholder-gray-500 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={saveEntry}
        disabled={loading || !date || !weightKg}
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Save Entry'}
      </button>
    </div>
  );
}
