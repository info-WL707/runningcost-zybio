import { useState, useEffect, useRef } from 'react';
import { HEMATO, CC, CC_P } from '../lib/data';

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseIDR(str) {
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}
function fmt(n) {
  if (!isFinite(n) || isNaN(n) || n === null) return '—';
  return Math.round(n).toLocaleString('id-ID');
}
function rp(n) {
  if (!isFinite(n) || isNaN(n) || n === null) return '—';
  return 'Rp ' + fmt(n);
}
function initFmt(v) {
  return v > 0 ? Math.round(v).toLocaleString('id-ID') : '0';
}
const nettOf = (obj) => obj.price * (1 - obj.disc / 100);
const sellOf = (base, markup) => markup < 100 ? base / (1 - markup / 100) : 0;

// ─── NumInput ─────────────────────────────────────────────────────────────────

function NumInput({ value, onChange, prefix, suffix }) {
  const [text, setText] = useState(() => initFmt(value));
  const editing = useRef(false);

  useEffect(() => { if (!editing.current) setText(initFmt(value)); }, [value]);

  return (
    <div className="field-row">
      {prefix && <span className="pfx">{prefix}</span>}
      <input
        type="text" value={text} className="ni" inputMode="numeric"
        onFocus={() => { editing.current = true; }}
        onChange={e => { setText(e.target.value); onChange(parseIDR(e.target.value)); }}
        onBlur={() => {
          editing.current = false;
          const v = parseIDR(text); setText(initFmt(v)); onChange(v);
        }}
      />
      {suffix && <span className="sfx">{suffix}</span>}
    </div>
  );
}

// ─── CCNumInput (inline table cell) ──────────────────────────────────────────

function CCNumInput({ value, onChange, small = false }) {
  const [text, setText] = useState(() => initFmt(value));
  const editing = useRef(false);

  useEffect(() => { if (!editing.current) setText(initFmt(value)); }, [value]);

  return (
    <input
      type="text" value={text} className={small ? 'di' : 'pi'} inputMode="numeric"
      onFocus={() => { editing.current = true; }}
      onChange={e => { setText(e.target.value); onChange(parseIDR(e.target.value)); }}
      onBlur={() => {
        editing.current = false;
        const v = parseIDR(text); setText(initFmt(v)); onChange(v);
      }}
    />
  );
}

// ─── HematoTable ─────────────────────────────────────────────────────────────

function HematoTable({ data, hRes, capPt, markup, D }) {
  const isPb     = data.label === 'Z52' || data.label === 'Z50';
  const colCount = isPb ? 5 : 4;

  const rows = data.reagents.map(r => {
    const pr  = hRes ? hRes.pr[r.id] : null;
    const cyc = pr ? pr.c : 0;
    const fix = pr ? pr.f : 0;
    const pb  = isPb && r.id === 'probe' && hRes ? (hRes.pb || 0) : 0;
    return { ...r, cyc, fix, pb, tot: cyc + fix + pb };
  });

  const totR = rows.reduce((s, r) => s + r.tot, 0);
  const base = capPt + totR;
  const sell = sellOf(base, markup);

  return (
    <div className="tbl-section">
      <div className="tbl-hbar">
        <span className="tbl-title">Rincian Reagen — {data.label} ({data.diff})</span>
        <span className="tbl-note">
          {D > 0 ? `${fmt(D)} test/hari · startup+shutdown dialokasikan per test` : 'isi parameter KSO di sidebar'}
        </span>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Reagen</th>
              <th>Pack</th>
              <th className="r">Siklus/Test</th>
              <th className="r">Tetap/Test</th>
              {isPb && <th className="r">Berkala/Test</th>}
              <th className="r">Total/Test</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.fn}</td>
                <td style={{ color: 'var(--text-3)', fontSize: '11px' }}>{r.pack}</td>
                <td className="r">{hRes ? fmt(r.cyc) : '—'}</td>
                <td className="r">{hRes ? fmt(r.fix) : '—'}</td>
                {isPb && <td className="r">{r.id === 'probe' && hRes ? fmt(r.pb) : '—'}</td>}
                <td className="cpt">{hRes ? fmt(r.tot) : '—'}</td>
              </tr>
            ))}
            <tr className="tr-sub">
              <td colSpan={colCount}>Total Biaya Reagen / Test</td>
              <td className="cpt">{hRes ? fmt(totR) : '—'}</td>
            </tr>
            <tr className="tr-capex">
              <td colSpan={colCount} style={{ color: 'var(--red)' }}>+ CAPEX / Test</td>
              <td className="r" style={{ fontWeight: 700, color: 'var(--red)' }}>{rp(capPt)}</td>
            </tr>
            <tr className="tr-sell">
              <td colSpan={colCount}>Harga Jual / Test — margin {markup}%</td>
              <td className="cpt">{hRes ? rp(sell) : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CCTable ──────────────────────────────────────────────────────────────────

const PAN_CLS = { Hepatic: 'bh', Renal: 'br', Lipid: 'bl', Diabetes: 'bd' };

function CCTable({ data, ccPar, updCCPar, detRes, capPt, markup, consObjs }) {
  const detTotal = detRes ? detRes.total : 0;

  return (
    <div className="tbl-section">
      <div className="tbl-hbar">
        <span className="tbl-title">Simulasi Pricelist — {data.label}</span>
        <span className="tbl-note">
          Beban alat + beban consumable dihitung per sampel · simulasi harga per parameter
        </span>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              {/* identitas */}
              <th style={{ width: 28 }}>No</th>
              <th>Parameter</th>
              <th>Panel</th>
              <th>Pack</th>
              <th className="r">Test/Kit</th>
              {/* harga reagen */}
              <th className="r" style={{ borderLeft: '2px solid #C7D6F0' }}>Harga Beli</th>
              <th className="r">Disc %</th>
              <th className="r">Nett/Kit</th>
              <th className="r">Reagen/Test</th>
              {/* simulasi */}
              <th className="r" style={{ borderLeft: '2px solid #C7D6F0', background: '#EBF0FB' }}>Beban Alat/Test</th>
              <th className="r" style={{ background: '#EBF0FB' }}>Beban Cons/Test</th>
              <th className="r" style={{ background: '#EBF0FB' }}>Base/Test</th>
              <th className="r" style={{ background: '#D6E8FF', fontWeight: 800 }}>Jual/Test</th>
              <th className="r" style={{ background: '#D6E8FF', fontWeight: 800 }}>Simulasi/Kit</th>
            </tr>
          </thead>
          <tbody>
            {CC_P.map(p => {
              const par     = ccPar[p.no];
              const nett    = par.price * (1 - par.disc / 100);
              const rgnCpt  = p.t > 0 ? nett / p.t : 0;
              const base    = capPt + detTotal + rgnCpt;
              const sellPt  = sellOf(base, markup);
              const sellKit = sellPt * p.t;
              return (
                <tr key={p.no}>
                  <td style={{ color: 'var(--text-3)' }}>{p.no}</td>
                  <td style={{ fontWeight: 700 }}>{p.p}</td>
                  <td><span className={`badge ${PAN_CLS[p.pan] || 'bh'}`}>{p.pan}</span></td>
                  <td style={{ fontSize: '11px', color: 'var(--text-2)' }}>{p.pack}</td>
                  <td className="r">{fmt(p.t)}</td>

                  <td className="r" style={{ borderLeft: '2px solid #C7D6F0' }}>
                    <CCNumInput value={par.price} onChange={v => updCCPar(p.no, 'price', v)} />
                  </td>
                  <td className="r">
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                      <CCNumInput value={par.disc} onChange={v => updCCPar(p.no, 'disc', v)} small />
                      <span style={{ color: 'var(--text-3)' }}>%</span>
                    </span>
                  </td>
                  <td className="r">{fmt(nett)}</td>
                  <td className="cpt">{fmt(rgnCpt)}</td>

                  <td className="r" style={{ borderLeft: '2px solid #C7D6F0', background: '#F3F7FF', color: 'var(--text-2)' }}>{detRes ? fmt(capPt) : '—'}</td>
                  <td className="r" style={{ background: '#F3F7FF', color: 'var(--text-2)' }}>{detRes ? fmt(detTotal) : '—'}</td>
                  <td className="r" style={{ background: '#F3F7FF', fontWeight: 600 }}>{detRes ? fmt(base) : '—'}</td>
                  <td className="r" style={{ background: '#EBF3FF', fontWeight: 700, color: 'var(--blue)' }}>{detRes ? rp(sellPt) : '—'}</td>
                  <td className="r" style={{ background: '#EBF3FF', fontWeight: 800, color: 'var(--blue)', fontSize: 13 }}>{detRes ? rp(sellKit) : '—'}</td>
                </tr>
              );
            })}

            {/* Consumable rows */}
            {data.cons.map(c => {
              const obj    = consObjs[c.id];
              const nett   = nettOf(obj);
              const detCpt = detRes ? (c.id === 'conc' ? detRes.conc : detRes.probe) : null;
              return (
                <tr key={c.id} style={{ background: '#F0F9FF' }}>
                  <td style={{ color: 'var(--text-3)' }}>—</td>
                  <td style={{ fontWeight: 600 }}>{c.fn}</td>
                  <td><span className="badge bc">Consumable</span></td>
                  <td style={{ fontSize: '11px', color: 'var(--text-2)' }}>{c.pack}</td>
                  <td className="r" style={{ color: 'var(--text-3)' }}>/{fmt(c.vol)} mL</td>

                  <td className="r" style={{ borderLeft: '2px solid #C7D6F0', color: 'var(--text-3)' }}>{fmt(obj.price)}</td>
                  <td className="r" style={{ color: 'var(--text-3)' }}>{obj.disc}%</td>
                  <td className="r" style={{ color: 'var(--text-3)' }}>{fmt(nett)}</td>
                  <td className="cpt">{detCpt !== null ? fmt(detCpt) : '—'}</td>

                  <td colSpan={5} style={{ borderLeft: '2px solid #C7D6F0', color: 'var(--text-3)', fontSize: 11, background: '#F0F9FF' }}>
                    Biaya consumable sudah dimasukkan ke kolom Beban Cons/Test setiap parameter
                  </td>
                </tr>
              );
            })}

            <tr className="tr-sub">
              <td colSpan={9}>Total Detergent / Sampel</td>
              <td colSpan={5} className="cpt" style={{ textAlign: 'right' }}>
                {detRes ? rp(detTotal) : '—'}
              </td>
            </tr>
            <tr className="tr-capex">
              <td colSpan={9} style={{ color: 'var(--red)' }}>+ CAPEX / Sampel</td>
              <td colSpan={5} className="r" style={{ fontWeight: 700, color: 'var(--red)' }}>
                {rp(capPt)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Initial state ────────────────────────────────────────────────────────────

function initHSet() {
  return {
    Z3:      { price: 115e6,     disc: 0,  kso: 60, markup: 20, tests: 500  },
    Z52:     { price: 190e6,     disc: 0,  kso: 60, markup: 20, tests: 750  },
    Z50:     { price: 210e6,     disc: 0,  kso: 60, markup: 20, tests: 750  },
    EXZ8000: { price: 500e6,     disc: 0,  kso: 60, markup: 20, tests: 2000 },
    EXZ6000: { price: 365e6,     disc: 0,  kso: 60, markup: 20, tests: 1500 },
  };
}
function initCSet() {
  return {
    EXC200: { price: 210e6,     disc: 30, kso: 60, markup: 20, tests: 1800 },
    EXC400: { price: 765765000, disc: 0,  kso: 60, markup: 20, tests: 5000 },
  };
}
function initHRp() {
  return {
    Z3:      { lyse: {price:1550000,disc:0}, dil: {price:1550000,disc:0}, probe: {price:400000,disc:0} },
    Z52:     { dn: {price:2000000,disc:0}, ld: {price:2500000,disc:0}, lb: {price:2000000,disc:0}, probe: {price:400000,disc:0} },
    Z50:     { dn: {price:2000000,disc:0}, ld: {price:2500000,disc:0}, lb: {price:2000000,disc:0}, probe: {price:400000,disc:0} },
    EXZ8000: {
      dn:    {price:1870000, disc:0}, ld:    {price:11787000,disc:0}, ln:    {price:11787000,disc:0},
      fd:    {price:8840000, disc:0}, fn:    {price:2550000, disc:0}, ls:    {price:3684000, disc:0},
      dr:    {price:2947000, disc:0}, fr:    {price:9577000, disc:0}, probe: {price:800000,  disc:0},
    },
    EXZ6000: { dn: {price:2000000,disc:0}, ldi: {price:2600000,disc:0}, ldii: {price:3250000,disc:0}, lb: {price:2250000,disc:0}, probe: {price:400000,disc:0} },
  };
}
function initCCCons() {
  return {
    EXC200: { conc: {price:10032000,disc:0}, probe_d: {price:4026000,disc:0} },
    EXC400: { conc: {price:10032000,disc:0}, probe_d: {price:4026000,disc:0} },
  };
}
function initCCPar() {
  return Object.fromEntries(CC_P.map(p => [p.no, { price: p.dp, disc: 0 }]));
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [tab,         setTab]         = useState('hemato');
  const [hType,       setHType]       = useState('Z3');
  const [cType,       setCType]       = useState('EXC200');
  const [hSet,        setHSet]        = useState(initHSet);
  const [cSet,        setCSet]        = useState(initCSet);
  const [ups,         setUps]         = useState(0);
  const [lis,         setLis]         = useState(0);
  const [workDays,    setWorkDays]    = useState(25);
  const [backupOn,    setBackupOn]    = useState(false);
  const [backupKey,   setBackupKey]   = useState('Z3');
  const [backupPrice, setBackupPrice] = useState(115e6);
  const [backupDisc,  setBackupDisc]  = useState(0);
  const [hRp,    setHRp]    = useState(initHRp);
  const [ccCons, setCCCons] = useState(initCCCons);
  const [ccPar,  setCCPar]  = useState(initCCPar);

  // ── CAPEX ──
  const curSet  = tab === 'hemato' ? hSet[hType] : cSet[cType];
  const aNett   = curSet.price * (1 - curSet.disc / 100);
  const bNett   = backupOn ? backupPrice * (1 - backupDisc / 100) : 0;
  const totCap  = aNett + ups + lis + bNett;
  const totTest = curSet.kso * curSet.tests;
  const capPt   = totTest > 0 ? totCap / totTest : 0;
  const D       = workDays > 0 ? curSet.tests / workDays : 0;

  // ── Nett price maps ──
  const rpNettMap = {};
  Object.entries(hRp[hType]).forEach(([id, obj]) => { rpNettMap[id] = nettOf(obj); });

  const consNettMap = {};
  Object.entries(ccCons[cType]).forEach(([id, obj]) => { consNettMap[id] = nettOf(obj); });

  // ── Calc ──
  let hRes   = null;
  let detRes = null;

  if (tab === 'hemato' && D > 0) {
    hRes = HEMATO[hType].calc(curSet.tests, workDays, rpNettMap);
  } else if (tab === 'cc' && D > 0) {
    detRes = CC[cType].det(curSet.tests, workDays, consNettMap.conc, consNettMap.probe_d);
  }

  // ── CC: average reagent cost/test across all 16 parameters ──
  const avgReagenCpt = CC_P.reduce((sum, p) => {
    const par  = ccPar[p.no];
    const nett = par.price * (1 - par.disc / 100);
    return sum + (p.t > 0 ? nett / p.t : 0);
  }, 0) / CC_P.length;

  const detTotal = detRes ? detRes.total : 0;

  // ── Base cost & sell price ──
  const hReagenCpt = hRes ? hRes.total : 0;
  const baseCost   = tab === 'hemato'
    ? capPt + hReagenCpt
    : capPt + detTotal + avgReagenCpt;
  const sellPrice  = sellOf(baseCost, curSet.markup);

  // ── Updaters ──
  const updH  = (f, v) => setHSet(p  => ({ ...p, [hType]: { ...p[hType], [f]: v } }));
  const updC  = (f, v) => setCSet(p  => ({ ...p, [cType]: { ...p[cType], [f]: v } }));
  const updS  = (f, v) => tab === 'hemato' ? updH(f, v) : updC(f, v);

  const updHRp    = (id, fld, v) => setHRp(p    => ({ ...p, [hType]: { ...p[hType], [id]: { ...p[hType][id], [fld]: v } } }));
  const updCCCons = (id, fld, v) => setCCCons(p  => ({ ...p, [cType]: { ...p[cType], [id]: { ...p[cType][id], [fld]: v } } }));
  const updCCPar  = (no, fld, v) => setCCPar(p   => ({ ...p, [no]: { ...p[no], [fld]: v } }));

  const selHType = (t) => {
    setHType(t);
    if (backupOn) { setBackupKey(t); setBackupPrice(HEMATO[t].dP); setBackupDisc(HEMATO[t].dD); }
  };
  const onBackupKeyChange = (key) => {
    setBackupKey(key);
    const d = tab === 'hemato' ? HEMATO[key] : CC[key];
    if (d) { setBackupPrice(d.dP); setBackupDisc(d.dD); }
  };

  const types   = tab === 'hemato' ? Object.values(HEMATO) : Object.values(CC);
  const curKey  = tab === 'hemato' ? hType : cType;
  const setType = tab === 'hemato' ? selHType : setCType;

  const reagents   = tab === 'hemato' ? HEMATO[hType].reagents : CC[cType].cons;
  const getRpObj   = (id) => tab === 'hemato' ? hRp[hType][id] : ccCons[cType][id];
  const setRpField = (id, fld, v) => tab === 'hemato' ? updHRp(id, fld, v) : updCCCons(id, fld, v);

  // ── Metrics ──
  const MetricsHemato = () => (
    <div className="metrics">
      <div className="mc">
        <div className="ml">CAPEX / Test</div>
        <div className="mv">{rp(capPt)}</div>
        <div className="ms">{totTest > 0 ? `${fmt(totTest)} test · ${curSet.kso} bln` : '—'}</div>
      </div>
      <div className="mc">
        <div className="ml">Reagen / Test (CBC)</div>
        <div className="mv">{rp(hReagenCpt)}</div>
        <div className="ms">{D > 0 ? `${fmt(D)} test/hari` : '—'}</div>
      </div>
      <div className="mc">
        <div className="ml">Base Cost / Test</div>
        <div className="mv">{rp(baseCost)}</div>
        <div className="ms">sebelum markup</div>
      </div>
      <div className="mc hi">
        <div className="ml">Harga Jual / Test</div>
        <div className="mv">{rp(sellPrice)}</div>
        <div className="ms">margin {curSet.markup}%</div>
      </div>
    </div>
  );

  const MetricsCC = () => (
    <div className="metrics metrics-cc">
      <div className="mc">
        <div className="ml">① Beban Alat / Sampel</div>
        <div className="mv">{rp(capPt)}</div>
        <div className="ms">{totTest > 0 ? `CAPEX ÷ ${fmt(totTest)} sampel` : '—'}</div>
      </div>
      <div className="mc">
        <div className="ml">② Beban Consumable / Sampel</div>
        <div className="mv">{rp(detTotal)}</div>
        <div className="ms">{D > 0 ? `detergent · ${fmt(D)} sampel/hari` : '—'}</div>
      </div>
      <div className="mc">
        <div className="ml">③ Avg Reagen / Test</div>
        <div className="mv">{rp(avgReagenCpt)}</div>
        <div className="ms">rata-rata {CC_P.length} parameter</div>
      </div>
      <div className="mc" style={{ borderColor: '#CBD5E1' }}>
        <div className="ml">Base Cost Avg / Test</div>
        <div className="mv" style={{ fontSize: 18 }}>{rp(baseCost)}</div>
        <div className="ms">① + ② + ③</div>
      </div>
      <div className="mc hi">
        <div className="ml">Avg Harga Jual / Test</div>
        <div className="mv">{rp(sellPrice)}</div>
        <div className="ms">margin {curSet.markup}%</div>
      </div>
    </div>
  );

  return (
    <div>
      <header className="hdr">
        <div className="brand">
          <span className="brand-n">ZYBIO</span>
          <span className="brand-t">KSO Running Cost Simulator</span>
        </div>
        <div className="hdr-r">Hematologi &amp; Kimia Klinik<br />Wahana Lifeline · 2026</div>
      </header>

      <nav className="tab-bar">
        {[{ key: 'hemato', label: 'Hematologi' }, { key: 'cc', label: 'Kimia Klinik' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`tab-btn${tab === t.key ? ' active' : ''}`}>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="workspace">
        <aside className="sidebar">

          <div className="sb-section">
            <div className="sb-lbl">Tipe Analyzer</div>
            <div className="type-grid">
              {types.map(t => (
                <button key={t.label} onClick={() => setType(t.label)}
                  className={`type-btn${curKey === t.label ? ' active' : ''}`}>
                  {t.label}
                  {t.diff && <span className="diff-tag">{t.diff}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-lbl">CAPEX</div>
            <div className="field">
              <label>Harga Analyzer</label>
              <NumInput value={curSet.price} onChange={v => updS('price', v)} prefix="Rp" />
            </div>
            <div className="field">
              <label>Diskon Analyzer</label>
              <NumInput value={curSet.disc} onChange={v => updS('disc', v)} suffix="%" />
            </div>
            <div className="comp">
              <span className="cl">Nett Analyzer</span><span className="cv">{rp(aNett)}</span>
            </div>
            <div className="field">
              <label>UPS</label>
              <NumInput value={ups} onChange={setUps} prefix="Rp" />
            </div>
            <div className="field">
              <label>LIS</label>
              <NumInput value={lis} onChange={setLis} prefix="Rp" />
            </div>
            <div className="sep" />
            <div className="bck-toggle">
              <input type="checkbox" id="bck-on" checked={backupOn}
                onChange={e => setBackupOn(e.target.checked)} />
              <label htmlFor="bck-on">+ Backup Analyzer</label>
            </div>
            {backupOn && (
              <div className="bck-fields">
                <div className="field">
                  <label>Tipe Backup</label>
                  <select value={backupKey} onChange={e => onBackupKeyChange(e.target.value)}>
                    {types.map(t => (
                      <option key={t.label} value={t.label}>
                        {t.label}{t.diff ? ` (${t.diff})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Harga Backup</label>
                  <NumInput value={backupPrice} onChange={setBackupPrice} prefix="Rp" />
                </div>
                <div className="field">
                  <label>Diskon Backup</label>
                  <NumInput value={backupDisc} onChange={setBackupDisc} suffix="%" />
                </div>
                <div className="comp">
                  <span className="cl">Nett Backup</span><span className="cv">{rp(bNett)}</span>
                </div>
              </div>
            )}
            <div className="comp strong">
              <span className="cl">Total CAPEX</span><span className="cv">{rp(totCap)}</span>
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-lbl">Parameter KSO</div>
            <div className="field">
              <label>Masa KSO</label>
              <NumInput value={curSet.kso} onChange={v => updS('kso', v)} suffix="bln" />
            </div>
            <div className="field">
              <label>{tab === 'hemato' ? 'Test / Bulan' : 'Sampel / Bulan'}</label>
              <NumInput value={curSet.tests} onChange={v => updS('tests', v)} />
            </div>
            <div className="field">
              <label>Hari Kerja / Bulan</label>
              <NumInput value={workDays} onChange={setWorkDays} suffix="hari" />
            </div>
            <div className="comp">
              <span className="cl">{tab === 'hemato' ? 'Test' : 'Sampel'} / Hari</span>
              <span className="cv">{D > 0 ? fmt(D) : '—'}</span>
            </div>
            <div className="comp">
              <span className="cl">Total {tab === 'hemato' ? 'Test' : 'Sampel'} KSO</span>
              <span className="cv">{totTest > 0 ? fmt(totTest) : '—'}</span>
            </div>
            <div className="field" style={{ marginTop: 6 }}>
              <label>Margin / Markup</label>
              <NumInput value={curSet.markup} onChange={v => updS('markup', v)} suffix="%" />
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-lbl">
              {tab === 'hemato' ? 'Harga Reagen' : 'Harga Consumable'}
            </div>
            <div className="rp-list">
              {reagents.map(r => {
                const obj  = getRpObj(r.id);
                const nett = nettOf(obj);
                return (
                  <div key={r.id} className="rp-item">
                    <div className="rp-name" title={r.fn}>{r.fn}</div>
                    <div className="rp-pack">{r.pack}</div>
                    <div className="rp-row2">
                      <div className="field" style={{ margin: 0 }}>
                        <label>Harga Beli</label>
                        <NumInput value={obj.price} onChange={v => setRpField(r.id, 'price', v)} prefix="Rp" />
                      </div>
                      <div className="field" style={{ margin: 0 }}>
                        <label>Diskon</label>
                        <NumInput value={obj.disc} onChange={v => setRpField(r.id, 'disc', v)} suffix="%" />
                      </div>
                    </div>
                    <div className="rp-nett">Nett: <span>{rp(nett)}</span></div>
                  </div>
                );
              })}
            </div>
          </div>

        </aside>

        <div className="main">
          {tab === 'hemato' ? <MetricsHemato /> : <MetricsCC />}

          {tab === 'hemato' ? (
            <HematoTable
              data={HEMATO[hType]} hRes={hRes}
              capPt={capPt} markup={curSet.markup} D={D}
            />
          ) : (
            <CCTable
              data={CC[cType]} ccPar={ccPar} updCCPar={updCCPar}
              detRes={detRes} capPt={capPt} markup={curSet.markup}
              consObjs={ccCons[cType]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
