import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useEntries } from '../hooks/useEntries';
import { detectCyclePhase } from '../utils/cycle';
import { getMoonIllumination, getMoonPhase } from '../utils/cosmos';

const FIELDS = [
  { key: 'body.mood',                label: 'Mood'                   },
  { key: 'body.sleep',               label: 'Sleep'                  },
  { key: 'body.creativeEnergy',      label: 'Creative Energy'        },
  { key: 'body.libido',              label: 'Libido'                 },
  { key: 'body.breastPain',          label: 'Breast Tenderness'      },
  { key: 'body.breastSize',          label: 'Breast Size'            },
  { key: 'body.nippleChange',        label: 'Nipple Change'          },
  { key: 'body.lhPeak',              label: 'LH Reading'             },
  { key: 'body.temp',                label: 'BBT (°C)'               },
  { key: 'period.flow',              label: 'Flow'                   },
  { key: 'period.cramps',            label: 'Cramps'                 },
  { key: 'fasting.active',           label: 'Fasting'                },
  { key: 'poops.length',             label: 'Poop count'             },
  { key: 'cosmos.moonIllumination',  label: 'Moon Illumination (%)'  },
];

function getNestedValue(obj, path) {
  if (path === 'poops.length') return obj.poops?.length ?? null;
  if (path === 'fasting.active') return obj.fasting?.active ? 1 : null;
  if (path === 'cosmos.moonIllumination') {
    return getMoonIllumination(getMoonPhase(obj.date));
  }
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

const RANGES = [
  { label: '30d', days: 30 },
  { label: '60d', days: 60 },
  { label: '90d', days: 90 },
  { label: 'All', days: Infinity },
];

const COLORS = ['#9b7ec8', '#e91e8c', '#4caf82', '#ffb347'];

export default function Trends() {
  const { entries } = useEntries();
  const [fields, setFields] = useState(['body.mood', 'body.creativeEnergy']);
  const [range, setRange] = useState(60);
  const [chartType, setChartType] = useState('line');

  const data = useMemo(() => {
    const cutoff = range === Infinity ? '' : (() => {
      const d = new Date();
      d.setDate(d.getDate() - range);
      return d.toISOString().split('T')[0];
    })();

    return Object.values(entries)
      .filter(e => !cutoff || e.date >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(e => {
        const point = { date: e.date.slice(5) }; // MM-DD
        fields.forEach(f => {
          const val = getNestedValue(e, f);
          if (val != null && val !== '') point[f] = Number(val);
        });
        point.phase = detectCyclePhase(e.date, entries);
        return point;
      });
  }, [entries, fields, range]);

  function toggleField(key) {
    setFields(prev =>
      prev.includes(key)
        ? prev.filter(f => f !== key)
        : prev.length < 4 ? [...prev, key] : prev
    );
  }

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  return (
    <div className="screen trends-screen">
      <header className="screen-header">
        <h2>Trends</h2>
      </header>

      <div className="trends-controls">
        <div className="range-pills">
          {RANGES.map(r => (
            <button
              key={r.label}
              className={`range-pill ${range === r.days ? 'active' : ''}`}
              onClick={() => setRange(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="chart-type-toggle">
          <button className={chartType === 'line' ? 'active' : ''} onClick={() => setChartType('line')}>Line</button>
          <button className={chartType === 'bar' ? 'active' : ''} onClick={() => setChartType('bar')}>Bar</button>
        </div>
      </div>

      <div className="field-selector">
        <p className="selector-hint">Select up to 4 fields:</p>
        <div className="field-pills">
          {FIELDS.map(f => (
            <button
              key={f.key}
              className={`field-pill ${fields.includes(f.key) ? 'active' : ''}`}
              onClick={() => toggleField(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <p>No data yet. Start logging on the Today screen.</p>
        </div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <ChartComponent data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,140,255,0.1)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#a09cbf', fontSize: 10 }}
                interval={Math.floor(data.length / 6)}
              />
              <YAxis tick={{ fill: '#a09cbf', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1e1333', border: '1px solid #4a2f9e', borderRadius: 8, color: '#f0e6ff' }}
                labelStyle={{ color: '#c5a8f0' }}
              />
              <Legend wrapperStyle={{ color: '#c5a8f0', fontSize: 12 }} />
              {fields.map((f, i) => {
                const field = FIELDS.find(x => x.key === f);
                if (chartType === 'line') {
                  return (
                    <Line
                      key={f}
                      type="monotone"
                      dataKey={f}
                      name={field?.label}
                      stroke={COLORS[i]}
                      dot={false}
                      strokeWidth={2}
                      connectNulls
                    />
                  );
                }
                return (
                  <Bar key={f} dataKey={f} name={field?.label} fill={COLORS[i]} opacity={0.8} />
                );
              })}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
