import { useState, useEffect, useRef } from 'react';
import { HEMATO, CC, CC_P, CC_PANELS, CROSSMATCH, CLIA, CLIA_PANELS, SNIBE_P, WONDFO_P, HPLC, ELEKTRO, BLOODGAS } from '../lib/data';
import { exportHemato, exportCC, exportCrossmatch, exportCLIA, exportHPLC, exportElektro, exportBloodGas } from '../lib/exportExcel';
import { printHemato, printCC, printCrossmatch, printCLIA, printHPLC, printElektro, printBloodGas } from '../lib/printPdf';

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
  hemato:  '#3B82F6',
  cc:      '#10B981',
  xm:      '#E11D48',
  clia:    '#7C3AED',
  hplc:    '#D97706',
  elektro: '#0D9488',
  bg:      '#0EA5E9',
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

function HematoResult({ data, hRes, capPt, markup, D, modeLabel, hRpData, totCap, totTest, kso, ctrl, exzMode, onExzModeChange, workDays, testsPerMonth, qcFree, salesName, faskesName, kotaKab, kompetitor, backupLabel, capexBreakdown }) {
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
      capexBreakdown,
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
      capexBreakdown,
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

// ─── HPLCResult ───────────────────────────────────────────────────────────────

function HPLCResult({ hplcRes, hplcCapPt, hplcTotTest, hplcSet, hplcD, hplcRp, hplcCtrlOh, hplcSell, totCap, workDays, salesName, faskesName, kotaKab, kompetitor, capexBreakdown }) {
  const totR  = hplcRes ? hplcRes.total : 0;
  const base  = hplcCapPt + totR + (hplcCtrlOh || 0);
  const markup_amt = hplcSell - base;

  const rows0 = HPLC.AH600PRO.reagents.map(r => {
    const obj         = hplcRp[r.id] || { price: r.dp, disc: 0 };
    const nettKit     = obj.price * (1 - obj.disc / 100);
    const sellKit     = hplcSet.markup < 100 ? nettKit / (1 - hplcSet.markup / 100) : 0;
    const pr          = hplcRes ? hplcRes.pr[r.id] : null;
    const contribTest = pr ? (pr.c + pr.f) : 0;
    return { ...r, obj, nettKit, sellKit, contribTest };
  });

  const rows = rows0.map(r => ({
    ...r,
    excelKit: totR > 0 && hplcSell > 0 ? r.nettKit * hplcSell / totR : 0,
  }));

  function handleExportHPLC() {
    exportHPLC({
      analyzerName: HPLC.AH600PRO.label,
      totCap,
      kso: hplcSet.kso,
      testsPerMonth: hplcSet.tests,
      workDays: workDays || 25,
      markup: hplcSet.markup,
      qcFree: hplcCtrlOh === 0,
      capPt: hplcCapPt,
      totR,
      ctrlOverhead: hplcCtrlOh || 0,
      sell: hplcSell,
      totTest: hplcTotTest,
      reagentRows: rows,
      capexBreakdown,
      salesName: salesName || '', faskesName: faskesName || '',
      kotaKab: kotaKab || '', kompetitor: kompetitor || '',
    });
  }
  function handlePrintHPLC() {
    printHPLC({
      analyzerName: HPLC.AH600PRO.label,
      totCap,
      kso: hplcSet.kso,
      testsPerMonth: hplcSet.tests,
      workDays: workDays || 25,
      markup: hplcSet.markup,
      qcFree: hplcCtrlOh === 0,
      capPt: hplcCapPt,
      totR,
      ctrlOverhead: hplcCtrlOh || 0,
      sell: hplcSell,
      totTest: hplcTotTest,
      reagentRows: rows,
      capexBreakdown,
      salesName: salesName || '', faskesName: faskesName || '',
      kotaKab: kotaKab || '', kompetitor: kompetitor || '',
    });
  }

  return (
    <div className="page2-wrap">
      <div className="cprr-hero">
        <div className="cprr-left">
          <div className="cprr-label">COST / TEST — KSO CPRR</div>
          <div className="cprr-sub">
            {HPLC.AH600PRO.brand}
            &nbsp;·&nbsp;{hplcTotTest > 0 ? `${fmt(hplcTotTest)} test · ${hplcSet.kso} bulan` : '—'}
            {hplcD > 0 ? ` · ${fmt(hplcD)} test/hari` : ''}
          </div>
          <div className="cprr-val">{hplcRes ? rp(hplcSell) : '—'}</div>
        </div>
        <div className="cprr-pills">
          <span className="pill pl-cap">CAPEX/Test: {rp(hplcCapPt)}</span>
          <span className="pill pl-rgn">Reagen/Test: {hplcRes ? rp(totR) : '—'}</span>
          {hplcCtrlOh > 0 && <span className="pill pl-qc">QC/Test: {rp(hplcCtrlOh)}</span>}
          <span className="pill pl-base">Base Cost: {rp(base)}</span>
          <span className="pill pl-mkp">Markup {hplcSet.markup}%: {hplcRes ? rp(markup_amt) : '—'}</span>
        </div>
      </div>

      <div className="tbl-section">
        <div className="tbl-hbar">
          <span className="tbl-title">Rincian Reagen — {HPLC.AH600PRO.label} (HbA1c HPLC)</span>
          <span className="tbl-note">
            {hplcD > 0 ? 'Harga KSO di Excel = harga yang dimasukkan ke file running cost Excel agar hasilnya sama dengan KSO CPRR' : 'Lengkapi input di halaman sebelumnya'}
          </span>
          {hplcRes && <button className="export-btn" onClick={handleExportHPLC}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak Excel</button>}
          {hplcRes && <button className="print-btn" onClick={handlePrintHPLC}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak PDF</button>}
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
                  <td className="cpt">{hplcRes ? fmt(r.contribTest) : '—'}</td>
                  <td className="r td-sell">{hplcRes && r.excelKit > 0 ? rp(r.excelKit) : '—'}</td>
                </tr>
              ))}
              {hplcCtrlOh > 0 && (
                <tr className="tr-ctrl">
                  <td colSpan={2}>QC Control + Kalibrasi / Test</td>
                  <td className="cpt">{fmt(hplcCtrlOh)}</td>
                  <td style={{ background: '#FFFBEB' }}>—</td>
                </tr>
              )}
              <tr className="tr-sub">
                <td colSpan={2}>Total Biaya Reagen / Test</td>
                <td className="cpt">{hplcRes ? fmt(totR) : '—'}</td>
                <td style={{ background: '#F1F5F9' }}></td>
              </tr>
              <tr className="tr-capex">
                <td colSpan={2} style={{ color: 'var(--red)' }}>
                  + CAPEX / Test&nbsp;
                  <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-3)' }}>
                    (Alat + UPS + LIS ÷ {fmt(hplcTotTest)} test KSO)
                  </span>
                </td>
                <td className="r" style={{ fontWeight: 700, color: 'var(--red)' }}>{rp(hplcCapPt)}</td>
                <td style={{ background: '#FFF5F5' }}></td>
              </tr>
              <tr className="tr-base">
                <td colSpan={2}>Base Cost / Test (sebelum markup)</td>
                <td className="cpt">{hplcRes ? rp(base) : '—'}</td>
                <td style={{ background: '#F8FAFC' }}></td>
              </tr>
              <tr className="tr-sell tr-sell-big">
                <td colSpan={2}>
                  Cost / Test KSO CPRR&nbsp;
                  <span style={{ fontWeight: 400, fontSize: 11 }}>margin {hplcSet.markup}%</span>
                </td>
                <td className="cpt" style={{ fontSize: 16, fontWeight: 900, color: 'var(--blue)' }}>
                  {hplcRes ? rp(hplcSell) : '—'}
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

// ─── ElektroResult ───────────────────────────────────────────────────────────

function ElektroResult({ elektroRes, elektroCapPt, elektroTotTest, elektroSet, elektroD, elektroRp, elektroQcOh, elektroSell, totCap, workDays, salesName, faskesName, kotaKab, kompetitor, capexBreakdown }) {
  const totR = elektroRes ? elektroRes.cpt : 0;
  const base = elektroCapPt + totR + (elektroQcOh || 0);
  const markup_amt = elektroSell - base;

  const modeInfo  = ELEKTRO.DNX6.modes[elektroSet.mode];
  const rpObj     = elektroRp[elektroSet.mode];
  const packLabel = elektroSet.mode === 'cartridge' ? '650 mL Cal A / cartridge' : '3×450 mL Cal A + 1 Cal B / set';
  const testsPerPack = elektroRes ? elektroRes.totalTests : 0;
  const excelKit  = testsPerPack > 0 && elektroSell > 0 ? elektroSell * testsPerPack : 0;

  const reagentRows = [{
    fn:          modeInfo.label + ' Reagent',
    pack:        packLabel,
    contribTest: totR,
    excelKit,
  }];

  function handleExportElektro() {
    exportElektro({
      analyzerName: ELEKTRO.DNX6.label, modeName: modeInfo.label,
      totCap, kso: elektroSet.kso, testsPerMonth: elektroSet.tests,
      workDays: workDays || 25, markup: elektroSet.markup,
      qcFree: elektroQcOh > 0, capPt: elektroCapPt,
      totR, ctrlOverhead: elektroQcOh || 0,
      sell: elektroSell, totTest: elektroTotTest,
      reagentRows,
      runDays: elektroRes ? elektroRes.runDays : 0,
      testsPerPack,
      capexBreakdown,
      salesName: salesName || '', faskesName: faskesName || '',
      kotaKab: kotaKab || '', kompetitor: kompetitor || '',
    });
  }
  function handlePrintElektro() {
    printElektro({
      analyzerName: ELEKTRO.DNX6.label, modeName: modeInfo.label,
      totCap, kso: elektroSet.kso, testsPerMonth: elektroSet.tests,
      workDays: workDays || 25, markup: elektroSet.markup,
      qcFree: elektroQcOh > 0, capPt: elektroCapPt,
      totR, ctrlOverhead: elektroQcOh || 0,
      sell: elektroSell, totTest: elektroTotTest,
      reagentRows,
      runDays: elektroRes ? elektroRes.runDays : 0,
      testsPerPack,
      capexBreakdown,
      salesName: salesName || '', faskesName: faskesName || '',
      kotaKab: kotaKab || '', kompetitor: kompetitor || '',
    });
  }

  return (
    <div className="page2-wrap">
      <div className="cprr-hero">
        <div className="cprr-left">
          <div className="cprr-label">COST / TEST — KSO CPRR</div>
          <div className="cprr-sub">
            {ELEKTRO.DNX6.brand} · {modeInfo.label}
            &nbsp;·&nbsp;{elektroTotTest > 0 ? `${fmt(elektroTotTest)} test · ${elektroSet.kso} bulan` : '—'}
            {elektroD > 0 ? ` · ${fmt(elektroD)} test/hari` : ''}
          </div>
          <div className="cprr-val">{elektroRes ? rp(elektroSell) : '—'}</div>
        </div>
        <div className="cprr-pills">
          <span className="pill pl-cap">CAPEX/Test: {rp(elektroCapPt)}</span>
          <span className="pill pl-rgn">Reagen/Test: {elektroRes ? rp(totR) : '—'}</span>
          {elektroQcOh > 0 && <span className="pill pl-qc">QC/Test: {rp(elektroQcOh)}</span>}
          <span className="pill pl-base">Base Cost: {rp(base)}</span>
          <span className="pill pl-mkp">Markup {elektroSet.markup}%: {elektroRes ? rp(markup_amt) : '—'}</span>
        </div>
      </div>

      <div className="tbl-section">
        <div className="tbl-hbar">
          <span className="tbl-title">Rincian Reagen — {ELEKTRO.DNX6.label} ({modeInfo.label})</span>
          <span className="tbl-note">
            {elektroD > 0 ? 'Sell/Kit = target harga jual per pack untuk mencapai CPRR' : 'Lengkapi input di halaman sebelumnya'}
          </span>
          {elektroRes && <button className="export-btn" onClick={handleExportElektro}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak Excel</button>}
          {elektroRes && <button className="print-btn" onClick={handlePrintElektro}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak PDF</button>}
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
              <tr>
                <td style={{ fontWeight: 600 }}>{modeInfo.label} Reagent</td>
                <td className="mob-hide" style={{ color: 'var(--text-3)', fontSize: '11px' }}>{packLabel}</td>
                <td className="cpt">{elektroRes ? fmt(totR) : '—'}</td>
                <td className="r td-sell">{elektroRes && excelKit > 0 ? rp(excelKit) : '—'}</td>
              </tr>
              {elektroQcOh > 0 && (
                <tr className="tr-ctrl">
                  <td colSpan={2}>QC Solution (3 level) / Test</td>
                  <td className="cpt">{fmt(elektroQcOh)}</td>
                  <td style={{ background: '#FFFBEB' }}>—</td>
                </tr>
              )}
              <tr className="tr-sub">
                <td colSpan={2}>Total Biaya Reagen / Test</td>
                <td className="cpt">{elektroRes ? fmt(totR + elektroQcOh) : '—'}</td>
                <td style={{ background: '#F1F5F9' }}></td>
              </tr>
              <tr className="tr-capex">
                <td colSpan={2} style={{ color: 'var(--red)' }}>
                  + CAPEX / Test&nbsp;
                  <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-3)' }}>
                    (Alat + UPS + LIS ÷ {fmt(elektroTotTest)} test KSO)
                  </span>
                </td>
                <td className="r" style={{ fontWeight: 700, color: 'var(--red)' }}>{rp(elektroCapPt)}</td>
                <td style={{ background: '#FFF5F5' }}></td>
              </tr>
              <tr className="tr-base">
                <td colSpan={2}>Base Cost / Test (sebelum markup)</td>
                <td className="cpt">{elektroRes ? rp(base) : '—'}</td>
                <td style={{ background: '#F8FAFC' }}></td>
              </tr>
              <tr className="tr-sell tr-sell-big">
                <td colSpan={2}>
                  Cost / Test KSO CPRR&nbsp;
                  <span style={{ fontWeight: 400, fontSize: 11 }}>margin {elektroSet.markup}%</span>
                </td>
                <td className="cpt" style={{ fontSize: 16, fontWeight: 900, color: 'var(--blue)' }}>
                  {elektroRes ? rp(elektroSell) : '—'}
                </td>
                <td style={{ background: 'var(--blue2)' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
        {elektroRes && (
          <div style={{ padding: '8px 18px', fontSize: 11, color: 'var(--text-3)', borderTop: '1px solid var(--bdr)' }}>
            {modeInfo.label}: {fmt(elektroRes.runDays)} hari/pack · {fmt(elektroRes.totalTests)} test/pack
            &nbsp;·&nbsp;Fixed: 21 mL/hari · Per-test: 0.8 mL Cal A
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BgResult ────────────────────────────────────────────────────────────────

function BgResult({ bgMode, bgSet, bgReal21d, bgResidue, bgKitCap, bgEffTests, bgHppKso, bgHppCprr, bgCartNett, bgQcOh, bgQcNett, bgCapPt, bgBase, bgSell, bgTotTest, bgD, bgCtrl, totCap, workDays, salesName, faskesName, kotaKab, kompetitor }) {
  const isCprr   = bgMode === 'cprr';
  const hpp      = isCprr ? bgHppCprr : bgHppKso;
  const hppBase  = bgKitCap > 0 ? bgCartNett / bgKitCap : 0;
  const hppResidu = hpp - hppBase;
  const markup_amt = bgSell - bgBase;
  const curCart  = BLOODGAS.PT1000.cartridges.find(c => c.id === bgSet.cartKey) || BLOODGAS.PT1000.cartridges[1];

  function handleExport() {
    exportBloodGas({
      bgMode, totCap, kso: bgSet.kso, testsPerMonth: bgSet.tests,
      workDays: workDays || 25, markup: bgSet.markup,
      qcFree: bgCtrl.free, capPt: bgCapPt,
      hpp, hppBase, hppResidu,
      qcOh: bgQcOh, base: bgBase, sell: bgSell, totTest: bgTotTest,
      cartFn: curCart.fn, cartPack: curCart.pack, cartNett: bgCartNett,
      kitCap: bgKitCap, real21d: bgReal21d, residue: bgResidue,
      stability: BLOODGAS.PT1000.stability,
      salesName: salesName || '', faskesName: faskesName || '',
      kotaKab: kotaKab || '', kompetitor: kompetitor || '',
    });
  }
  function handlePrint() {
    printBloodGas({
      bgMode, totCap, kso: bgSet.kso, testsPerMonth: bgSet.tests,
      workDays: workDays || 25, markup: bgSet.markup,
      qcFree: bgCtrl.free, capPt: bgCapPt,
      hpp, hppBase, hppResidu,
      qcOh: bgQcOh, base: bgBase, sell: bgSell, totTest: bgTotTest,
      cartFn: curCart.fn, cartPack: curCart.pack,
      kitCap: bgKitCap, real21d: bgReal21d, residue: bgResidue,
      stability: BLOODGAS.PT1000.stability,
      salesName: salesName || '', faskesName: faskesName || '',
      kotaKab: kotaKab || '', kompetitor: kompetitor || '',
    });
  }

  return (
    <div className="page2-wrap">
      <div className="cprr-hero">
        <div className="cprr-left">
          <div className="cprr-label">{isCprr ? 'COST / TEST — KSO CPRR' : 'RUNNING COST / TEST — KSO'}</div>
          <div className="cprr-sub">
            {BLOODGAS.PT1000.brand}
            &nbsp;·&nbsp;{bgTotTest > 0 ? `${fmt(bgTotTest)} test · ${bgSet.kso} bulan` : '—'}
            {bgD > 0 ? ` · ${fmt(bgD)} test/hari` : ''}
          </div>
          <div className="cprr-val">{bgSet.tests > 0 ? rp(bgSell) : '—'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
            {isCprr
              ? `Real test/21hari: ${fmt(Math.round(bgReal21d))} · Residu: ${fmt(Math.round(bgResidue))} · Kit cap: ${bgKitCap} test`
              : `Faskes beli cartridge sendiri · HPP = nett ÷ kit cap · Residu ditanggung faskes`}
          </div>
        </div>
        <div className="cprr-pills">
          <span className="pill pl-cap">CAPEX/Test: {rp(bgCapPt)}</span>
          <span className="pill pl-rgn">HPP Cartridge/Test: {bgSet.tests > 0 ? rp(hpp) : '—'}</span>
          {bgQcOh > 0 && <span className="pill pl-qc">QC/Test: {rp(bgQcOh)}</span>}
          <span className="pill pl-base">Base Cost: {bgSet.tests > 0 ? rp(bgBase) : '—'}</span>
          <span className="pill pl-mkp">Markup {bgSet.markup}%: {bgSet.tests > 0 ? rp(markup_amt) : '—'}</span>
        </div>
      </div>

      <div className="tbl-section">
        <div className="tbl-hbar">
          <span className="tbl-title">Rincian Cost / Test — {BLOODGAS.PT1000.brand}</span>
          <span className="tbl-note">
            {bgSet.tests > 0
              ? (isCprr ? 'CPRR: Residu cartridge diserap ke HPP/test · Open stability 21 hari' : 'KSO: HPP = nett ÷ kapasitas kit · Residu ditanggung faskes')
              : 'Lengkapi input test/bulan di halaman sebelumnya'}
          </span>
          {bgSet.tests > 0 && <button className="export-btn" onClick={handleExport}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak Excel</button>}
          {bgSet.tests > 0 && <button className="print-btn" onClick={handlePrint}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,verticalAlign:'middle'}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Cetak PDF</button>}
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Item Biaya</th>
                <th className="r">Kontrib / Test</th>
                <th className="mob-hide r">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>HPP Cartridge (base)</td>
                <td className="cpt">{bgSet.tests > 0 ? fmt(hppBase) : '—'}</td>
                <td className="mob-hide" style={{ fontSize: 11, color: 'var(--text-3)' }}>Nett ÷ {bgKitCap} test/kit</td>
              </tr>
              {isCprr && bgResidue > 0 && (
                <tr style={{ background: '#FFF8E1' }}>
                  <td style={{ fontWeight: 600, color: '#B45309' }}>+ Residu Cartridge</td>
                  <td className="cpt" style={{ color: '#B45309' }}>{fmt(hppResidu)}</td>
                  <td className="mob-hide" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {fmt(Math.round(bgResidue))} test terbuang ÷ {fmt(Math.round(bgReal21d))} real test
                  </td>
                </tr>
              )}
              <tr className="tr-sub">
                <td>HPP / Real Test {isCprr ? `(${fmt(Math.round(bgReal21d))} test/siklus)` : `(kit cap ${bgKitCap})`}</td>
                <td className="cpt">{bgSet.tests > 0 ? fmt(hpp) : '—'}</td>
                <td className="mob-hide" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {isCprr ? `Nett ÷ ${fmt(Math.round(bgReal21d))} real test` : `Nett ÷ ${bgKitCap} (kit cap)`}
                </td>
              </tr>
              {bgQcOh > 0 && (
                <tr className="tr-ctrl">
                  <td>QC / Test (Free)</td>
                  <td className="cpt">{fmt(bgQcOh)}</td>
                  <td className="mob-hide" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {fmt(bgCtrl.n_qc)} kit × Rp {fmt(bgQcNett)} ÷ {fmt(Math.round(bgEffTests))} test/siklus
                  </td>
                </tr>
              )}
              <tr className="tr-capex">
                <td style={{ color: 'var(--red)' }}>
                  + CAPEX / Test&nbsp;
                  <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-3)' }}>
                    (Alat + UPS + LIS ÷ {fmt(bgTotTest)} test KSO)
                  </span>
                </td>
                <td className="r" style={{ fontWeight: 700, color: 'var(--red)' }}>{rp(bgCapPt)}</td>
                <td className="mob-hide" style={{ background: '#FFF5F5' }}></td>
              </tr>
              <tr className="tr-base">
                <td>Base Cost / Test (sebelum markup)</td>
                <td className="cpt">{bgSet.tests > 0 ? rp(bgBase) : '—'}</td>
                <td className="mob-hide"></td>
              </tr>
              <tr className="tr-sell tr-sell-big">
                <td>
                  {isCprr ? 'Cost / Test KSO CPRR' : 'Running Cost / Test KSO'}&nbsp;
                  <span style={{ fontWeight: 400, fontSize: 11 }}>margin {bgSet.markup}%</span>
                </td>
                <td className="cpt" style={{ fontSize: 16, fontWeight: 900, color: 'var(--blue)' }}>
                  {bgSet.tests > 0 ? rp(bgSell) : '—'}
                </td>
                <td className="mob-hide" style={{ background: 'var(--blue2)' }}></td>
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
function initHplcRp() {
  return Object.fromEntries(HPLC.AH600PRO.reagents.map(r => [r.id, { price: r.dp, disc: 0 }]));
}
function initElektroRp() {
  return {
    cartridge: { price: ELEKTRO.DNX6.modes.cartridge.price, disc: 0 },
    bottle:    { price: ELEKTRO.DNX6.modes.bottle.price,    disc: 0 },
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
  const [hplcSet,    setHplcSet]    = useState({ price: HPLC.AH600PRO.dP, disc: 0, kso: HPLC.AH600PRO.dK, markup: HPLC.AH600PRO.dM, tests: HPLC.AH600PRO.dT });
  const [hplcRp,     setHplcRp]     = useState(initHplcRp);
  const [hplcCtrl,   setHplcCtrl]   = useState({ free: true, cal: { price: HPLC.AH600PRO.calPl, disc: 0 }, ctrl: { price: HPLC.AH600PRO.ctrlPl, disc: 0 } });
  const [hplcUps,    setHplcUps]    = useState(0);
  const [hplcLis,    setHplcLis]    = useState(0);
  const [elektroSet, setElektroSet] = useState({ price: ELEKTRO.DNX6.dP, disc: 0, kso: ELEKTRO.DNX6.dK, markup: ELEKTRO.DNX6.dM, tests: ELEKTRO.DNX6.dT, mode: 'cartridge' });
  const [elektroRp,  setElektroRp]  = useState(initElektroRp);
  const [elektroCtrl,setElektroCtrl]= useState({ free: true, qc1: { price: 948000, disc: 0 }, qc2: { price: 948000, disc: 0 }, qc3: { price: 948000, disc: 0 } });
  const [elektroUps,  setElektroUps]  = useState(0);
  const [elektroLis,  setElektroLis]  = useState(0);
  const [bgMode,     setBgMode]     = useState('cprr');
  const [bgSet,      setBgSet]      = useState({ price: BLOODGAS.PT1000.dP, disc: 0, kso: 0, markup: 0, tests: 0, cartKey: 'pt10_120' });
  const [bgRpCart,   setBgRpCart]   = useState(() => Object.fromEntries(BLOODGAS.PT1000.cartridges.map(c => [c.id, { price: c.dp, disc: 0 }])));
  const [bgRpQc,     setBgRpQc]     = useState({ price: BLOODGAS.PT1000.qc.dp, disc: 0 });
  const [bgCtrl,     setBgCtrl]     = useState({ free: true, n_qc: 1 });
  const [bgUps,      setBgUps]      = useState(0);
  const [bgLis,      setBgLis]      = useState(0);
  const [ccParamTpm, setCcParamTpm] = useState({});

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

  // ── HPLC computed ──
  const hplcANett    = hplcSet.price * (1 - hplcSet.disc / 100);
  const hplcCapex    = hplcANett + hplcUps + hplcLis;
  const hplcTotTest  = hplcSet.kso * hplcSet.tests;
  const hplcCapPt    = hplcTotTest > 0 ? hplcCapex / hplcTotTest : 0;
  const hplcD        = workDays > 0 ? hplcSet.tests / workDays : 0;
  const hplcRpNett   = Object.fromEntries(Object.entries(hplcRp).map(([id, o]) => [id, o.price * (1 - o.disc / 100)]));
  const hplcRes      = hplcD > 0 ? HPLC.AH600PRO.calc(hplcSet.tests, workDays, hplcRpNett) : null;
  const hplcTotR     = hplcRes ? hplcRes.total : 0;
  const hplcCalNett  = hplcCtrl.cal.price  * (1 - hplcCtrl.cal.disc  / 100);
  const hplcCtrlNett = hplcCtrl.ctrl.price * (1 - hplcCtrl.ctrl.disc / 100);
  const hplcCtrlOh   = (hplcCtrl.free && hplcSet.tests > 0 && workDays > 0)
    ? (hplcCalNett * (workDays / 5) * 0.5 + hplcCtrlNett * workDays * 0.0392) / hplcSet.tests
    : 0;
  const hplcBase     = hplcCapPt + hplcTotR + hplcCtrlOh;
  const hplcSell     = sellOf(hplcBase, hplcSet.markup);

  // ── Elektrolit computed ──
  const elektroANett    = elektroSet.price * (1 - elektroSet.disc / 100);
  const elektroCapex    = elektroANett + elektroUps + elektroLis;
  const elektroTotTest  = elektroSet.kso * elektroSet.tests;
  const elektroCapPt    = elektroTotTest > 0 ? elektroCapex / elektroTotTest : 0;
  const elektroD        = workDays > 0 ? elektroSet.tests / workDays : 0;
  const elektroRpNow    = elektroRp[elektroSet.mode];
  const elektroRpNett   = elektroRpNow.price * (1 - elektroRpNow.disc / 100);
  const elektroRes      = elektroD > 0 ? ELEKTRO.DNX6.calc(elektroSet.tests, workDays, elektroSet.mode, elektroRpNett) : null;
  const elektroTotR     = elektroRes ? elektroRes.cpt : 0;
  const elektroQc1Nett  = elektroCtrl.qc1.price * (1 - elektroCtrl.qc1.disc / 100);
  const elektroQc2Nett  = elektroCtrl.qc2.price * (1 - elektroCtrl.qc2.disc / 100);
  const elektroQc3Nett  = elektroCtrl.qc3.price * (1 - elektroCtrl.qc3.disc / 100);
  const elektroQcOh     = (elektroCtrl.free && elektroSet.tests > 0)
    ? (elektroQc1Nett + elektroQc2Nett + elektroQc3Nett) / elektroSet.tests
    : 0;
  const elektroBase     = elektroCapPt + elektroTotR + elektroQcOh;
  const elektroSell     = sellOf(elektroBase, elektroSet.markup);

  // ── Blood Gas computed ──
  const bgANett    = bgSet.price * (1 - bgSet.disc / 100);
  const bgCapex    = bgANett + bgUps + bgLis;
  const bgTotTest  = bgSet.kso * bgSet.tests;
  const bgCapPt    = bgTotTest > 0 ? bgCapex / bgTotTest : 0;
  const bgD        = workDays > 0 ? bgSet.tests / workDays : 0;
  const bgReal21d  = bgSet.tests / 30 * BLOODGAS.PT1000.stability;
  const bgCurCart  = BLOODGAS.PT1000.cartridges.find(c => c.id === bgSet.cartKey) || BLOODGAS.PT1000.cartridges[1];
  const bgKitCap   = bgCurCart.kit;
  const bgEffTests = Math.min(bgReal21d, bgKitCap);
  const bgResidue  = Math.max(0, bgKitCap - bgReal21d);
  const bgCartRp   = bgRpCart[bgSet.cartKey] || { price: bgCurCart.dp, disc: 0 };
  const bgCartNett = bgCartRp.price * (1 - bgCartRp.disc / 100);
  const bgHppKso   = bgKitCap > 0 ? bgCartNett / bgKitCap : 0;
  const bgHppCprr  = bgEffTests > 0 ? bgCartNett / bgEffTests : 0;
  const bgHppPerTest = bgMode === 'kso' ? bgHppKso : bgHppCprr;
  const bgQcNett   = bgRpQc.price * (1 - bgRpQc.disc / 100);
  const bgQcOh     = bgCtrl.free && bgEffTests > 0 ? bgQcNett * bgCtrl.n_qc / bgEffTests : 0;
  const bgBase     = bgCapPt + bgHppPerTest + (bgMode === 'cprr' ? bgQcOh : 0);
  const bgSell     = sellOf(bgBase, bgSet.markup);

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

  const updHplc     = (f, v) => setHplcSet(p => ({ ...p, [f]: v }));
  const updHplcRp   = (id, fld, v) => setHplcRp(p => ({ ...p, [id]: { ...p[id], [fld]: v } }));
  const updHplcCtrl = (fld, v) => setHplcCtrl(p => ({ ...p, [fld]: v }));
  const updHplcCtrlCal  = (fld, v) => setHplcCtrl(p => ({ ...p, cal:  { ...p.cal,  [fld]: v } }));
  const updHplcCtrlCtrl = (fld, v) => setHplcCtrl(p => ({ ...p, ctrl: { ...p.ctrl, [fld]: v } }));

  const updElektro    = (f, v) => setElektroSet(p => ({ ...p, [f]: v }));
  const updElektroRp  = (mode, fld, v) => setElektroRp(p => ({ ...p, [mode]: { ...p[mode], [fld]: v } }));
  const updElektroCtrl = (fld, v) => setElektroCtrl(p => ({ ...p, [fld]: v }));
  const updElektroQc  = (qid, fld, v) => setElektroCtrl(p => ({ ...p, [qid]: { ...p[qid], [fld]: v } }));

  const updBg     = (f, v) => setBgSet(p => ({ ...p, [f]: v }));
  const updBgCart = (id, fld, v) => setBgRpCart(p => ({ ...p, [id]: { ...p[id], [fld]: v } }));
  const updBgQc   = (fld, v) => setBgRpQc(p => ({ ...p, [fld]: v }));

  const updCCParam = (id, field, value) =>
    setCCParams(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p));
  const updCcParamTpm = (id, val) => setCcParamTpm(p => ({ ...p, [id]: val }));
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
          <img src="/logo.png" alt="Wahana Lifeline" className="hdr-logo" />
        </div>
        <div className="hdr-r">
          Dashboard KSO Simulator<br />Hematologi · Kimia Klinik · Crossmatch · CLIA · HPLC · Blood Gas · Elektrolit
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
            <MerkPill label="HPLC" color={CAT_COLORS.hplc}
              active={tab === 'hplc'} onClick={() => setTab('hplc')} />
            <MerkPill label="Elektrolit" color={CAT_COLORS.elektro}
              active={tab === 'elektro'} onClick={() => setTab('elektro')} />
            <MerkPill label="Blood Gas" color={CAT_COLORS.bg}
              active={tab === 'bg'} onClick={() => setTab('bg')} />
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

          {/* ══ HPLC INPUT ══ */}
          {tab === 'hplc' && (
            <>
              <div className="sel-row">
                <span className="sel-label">PRESET TEST/BLN</span>
                <div className="preset-grid">
                  {HPLC.AH600PRO.testPresets.map(v => (
                    <button key={v} onClick={() => updHplc('tests', v)}
                      className={`preset-btn${hplcSet.tests === v ? ' active' : ''}`}>
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
                    <NumInput value={hplcSet.price} onChange={v => updHplc('price', v)} prefix="Rp" />
                  </div>
                  <div className="field">
                    <label>Diskon Analyzer</label>
                    <NumInput value={hplcSet.disc} onChange={v => updHplc('disc', v)} suffix="%" />
                  </div>
                  <div className="comp">
                    <span className="cl">Nett Analyzer</span>
                    <span className="cv">{rp(hplcANett)}</span>
                  </div>
                  <div className="field">
                    <label>UPS</label>
                    <NumInput value={hplcUps} onChange={v => setHplcUps(v)} prefix="Rp" />
                  </div>
                  <div className="field">
                    <label>LIS</label>
                    <NumInput value={hplcLis} onChange={v => setHplcLis(v)} prefix="Rp" />
                  </div>
                  <div className="comp strong">
                    <span className="cl">Total CAPEX</span>
                    <span className="cv">{rp(hplcCapex)}</span>
                  </div>
                </div>

                {/* Parameter KSO */}
                <div className="inp-card">
                  <div className="inp-card-title">PARAMETER KSO</div>
                  <div className="field">
                    <label>Masa KSO</label>
                    <NumInput value={hplcSet.kso} onChange={v => updHplc('kso', v)} suffix="bln" />
                  </div>
                  <div className="field">
                    <label>Test / Bulan</label>
                    <NumInput value={hplcSet.tests} onChange={v => updHplc('tests', v)} />
                  </div>
                  <div className="field">
                    <label>Hari Kerja / Bulan</label>
                    <NumInput value={workDays} onChange={setWorkDays} suffix="hari" />
                  </div>
                  <div className="field">
                    <label>Margin / Markup</label>
                    <NumInput value={hplcSet.markup} onChange={v => updHplc('markup', v)} suffix="%" />
                  </div>
                  <div className="sep" />
                  <div className="comp">
                    <span className="cl">Test / Hari</span>
                    <span className="cv">{hplcD > 0 ? fmt(hplcD) : '—'}</span>
                  </div>
                  <div className="comp">
                    <span className="cl">Total Test KSO</span>
                    <span className="cv">{hplcTotTest > 0 ? fmt(hplcTotTest) : '—'}</span>
                  </div>
                  <div className="comp">
                    <span className="cl">CAPEX / Test</span>
                    <span className="cv" style={{ color: 'var(--red)' }}>{rp(hplcCapPt)}</span>
                  </div>
                  <div className="comp">
                    <span className="cl">Reagen / Test</span>
                    <span className="cv">{rp(hplcTotR)}</span>
                  </div>
                  {hplcCtrlOh > 0 && (
                    <div className="comp">
                      <span className="cl">Kontrol+Cal / Test</span>
                      <span className="cv" style={{ color: 'var(--amber)' }}>{rp(hplcCtrlOh)}</span>
                    </div>
                  )}
                  <div className="comp strong">
                    <span className="cl">Harga Jual / Test</span>
                    <span className="cv">{rp(hplcSell)}</span>
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
                    {HPLC.AH600PRO.reagents.map(r => {
                      const obj  = hplcRp[r.id] || { price: r.dp, disc: 0 };
                      const nett = obj.price * (1 - obj.disc / 100);
                      return (
                        <div key={r.id} className="rp-item">
                          <div className="rp-name" title={r.fn}>{r.fn}</div>
                          <div className="rp-pack">{r.pack}</div>
                          <div className="rp-row2">
                            <div className="field" style={{ margin: 0 }}>
                              <label>Harga Pricelist / Kit</label>
                              <NumInput value={obj.price} onChange={v => updHplcRp(r.id, 'price', v)} prefix="Rp" />
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Diskon</label>
                              <NumInput value={obj.disc} onChange={v => updHplcRp(r.id, 'disc', v)} suffix="%" />
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
                      const active = (opt === 'free') === hplcCtrl.free;
                      return (
                        <button key={opt}
                          className={`merk-pill${active ? ' merk-active' : ''}`}
                          style={active ? { borderColor: CAT_COLORS.hplc, color: CAT_COLORS.hplc } : {}}
                          onClick={() => updHplcCtrl('free', opt === 'free')}>
                          {opt === 'free' ? 'Free (Overhead)' : 'Beli (Pricelist)'}
                        </button>
                      );
                    })}
                  </div>
                  <div className="rp-list">
                    <div className="rp-item">
                      <div className="rp-name">HbA1c Calibrator Set</div>
                      <div className="rp-pack">1 mL×2 vial/set</div>
                      <div className="rp-row2">
                        <div className="field" style={{ margin: 0 }}>
                          <label>Harga Beli</label>
                          <NumInput value={hplcCtrl.cal.price} onChange={v => updHplcCtrlCal('price', v)} prefix="Rp" />
                        </div>
                        <div className="field" style={{ margin: 0 }}>
                          <label>Diskon</label>
                          <NumInput value={hplcCtrl.cal.disc} onChange={v => updHplcCtrlCal('disc', v)} suffix="%" />
                        </div>
                      </div>
                    </div>
                    <div className="rp-item">
                      <div className="rp-name">HbA1c Control</div>
                      <div className="rp-pack">0.5 mL×2 vial/set</div>
                      <div className="rp-row2">
                        <div className="field" style={{ margin: 0 }}>
                          <label>Harga Beli</label>
                          <NumInput value={hplcCtrl.ctrl.price} onChange={v => updHplcCtrlCtrl('price', v)} prefix="Rp" />
                        </div>
                        <div className="field" style={{ margin: 0 }}>
                          <label>Diskon</label>
                          <NumInput value={hplcCtrl.ctrl.disc} onChange={v => updHplcCtrlCtrl('disc', v)} suffix="%" />
                        </div>
                      </div>
                    </div>
                  </div>
                  {hplcRes && hplcD > 0 && (
                    <div style={{ borderTop: '2px solid var(--bdr)', marginTop: 10, paddingTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 6 }}>
                        RUNNING COST SUMMARY
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: 'var(--text-2)' }}>Total Reagen / Test</span>
                        <span style={{ fontWeight: 600 }}>{rp(hplcTotR)}</span>
                      </div>
                      {hplcCtrlOh > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: 'var(--text-2)' }}>Kontrol + Cal / Test</span>
                          <span style={{ fontWeight: 600, color: 'var(--amber)' }}>{rp(hplcCtrlOh)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-2)' }}>+ CAPEX / Test</span>
                        <span style={{ fontWeight: 600, color: 'var(--red)' }}>{rp(hplcCapPt)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid var(--bdr)', paddingTop: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--blue)' }}>Cost / Test KSO CPRR</span>
                        <span style={{ fontWeight: 900, color: 'var(--blue)', fontSize: 16 }}>{rp(hplcSell)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ══ ELEKTROLIT INPUT ══ */}
          {tab === 'elektro' && (
            <>
              <div className="sel-row">
                <span className="sel-label">TIPE REAGEN</span>
                {['cartridge', 'bottle'].map(m => (
                  <MerkPill key={m}
                    label={ELEKTRO.DNX6.modes[m].label}
                    color={CAT_COLORS.elektro}
                    active={elektroSet.mode === m}
                    onClick={() => updElektro('mode', m)} />
                ))}
              </div>

              <div className="sel-row">
                <span className="sel-label">PRESET TEST/BLN</span>
                <div className="preset-grid">
                  {ELEKTRO.DNX6.testPresets.map(v => (
                    <button key={v} onClick={() => updElektro('tests', v)}
                      className={`preset-btn${elektroSet.tests === v ? ' active' : ''}`}>
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
                    <NumInput value={elektroSet.price} onChange={v => updElektro('price', v)} prefix="Rp" />
                  </div>
                  <div className="field">
                    <label>Diskon Analyzer</label>
                    <NumInput value={elektroSet.disc} onChange={v => updElektro('disc', v)} suffix="%" />
                  </div>
                  <div className="comp">
                    <span className="cl">Nett Analyzer</span>
                    <span className="cv">{rp(elektroANett)}</span>
                  </div>
                  <div className="field">
                    <label>UPS</label>
                    <NumInput value={elektroUps} onChange={setElektroUps} prefix="Rp" />
                  </div>
                  <div className="field">
                    <label>LIS</label>
                    <NumInput value={elektroLis} onChange={setElektroLis} prefix="Rp" />
                  </div>
                  <div className="comp strong">
                    <span className="cl">Total CAPEX</span>
                    <span className="cv">{rp(elektroCapex)}</span>
                  </div>
                </div>

                {/* Parameter KSO */}
                <div className="inp-card">
                  <div className="inp-card-title">PARAMETER KSO</div>
                  <div className="field">
                    <label>Masa KSO</label>
                    <NumInput value={elektroSet.kso} onChange={v => updElektro('kso', v)} suffix="bln" />
                  </div>
                  <div className="field">
                    <label>Test / Bulan</label>
                    <NumInput value={elektroSet.tests} onChange={v => updElektro('tests', v)} />
                  </div>
                  <div className="field">
                    <label>Hari Kerja / Bulan</label>
                    <NumInput value={workDays} onChange={setWorkDays} suffix="hari" />
                  </div>
                  <div className="field">
                    <label>Margin / Markup</label>
                    <NumInput value={elektroSet.markup} onChange={v => updElektro('markup', v)} suffix="%" />
                  </div>
                  <div className="sep" />
                  <div className="comp">
                    <span className="cl">Test / Hari</span>
                    <span className="cv">{elektroD > 0 ? fmt(elektroD) : '—'}</span>
                  </div>
                  <div className="comp">
                    <span className="cl">Total Test KSO</span>
                    <span className="cv">{elektroTotTest > 0 ? fmt(elektroTotTest) : '—'}</span>
                  </div>
                  <div className="comp">
                    <span className="cl">CAPEX / Test</span>
                    <span className="cv" style={{ color: 'var(--red)' }}>{rp(elektroCapPt)}</span>
                  </div>
                  <div className="comp">
                    <span className="cl">Reagen / Test</span>
                    <span className="cv">{rp(elektroTotR)}</span>
                  </div>
                  {elektroQcOh > 0 && (
                    <div className="comp">
                      <span className="cl">QC / Test</span>
                      <span className="cv" style={{ color: 'var(--amber)' }}>{rp(elektroQcOh)}</span>
                    </div>
                  )}
                  <div className="comp strong">
                    <span className="cl">Harga Jual / Test</span>
                    <span className="cv">{rp(elektroSell)}</span>
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
                    {(() => {
                      const m = elektroSet.mode;
                      const modeInfo = ELEKTRO.DNX6.modes[m];
                      const obj = elektroRp[m];
                      const nett = obj.price * (1 - obj.disc / 100);
                      const packLabel = m === 'cartridge' ? '650 mL Cal A / cartridge' : '3×450 mL Cal A + 1 Cal B / set';
                      return (
                        <div className="rp-item">
                          <div className="rp-name">{modeInfo.label} Reagent</div>
                          <div className="rp-pack">{packLabel}</div>
                          <div className="rp-row2">
                            <div className="field" style={{ margin: 0 }}>
                              <label>Harga Pricelist / {m === 'cartridge' ? 'Cartridge' : 'Set'}</label>
                              <NumInput value={obj.price} onChange={v => updElektroRp(m, 'price', v)} prefix="Rp" />
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Diskon</label>
                              <NumInput value={obj.disc} onChange={v => updElektroRp(m, 'disc', v)} suffix="%" />
                            </div>
                          </div>
                          <div className="rp-nett">Nett: <span>{rp(nett)}</span></div>
                          {elektroRes && (
                            <div className="rp-nett" style={{ color: 'var(--text-3)' }}>
                              {fmt(elektroRes.runDays)} hari/pack · {fmt(elektroRes.totalTests)} test/pack
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* QC Section */}
                  <div className="sep" style={{ margin: '10px 0' }} />
                  <div className="inp-card-title" style={{ marginBottom: 8 }}>QC SOLUTION</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {['free', 'beli'].map(opt => {
                      const active = (opt === 'free') === elektroCtrl.free;
                      return (
                        <button key={opt}
                          className={`merk-pill${active ? ' merk-active' : ''}`}
                          style={active ? { borderColor: CAT_COLORS.elektro, color: CAT_COLORS.elektro } : {}}
                          onClick={() => updElektroCtrl('free', opt === 'free')}>
                          {opt === 'free' ? 'Free (Overhead)' : 'Beli (Pricelist)'}
                        </button>
                      );
                    })}
                  </div>
                  <div className="rp-list">
                    {ELEKTRO.DNX6.qcItems.map(q => {
                      const obj = elektroCtrl[q.id];
                      const nett = obj.price * (1 - obj.disc / 100);
                      return (
                        <div key={q.id} className="rp-item">
                          <div className="rp-name">{q.fn}</div>
                          <div className="rp-pack">{q.pack}</div>
                          <div className="rp-row2">
                            <div className="field" style={{ margin: 0 }}>
                              <label>Harga Beli</label>
                              <NumInput value={obj.price} onChange={v => updElektroQc(q.id, 'price', v)} prefix="Rp" />
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Diskon</label>
                              <NumInput value={obj.disc} onChange={v => updElektroQc(q.id, 'disc', v)} suffix="%" />
                            </div>
                          </div>
                          <div className="rp-nett">Nett: <span>{rp(nett)}</span></div>
                        </div>
                      );
                    })}
                  </div>

                  {elektroRes && elektroD > 0 && (
                    <div style={{ borderTop: '2px solid var(--bdr)', marginTop: 10, paddingTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 6 }}>
                        RUNNING COST SUMMARY
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: 'var(--text-2)' }}>Total Reagen / Test</span>
                        <span style={{ fontWeight: 600 }}>{rp(elektroTotR)}</span>
                      </div>
                      {elektroQcOh > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: 'var(--text-2)' }}>QC / Test</span>
                          <span style={{ fontWeight: 600, color: 'var(--amber)' }}>{rp(elektroQcOh)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-2)' }}>+ CAPEX / Test</span>
                        <span style={{ fontWeight: 600, color: 'var(--red)' }}>{rp(elektroCapPt)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid var(--bdr)', paddingTop: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--blue)' }}>Cost / Test KSO CPRR</span>
                        <span style={{ fontWeight: 900, color: 'var(--blue)', fontSize: 16 }}>{rp(elektroSell)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ══ BLOOD GAS INPUT ══ */}
          {tab === 'bg' && (
            <>
              <div className="sel-row">
                <span className="sel-label">PRESET TEST/BLN</span>
                <div className="preset-grid">
                  {BLOODGAS.PT1000.testPresets.map(v => (
                    <button key={v} onClick={() => updBg('tests', v)}
                      className={`preset-btn${bgSet.tests === v ? ' active' : ''}`}>
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
                    <NumInput value={bgSet.price} onChange={v => updBg('price', v)} prefix="Rp" />
                  </div>
                  <div className="field">
                    <label>Diskon Analyzer</label>
                    <NumInput value={bgSet.disc} onChange={v => updBg('disc', v)} suffix="%" />
                  </div>
                  <div className="comp">
                    <span className="cl">Nett Analyzer</span>
                    <span className="cv">{rp(bgANett)}</span>
                  </div>
                  <div className="field">
                    <label>UPS</label>
                    <NumInput value={bgUps} onChange={v => setBgUps(v)} prefix="Rp" />
                  </div>
                  <div className="field">
                    <label>LIS</label>
                    <NumInput value={bgLis} onChange={v => setBgLis(v)} prefix="Rp" />
                  </div>
                  <div className="comp strong">
                    <span className="cl">Total CAPEX</span>
                    <span className="cv">{rp(bgCapex)}</span>
                  </div>
                </div>

                {/* Parameter KSO */}
                <div className="inp-card">
                  <div className="inp-card-title">PARAMETER KSO</div>
                  <div className="field">
                    <label>Masa KSO</label>
                    <NumInput value={bgSet.kso} onChange={v => updBg('kso', v)} suffix="bln" />
                  </div>
                  <div className="field">
                    <label>Test / Bulan</label>
                    <NumInput value={bgSet.tests} onChange={v => updBg('tests', v)} />
                  </div>
                  <div className="field">
                    <label>Hari Kerja / Bulan</label>
                    <NumInput value={workDays} onChange={setWorkDays} suffix="hari" />
                  </div>
                  <div className="field">
                    <label>Margin / Markup</label>
                    <NumInput value={bgSet.markup} onChange={v => updBg('markup', v)} suffix="%" />
                  </div>

                  <div className="sep" />
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.5px' }}>SKEMA KERJASAMA</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {[{ id: 'kso', label: 'Faskes Beli' }, { id: 'cprr', label: 'CPRR' }].map(m => (
                      <button key={m.id}
                        className={`merk-pill${bgMode === m.id ? ' merk-active' : ''}`}
                        style={bgMode === m.id ? { borderColor: CAT_COLORS.bg, color: CAT_COLORS.bg } : {}}
                        onClick={() => setBgMode(m.id)}>
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.5px' }}>PILIH CARTRIDGE</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                    {BLOODGAS.PT1000.cartridges.map(c => (
                      <button key={c.id}
                        className={`merk-pill${bgSet.cartKey === c.id ? ' merk-active' : ''}`}
                        style={bgSet.cartKey === c.id ? { borderColor: CAT_COLORS.bg, color: CAT_COLORS.bg } : {}}
                        onClick={() => updBg('cartKey', c.id)}>
                        <span className="merk-dot" style={{ background: CAT_COLORS.bg, opacity: bgSet.cartKey === c.id ? 1 : 0.3 }} />
                        {c.pack}
                      </button>
                    ))}
                  </div>

                  <div className="sep" />
                  <div className="comp">
                    <span className="cl">Open Stability</span>
                    <span className="cv" style={{ color: 'var(--amber)' }}>{BLOODGAS.PT1000.stability} hari</span>
                  </div>
                  <div className="comp">
                    <span className="cl">Real Test / 21 Hari</span>
                    <span className="cv" style={{ color: 'var(--blue)' }}>{bgSet.tests > 0 ? fmt(Math.round(bgReal21d)) : '—'}</span>
                  </div>
                  {bgResidue > 0 && bgSet.tests > 0 && (
                    <div className="comp">
                      <span className="cl">Residu (terbuang)</span>
                      <span className="cv" style={{ color: '#B45309' }}>{fmt(Math.round(bgResidue))} test</span>
                    </div>
                  )}
                  <div className="comp">
                    <span className="cl">Total Test KSO</span>
                    <span className="cv">{bgTotTest > 0 ? fmt(bgTotTest) : '—'}</span>
                  </div>
                  <div className="comp">
                    <span className="cl">CAPEX / Test</span>
                    <span className="cv" style={{ color: 'var(--red)' }}>{rp(bgCapPt)}</span>
                  </div>
                  <div className="comp">
                    <span className="cl">HPP Cartridge / Test</span>
                    <span className="cv">{bgSet.tests > 0 ? rp(bgHppPerTest) : '—'}</span>
                  </div>
                  {bgQcOh > 0 && (
                    <div className="comp">
                      <span className="cl">QC / Test</span>
                      <span className="cv" style={{ color: 'var(--amber)' }}>{rp(bgQcOh)}</span>
                    </div>
                  )}
                  <div className="comp strong">
                    <span className="cl">Harga Jual / Test</span>
                    <span className="cv">{bgSet.tests > 0 ? rp(bgSell) : '—'}</span>
                  </div>
                  <div className="sep" style={{ marginTop: 12 }} />
                  <button className="goto-btn" onClick={() => setPage('result')}>
                    Lihat Hasil Perhitungan ▶
                  </button>
                </div>

                {/* Harga Cartridge & QC */}
                <div className="inp-card inp-card-reagent">
                  <div className="inp-card-title">HARGA CARTRIDGE &amp; QC</div>
                  <div className="rp-list">
                    {BLOODGAS.PT1000.cartridges.map(c => {
                      const rpObj = bgRpCart[c.id] || { price: c.dp, disc: 0 };
                      const nett  = rpObj.price * (1 - rpObj.disc / 100);
                      const isActive = bgSet.cartKey === c.id;
                      return (
                        <div key={c.id} className="rp-item" style={{ opacity: isActive ? 1 : 0.65, cursor: 'pointer' }}
                          onClick={() => updBg('cartKey', c.id)}>
                          <div className="rp-name" title={c.fn}>
                            {c.fn}
                            {isActive && <span style={{ marginLeft: 6, fontSize: 10, color: CAT_COLORS.bg, fontWeight: 700 }}>● AKTIF</span>}
                          </div>
                          <div className="rp-pack">{c.pack}</div>
                          <div className="rp-row2">
                            <div className="field" style={{ margin: 0 }}>
                              <label>Harga Beli</label>
                              <NumInput value={rpObj.price} onChange={v => updBgCart(c.id, 'price', v)} prefix="Rp" />
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label>Diskon</label>
                              <NumInput value={rpObj.disc} onChange={v => updBgCart(c.id, 'disc', v)} suffix="%" />
                            </div>
                          </div>
                          <div className="rp-nett">Nett: <span>{rp(nett)}</span></div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="sep" style={{ margin: '10px 0' }} />
                  <div className="inp-card-title" style={{ marginBottom: 8 }}>QC CONTROL</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {['free', 'beli'].map(opt => {
                      const active = (opt === 'free') === bgCtrl.free;
                      return (
                        <button key={opt}
                          className={`merk-pill${active ? ' merk-active' : ''}`}
                          style={active ? { borderColor: CAT_COLORS.bg, color: CAT_COLORS.bg } : {}}
                          onClick={() => setBgCtrl(s => ({ ...s, free: opt === 'free' }))}>
                          {opt === 'free' ? 'Free (Overhead)' : 'Beli (Faskes)'}
                        </button>
                      );
                    })}
                  </div>
                  <div className="rp-list">
                    <div className="rp-item">
                      <div className="rp-name">{BLOODGAS.PT1000.qc.fn}</div>
                      <div className="rp-pack">{BLOODGAS.PT1000.qc.pack}</div>
                      <div className="rp-row2">
                        <div className="field" style={{ margin: 0 }}>
                          <label>Harga Beli</label>
                          <NumInput value={bgRpQc.price} onChange={v => updBgQc('price', v)} prefix="Rp" disabled={!bgCtrl.free} />
                        </div>
                        <div className="field" style={{ margin: 0 }}>
                          <label>Diskon</label>
                          <NumInput value={bgRpQc.disc} onChange={v => updBgQc('disc', v)} suffix="%" disabled={!bgCtrl.free} />
                        </div>
                      </div>
                      <div className="rp-nett">Nett: <span>{rp(bgQcNett)}</span></div>
                    </div>
                  </div>
                  {bgCtrl.free && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Kit QC / siklus 21 hari</span>
                      <SmallNumInput value={bgCtrl.n_qc} onChange={v => setBgCtrl(s => ({ ...s, n_qc: v }))} tiny />
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>kit</span>
                    </div>
                  )}

                  {bgSet.tests > 0 && (
                    <div style={{ borderTop: '2px solid var(--bdr)', marginTop: 10, paddingTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 6 }}>
                        RUNNING COST SUMMARY
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: 'var(--text-2)' }}>HPP Cartridge / Test</span>
                        <span style={{ fontWeight: 600 }}>{rp(bgHppPerTest)}</span>
                      </div>
                      {bgQcOh > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: 'var(--text-2)' }}>QC / Test</span>
                          <span style={{ fontWeight: 600, color: 'var(--amber)' }}>{rp(bgQcOh)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-2)' }}>+ CAPEX / Test</span>
                        <span style={{ fontWeight: 600, color: 'var(--red)' }}>{rp(bgCapPt)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid var(--bdr)', paddingTop: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--blue)' }}>
                          Cost / Test {bgMode === 'cprr' ? 'KSO CPRR' : 'KSO'}
                        </span>
                        <span style={{ fontWeight: 900, color: 'var(--blue)', fontSize: 16 }}>{rp(bgSell)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
              capexBreakdown={{ alat: aNett, backup: bNett, ups, lis }}
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
                capexBreakdown={{ alat: aNett, backup: bNett, ups, lis }}
                ccParamTpm={ccParamTpm}
                updCcParamTpm={updCcParamTpm}
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
              capexBreakdown={{ alat: xmANett, backup: 0, ups: xmUps, lis: xmLis }}
            />
          ) : tab === 'clia' ? (
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
              capexBreakdown={{ alat: cliaANett, backup: 0, ups: cliaUps, lis: cliaLis }}
            />
          ) : tab === 'hplc' ? (
            <HPLCResult
              hplcRes={hplcRes}
              hplcCapPt={hplcCapPt}
              hplcTotTest={hplcTotTest}
              hplcSet={hplcSet}
              hplcD={hplcD}
              hplcRp={hplcRp}
              hplcCtrlOh={hplcCtrlOh}
              hplcSell={hplcSell}
              totCap={hplcCapex}
              workDays={workDays}
              salesName={salesName} faskesName={faskesName} kotaKab={kotaKab} kompetitor={kompetitor}
              capexBreakdown={{ alat: hplcANett, backup: 0, ups: hplcUps, lis: hplcLis }}
            />
          ) : tab === 'elektro' ? (
            <ElektroResult
              elektroRes={elektroRes}
              elektroCapPt={elektroCapPt}
              elektroTotTest={elektroTotTest}
              elektroSet={elektroSet}
              elektroD={elektroD}
              elektroRp={elektroRp}
              elektroQcOh={elektroQcOh}
              elektroSell={elektroSell}
              totCap={elektroCapex}
              workDays={workDays}
              salesName={salesName} faskesName={faskesName} kotaKab={kotaKab} kompetitor={kompetitor}
              capexBreakdown={{ alat: elektroANett, backup: 0, ups: elektroUps, lis: elektroLis }}
            />
          ) : (
            <BgResult
              bgMode={bgMode}
              bgSet={bgSet}
              bgReal21d={bgReal21d}
              bgResidue={bgResidue}
              bgKitCap={bgKitCap}
              bgEffTests={bgEffTests}
              bgHppKso={bgHppKso}
              bgHppCprr={bgHppCprr}
              bgCartNett={bgCartNett}
              bgQcOh={bgQcOh}
              bgQcNett={bgQcNett}
              bgCapPt={bgCapPt}
              bgBase={bgBase}
              bgSell={bgSell}
              bgTotTest={bgTotTest}
              bgD={bgD}
              bgCtrl={bgCtrl}
              totCap={bgCapex}
              workDays={workDays}
              salesName={salesName} faskesName={faskesName} kotaKab={kotaKab} kompetitor={kompetitor}
              capexBreakdown={{ alat: bgANett, backup: 0, ups: bgUps, lis: bgLis }}
            />
          )}
        </div>
      </div>

      </div>

      {/* ── Mobile bottom category nav — outside data-page wrapper to escape its stacking context ── */}
      <nav className="mob-nav-bar">
        {[
          { key: 'hemato',  label: 'Hemato',   color: CAT_COLORS.hemato },
          { key: 'cc',      label: 'CC',       color: CAT_COLORS.cc },
          { key: 'xm',      label: 'XM',       color: CAT_COLORS.xm },
          { key: 'clia',    label: 'CLIA',     color: CAT_COLORS.clia },
          { key: 'hplc',    label: 'HPLC',     color: CAT_COLORS.hplc },
          { key: 'elektro', label: 'Elektro',  color: CAT_COLORS.elektro },
          { key: 'bg',      label: 'Blood Gas', color: CAT_COLORS.bg },
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
