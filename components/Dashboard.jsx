import { useState, useEffect, useRef } from 'react';
import { HEMATO, CC, CC_P, CC_PANELS, CROSSMATCH, CLIA, CLIA_PANELS, SNIBE_P, WONDFO_P } from '../lib/data';
import { exportHemato, exportCC, exportCrossmatch, exportCLIA } from '../lib/exportExcel';
import { printHemato, printCC, printCrossmatch, printCLIA } from '../lib/printPdf';

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
const nettOf   = (obj) => obj.price * (1 - obj.disc / 100);
const sellOf   = (base, markup) => markup < 100 ? base / (1 - markup / 100) : 0;

// ─── Analyzer dot colors ──────────────────────────────────────────────────────

const H_COLORS = {
  Z3:      '#10B981',
  Z52:     '#3B82F6',
  Z50:     '#6366F1',
  EXZ8000: '#8B5CF6',
  EXZ6000: '#F59E0B',
};
const C_COLORS = {
  EXC200: '#06B6D4',
  EXC400: '#EC4899',
};
const XM_COLORS = {
  LIBO:   '#E11D48',
  REDCEL: '#2563EB',
};
const CLIA_COLORS = {
  SNIBE:  '#7C3AED',
  WONDFO: '#0891B2',
};
const CAT_COLORS = {
  hemato: '#3B82F6',
  cc:     '#10B981',
  xm:     '#E11D48',
  clia:   '#7C3AED',
};
const PAN_CLS_CLIA = {
  'Cardiac/IGD':     'bc',
  'Infeksi':         'bctrl',
  'Diabetes':        'bm',
  'Sepsis/Inflam':   'br',
  'Thyroid':         'bh',
  'Anemia/Bone':     'bl',
  'Fertility/Hormon':'bcons',
  'Dengue':          'bc',
  'Infectious':      'bctrl',
  'Fertility':       'bm',
  'Tumour':          'br',
  'Critical':        'bc',
  'Metabolism':      'bl',
};
const PAN_CLS = {
  Hepatic:    'bh',
  Renal:      'br',
  Lipid:      'bl',
  Metabolic:  'bm',
  Control:    'bctrl',
  Consumable: 'bcons',
};

// ─── NumInput ─────────────────────────────────────────────────────────────────

function NumInput({ value, onChange, prefix, suffix, disabled }) {
  const [text, setText] = useState(() => initFmt(value));
  const editing = useRef(false);
  useEffect(() => { if (!editing.current) setText(initFmt(value)); }, [value]);
  return (
    <div className="field-row">
      {prefix && <span className="pfx">{prefix}</span>}
      <input
        type="text" value={text} className="ni" inputMode="numeric"
        disabled={!!disabled}
        onFocus={e => { editing.current = true; e.target.select(); }}
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

// ─── SmallNumInput — inline editable number (price / disc in parameter table) ─

function SmallNumInput({ value, onChange, tiny }) {
  const [text, setText] = useState(() => initFmt(value));
  const editing = useRef(false);
  useEffect(() => { if (!editing.current) setText(initFmt(value)); }, [value]);
  return (
    <input
      type="text" value={text}
      className={tiny ? 'di' : 'pi'}
      inputMode="numeric"
      onFocus={e => { editing.current = true; e.target.select(); }}
      onChange={e => { setText(e.target.value); onChange(parseIDR(e.target.value)); }}
      onBlur={() => {
        editing.current = false;
        const v = parseIDR(text); setText(initFmt(v)); onChange(v);
      }}
    />
  );
}

// ─── MerkPill ─────────────────────────────────────────────────────────────────

function MerkPill({ label, color, active, onClick, sub }) {
  return (
    <button
      className={`merk-pill${active ? ' merk-active' : ''}`}
      style={active ? { borderColor: color, color } : {}}
      onClick={onClick}
    >
      <span className="merk-dot" style={{ background: color }} />
      {label}
      {sub && <span className="merk-sub">{sub}</span>}
    </button>
  );
}

// ─── HematoResult (Page 2) ────────────────────────────────────────────────────

function HematoResult({ data, hRes, capPt, markup, D, modeLabel, hRpData, totCap, totTest, kso, ctrl, exzMode, onExzModeChange, workDays, testsPerMonth, qcFree, salesName, faskesName, kotaKab, kompetitor, backupLabel }) {
  const rows0 = data.reagents.map(r => {
    const obj         = hRpData[r.id] || { price: 0, disc: 0 };
    const nettKit     = obj.price * (1 - obj.disc / 100);
    const sellKit     = markup < 100 ? nettKit / (1 - markup / 100) : 0;
    const pr          = hRes ? hRes.pr[r.id] : null;
    const cyc         = pr ? pr.c : 0;
    const fix         = pr ? pr.f : 0;
    const contribTest = cyc + fix;
    return { ...r, obj, nettKit, sellKit, contribTest };
  });

  const totR = rows0.reduce((s, r) => s + r.contribTest, 0);
  const base = capPt + totR + (ctrl || 0);
  const sell       = sellOf(base, markup);

  // harga yang harus dimasukkan ke Excel agar Excel menghasilkan CPRR yang sama
  const rows = rows0.map(r => ({
    ...r,
    excelKit: totR > 0 && sell > 0 ? r.nettKit * sell / totR : 0,
  }));
  const markup_amt = sell - base;

  function handleExportHemato() {
    const analyzerName = `${data.label}${data.diff ? ` (${data.diff})` : ''}${modeLabel ? ` · ${modeLabel}` : ''}`;
    exportHemato({
      analyzerName,
      backupLabel: backupLabel || '',
      totCap,
      kso,
      testsPerMonth: testsPerMonth || (kso > 0 ? totTest / kso : 0),
      workDays: workDays || 25,
      markup,
      qcFree: qcFree !== undefined ? qcFree : true,
      capPt,
      totR,
      ctrlOverhead: ctrl || 0,
      sell,
      totTest,
      reagentRows: rows,
      salesName: salesName || '',
      faskesName: faskesName || '',
      kotaKab: kotaKab || '',
      kompetitor: kompetitor || '',
    });
  }
  function handlePrintHemato() {
    const analyzerName = `${data.label}${data.diff ? ` (${data.diff})` : ''}${modeLabel ? ` · ${modeLabel}` : ''}`;
    printHemato({
      analyzerName,
      backupLabel: backupLabel || '',
      totCap,
      kso,
      testsPerMonth: testsPerMonth || (kso > 0 ? totTest / kso : 0),
      workDays: workDays || 25,
      markup,
      qcFree: qcFree !== undefined ? qcFree : true,
      capPt,
      totR,
      ctrlOverhead: ctrl || 0,
      sell,
      totTest,
      reagentRows: rows,
      salesName: salesName || '',
      faskesName: faskesName || '',
      kotaKab: kotaKab || '',
      kompetitor: kompetitor || '',
    });
  }

  return (
    <div className="page2-wrap">
      {onExzModeChange && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 18px', background: '#F8FAFC', borderBottom: '1px solid var(--bdr)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginRight: 4 }}>MODE TEST</span>
          {[
            { id: 'cbc_diff',         label: 'CBC+Diff' },
            { id: 'cbc_diff_ret',     label: 'CBC+Diff+RET' },
            { id: 'cbc_diff_xn',      label: 'CBC+Diff+Check XN' },
            { id: 'cbc_diff_ret_xr',  label: 'CBC+Diff+RET+Check XR' },
          ].map(m => (
            <MerkPill key={m.id} label={m.label} color="#8B5CF6"
              active={exzMode === m.id} onClick={() => onExzModeChange(m.id)} />
          ))}
        </div>
      )}
      <div className="cprr-hero">
        <div className="cprr-left">
          <div className="cprr-label">COST / TEST — KSO CPRR</div>
          <div className="cprr-sub">
            {data.label} {data.diff}{modeLabel ? ` · ${modeLabel}` : ''}
            &nbsp;·&nbsp;{totTest > 0 ? `${fmt(totTest)} test · ${kso} bulan` : '—'}
            {D > 0 ? ` · ${fmt(D)} test/hari` : ''}
          </div>
          <div className="cprr-val">{hRes ? rp(sell) : '—'}</div>
        </div>
        <div className="cprr-pills">
          <span className="pill pl-cap">CAPEX/Test: {rp(capPt)}</span>
          <span className="pill pl-rgn">Reagen/Test: {hRes ? rp(totR) : '—'}</span>
          {ctrl > 0 && <span className="pill pl-qc">QC/Test: {rp(ctrl)}</span>}
          <span className="pill pl-base">Base Cost: {rp(base)}</span>
          <span className="pill pl-mkp">Markup {markup}%: {hRes ? rp(markup_amt) : '—'}</span>
        </div>
      </div>

      <div className="tbl-section">
        <div className="tbl-hbar">
          <span className="tbl-title">
            Rincian Reagen — {data.label} ({data.diff}){modeLabel ? ` · ${modeLabel}` : ''}
          </span>
          <span className="tbl-note">
            {D > 0 ? 'Harga KSO di Excel = harga yang dimasukkan ke file running cost Excel agar hasilnya sama dengan KSO CPRR' : 'Lengkapi input di halaman sebelumnya'}
          </span>
          {hRes && <button className="export-btn" onClick={handleExportHemato}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak Excel</button>}
          {hRes && <button className="print-btn" onClick={handlePrintHemato}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak PDF</button>}
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th className="mob-hide">Kemasan</th>
                <th className="r">Kontrib/Test</th>
                <th className="r th-sell">Sell/Kit (KSO)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.fn}</td>
                  <td className="mob-hide" style={{ color: 'var(--text-3)', fontSize: '11px' }}>{r.pack}</td>
                  <td className="cpt">{hRes ? fmt(r.contribTest) : '—'}</td>
                  <td className="r td-sell">{hRes && r.excelKit > 0 ? rp(r.excelKit) : '—'}</td>
                </tr>
              ))}
              {ctrl > 0 && (
                <tr className="tr-ctrl">
                  <td colSpan={2}>QC Control + Kalibrasi / Test</td>
                  <td className="cpt">{fmt(ctrl)}</td>
                  <td style={{ background: '#FFFBEB' }}>—</td>
                </tr>
              )}
              <tr className="tr-sub">
                <td colSpan={2}>Total Biaya Reagen / Test</td>
                <td className="cpt">{hRes ? fmt(totR) : '—'}</td>
                <td style={{ background: '#F1F5F9' }}></td>
              </tr>
              <tr className="tr-capex">
                <td colSpan={2} style={{ color: 'var(--red)' }}>
                  + CAPEX / Test&nbsp;
                  <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-3)' }}>
                    (Alat + UPS + LIS ÷ {fmt(totTest)} test KSO)
                  </span>
                </td>
                <td className="r" style={{ fontWeight: 700, color: 'var(--red)' }}>{rp(capPt)}</td>
                <td style={{ background: '#FFF5F5' }}></td>
              </tr>
              <tr className="tr-base">
                <td colSpan={2}>Base Cost / Test (sebelum markup)</td>
                <td className="cpt">{hRes ? rp(base) : '—'}</td>
                <td style={{ background: '#F8FAFC' }}></td>
              </tr>
              <tr className="tr-sell tr-sell-big">
                <td colSpan={2}>
                  Cost / Test KSO CPRR&nbsp;
                  <span style={{ fontWeight: 400, fontSize: 11 }}>margin {markup}%</span>
                </td>
                <td className="cpt" style={{ fontSize: 16, fontWeight: 900, color: 'var(--blue)' }}>
                  {hRes ? rp(sell) : '—'}
                </td>
                <td style={{ background: 'var(--blue2)' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CrossmatchResult ─────────────────────────────────────────────────────────

function CrossmatchResult({ data, xmRes, xmCapPt, markup, xmD, curMethod, xmTotTest, kso, xmRpNow, totCap, workDays, salesName, faskesName, kotaKab, kompetitor }) {
  const totR = xmRes ? xmRes.total : 0;
  const base = xmCapPt + totR;
  const sell = sellOf(base, markup);
  const markup_amt = sell - base;

  const rows = data.reagents.map(r => {
    const obj     = xmRpNow[r.id] || { price: 0, disc: 0 };
    const nettKit = obj.price * (1 - obj.disc / 100);
    const contrib = xmRes ? (xmRes.pr[r.id] || 0) : 0;
    const sellKit = markup < 100 ? nettKit / (1 - markup / 100) : 0;
    return { ...r, nettKit, contrib, sellKit };
  });

  function handleExportXM() {
    exportCrossmatch({
      analyzerName: data.label,
      methodLabel: curMethod.label,
      totCap: totCap || 0,
      kso,
      testsPerMonth: kso > 0 && xmTotTest > 0 ? xmTotTest / kso : 0,
      workDays: workDays || 25,
      markup,
      capPt: xmCapPt,
      totR,
      sell,
      totTest: xmTotTest,
      reagentRows: rows,
      salesName: salesName || '',
      faskesName: faskesName || '',
      kotaKab: kotaKab || '',
      kompetitor: kompetitor || '',
    });
  }
  function handlePrintXM() {
    printCrossmatch({
      analyzerName: data.label,
      methodLabel: curMethod.label,
      totCap: totCap || 0,
      kso,
      testsPerMonth: kso > 0 && xmTotTest > 0 ? xmTotTest / kso : 0,
      workDays: workDays || 25,
      markup,
      capPt: xmCapPt,
      totR,
      sell,
      totTest: xmTotTest,
      reagentRows: rows,
      salesName: salesName || '',
      faskesName: faskesName || '',
      kotaKab: kotaKab || '',
      kompetitor: kompetitor || '',
    });
  }

  return (
    <div className="page2-wrap">
      <div className="cprr-hero">
        <div className="cprr-left">
          <div className="cprr-label">COST / TEST — KSO CPRR</div>
          <div className="cprr-sub">
            {data.label} · {curMethod.label}
            &nbsp;·&nbsp;{xmTotTest > 0 ? `${fmt(xmTotTest)} test · ${kso} bulan` : '—'}
            {xmD > 0 ? ` · ${fmt(xmD)} test/hari` : ''}
          </div>
          <div className="cprr-val">{xmRes ? rp(sell) : '—'}</div>
        </div>
        <div className="cprr-pills">
          <span className="pill pl-cap">CAPEX/Test: {rp(xmCapPt)}</span>
          <span className="pill pl-rgn">Reagen/Test: {xmRes ? rp(totR) : '—'}</span>
          <span className="pill pl-base">Base Cost: {rp(base)}</span>
          <span className="pill pl-mkp">Markup {markup}%: {xmRes ? rp(markup_amt) : '—'}</span>
        </div>
      </div>

      <div className="tbl-section">
        <div className="tbl-hbar">
          <span className="tbl-title">Rincian Reagen — {data.label} ({curMethod.label})</span>
          <span className="tbl-note">
            {xmD > 0 ? 'Harga Jual/Kit = nett ÷ (1−markup) · proporsional' : 'Lengkapi input di halaman sebelumnya'}
          </span>
          {xmRes && <button className="export-btn" onClick={handleExportXM}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak Excel</button>}
          {xmRes && <button className="print-btn" onClick={handlePrintXM}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak PDF</button>}
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th className="mob-hide">Kemasan</th>
                <th className="r">Kontrib/Test</th>
                <th className="r th-sell">Sell/Kit (KSO)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.fn}</td>
                  <td className="mob-hide" style={{ color: 'var(--text-3)', fontSize: '11px' }}>{r.pack}</td>
                  <td className="cpt">{xmRes ? fmt(r.contrib) : '—'}</td>
                  <td className="r td-sell">{xmRes ? rp(r.sellKit) : '—'}</td>
                </tr>
              ))}
              <tr className="tr-sub">
                <td colSpan={2}>Total Biaya Reagen / Test</td>
                <td className="cpt">{xmRes ? fmt(totR) : '—'}</td>
                <td style={{ background: '#F1F5F9' }}></td>
              </tr>
              <tr className="tr-capex">
                <td colSpan={2} style={{ color: 'var(--red)' }}>
                  + CAPEX / Test&nbsp;
                  <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-3)' }}>
                    ({fmt(xmTotTest)} test KSO)
                  </span>
                </td>
                <td className="r" style={{ fontWeight: 700, color: 'var(--red)' }}>{rp(xmCapPt)}</td>
                <td style={{ background: '#FFF5F5' }}></td>
              </tr>
              <tr className="tr-base">
                <td colSpan={2}>Base Cost / Test (sebelum markup)</td>
                <td className="cpt">{xmRes ? rp(base) : '—'}</td>
                <td style={{ background: '#F8FAFC' }}></td>
              </tr>
              <tr className="tr-sell tr-sell-big">
                <td colSpan={2}>
                  Cost / Test KSO CPRR&nbsp;
                  <span style={{ fontWeight: 400, fontSize: 11 }}>margin {markup}%</span>
                </td>
                <td className="cpt" style={{ fontSize: 16, fontWeight: 900, color: 'var(--blue)' }}>
                  {xmRes ? rp(sell) : '—'}
                </td>
                <td style={{ background: 'var(--blue2)' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CrossmatchInput ──────────────────────────────────────────────────────────

function CrossmatchInput({
  xmType, xmCurSet, updXm,
  xmUps, setXmUps, xmLis, setXmLis,
  xmRpNow, updXmRp,
  workDays, setWorkDays,
  xmCapex, xmTotTest, xmCapPt, xmD,
  xmRes, xmSell,
  onGoToResult,
}) {
  const data = CROSSMATCH[xmType];
  return (
    <div className="input-grid">
      {/* CAPEX */}
      <div className="inp-card">
        <div className="inp-card-title">CAPEX</div>
        <div className="field">
          <label>Harga Alat (Total Peralatan)</label>
          <NumInput value={xmCurSet.price} onChange={v => updXm('price', v)} prefix="Rp" />
        </div>
        <div className="field">
          <label>Diskon</label>
          <NumInput value={xmCurSet.disc} onChange={v => updXm('disc', v)} suffix="%" />
        </div>
        <div className="comp">
          <span className="cl">Nett Alat</span>
          <span className="cv">{rp(xmCurSet.price * (1 - xmCurSet.disc / 100))}</span>
        </div>
        <div className="field">
          <label>UPS</label>
          <NumInput value={xmUps} onChange={setXmUps} prefix="Rp" />
        </div>
        <div className="field">
          <label>LIS</label>
          <NumInput value={xmLis} onChange={setXmLis} prefix="Rp" />
        </div>
        <div className="comp strong">
          <span className="cl">Total CAPEX</span>
          <span className="cv">{rp(xmCapex)}</span>
        </div>
      </div>

      {/* KSO Params */}
      <div className="inp-card">
        <div className="inp-card-title">PARAMETER KSO</div>
        <div className="field">
          <label>Masa KSO</label>
          <NumInput value={xmCurSet.kso} onChange={v => updXm('kso', v)} suffix="bln" />
        </div>
        <div className="field">
          <label>Test / Bulan</label>
          <NumInput value={xmCurSet.tests} onChange={v => updXm('tests', v)} />
        </div>
        <div className="field">
          <label>Hari Kerja / Bulan</label>
          <NumInput value={workDays} onChange={setWorkDays} suffix="hari" />
        </div>
        <div className="field">
          <label>Margin / Markup</label>
          <NumInput value={xmCurSet.markup} onChange={v => updXm('markup', v)} suffix="%" />
        </div>
        <div className="sep" />
        <div className="comp">
          <span className="cl">Test / Hari</span>
          <span className="cv">{xmD > 0 ? fmt(xmD) : '—'}</span>
        </div>
        <div className="comp">
          <span className="cl">Total Test KSO</span>
          <span className="cv">{xmTotTest > 0 ? fmt(xmTotTest) : '—'}</span>
        </div>
        <div className="comp">
          <span className="cl">CAPEX / Test</span>
          <span className="cv" style={{ color: 'var(--red)' }}>{rp(xmCapPt)}</span>
        </div>
        <div className="comp">
          <span className="cl">Reagen / Test</span>
          <span className="cv">{xmRes ? rp(xmRes.total) : '—'}</span>
        </div>
        <div className="comp strong">
          <span className="cl">Harga Jual / Test</span>
          <span className="cv">{rp(xmSell)}</span>
        </div>
      </div>

      {/* Reagent Prices */}
      <div className="inp-card inp-card-reagent">
        <div className="inp-card-title">HARGA REAGEN</div>
        <div className="rp-list">
          {data.reagents.map(r => {
            const obj  = xmRpNow[r.id] || { price: 0, disc: 0 };
            const nett = obj.price * (1 - obj.disc / 100);
            return (
              <div key={r.id} className="rp-item">
                <div className="rp-name" title={r.fn}>{r.fn}</div>
                <div className="rp-pack">{r.pack}</div>
                <div className="rp-row2">
                  <div className="field" style={{ margin: 0 }}>
                    <label>Harga Beli</label>
                    <NumInput value={obj.price} onChange={v => updXmRp(r.id, 'price', v)} prefix="Rp" />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Diskon</label>
                    <NumInput value={obj.disc} onChange={v => updXmRp(r.id, 'disc', v)} suffix="%" />
                  </div>
                </div>
                <div className="rp-nett">Nett: <span>{rp(nett)}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── CLIAResultTable ──────────────────────────────────────────────────────────

function CLIAResultTable({ cliaType, cliaCapPt, cliaConsBase, cliaConsInf, markup, totTest, kso, testsPerMonth, D, cliaParamsNow, deletedParams, totCap, workDays, qcFree, salesName, faskesName, kotaKab, kompetitor }) {
  const panels = CLIA_PANELS[cliaType];
  const paramList = cliaType === 'SNIBE' ? SNIBE_P : WONDFO_P;
  const prefix = cliaType === 'SNIBE' ? 's' : 'w';

  const activeRows = [];
  panels.forEach(panel => {
    paramList
      .filter(p => p.pan === panel && !deletedParams?.has(`${prefix}_${p.no}`))
      .forEach(p => {
        const obj = cliaParamsNow[`${prefix}_${p.no}`] || { price: p.dp, disc: 0 };
        const nettKit = obj.price * (1 - obj.disc / 100);
        const hppPerTest = p.kit > 0 ? nettKit / p.kit : 0;
        const consPerTest = (p.inf && cliaType === 'WONDFO') ? cliaConsInf : cliaConsBase;
        activeRows.push({ hppPerTest, consPerTest });
      });
  });
  const n = activeRows.length;
  const avgReagen = n > 0 ? activeRows.reduce((s, r) => s + r.hppPerTest, 0) / n : 0;
  const avgCons   = n > 0 ? activeRows.reduce((s, r) => s + r.consPerTest, 0) / n : 0;
  const avgBase   = cliaCapPt + avgCons + avgReagen;
  const avgSell   = n > 0 ? Math.ceil(sellOf(avgBase, markup) / 100) * 100 : 0;
  const markupAmt = avgSell - avgBase;

  const panelRows = [];
  panels.forEach(panel => {
    paramList
      .filter(p => p.pan === panel && !deletedParams?.has(`${prefix}_${p.no}`))
      .forEach(p => {
        const obj = cliaParamsNow[`${prefix}_${p.no}`] || { price: p.dp, disc: 0 };
        const nettKit = obj.price * (1 - obj.disc / 100);
        const hppPerTest = p.kit > 0 ? nettKit / p.kit : 0;
        const consPerTest = (p.inf && cliaType === 'WONDFO') ? cliaConsInf : cliaConsBase;
        const costTest = cliaCapPt + consPerTest + hppPerTest;
        const sellTest = sellOf(costTest, markup);
        panelRows.push({ panel, name: p.name, kit: p.kit, sellTest, sellKit: sellTest * p.kit });
      });
  });

  function handleExportCLIA() {
    exportCLIA({
      analyzerName: cliaType,
      brandName: CLIA[cliaType].brand,
      totCap: totCap || 0,
      kso,
      testsPerMonth,
      workDays: workDays || 25,
      markup,
      qcFree: qcFree !== undefined ? qcFree : false,
      capPt: cliaCapPt,
      consPerTest: cliaConsBase,
      avgSellCpt: avgSell,
      totTest,
      panelRows,
      salesName: salesName || '',
      faskesName: faskesName || '',
      kotaKab: kotaKab || '',
      kompetitor: kompetitor || '',
    });
  }
  function handlePrintCLIA() {
    printCLIA({
      analyzerName: cliaType,
      brandName: CLIA[cliaType].brand,
      totCap: totCap || 0,
      kso,
      testsPerMonth,
      workDays: workDays || 25,
      markup,
      qcFree: qcFree !== undefined ? qcFree : false,
      capPt: cliaCapPt,
      consPerTest: cliaConsBase,
      avgSellCpt: avgSell,
      totTest,
      panelRows,
      salesName: salesName || '',
      faskesName: faskesName || '',
      kotaKab: kotaKab || '',
      kompetitor: kompetitor || '',
    });
  }

  let seq = 0;
  return (
    <div className="page2-wrap">
      <div className="cprr-hero">
        <div className="cprr-left">
          <div className="cprr-label">COST / TEST — KSO CPRR</div>
          <div className="cprr-sub">
            {CLIA[cliaType].brand}
            {testsPerMonth > 0 ? ` · ${fmt(testsPerMonth)} test/bln` : ''}
            {kso > 0 ? ` · ${kso} bulan` : ''}
            {D > 0 ? ` · ${fmt(Math.round(D))} test/hari` : ''}
          </div>
          <div className="cprr-val">{n > 0 ? rp(avgSell) : '—'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
            Rata-rata sell/test dari {n} parameter · reagen bervariasi per parameter
          </div>
        </div>
        <div className="cprr-pills">
          <span className="pill pl-cap">CAPEX/Test: {rp(cliaCapPt)}</span>
          <span className="pill pl-rgn">Rata-rata Reagen/Test: {n > 0 ? rp(Math.round(avgReagen)) : '—'}</span>
          <span className="pill pl-base">Base Cost: {n > 0 ? rp(Math.round(avgBase)) : '—'}</span>
          <span className="pill pl-mkp">Markup {markup}%: {n > 0 ? rp(Math.round(markupAmt)) : '—'}</span>
        </div>
      </div>
      <div className="tbl-section">
        <div className="tbl-hbar">
          <span className="tbl-title">Rincian Cost / Test — {CLIA[cliaType].brand}</span>
          <span className="tbl-note">Cost/Test = Beban Alat + Beban Konsumabel + HPP Reagen/Kit</span>
          {n > 0 && <button className="export-btn" onClick={handleExportCLIA}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak Excel</button>}
          {n > 0 && <button className="print-btn" onClick={handlePrintCLIA}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak PDF</button>}
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th className="r">Kit</th>
                <th className="r th-sell">Sell/Test</th>
                <th className="r th-sell">Sell/Kit (KSO)</th>
              </tr>
            </thead>
            <tbody>
              {panels.map(panel => {
                const rows = paramList.filter(p => p.pan === panel && !deletedParams?.has(`${cliaType === 'SNIBE' ? 's' : 'w'}_${p.no}`));
                if (rows.length === 0) return null;
                const cls = PAN_CLS_CLIA[panel] || 'bc';
                return [
                  <tr key={`ph-${panel}`} className="tr-panel-hdr">
                    <td colSpan={4}><span className={`badge ${cls}`}>{panel}</span></td>
                  </tr>,
                  ...rows.map(p => {
                    const obj = cliaParamsNow[`${cliaType === 'SNIBE' ? 's' : 'w'}_${p.no}`] || { price: p.dp, disc: 0 };
                    const nettKit = obj.price * (1 - obj.disc / 100);
                    const hppPerTest = p.kit > 0 ? nettKit / p.kit : 0;
                    const consPerTest = (p.inf && cliaType === 'WONDFO') ? cliaConsInf : cliaConsBase;
                    const costTest = cliaCapPt + consPerTest + hppPerTest;
                    const sellTest = sellOf(costTest, markup);
                    const sellKit  = sellTest * p.kit;
                    return (
                      <tr key={p.no}>
                        <td style={{ fontWeight: 700 }}>{p.name}</td>
                        <td className="r">{p.kit}T</td>
                        <td className="r td-sell">{rp(sellTest)}</td>
                        <td className="r td-sell">{rp(sellKit)}</td>
                      </tr>
                    );
                  }),
                ];
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CLIAInput ────────────────────────────────────────────────────────────────

function CLIAInput({
  cliaType, cliaCurSet, updClia,
  cliaUps, setCliaUps, cliaLis, setCliaLis,
  cliaCapex, cliaTotTest, cliaCapPt,
  cliaConsBase, cliaConsInf,
  cliaConsNow, updCliaCons,
  cliaIsFree, onToggleConsFree,
  cliaParamsNow, updCliaParam,
  markup,
  onGoToResult,
  deletedParams,
  onDeleteParam,
}) {
  const data = CLIA[cliaType];
  const paramList = cliaType === 'SNIBE' ? SNIBE_P : WONDFO_P;
  const panels = CLIA_PANELS[cliaType];

  return (
    <div>
      <div className="input-grid">
        {/* CAPEX */}
        <div className="inp-card">
          <div className="inp-card-title">CAPEX</div>
          <div className="field">
            <label>Harga Alat</label>
            <NumInput value={cliaCurSet.price} onChange={v => updClia('price', v)} prefix="Rp" />
          </div>
          <div className="field">
            <label>Diskon</label>
            <NumInput value={cliaCurSet.disc} onChange={v => updClia('disc', v)} suffix="%" />
          </div>
          <div className="comp">
            <span className="cl">Nett Alat</span>
            <span className="cv">{rp(cliaCurSet.price * (1 - cliaCurSet.disc / 100))}</span>
          </div>
          <div className="field">
            <label>UPS</label>
            <NumInput value={cliaUps} onChange={setCliaUps} prefix="Rp" />
          </div>
          <div className="field">
            <label>LIS</label>
            <NumInput value={cliaLis} onChange={setCliaLis} prefix="Rp" />
          </div>
          <div className="comp strong">
            <span className="cl">Total CAPEX</span>
            <span className="cv">{rp(cliaCapex)}</span>
          </div>
        </div>

        {/* KSO Params */}
        <div className="inp-card">
          <div className="inp-card-title">PARAMETER KSO</div>
          <div className="field">
            <label>Masa KSO</label>
            <NumInput value={cliaCurSet.kso} onChange={v => updClia('kso', v)} suffix="bln" />
          </div>
          <div className="field">
            <label>Test / Bulan</label>
            <NumInput value={cliaCurSet.tests} onChange={v => updClia('tests', v)} />
          </div>
          <div className="field">
            <label>Margin / Markup</label>
            <NumInput value={cliaCurSet.markup} onChange={v => updClia('markup', v)} suffix="%" />
          </div>
          <div className="sep" />
          <div className="comp">
            <span className="cl">Total Test KSO</span>
            <span className="cv">{cliaTotTest > 0 ? fmt(cliaTotTest) : '—'}</span>
          </div>
          <div className="comp">
            <span className="cl">CAPEX / Test</span>
            <span className="cv" style={{ color: 'var(--red)' }}>{rp(cliaCapPt)}</span>
          </div>
          <div className="comp">
            <span className="cl">Konsumabel / Test</span>
            <span className="cv">{rp(cliaConsBase)}</span>
          </div>
          {cliaType === 'WONDFO' && (
            <div className="comp">
              <span className="cl">Kons. Infectious / Test</span>
              <span className="cv" style={{ color: 'var(--amber)' }}>{rp(cliaConsInf)}</span>
            </div>
          )}
        </div>

        {/* Consumable Prices */}
        <div className="inp-card inp-card-reagent">
          <div className="inp-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>HARGA KONSUMABEL</span>
            <button
              onClick={onToggleConsFree}
              className={cliaIsFree ? 'cc-free-on' : 'cc-free-off'}
              style={{ fontSize: 11, padding: '2px 10px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
              {cliaIsFree ? 'FREE' : 'PAID'}
            </button>
          </div>
          {cliaIsFree && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontStyle: 'italic' }}>
              Konsumabel disediakan gratis oleh supplier · tidak dihitung ke running cost
            </div>
          )}
          <div className="rp-list">
            {data.cons.map(c => {
              const obj  = cliaConsNow[c.id] || { price: c.dp, yield: c.yield, disc: 0 };
              const nett = obj.price * (1 - (obj.disc || 0) / 100);
              const cpt  = (!cliaIsFree && obj.yield > 0) ? nett / obj.yield : 0;
              return (
                <div key={c.id} className="rp-item" style={{ opacity: cliaIsFree ? 0.5 : 1 }}>
                  <div className="rp-name" title={c.fn}>
                    {c.fn}
                    {c.inf && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--amber)', fontWeight: 700 }}>INFECTIOUS</span>}
                  </div>
                  <div className="rp-pack">{c.pack}</div>
                  <div className="rp-row2">
                    <div className="field" style={{ margin: 0 }}>
                      <label>Harga Pricelist / Pack</label>
                      <NumInput value={obj.price} onChange={v => updCliaCons(c.id, 'price', v)} prefix="Rp" disabled={cliaIsFree} />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>Diskon</label>
                      <NumInput value={obj.disc || 0} onChange={v => updCliaCons(c.id, 'disc', v)} suffix="%" disabled={cliaIsFree} />
                    </div>
                  </div>
                  <div className="rp-row2" style={{ marginTop: 4 }}>
                    <div className="field" style={{ margin: 0 }}>
                      <label>Yield / Pack</label>
                      <NumInput value={obj.yield} onChange={v => updCliaCons(c.id, 'yield', v)} suffix="test" disabled={cliaIsFree} />
                    </div>
                    <div style={{ flex: 1 }} />
                  </div>
                  <div className="rp-nett">Nett: <span>{rp(nett)}</span> · Cost/Test: <span>{rp(cpt)}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Parameter HPP Prices */}
      <div className="inp-card cc-param-card" style={{ marginTop: 16 }}>
        <div className="inp-card-title">HARGA REAGEN / HPP PER KIT</div>
        <div className="cc-param-table-hdr">
          <span style={{ flex: 3 }}>Parameter</span>
          <span style={{ width: 44, textAlign: 'right' }}>Kit</span>
          <span style={{ width: 90, textAlign: 'right' }}>HPP/Kit</span>
          <span style={{ width: 52, textAlign: 'right' }}>Disc%</span>
          {cliaType === 'WONDFO' && <span style={{ width: 54, textAlign: 'center' }}>Inf</span>}
        </div>
        {panels.map(panel => {
          const items = paramList.filter(p => p.pan === panel);
          if (!items.length) return null;
          const cls = PAN_CLS_CLIA[panel] || 'bc';
          const visibleItems = items.filter(p => !deletedParams?.has(`${cliaType === 'SNIBE' ? 's' : 'w'}_${p.no}`));
          return (
            <div key={panel} className="cc-param-group">
              <div className="cc-param-group-hdr">
                <span className={`badge ${cls}`}>{panel}</span>
              </div>
              {visibleItems.map(p => {
                const pid = `${cliaType === 'SNIBE' ? 's' : 'w'}_${p.no}`;
                const obj = cliaParamsNow[pid] || { price: p.dp, disc: 0 };
                return (
                  <div key={pid} className="cc-param-row">
                    <span className="cc-pr-name">{p.name}</span>
                    <span className="cc-pr-t">{p.kit}T</span>
                    <span className="cc-pr-num">
                      <SmallNumInput value={obj.price} onChange={v => updCliaParam(pid, 'price', v)} />
                    </span>
                    <span className="cc-pr-disc">
                      <SmallNumInput value={obj.disc} onChange={v => updCliaParam(pid, 'disc', v)} tiny />
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>%</span>
                    </span>
                    {cliaType === 'WONDFO' && (
                      <span style={{ width: 54, textAlign: 'center', fontSize: 10 }}>
                        {p.inf ? <span style={{ color: 'var(--amber)', fontWeight: 700 }}>●</span> : '—'}
                      </span>
                    )}
                    <button className="cc-del-btn" onClick={() => onDeleteParam?.(pid)} style={{ marginLeft: 4 }}>×</button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CCResultTable ────────────────────────────────────────────────────────────

function CCResultTable({ params, capPt, totTest, cType, ccQC, D, testsPerMonth, markup, kso, ccConsumablePerTest, ccDetResult, workDays, nParam, totCap, salesName, faskesName, kotaKab, kompetitor, backupLabel }) {
  // Split: free controls (overhead) vs display params
  const freeControls  = params.filter(p => p.panel === 'Control' && p.free);
  const freeCalibrator = freeControls.find(p => p.id === 'cc_cal');
  const freeCtrlVials  = freeControls.filter(p => p.id !== 'cc_cal');
  const displayParams  = params.filter(p => !(p.panel === 'Control' && p.free));

  // Beban Consumable/test from det() formula (batch-aware, 30-day basis matching Excel)
  const consumablePerTest = ccConsumablePerTest || 0;

  // Map each Consumable param to its det() breakdown (conc → first, probe → second)
  const consumables = params.filter(p => p.panel === 'Consumable');
  const consCptMap = {};
  if (ccDetResult && consumables.length >= 1) {
    if (consumables[0]) consCptMap[consumables[0].id] = ccDetResult.conc || 0;
    if (consumables[1]) consCptMap[consumables[1].id] = ccDetResult.probe || 0;
  }

  // QC reagent cost: average cost/test across all non-ctrl/non-consumable params × n_param
  const allRegularParams = params.filter(p => p.panel !== 'Control' && p.panel !== 'Consumable');
  const totalRegCost = allRegularParams.reduce((s, p) => {
    const nett = p.price * (1 - p.disc / 100);
    return s + (p.testsPerKit > 0 ? nett / p.testsPerKit : 0);
  }, 0);
  const avgCptPerParam = allRegularParams.length > 0 ? totalRegCost / allRegularParams.length : 0;
  const n = nParam;
  const baseCostSum = avgCptPerParam * n;

  // QC Control overhead (per workDays period → per patient test)
  const wd           = workDays || 0;
  const ptWd         = D * wd;
  const freeCtrlNett = freeCtrlVials.reduce((s, p) => s + p.price * (1 - p.disc / 100), 0);
  const qcReagent    = baseCostSum * (ccQC.n_ctrl || 0) * wd;
  const qcOverhead   = ptWd > 0 ? (qcReagent + freeCtrlNett) / ptWd : 0;

  // Calibrator overhead (per month)
  const calPerRun    = freeCalibrator
    ? (freeCalibrator.price * (1 - freeCalibrator.disc / 100)) / Math.max(freeCalibrator.testsPerKit, 1)
    : 0;
  const calReagent   = baseCostSum * (ccQC.n_cal || 0);
  const calKitCost   = calPerRun * (ccQC.n_cal || 0);
  const calOverhead  = testsPerMonth > 0 ? (calReagent + calKitCost) / testsPerMonth : 0;

  const hasOverhead   = freeControls.length > 0 && D > 0;
  const totalOverhead = hasOverhead ? qcOverhead + calOverhead : 0;

  const fixedBase = capPt + consumablePerTest + totalOverhead;

  // rata-rata sell/test dari semua parameter (termasuk reagen)
  const avgReagenCpt = allRegularParams.length > 0
    ? allRegularParams.reduce((s, p) => {
        const nett = p.price * (1 - p.disc / 100);
        return s + (p.testsPerKit > 0 ? nett / p.testsPerKit : 0);
      }, 0) / allRegularParams.length
    : 0;
  const avgBaseCpt = fixedBase + avgReagenCpt;
  const avgSellCpt = markup < 100 ? avgBaseCpt / (1 - markup / 100) : 0;
  const showAvg = (capPt > 0 || consumablePerTest > 0) && allRegularParams.length > 0;

  const paramRows = displayParams
    .filter(p => p.panel !== 'Consumable')
    .map(p => {
      const nett = p.price * (1 - p.disc / 100);
      const reagentCpt = p.testsPerKit > 0 ? nett / p.testsPerKit : 0;
      const baseCpt = capPt + consumablePerTest + totalOverhead + reagentCpt;
      const sellTest = markup < 100 ? Math.ceil(baseCpt / (1 - markup / 100) / 100) * 100 : 0;
      return { name: p.name, panel: p.panel, pack: p.pack, testsPerKit: p.testsPerKit, sellTest, sellKit: sellTest * p.testsPerKit };
    });
  const consItems = consumables.map(p => ({ name: p.name, cpt: consCptMap[p.id] ?? 0 }));
  const qcRows = hasOverhead ? [
    { label: 'QC Control / Test', value: qcOverhead },
    { label: 'Kalibrasi / Test', value: calOverhead },
  ] : [];

  function handleExportCC() {
    exportCC({
      analyzerName: cType,
      backupLabel: backupLabel || '',
      totCap: totCap || 0,
      kso,
      testsPerMonth,
      workDays: wd || workDays,
      markup,
      capPt,
      consumablePerTest,
      totalOverhead,
      hasOverhead,
      avgSellCpt: Math.ceil(avgSellCpt / 100) * 100,
      totTest,
      paramRows,
      consItems,
      qcRows,
      salesName: salesName || '',
      faskesName: faskesName || '',
      kotaKab: kotaKab || '',
      kompetitor: kompetitor || '',
    });
  }
  function handlePrintCC() {
    printCC({
      analyzerName: cType,
      backupLabel: backupLabel || '',
      totCap: totCap || 0,
      kso,
      testsPerMonth,
      workDays: wd || workDays,
      markup,
      capPt,
      consumablePerTest,
      totalOverhead,
      hasOverhead,
      avgSellCpt: Math.ceil(avgSellCpt / 100) * 100,
      totTest,
      paramRows,
      consItems,
      qcRows,
      salesName: salesName || '',
      faskesName: faskesName || '',
      kotaKab: kotaKab || '',
      kompetitor: kompetitor || '',
    });
  }

  let seq = 0;
  return (
    <div className="page2-wrap">
      <div className="cprr-hero">
        <div className="cprr-left">
          <div className="cprr-label">COST / TEST — KSO CPRR</div>
          <div className="cprr-sub">
            {cType}
            {testsPerMonth > 0 ? ` · ${fmt(testsPerMonth)} sampel/bln` : ''}
            {kso > 0 ? ` · ${kso} bulan` : ''}
            {D > 0 ? ` · ${fmt(Math.round(D))} sampel/hari` : ''}
          </div>
          <div className="cprr-val" style={{ fontSize: 28 }}>
            {showAvg ? rp(Math.ceil(avgSellCpt / 100) * 100) : capPt > 0 || consumablePerTest > 0 ? rp(fixedBase) : '—'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
            {showAvg
              ? `Rata-rata sell/test dari ${allRegularParams.length} parameter · reagen bervariasi per parameter`
              : `Beban tetap/test (alat + consumable${hasOverhead ? ' + QC' : ''}) · reagen bervariasi per parameter`}
          </div>
        </div>
        <div className="cprr-pills">
          <span className="pill pl-cap">CAPEX/Test: {rp(capPt)}</span>
          <span className="pill pl-rgn">Consumable/Test: {rp(consumablePerTest)}</span>
          {hasOverhead && <span className="pill pl-qc">QC+Cal/Test: {rp(totalOverhead)}</span>}
          {showAvg && <span className="pill pl-base">Rata-rata Reagen/Test: {rp(Math.round(avgReagenCpt))}</span>}
          <span className="pill pl-mkp">Markup {markup}%: {showAvg ? rp(Math.ceil(avgSellCpt / 100) * 100 - avgBaseCpt) : '—'}</span>
        </div>
      </div>

      <div className="tbl-section">
        <div className="tbl-hbar">
          <span className="tbl-title">Rincian Cost — {cType}</span>
          <span className="tbl-note">Sell/Test = (Beban Alat + Consumable + Reagen) ÷ (1−markup) · Sell/Kit = Sell/Test × Test/Kit</span>
          {showAvg && <button className="export-btn" onClick={handleExportCC}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak Excel</button>}
          {showAvg && <button className="print-btn" onClick={handlePrintCC}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak PDF</button>}
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th className="mob-hide" style={{ width: 32 }}>No</th>
                <th>Parameter</th>
                <th className="mob-hide">Panel</th>
                <th className="mob-hide">Pack</th>
                <th className="r">Test/Kit</th>
                <th className="r th-sell">Sell/Test</th>
                <th className="r th-sell">Sell/Kit (Pricelist)</th>
              </tr>
            </thead>
            <tbody>
              {CC_PANELS.map(panel => {
                const rows = displayParams.filter(p => p.panel === panel);
                if (rows.length === 0) return null;
                return [
                  <tr key={`ph-${panel}`} className="tr-panel-hdr">
                    <td colSpan={7}><span className={`badge ${PAN_CLS[panel]}`}>{panel}</span></td>
                  </tr>,
                  ...rows.map(p => {
                    seq += 1;
                    const nett       = p.price * (1 - p.disc / 100);
                    const reagentCpt = p.testsPerKit > 0 ? nett / p.testsPerKit : 0;
                    const isConsumable = p.panel === 'Consumable';
                    const baseCpt = isConsumable
                      ? (consCptMap[p.id] ?? 0)
                      : capPt + consumablePerTest + totalOverhead + reagentCpt;
                    const sellTest = !isConsumable && markup < 100
                      ? Math.ceil(baseCpt / (1 - markup / 100) / 100) * 100
                      : 0;
                    const sellKit = !isConsumable
                      ? sellTest * p.testsPerKit
                      : nett;
                    return (
                      <tr key={p.id}>
                        <td className="mob-hide" style={{ color: 'var(--text-3)' }}>{seq}</td>
                        <td style={{ fontWeight: 700 }}>{p.name}</td>
                        <td className="mob-hide"><span className={`badge ${PAN_CLS[p.panel]}`}>{p.panel}</span></td>
                        <td className="mob-hide" style={{ fontSize: 11, color: 'var(--text-2)' }}>{p.pack}</td>
                        <td className="r">
                          {isConsumable
                            ? <span style={{ fontSize: 10, color: 'var(--text-3)', fontStyle: 'italic' }}>overhead</span>
                            : fmt(p.testsPerKit)}
                        </td>
                        <td className="r td-sell">
                          {isConsumable
                            ? <span style={{ fontSize: 10, color: 'var(--text-3)' }}>—</span>
                            : rp(sellTest)}
                        </td>
                        <td className="r td-sell" title={isConsumable ? 'Harga beli per pack' : ''}>
                          {rp(sellKit)}
                        </td>
                      </tr>
                    );
                  }),
                ];
              })}

              {/* ── QC & Calibrator overhead rows (FREE mode) ── */}
              {hasOverhead && (
                <>
                  <tr className="tr-panel-hdr">
                    <td colSpan={7}>
                      <span className="badge bctrl">QC &amp; Calibrator — Overhead (Free)</span>
                      <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 10 }}>
                        dibebankan ke semua patient test
                      </span>
                    </td>
                  </tr>
                  {/* QC Control L1 + L2 */}
                  <tr className="tr-qc-overhead">
                    <td colSpan={4} style={{ fontSize: 11 }}>
                      <span style={{ fontWeight: 600 }}>QC Control</span>
                      <span style={{ color: 'var(--text-3)', marginLeft: 8 }}>
                        {fmt(n)} param × {ccQC.n_ctrl || 1}×/hari × {fmt(wd)} hari = {fmt(n * (ccQC.n_ctrl || 1) * wd)} reaksi
                        &nbsp;·&nbsp;Ctrl vial: {rp(freeCtrlNett)}
                        &nbsp;·&nbsp;÷ {fmt(Math.round(ptWd))} test/{fmt(wd)}hari
                      </span>
                    </td>
                    <td className="r" style={{ color: 'var(--text-3)', fontSize: 11 }}>
                      {freeCtrlVials.map(c => c.name).join(' + ') || '—'}
                    </td>
                    <td className="r" style={{ color: 'var(--amber)', fontWeight: 600 }}>{rp(freeCtrlNett)}</td>
                    <td className="cpt" style={{ color: 'var(--amber)' }}>{rp(qcOverhead)}</td>
                  </tr>
                  {/* Calibrator */}
                  {freeCalibrator && (
                    <tr className="tr-qc-overhead">
                      <td colSpan={4} style={{ fontSize: 11 }}>
                        <span style={{ fontWeight: 600 }}>Calibrator</span>
                        <span style={{ color: 'var(--text-3)', marginLeft: 8 }}>
                          {fmt(n)} param × {fmt(ccQC.n_cal)} kali = {fmt(n * (ccQC.n_cal || 0))} reaksi reagen
                          &nbsp;·&nbsp;Cal/run: {rp(calPerRun)}
                          &nbsp;·&nbsp;÷ {fmt(testsPerMonth)} test/bln
                        </span>
                      </td>
                      <td className="r" style={{ color: 'var(--text-3)', fontSize: 11 }}>{freeCalibrator.pack}</td>
                      <td className="r" style={{ color: 'var(--amber)', fontWeight: 600 }}>{rp(calKitCost)}</td>
                      <td className="cpt" style={{ color: 'var(--amber)' }}>{rp(calOverhead)}</td>
                    </tr>
                  )}
                  {/* Overhead total */}
                  <tr className="tr-sub">
                    <td colSpan={6} style={{ color: 'var(--amber)' }}>Total Overhead QC + Cal / Test</td>
                    <td className="cpt" style={{ color: 'var(--amber)' }}>{rp(totalOverhead)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CCInputCC ────────────────────────────────────────────────────────────────

const BLANK_FORM = { name: '', panel: 'Hepatic', pack: '', testsPerKit: 0, price: 0, disc: 0 };

function CCInputCC({
  cType, setCType, cSet, updC,
  ups, setUps, lis, setLis,
  backupOn, setBackupOn, backupKey, backupPrice, setBackupPrice, backupDisc, setBackupDisc,
  onBackupKeyChange,
  workDays, setWorkDays,
  aNett, bNett, totCap, capPt, D, totTest,
  ccParams, updCCParam, addCCParam, delCCParam,
  ccQC, setCCQC,
  onGoToResult,
}) {
  const [addForm, setAddForm] = useState(BLANK_FORM);
  const cTypes = Object.values(CC);

  const handleAdd = () => {
    if (!addForm.name.trim()) return;
    addCCParam(addForm);
    setAddForm(BLANK_FORM);
  };

  return (
    <div className="input-grid">

      {/* ── CAPEX ── */}
      <div className="inp-card">
        <div className="inp-card-title">CAPEX</div>

        <div className="field">
          <label>Harga Analyzer</label>
          <NumInput value={cSet.price} onChange={v => updC('price', v)} prefix="Rp" />
        </div>
        <div className="field">
          <label>Diskon Analyzer</label>
          <NumInput value={cSet.disc} onChange={v => updC('disc', v)} suffix="%" />
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
          <input type="checkbox" id="bck-cc" checked={backupOn}
            onChange={e => setBackupOn(e.target.checked)} />
          <label htmlFor="bck-cc">+ Backup Analyzer</label>
        </div>
        {backupOn && (
          <div className="bck-fields">
            <div className="field">
              <label>Tipe Backup</label>
              <select value={backupKey} onChange={e => onBackupKeyChange(e.target.value)}>
                {cTypes.map(t => (
                  <option key={t.label} value={t.label}>{t.label}</option>
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

      {/* ── Skema KSO ── */}
      <div className="inp-card">
        <div className="inp-card-title">SKEMA KSO</div>

        <div className="field">
          <label>Masa KSO</label>
          <NumInput value={cSet.kso} onChange={v => updC('kso', v)} suffix="bln" />
        </div>
        <div className="field">
          <label>Sampel / Bulan</label>
          <NumInput value={cSet.tests} onChange={v => updC('tests', v)} />
        </div>
        <div className="field">
          <label>Hari Kerja / Bulan</label>
          <NumInput value={workDays} onChange={setWorkDays} suffix="hari" />
        </div>
        <div className="field">
          <label>Batch / Hari</label>
          <NumInput value={cSet.batch} onChange={v => updC('batch', v)} suffix="sesi" />
        </div>
        <div className="field">
          <label>Margin / Markup</label>
          <NumInput value={cSet.markup} onChange={v => updC('markup', v)} suffix="%" />
        </div>

        <div className="sep" />
        <div className="comp">
          <span className="cl">Sampel / Hari</span>
          <span className="cv">{D > 0 ? fmt(D) : '—'}</span>
        </div>
        <div className="comp">
          <span className="cl">Total Sampel KSO</span>
          <span className="cv">{totTest > 0 ? fmt(totTest) : '—'}</span>
        </div>
        <div className="comp">
          <span className="cl">CAPEX / Sampel</span>
          <span className="cv" style={{ color: 'var(--red)' }}>{rp(capPt)}</span>
        </div>

      </div>

      {/* ── Parameter Reagen ── */}
      <div className="inp-card cc-param-card">
        <div className="inp-card-title">PARAMETER REAGEN</div>

        <div className="cc-param-table-hdr">
          <span style={{ flex: 2 }}>Nama</span>
          <span className="mob-hide" style={{ flex: 3 }}>Pack</span>
          <span style={{ width: 70, textAlign: 'right' }}>Test/Kit</span>
          <span style={{ width: 90, textAlign: 'right' }}>Harga Beli</span>
          <span style={{ width: 52, textAlign: 'right' }}>Disc%</span>
          <span style={{ width: 32, textAlign: 'center' }}>QC</span>
          <span style={{ width: 54 }}></span>
        </div>

        {CC_PANELS.map(panel => {
          const items = ccParams.filter(p => p.panel === panel);
          const isCtrl = panel === 'Control';
          const anyFreeCtrl = isCtrl && items.some(p => p.free);
          return (
            <div key={panel} className="cc-param-group">
              <div className="cc-param-group-hdr">
                <span className={`badge ${PAN_CLS[panel]}`}>{panel}</span>
              </div>
              {items.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '4px 0 6px', fontStyle: 'italic' }}>
                  Belum ada parameter
                </div>
              )}
              {items.map(p => {
                const editable = p.custom || isCtrl;
                return (
                  <div key={p.id} className="cc-param-row">
                    <span className="cc-pr-name">
                      {editable
                        ? <input className="cc-pr-text" value={p.name}
                            onChange={e => updCCParam(p.id, 'name', e.target.value)} placeholder="Nama" />
                        : p.name}
                    </span>
                    <span className="cc-pr-pack mob-hide">
                      {editable
                        ? <input className="cc-pr-text" value={p.pack}
                            onChange={e => updCCParam(p.id, 'pack', e.target.value)} placeholder="Kemasan" />
                        : <span className="cc-pr-pack-txt">{p.pack}</span>}
                    </span>
                    <span className="cc-pr-t">
                      {editable
                        ? <SmallNumInput value={p.testsPerKit} onChange={v => updCCParam(p.id, 'testsPerKit', v)} tiny />
                        : fmt(p.testsPerKit)}
                    </span>
                    <span className="cc-pr-num">
                      <SmallNumInput value={p.price} onChange={v => updCCParam(p.id, 'price', v)} />
                    </span>
                    <span className="cc-pr-disc">
                      <SmallNumInput value={p.disc} onChange={v => updCCParam(p.id, 'disc', v)} tiny />
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>%</span>
                    </span>
                    <span className="cc-pr-act">
                      {isCtrl && (
                        <label className="cc-free-toggle">
                          <input type="checkbox" checked={!!p.free} style={{ display: 'none' }}
                            onChange={e => updCCParam(p.id, 'free', e.target.checked)} />
                          <span className={p.free ? 'cc-free-on' : 'cc-free-off'}>
                            {p.free ? 'Free' : 'Paid'}
                          </span>
                        </label>
                      )}
                      <button className="cc-del-btn" style={isCtrl ? { marginLeft: 2 } : {}} onClick={() => delCCParam(p.id)}>×</button>
                    </span>
                  </div>
                );
              })}

              {/* QC Settings — shown inside Control group when any item is Free */}
              {isCtrl && anyFreeCtrl && (
                <div className="cc-qc-settings">
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.5px' }}>
                    PENGATURAN QC &amp; KALIBRASI
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Kontrol / hari</span>
                      <SmallNumInput value={ccQC.n_ctrl} onChange={v => setCCQC(q => ({ ...q, n_ctrl: v }))} tiny />
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>kali</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Kalibrasi / bulan</span>
                      <SmallNumInput value={ccQC.n_cal} onChange={v => setCCQC(q => ({ ...q, n_cal: v }))} tiny />
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>kali</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add form */}
        <div className="cc-add-form">
          <div className="cc-add-title">+ Tambah Parameter</div>
          <div className="cc-add-row">
            <input className="cc-add-text" placeholder="Nama parameter"
              value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
            <select className="cc-add-sel" value={addForm.panel}
              onChange={e => setAddForm(f => ({ ...f, panel: e.target.value }))}>
              {CC_PANELS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input className="cc-add-text" placeholder="Pack / kemasan"
              value={addForm.pack} onChange={e => setAddForm(f => ({ ...f, pack: e.target.value }))} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <SmallNumInput value={addForm.testsPerKit} onChange={v => setAddForm(f => ({ ...f, testsPerKit: v }))} tiny />
              <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>test/kit</span>
            </span>
            <SmallNumInput value={addForm.price} onChange={v => setAddForm(f => ({ ...f, price: v }))} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <SmallNumInput value={addForm.disc} onChange={v => setAddForm(f => ({ ...f, disc: v }))} tiny />
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>%</span>
            </span>
            <button className="cc-add-btn" onClick={handleAdd}>Tambah</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Initial state ────────────────────────────────────────────────────────────

function initHSet() {
  return {
    Z3:      { price: HEMATO.Z3.dPl,      disc: 0, kso: 0, markup: 0, tests: 0 },
    Z52:     { price: HEMATO.Z52.dPl,     disc: 0, kso: 0, markup: 0, tests: 0 },
    Z50:     { price: HEMATO.Z50.dPl,     disc: 0, kso: 0, markup: 0, tests: 0 },
    EXZ8000: { price: HEMATO.EXZ8000.dPl, disc: 0, kso: 0, markup: 0, tests: 0 },
    EXZ6000: { price: HEMATO.EXZ6000.dPl, disc: 0, kso: 0, markup: 0, tests: 0 },
  };
}
function initCSet() {
  return {
    EXC200: { price: CC.EXC200.dPl, disc: 0, kso: 0, markup: 0, tests: 0, batch: 0 },
    EXC400: { price: CC.EXC400.dPl, disc: 0, kso: 0, markup: 0, tests: 0, batch: 0 },
  };
}
function initHRp() {
  const rp = (analyzer) => Object.fromEntries(
    analyzer.reagents.map(r => [r.id, { price: r.pl ?? r.dp, disc: 0 }])
  );
  return {
    Z3:      rp(HEMATO.Z3),
    Z52:     rp(HEMATO.Z52),
    Z50:     rp(HEMATO.Z50),
    EXZ8000: rp(HEMATO.EXZ8000),
    EXZ6000: rp(HEMATO.EXZ6000),
  };
}
function initXmSet() {
  return {
    LIBO:   { price: 0, disc: 0, kso: 0, markup: 0, tests: 0 },
    REDCEL: { price: 0, disc: 0, kso: 0, markup: 0, tests: 0 },
  };
}
function initXmMethod() {
  return { LIBO: 'm3', REDCEL: 'xm' };
}
function initXmRp() {
  return {
    LIBO:   { card: { price: 2214000, disc: 0 }, liss: { price: 1107000, disc: 0 } },
    REDCEL: { ahg:  { price: 3885000, disc: 0 }, liss: { price: 2500000, disc: 0 } },
  };
}

function initCliaSet() {
  return {
    SNIBE:  { price: 0, disc: 0, kso: 0, markup: 0, tests: 0 },
    WONDFO: { price: 0, disc: 0, kso: 0, markup: 0, tests: 0 },
  };
}
function initCliaCons() {
  const build = (brand) => {
    const obj = {};
    CLIA[brand].cons.forEach(c => { obj[c.id] = { price: c.dp, yield: c.yield, disc: 0 }; });
    return obj;
  };
  return { SNIBE: build('SNIBE'), WONDFO: build('WONDFO') };
}
function initCliaParams() {
  const build = (prefix, list) => {
    const obj = {};
    list.forEach(p => { obj[`${prefix}_${p.no}`] = { price: p.dp, disc: 0 }; });
    return obj;
  };
  return { SNIBE: build('s', SNIBE_P), WONDFO: build('w', WONDFO_P) };
}

function initCCParams() {
  const base = CC_P.map(p => ({
    id:          `cc_${p.no}`,
    name:        p.p,
    panel:       p.pan,
    pack:        p.pack,
    testsPerKit: p.t,
    price:       p.pl ?? p.dp,
    disc:        0,
    custom:      false,
    free:        p.pan === 'Control',
    qc_active:   false,
    pl:          p.pl,
  }));
  base.push({
    id: 'cc_cal', name: 'Calibrator', panel: 'Control',
    pack: '5 mL/vial', testsPerKit: 1, price: 2000000, disc: 0, custom: false, free: true,
  });
  return base;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [page,        setPage]        = useState('input');
  const [tab,         setTab]         = useState('hemato');
  const [hType,       setHType]       = useState('Z3');
  const [cType,       setCType]       = useState('EXC200');
  const [hSet,        setHSet]        = useState(initHSet);
  const [cSet,        setCSet]        = useState(initCSet);
  const [ups,         setUps]         = useState(0);
  const [lis,         setLis]         = useState(0);
  const [workDays,    setWorkDays]    = useState(0);
  const [backupOn,    setBackupOn]    = useState(false);
  const [backupKey,   setBackupKey]   = useState('Z3');
  const [backupPrice, setBackupPrice] = useState(HEMATO.Z3.dPl);
  const [backupDisc,  setBackupDisc]  = useState(0);
  const [hRp,         setHRp]         = useState(initHRp);
  const [exzMode,     setExzMode]     = useState('cbc_diff_ret');
  const [exzCtrl,     setExzCtrl]     = useState({
    free: true, n_qc: 0, n_cal: 0,
    xn:  { price: HEMATO.EXZ8000.xnCtrlPl, disc: 0 },
    xr:  { price: HEMATO.EXZ8000.xrCtrlPl, disc: 0 },
    cal: { price: HEMATO.EXZ8000.calPl,    disc: 0 },
  });
  const [hCtrl,       setHCtrl]       = useState({
    Z3:      { free: true, n_qc: 0, n_cal: 0, ctrl: { price: HEMATO.Z3.ctrlPl      ?? 0, disc: 0 }, cal: { price: 0, disc: 0 } },
    Z52:     { free: true, n_qc: 0, n_cal: 0, ctrl: { price: HEMATO.Z52.ctrlPl     ?? 0, disc: 0 }, cal: { price: 0, disc: 0 } },
    Z50:     { free: true, n_qc: 0, n_cal: 0, ctrl: { price: HEMATO.Z50.ctrlPl     ?? 0, disc: 0 }, cal: { price: 0, disc: 0 } },
    EXZ6000: { free: true, n_qc: 0, n_cal: 0, ctrl: { price: HEMATO.EXZ6000.ctrlPl ?? 0, disc: 0 }, cal: { price: 0, disc: 0 } },
  });
  const [ccParams,    setCCParams]    = useState(initCCParams);
  const [ccQC,        setCCQC]        = useState({ n_ctrl: 0, n_cal: 0, n_param: 0 });
  const [xmType,      setXmType]      = useState('LIBO');
  const [xmMethod,    setXmMethod]    = useState(initXmMethod);
  const [xmSet,       setXmSet]       = useState(initXmSet);
  const [xmRp,        setXmRp]        = useState(initXmRp);
  const [xmUps,       setXmUps]       = useState(0);
  const [xmLis,       setXmLis]       = useState(0);
  const [cliaType,    setCliaType]    = useState('SNIBE');
  const [cliaSet,     setCliaSet]     = useState(initCliaSet);
  const [cliaUps,     setCliaUps]     = useState(0);
  const [cliaLis,     setCliaLis]     = useState(0);
  const [cliaCons,    setCliaCons]    = useState(initCliaCons);
  const [cliaConsFree, setCliaConsFree] = useState({ SNIBE: false, WONDFO: false });
  const [cliaParams,  setCliaParams]  = useState(initCliaParams);
  const [cliaDeletedParams, setCliaDeletedParams] = useState({ SNIBE: new Set(), WONDFO: new Set() });
  const [salesName,  setSalesName]  = useState('');
  const [faskesName, setFaskesName] = useState('');
  const [kotaKab,    setKotaKab]    = useState('');
  const [kompetitor, setKompetitor] = useState('');

  // ── CAPEX ──
  const curSet  = (tab === 'hemato' ? hSet[hType] : cSet[cType]) || { price: 0, disc: 0, kso: 0, markup: 0, tests: 0, batch: 0 };
  const aNett   = curSet.price * (1 - curSet.disc / 100);
  const bNett   = backupOn ? backupPrice * (1 - backupDisc / 100) : 0;
  const totCap  = aNett + ups + lis + bNett;
  const totTest = curSet.kso * curSet.tests;
  const capPt   = totTest > 0 ? totCap / totTest : 0;
  const D       = workDays > 0 ? curSet.tests / workDays : 0;

  // ── CC Consumable via det() (30-day basis matching Excel D2 table) ──
  const ccConcItem  = ccParams.find(p => p.id === 'cc_19');
  const ccProbeItem = ccParams.find(p => p.id === 'cc_20');
  const ccConcNett  = ccConcItem  ? ccConcItem.price  * (1 - ccConcItem.disc  / 100) : CC[cType].cons[0].dp;
  const ccProbeNett = ccProbeItem ? ccProbeItem.price * (1 - ccProbeItem.disc / 100) : CC[cType].cons[1].dp;
  const ccDetResult = cSet[cType].tests > 0
    ? CC[cType].det(cSet[cType].tests, workDays, ccConcNett, ccProbeNett, cSet[cType].batch)
    : null;
  const ccConsumablePerTest = ccDetResult ? ccDetResult.total : 0;

  // ── Crossmatch computed ──
  const xmCurSet   = xmSet[xmType] || { price: 0, disc: 0, kso: 0, markup: 0, tests: 0 };
  const xmANett    = xmCurSet.price * (1 - xmCurSet.disc / 100);
  const xmCapex    = xmANett + xmUps + xmLis;
  const xmTotTest  = xmCurSet.kso * xmCurSet.tests;
  const xmCapPt    = xmTotTest > 0 ? xmCapex / xmTotTest : 0;
  const xmD        = workDays > 0 ? xmCurSet.tests / workDays : 0;
  const xmCurMethod = CROSSMATCH[xmType].methods.find(m => m.id === xmMethod[xmType]) || CROSSMATCH[xmType].methods[0];
  const xmRpNettMap = {};
  Object.entries(xmRp[xmType]).forEach(([id, obj]) => { xmRpNettMap[id] = nettOf(obj); });
  const xmRes = xmD > 0
    ? CROSSMATCH[xmType].calc(xmCurSet.tests, workDays, xmRpNettMap, xmMethod[xmType])
    : null;
  const xmSell = sellOf(xmCapPt + (xmRes ? xmRes.total : 0), xmCurSet.markup);

  // ── CLIA computed ──
  const cliaCurSet  = cliaSet[cliaType] || { price: 0, disc: 0, kso: 0, markup: 0, tests: 0 };
  const cliaANett   = cliaCurSet.price * (1 - cliaCurSet.disc / 100);
  const cliaCapex   = cliaANett + cliaUps + cliaLis;
  const cliaTotTest = cliaCurSet.kso * cliaCurSet.tests;
  const cliaCapPt   = cliaTotTest > 0 ? cliaCapex / cliaTotTest : 0;
  const cliaConsNow  = cliaCons[cliaType];
  const cliaIsFree   = cliaConsFree[cliaType];
  const cliaConsBase = cliaIsFree ? 0 : CLIA[cliaType].cons
    .filter(c => !c.inf)
    .reduce((s, c) => {
      const cv = cliaConsNow[c.id] || { price: c.dp, yield: c.yield, disc: 0 };
      const nett = cv.price * (1 - (cv.disc || 0) / 100);
      return s + (cv.yield > 0 ? nett / cv.yield : 0);
    }, 0);
  const iwashCons = CLIA[cliaType].cons.find(c => c.inf);
  const iwashCpt = (!cliaIsFree && iwashCons)
    ? (() => { const cv = cliaConsNow[iwashCons.id] || { price: iwashCons.dp, yield: iwashCons.yield, disc: 0 }; const nett = cv.price * (1 - (cv.disc || 0) / 100); return cv.yield > 0 ? nett / cv.yield : 0; })()
    : 0;
  const cliaConsInf = cliaConsBase + iwashCpt;
  const cliaParamsNow = cliaParams[cliaType];

  // ── Reagent nett maps (hemato) — nett = pricelist × (1 − disc) ──
  const rpNettMap = {};
  Object.entries(hRp[hType]).forEach(([id, obj]) => {
    rpNettMap[id] = obj.price * (1 - obj.disc / 100);
  });

  // ── Calc (hemato) ──
  let hRes = null;
  if (tab === 'hemato' && D > 0) {
    hRes = HEMATO[hType].calc(curSet.tests, workDays, rpNettMap, hType === 'EXZ8000' ? exzMode : undefined);
  }

  // ── Updaters ──
  const updH  = (f, v) => setHSet(p  => ({ ...p, [hType]: { ...p[hType], [f]: v } }));
  const updC  = (f, v) => setCSet(p  => ({ ...p, [cType]: { ...p[cType], [f]: v } }));
  const updHRp = (id, fld, v) => setHRp(p => ({ ...p, [hType]: { ...p[hType], [id]: { ...p[hType][id], [fld]: v } } }));
  const updXm  = (f, v) => setXmSet(p => ({ ...p, [xmType]: { ...p[xmType], [f]: v } }));
  const updXmRp = (id, fld, v) => setXmRp(p => ({ ...p, [xmType]: { ...p[xmType], [id]: { ...p[xmType][id], [fld]: v } } }));
  const updXmMethod = (m) => setXmMethod(prev => ({ ...prev, [xmType]: m }));

  const updClia         = (f, v) => setCliaSet(p => ({ ...p, [cliaType]: { ...p[cliaType], [f]: v } }));
  const updCliaCons     = (id, fld, v) => setCliaCons(p => ({ ...p, [cliaType]: { ...p[cliaType], [id]: { ...p[cliaType][id], [fld]: v } } }));
  const updCliaParam    = (pid, fld, v) => setCliaParams(p => ({ ...p, [cliaType]: { ...p[cliaType], [pid]: { ...p[cliaType][pid], [fld]: v } } }));
  const toggleCliaFree  = () => setCliaConsFree(p => ({ ...p, [cliaType]: !p[cliaType] }));

  const updHCtrl     = (f, v) => setHCtrl(p => ({ ...p, [hType]: { ...p[hType], [f]: v } }));
  const updHCtrlCtrl = (f, v) => setHCtrl(p => ({ ...p, [hType]: { ...p[hType], ctrl: { ...p[hType].ctrl, [f]: v } } }));
  const updHCtrlCal  = (f, v) => setHCtrl(p => ({ ...p, [hType]: { ...p[hType], cal:  { ...p[hType].cal,  [f]: v } } }));

  const updCCParam = (id, field, value) =>
    setCCParams(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p));
  const addCCParam = (data) =>
    setCCParams(ps => [...ps, { ...data, id: `custom_${ps.length + 1}`, custom: true }]);
  const delCCParam = (id) =>
    setCCParams(ps => ps.filter(p => p.id !== id));

  const selHType = (t) => {
    setHType(t);
    if (backupOn) { setBackupKey(t); setBackupPrice(HEMATO[t].dPl ?? HEMATO[t].dP); setBackupDisc(HEMATO[t].dD); }
  };
  const onBackupKeyChange = (key) => {
    setBackupKey(key);
    const d = tab === 'hemato' ? HEMATO[key] : CC[key];
    if (d) { setBackupPrice(d.dPl ?? d.dP); setBackupDisc(d.dD); }
  };

  const hTypes  = Object.values(HEMATO);
  // EXZ8000 control/calibrator overhead
  let ctrlOverhead = 0;
  if (hType === 'EXZ8000' && D > 0 && hRes && (exzMode === 'cbc_diff_xn' || exzMode === 'cbc_diff_ret_xr')) {
    const isXr      = exzMode === 'cbc_diff_ret_xr';
    const ctrlObj   = isXr ? exzCtrl.xr : exzCtrl.xn;
    const nettCtrl  = ctrlObj.price * (1 - ctrlObj.disc / 100);
    const nettCal   = exzCtrl.cal.price * (1 - exzCtrl.cal.disc / 100);
    const tests25   = D * 25;
    if (exzCtrl.free) {
      const qcReagen  = exzCtrl.n_qc * 25 * hRes.cyc;
      const calReagen = exzCtrl.n_cal * hRes.cyc;
      ctrlOverhead = (nettCtrl + qcReagen + nettCal + calReagen) / tests25;
    }
    // Beli: ctrl/cal tidak dibebankan ke test
  } else if (hType !== 'EXZ8000' && D > 0 && hRes) {
    const hc = hCtrl[hType];
    if (hc) {
      const nettCtrl   = hc.ctrl.price * (1 - hc.ctrl.disc / 100);
      const nettCal    = hc.cal.price  * (1 - hc.cal.disc  / 100);
      const monthTests = curSet.tests;
      if (hc.free && monthTests > 0) {
        const qcReagen  = hc.n_qc  * workDays * hRes.cyc;
        const calReagen = hc.n_cal * hRes.cyc;
        ctrlOverhead = (nettCtrl + qcReagen + nettCal + calReagen) / monthTests;
      }
      // Beli: ctrl/cal tidak dibebankan ke test
    }
  }

  const hReagenCpt = hRes ? hRes.total : 0;
  const sellPrice  = tab === 'hemato' ? sellOf(capPt + hReagenCpt + ctrlOverhead, curSet.markup) : 0;

  const exzModeLabel = hType === 'EXZ8000'
    ? HEMATO.EXZ8000.testModes.find(m => m.id === exzMode)?.label
    : null;

  const reagents   = HEMATO[hType].reagents;
  const getRpObj   = (id) => hRp[hType][id];
  const setRpField = (id, fld, v) => updHRp(id, fld, v);

  const nParam = ccParams.filter(p => p.panel !== 'Control' && p.panel !== 'Consumable').length;

  return (
    <>
      <div data-page={page}>
      {/* ── Header ── */}
      <header className="hdr">
        <div className="brand">
          <span className="brand-n">Dashboard</span>
          <span className="brand-t">KSO Simulator</span>
        </div>
        <div className="hdr-r">
          Hematologi · Kimia Klinik · Crossmatch · CLIA<br />Wahana Lifeline · 2026
        </div>
      </header>

      {/* ── Page navigation (desktop) ── */}
      <nav className="page-nav">
        <button
          className={`pnav-btn${page === 'input' ? ' pnav-active' : ''}`}
          onClick={() => setPage('input')}
        >
          ▶ INPUT &amp; PRICELIST REAGEN
        </button>
        <button
          className={`pnav-btn${page === 'result' ? ' pnav-active' : ''}`}
          onClick={() => setPage('result')}
        >
          ▶ HASIL PERHITUNGAN
        </button>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          PAGE 1 — INPUT
      ══════════════════════════════════════════════════════════════ */}
      <div className="sec-input">
        <div className="page-body">

          {/* ── Informasi Kunjungan ── */}
          <div className="inp-card info-card">
            <div className="inp-card-title">INFORMASI KUNJUNGAN</div>
            <div className="info-card-grid">
              <div className="field">
                <label>Nama Sales</label>
                <input type="text" className="txt-inp" value={salesName} onChange={e => setSalesName(e.target.value)} placeholder="—" />
              </div>
              <div className="field">
                <label>Nama Faskes</label>
                <input type="text" className="txt-inp" value={faskesName} onChange={e => setFaskesName(e.target.value)} placeholder="—" />
              </div>
              <div className="field">
                <label>Kota / Kab</label>
                <input type="text" className="txt-inp" value={kotaKab} onChange={e => setKotaKab(e.target.value)} placeholder="—" />
              </div>
              <div className="field">
                <label>Informasi Kompetitor</label>
                <input type="text" className="txt-inp" value={kompetitor} onChange={e => setKompetitor(e.target.value)} placeholder="—" />
              </div>
            </div>
          </div>

          {/* ── Pilih Kategori ── */}
          <div className="sel-row">
            <span className="sel-label">PILIH KATEGORI</span>
            <MerkPill label="Hematologi" color={CAT_COLORS.hemato}
              active={tab === 'hemato'} onClick={() => setTab('hemato')} />
            <MerkPill label="Kimia Klinik" color={CAT_COLORS.cc}
              active={tab === 'cc'} onClick={() => setTab('cc')} />
            <MerkPill label="Crossmatch" color={CAT_COLORS.xm}
              active={tab === 'xm'} onClick={() => setTab('xm')} />
            <MerkPill label="CLIA" color={CAT_COLORS.clia}
              active={tab === 'clia'} onClick={() => setTab('clia')} />
          </div>

          {/* ══ HEMATO INPUT ══ */}
          {tab === 'hemato' && (
            <>
              <div className="sel-row">
                <span className="sel-label">PILIH ANALYZER</span>
                {hTypes.map(t => (
                  <MerkPill key={t.label} label={t.label} color={H_COLORS[t.label]}
                    active={hType === t.label} onClick={() => selHType(t.label)} sub={t.diff} />
                ))}
                <span className="sel-desc">{HEMATO[hType].diff} · {hType}</span>
              </div>

              <div className="sel-row">
                <span className="sel-label">PRESET TEST/BLN</span>
                <div className="preset-grid">
                  {HEMATO[hType].testPresets.map(v => (
                    <button key={v} onClick={() => updH('tests', v)}
                      className={`preset-btn${curSet.tests === v ? ' active' : ''}`}>
                      {fmt(v)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-grid">
                {/* CAPEX */}
                <div className="inp-card">
                  <div className="inp-card-title">CAPEX</div>
                  <div className="field">
                    <label>Harga Analyzer</label>
                    <NumInput value={curSet.price} onChange={v => updH('price', v)} prefix="Rp" />
                  </div>
                  <div className="field">
                    <label>Diskon Analyzer</label>
                    <NumInput value={curSet.disc} onChange={v => updH('disc', v)} suffix="%" />
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
                          {hTypes.map(t => (
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

                {/* Parameter KSO */}
                <div className="inp-card">
                  <div className="inp-card-title">PARAMETER KSO</div>
                  <div className="field">
                    <label>Masa KSO</label>
                    <NumInput value={curSet.kso} onChange={v => updH('kso', v)} suffix="bln" />
                  </div>
                  <div className="field">
                    <label>Test / Bulan</label>
                    <NumInput value={curSet.tests} onChange={v => updH('tests', v)} />
                  </div>
                  <div className="field">
                    <label>Hari Kerja / Bulan</label>
                    <NumInput value={workDays} onChange={setWorkDays} suffix="hari" />
                  </div>
                  <div className="field">
                    <label>Margin / Markup</label>
                    <NumInput value={curSet.markup} onChange={v => updH('markup', v)} suffix="%" />
                  </div>
                  <div className="sep" />
                  <div className="comp">
                    <span className="cl">Test / Hari</span>
                    <span className="cv">{D > 0 ? fmt(D) : '—'}</span>
                  </div>
                  <div className="comp">
                    <span className="cl">Total Test KSO</span>
                    <span className="cv">{totTest > 0 ? fmt(totTest) : '—'}</span>
                  </div>
                  <div className="comp">
                    <span className="cl">CAPEX / Test</span>
                    <span className="cv" style={{ color: 'var(--red)' }}>{rp(capPt)}</span>
                  </div>
                  <div className="comp">
                    <span className="cl">Reagen / Test</span>
                    <span className="cv">{rp(hReagenCpt)}</span>
                  </div>
                  {ctrlOverhead > 0 && (
                    <div className="comp">
                      <span className="cl">Kontrol+Cal / Test</span>
                      <span className="cv" style={{ color: 'var(--amber)' }}>{rp(ctrlOverhead)}</span>
                    </div>
                  )}
                  <div className="comp strong">
                    <span className="cl">Harga Jual / Test</span>
                    <span className="cv">{rp(sellPrice)}</span>
                  </div>
                  <div className="sep" style={{ marginTop: 12 }} />
                  <button className="goto-btn" onClick={() => setPage('result')}>
                    Lihat Hasil Perhitungan ▶
                  </button>
                </div>

                {/* Harga Reagen */}
                <div className="inp-card inp-card-reagent">
                  <div className="inp-card-title">HARGA REAGEN (PRICELIST)</div>
                  <div className="rp-list">
                    {reagents.map(r => {
                      const obj  = getRpObj(r.id);
                      const nett = obj.price * (1 - obj.disc / 100);
                      return (
                        <div key={r.id} className="rp-item">
                          <div className="rp-name" title={r.fn}>{r.fn}</div>
                          <div className="rp-pack">{r.pack}</div>
                          <div className="rp-row2">
                            <div className="field" style={{ margin: 0 }}>
                              <label>Harga Pricelist / Kit</label>
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
                  {/* Kontrol & Kalibrator */}
                  <div className="sep" style={{ margin: '10px 0' }} />
                  <div className="inp-card-title" style={{ marginBottom: 8 }}>KONTROL &amp; KALIBRATOR</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {['free', 'beli'].map(opt => {
                      const isFree = hType === 'EXZ8000' ? exzCtrl.free : hCtrl[hType]?.free;
                      const active = (opt === 'free') === isFree;
                      const color  = H_COLORS[hType] || '#6366F1';
                      return (
                        <button key={opt}
                          className={`merk-pill${active ? ' merk-active' : ''}`}
                          style={active ? { borderColor: color, color } : {}}
                          onClick={() => hType === 'EXZ8000'
                            ? setExzCtrl(s => ({ ...s, free: opt === 'free' }))
                            : updHCtrl('free', opt === 'free')}>
                          {opt === 'free' ? 'Free (Overhead)' : 'Beli (Pricelist)'}
                        </button>
                      );
                    })}
                  </div>
                  <div className="rp-list">
                    {/* Kontrol */}
                    {hType === 'EXZ8000' ? (
                      <>
                        <div className="rp-item">
                          <div className="rp-name">Check-XN Control</div>
                          <div className="rp-row2">
                            <div className="field" style={{ margin: 0 }}>
                              <label>Harga Beli</label>
                              <NumInput value={exzCtrl.xn.price} onChange={v => setExzCtrl(s => ({ ...s, xn: { ...s.xn, price: v } }))} prefix="Rp" />
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Diskon</label>
                              <NumInput value={exzCtrl.xn.disc} onChange={v => setExzCtrl(s => ({ ...s, xn: { ...s.xn, disc: v } }))} suffix="%" />
                            </div>
                          </div>
                        </div>
                        <div className="rp-item">
                          <div className="rp-name">Check-XR Control</div>
                          <div className="rp-row2">
                            <div className="field" style={{ margin: 0 }}>
                              <label>Harga Beli</label>
                              <NumInput value={exzCtrl.xr.price} onChange={v => setExzCtrl(s => ({ ...s, xr: { ...s.xr, price: v } }))} prefix="Rp" />
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Diskon</label>
                              <NumInput value={exzCtrl.xr.disc} onChange={v => setExzCtrl(s => ({ ...s, xr: { ...s.xr, disc: v } }))} suffix="%" />
                            </div>
                          </div>
                        </div>
                        <div className="rp-item">
                          <div className="rp-name">CAL Calibrator</div>
                          <div className="rp-row2">
                            <div className="field" style={{ margin: 0 }}>
                              <label>Harga Beli</label>
                              <NumInput value={exzCtrl.cal.price} onChange={v => setExzCtrl(s => ({ ...s, cal: { ...s.cal, price: v } }))} prefix="Rp" />
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Diskon</label>
                              <NumInput value={exzCtrl.cal.disc} onChange={v => setExzCtrl(s => ({ ...s, cal: { ...s.cal, disc: v } }))} suffix="%" />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="rp-item">
                          <div className="rp-name">Harga Kontrol</div>
                          <div className="rp-row2">
                            <div className="field" style={{ margin: 0 }}>
                              <label>Harga Beli</label>
                              <NumInput value={hCtrl[hType]?.ctrl.price || 0} onChange={v => updHCtrlCtrl('price', v)} prefix="Rp" />
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Diskon</label>
                              <NumInput value={hCtrl[hType]?.ctrl.disc || 0} onChange={v => updHCtrlCtrl('disc', v)} suffix="%" />
                            </div>
                          </div>
                        </div>
                        <div className="rp-item">
                          <div className="rp-name">Harga Kalibrator</div>
                          <div className="rp-row2">
                            <div className="field" style={{ margin: 0 }}>
                              <label>Harga Beli</label>
                              <NumInput value={hCtrl[hType]?.cal.price || 0} onChange={v => updHCtrlCal('price', v)} prefix="Rp" />
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Diskon</label>
                              <NumInput value={hCtrl[hType]?.cal.disc || 0} onChange={v => updHCtrlCal('disc', v)} suffix="%" />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {/* QC settings when Free */}
                  {(hType === 'EXZ8000' ? exzCtrl.free : hCtrl[hType]?.free) && (
                    <div className="cc-qc-settings">
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.5px' }}>
                        PENGATURAN QC &amp; KALIBRASI
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Jml QC/hari</span>
                          {hType === 'EXZ8000' ? (
                            <SmallNumInput value={exzCtrl.n_qc} onChange={v => setExzCtrl(s => ({ ...s, n_qc: v }))} tiny />
                          ) : (
                            <SmallNumInput value={hCtrl[hType]?.n_qc ?? 0} onChange={v => updHCtrl('n_qc', v)} tiny />
                          )}
                          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>run</span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                            {hType === 'EXZ8000' ? 'Kalibrasi/25 hari' : 'Kalibrasi/bulan'}
                          </span>
                          {hType === 'EXZ8000' ? (
                            <SmallNumInput value={exzCtrl.n_cal} onChange={v => setExzCtrl(s => ({ ...s, n_cal: v }))} tiny />
                          ) : (
                            <SmallNumInput value={hCtrl[hType]?.n_cal ?? 0} onChange={v => updHCtrl('n_cal', v)} tiny />
                          )}
                          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>kali</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Running cost summary — perbandingan KSO vs konversi reagen */}
                  {hRes && D > 0 && (
                    <div style={{ borderTop: '2px solid var(--bdr)', marginTop: 10, paddingTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 6 }}>
                        RUNNING COST SUMMARY
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: 'var(--text-2)' }}>Total Reagen / Test</span>
                        <span style={{ fontWeight: 600 }}>{rp(hReagenCpt)}</span>
                      </div>
                      {ctrlOverhead > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: 'var(--text-2)' }}>Kontrol + Cal / Test</span>
                          <span style={{ fontWeight: 600, color: 'var(--amber)' }}>{rp(ctrlOverhead)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-2)' }}>+ CAPEX / Test</span>
                        <span style={{ fontWeight: 600, color: 'var(--red)' }}>{rp(capPt)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid var(--bdr)', paddingTop: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--blue)' }}>Cost / Test KSO CPRR</span>
                        <span style={{ fontWeight: 900, color: 'var(--blue)', fontSize: 16 }}>{rp(sellPrice)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ══ CC INPUT ══ */}
          {tab === 'cc' && (
            <>
              <div className="sel-row">
                <span className="sel-label">PILIH ANALYZER</span>
                {Object.values(CC).map(t => (
                  <MerkPill key={t.label} label={t.label} color={C_COLORS[t.label]}
                    active={cType === t.label} onClick={() => setCType(t.label)} />
                ))}
              </div>
              <div className="sel-row">
                <span className="sel-label">PRESET TEST/BLN</span>
                <div className="preset-grid">
                  {CC[cType].testPresets.map(v => (
                    <button key={v} onClick={() => updC('tests', v)}
                      className={`preset-btn${cSet[cType].tests === v ? ' active' : ''}`}>
                      {fmt(v)}
                    </button>
                  ))}
                </div>
              </div>
              <CCInputCC
              cType={cType} setCType={setCType}
              cSet={cSet[cType]} updC={updC}
              ups={ups} setUps={setUps}
              lis={lis} setLis={setLis}
              backupOn={backupOn} setBackupOn={setBackupOn}
              backupKey={backupKey}
              backupPrice={backupPrice} setBackupPrice={setBackupPrice}
              backupDisc={backupDisc} setBackupDisc={setBackupDisc}
              onBackupKeyChange={onBackupKeyChange}
              workDays={workDays} setWorkDays={setWorkDays}
              aNett={aNett} bNett={bNett} totCap={totCap}
              capPt={capPt} D={D} totTest={totTest}
              ccParams={ccParams}
              updCCParam={updCCParam}
              addCCParam={addCCParam}
              delCCParam={delCCParam}
              ccQC={ccQC} setCCQC={setCCQC}
              onGoToResult={() => setPage('result')}
            />
            </>
          )}

          {/* ══ CROSSMATCH INPUT ══ */}
          {tab === 'xm' && (
            <>
              <div className="sel-row">
                <span className="sel-label">PILIH ANALYZER</span>
                {Object.values(CROSSMATCH).map(t => (
                  <MerkPill key={t.label} label={t.label} color={XM_COLORS[t.label]}
                    active={xmType === t.label} onClick={() => setXmType(t.label)} sub={t.brand} />
                ))}
              </div>
              <div className="sel-row">
                <span className="sel-label">METODE</span>
                {CROSSMATCH[xmType].methods.map(m => (
                  <MerkPill key={m.id} label={m.label} color={XM_COLORS[xmType]}
                    active={xmMethod[xmType] === m.id} onClick={() => updXmMethod(m.id)} />
                ))}
                <span className="sel-desc">
                  {xmCurMethod.cols} {xmType === 'LIBO' ? 'well' : 'kolom'}/test · {xmCurMethod.liss_ml} mL LISS/test
                </span>
              </div>
              <div className="sel-row">
                <span className="sel-label">PRESET TEST/BLN</span>
                <div className="preset-grid">
                  {CROSSMATCH[xmType].testPresets.map(v => (
                    <button key={v} onClick={() => updXm('tests', v)}
                      className={`preset-btn${xmCurSet.tests === v ? ' active' : ''}`}>
                      {fmt(v)}
                    </button>
                  ))}
                </div>
              </div>
              <CrossmatchInput
                xmType={xmType}
                xmCurSet={xmCurSet}
                updXm={updXm}
                xmUps={xmUps} setXmUps={setXmUps}
                xmLis={xmLis} setXmLis={setXmLis}
                xmRpNow={xmRp[xmType]}
                updXmRp={updXmRp}
                workDays={workDays} setWorkDays={setWorkDays}
                xmCapex={xmCapex} xmTotTest={xmTotTest} xmCapPt={xmCapPt} xmD={xmD}
                xmRes={xmRes} xmSell={xmSell}
                onGoToResult={() => setPage('result')}
              />
            </>
          )}

          {/* ══ CLIA INPUT ══ */}
          {tab === 'clia' && (
            <>
              <div className="sel-row">
                <span className="sel-label">PILIH ANALYZER</span>
                {Object.entries(CLIA).map(([key, t]) => (
                  <MerkPill key={key} label={t.label} color={CLIA_COLORS[key]}
                    active={cliaType === key} onClick={() => setCliaType(key)} sub={t.brand} />
                ))}
              </div>
              <div className="sel-row">
                <span className="sel-label">PRESET TEST/BLN</span>
                <div className="preset-grid">
                  {CLIA[cliaType].testPresets.map(v => (
                    <button key={v} onClick={() => updClia('tests', v)}
                      className={`preset-btn${cliaCurSet.tests === v ? ' active' : ''}`}>
                      {fmt(v)}
                    </button>
                  ))}
                </div>
              </div>
              <CLIAInput
                cliaType={cliaType}
                cliaCurSet={cliaCurSet}
                updClia={updClia}
                cliaUps={cliaUps} setCliaUps={setCliaUps}
                cliaLis={cliaLis} setCliaLis={setCliaLis}
                cliaCapex={cliaCapex} cliaTotTest={cliaTotTest} cliaCapPt={cliaCapPt}
                cliaConsBase={cliaConsBase} cliaConsInf={cliaConsInf}
                cliaConsNow={cliaConsNow} updCliaCons={updCliaCons}
                cliaIsFree={cliaIsFree} onToggleConsFree={toggleCliaFree}
                cliaParamsNow={cliaParamsNow} updCliaParam={updCliaParam}
                markup={cliaCurSet.markup}
                onGoToResult={() => setPage('result')}
                deletedParams={cliaDeletedParams[cliaType]}
                onDeleteParam={pid => setCliaDeletedParams(p => ({ ...p, [cliaType]: new Set([...p[cliaType], pid]) }))}
              />
            </>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PAGE 2 — HASIL PERHITUNGAN
      ══════════════════════════════════════════════════════════════ */}
      <div className="sec-result" id="mob-result">
        <div className="page-body">
          {tab === 'hemato' ? (
            <HematoResult
              data={HEMATO[hType]}
              hRes={hRes}
              capPt={capPt}
              markup={curSet.markup}
              D={D}
              modeLabel={exzModeLabel}
              hRpData={hRp[hType]}
              totCap={totCap}
              totTest={totTest}
              kso={curSet.kso}
              ctrl={ctrlOverhead}
              exzMode={exzMode}
              onExzModeChange={hType === 'EXZ8000' ? setExzMode : undefined}
              workDays={workDays}
              testsPerMonth={curSet.tests}
              qcFree={hType === 'EXZ8000' ? exzCtrl.free : (hCtrl[hType]?.free ?? true)}
              salesName={salesName} faskesName={faskesName} kotaKab={kotaKab} kompetitor={kompetitor}
              backupLabel={backupOn ? (HEMATO[backupKey]?.diff ? `${HEMATO[backupKey].label} (${HEMATO[backupKey].diff})` : HEMATO[backupKey]?.label || backupKey) : ''}
            />
          ) : tab === 'cc' ? (
              <CCResultTable
                params={ccParams}
                capPt={capPt}
                totTest={totTest}
                cType={cType}
                ccQC={ccQC}
                D={D}
                testsPerMonth={cSet[cType].tests}
                markup={cSet[cType].markup}
                kso={cSet[cType].kso}
                ccConsumablePerTest={ccConsumablePerTest}
                ccDetResult={ccDetResult}
                workDays={workDays}
                nParam={nParam}
                totCap={totCap}
                salesName={salesName} faskesName={faskesName} kotaKab={kotaKab} kompetitor={kompetitor}
                backupLabel={backupOn ? (CC[backupKey]?.label || backupKey) : ''}
              />
          ) : tab === 'xm' ? (
            <CrossmatchResult
              data={CROSSMATCH[xmType]}
              xmRes={xmRes}
              xmCapPt={xmCapPt}
              markup={xmCurSet.markup}
              xmD={xmD}
              curMethod={xmCurMethod}
              xmTotTest={xmTotTest}
              kso={xmCurSet.kso}
              xmRpNow={xmRp[xmType]}
              totCap={xmCapex}
              workDays={workDays}
              salesName={salesName} faskesName={faskesName} kotaKab={kotaKab} kompetitor={kompetitor}
            />
          ) : (
            <CLIAResultTable
              cliaType={cliaType}
              cliaCapPt={cliaCapPt}
              cliaConsBase={cliaConsBase}
              cliaConsInf={cliaConsInf}
              markup={cliaCurSet.markup}
              totTest={cliaTotTest}
              kso={cliaCurSet.kso}
              testsPerMonth={cliaCurSet.tests}
              D={workDays > 0 ? cliaCurSet.tests / workDays : 0}
              cliaParamsNow={cliaParamsNow}
              deletedParams={cliaDeletedParams[cliaType]}
              totCap={cliaCapex}
              workDays={workDays}
              qcFree={cliaIsFree}
              salesName={salesName} faskesName={faskesName} kotaKab={kotaKab} kompetitor={kompetitor}
            />
          )}
        </div>
      </div>

      </div>

      {/* ── Mobile bottom category nav — outside data-page wrapper to escape its stacking context ── */}
      <nav className="mob-nav-bar">
        {[
          { key: 'hemato', label: 'Hemato', color: CAT_COLORS.hemato },
          { key: 'cc',     label: 'CC',     color: CAT_COLORS.cc },
          { key: 'xm',     label: 'XM',     color: CAT_COLORS.xm },
          { key: 'clia',   label: 'CLIA',   color: CAT_COLORS.clia },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            className={`mob-nav-btn${tab === key ? ' mob-nav-active' : ''}`}
            style={tab === key ? { borderTopColor: color, color } : {}}
            onClick={() => { setTab(key); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <span className="mob-nav-dot" style={{ background: color }} />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
