/* frame.jsx — shared phone shell, icon set, ring + line-chart helpers */

const ICONS = {
  home:   <path d="M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9" />,
  user:   <><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
  food:   <><path d="M6 3v8m0 0a2.4 2.4 0 0 0 0-4.8M4 3v3.2a2 2 0 0 0 2 2M8 3v3.2a2 2 0 0 1-2 2M6 11v10" /><path d="M16 3c-1.5 1-2.5 3-2.5 6 0 1.6 1 2.4 2.5 2.4V21" /></>,
  weight: <><path d="M5 8h14l1.6 12.5a1 1 0 0 1-1 1.1H4.4a1 1 0 0 1-1-1.1L5 8Z" /><path d="M9.5 8a2.5 2.5 0 0 1 5 0" /></>,
  steps:  <><path d="M8.5 14c-1.6 0-2.6-1.2-2.8-3-.2-1.6.3-3.6.3-5.2C6 4.3 6.8 3.5 8 3.5s2 .9 2 2.1c0 1.7-.3 2.9-.3 4.6 0 2.2-.6 3.8-1.2 3.8Z" /><path d="M7 17.5c0 1.4.8 3 2.4 3 1.3 0 2.1-1 2.1-2.3 0-.8-.4-1.6-1.2-2.4" /></>,
  sleep:  <path d="M20 14.2A8 8 0 0 1 9.8 4 8 8 0 1 0 20 14.2Z" />,
  camera: <><rect x="3" y="6.5" width="18" height="13" rx="2.5" /><circle cx="12" cy="13" r="3.4" /><path d="M8.5 6.5 9.8 4h4.4l1.3 2.5" /></>,
  close:  <path d="M6 6l12 12M18 6 6 18" />,
  cal:    <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>,
  chevL:  <path d="M14.5 5 8 12l6.5 7" />,
  chevR:  <path d="M9.5 5 16 12l-6.5 7" />,
  chevD:  <path d="M5 9.5 12 16l7-6.5" />,
  up:     <path d="M6 14l6-6 6 6" />,
  down:   <path d="M6 10l6 6 6-6" />,
  plus:   <path d="M12 5v14M5 12h14" />,
  minus:  <path d="M5 12h14" />,
};

function Icon({ name, size = 22, stroke = 1.7, color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style}>
      {ICONS[name]}
    </svg>
  );
}

function StatusBar() {
  return (
    <div className="phone-status">
      <span>9:41</span>
      <div className="sb-right">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4.5" width="3" height="7.5" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 4.2A11 11 0 0 1 16 4.2M3.4 6.8a7.2 7.2 0 0 1 10.2 0M5.9 9.3a3.6 3.6 0 0 1 5.2 0"/><circle cx="8.5" cy="11" r=".6" fill="currentColor" stroke="none"/></svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="1" y="1" width="21" height="11" rx="3" stroke="currentColor" strokeOpacity=".5"/><rect x="3" y="3" width="15" height="7" rx="1.5" fill="currentColor"/><rect x="23.5" y="4.5" width="1.6" height="4" rx=".8" fill="currentColor" fillOpacity=".5"/></svg>
      </div>
    </div>
  );
}

function Phone({ themeClass, bare, children }) {
  return (
    <div className={"phone " + themeClass}>
      {!bare && <StatusBar />}
      <div className="phone-body">{children}</div>
    </div>
  );
}

/* Donut ring. pct can exceed nothing; clamped 0..1 for sweep */
function Ring({ size = 168, stroke = 12, pct = 0.5, track = "#eee", color = "#000", cap = "round", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap={cap} strokeDasharray={c} strokeDashoffset={c * (1 - p)} />
      </svg>
      {children}
    </div>
  );
}

/* Simple line chart for steps trend */
function LineChart({ data, w = 318, h = 150, color = "#000", track = "#eee", dot = "#000", labels = [], yticks = [], fill = null }) {
  const pad = { l: 30, r: 8, t: 10, b: 22 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const vals = data;
  const min = Math.min(...vals), max = Math.max(...vals);
  const lo = min - (max - min) * 0.25, hi = max + (max - min) * 0.18;
  const x = i => pad.l + (iw * i) / (vals.length - 1);
  const y = v => pad.t + ih - (ih * (v - lo)) / (hi - lo);
  const pts = vals.map((v, i) => [x(i), y(v)]);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = path + ` L${x(vals.length-1).toFixed(1)} ${pad.t+ih} L${pad.l} ${pad.t+ih} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {yticks.map((t, i) => {
        const yy = y(t.v);
        return <g key={i}>
          <line x1={pad.l} y1={yy} x2={w - pad.r} y2={yy} stroke={track} strokeWidth="1" strokeDasharray="2 4" />
          <text x={pad.l - 8} y={yy + 3} textAnchor="end" fontSize="9" fontFamily="var(--mono)" fill="var(--idx-faint)">{t.t}</text>
        </g>;
      })}
      {fill && <path d={area} fill={fill} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.2" fill={dot} />)}
      {labels.map((l, i) => {
        const last = i === labels.length - 1;
        const anchor = i === 0 ? "start" : last ? "end" : "middle";
        const lx = i === 0 ? pad.l - 2 : last ? w - pad.r + 2 : x(i);
        return <text key={i} x={lx} y={h - 5} textAnchor={anchor} fontSize="9" fontFamily="var(--mono)" fill="var(--idx-faint)">{l}</text>;
      })}
    </svg>
  );
}

Object.assign(window, { Icon, StatusBar, Phone, Ring, LineChart });
