// PDF print utility — A4 portrait via browser print dialog

const F = (v) => {
  if (!isFinite(v) || isNaN(v) || v === null || v === undefined) return '—';
  return Math.round(v).toLocaleString('id-ID');
};
const Rp = (v) => {
  if (!isFinite(v) || isNaN(v) || v === null || v === undefined) return '—';
  const r = Math.round(v);
  if (r === 0) return 'Rp 0';
  return 'Rp ' + r.toLocaleString('id-ID');
};
const todayStr = () => new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

function esc(s) {
  return String(s ?? '—')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const BASE_CSS = `
@page { size: A4 portrait; margin: 12mm 15mm; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 10pt;
  color: #1A2733;
  background: #fff;
}
/* ── Header ── */
.hdr {
  background: #1C3F6E;
  padding: 14px 16px 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.hdr-title { font-size: 13pt; font-weight: 800; color: #fff; letter-spacing: 0.3px; }
.hdr-sub { font-size: 7.5pt; color: rgba(255,255,255,0.6); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3px; }
.hdr-brand { font-size: 11pt; font-weight: 700; color: #fff; text-align: right; }
.hdr-date { font-size: 8pt; color: rgba(255,255,255,0.6); text-align: right; margin-top: 2px; }
/* ── Meta strip ── */
.meta {
  background: #EEF2F7;
  border-bottom: 1px solid #C9D4E0;
  padding: 7px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.meta-item { display: flex; flex-direction: column; gap: 1px; }
.meta-item:not(:last-child) { border-right: 1px solid #C9D4E0; padding-right: 12px; margin-right: 12px; }
.meta-lbl { font-size: 7pt; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #7A90A8; }
.meta-val { font-size: 9.5pt; font-weight: 600; color: #1C3F6E; }
/* ── Body ── */
.body { padding: 13px 16px 14px; display: flex; flex-direction: column; gap: 12px; }
/* ── Section ── */
.sec-hdr { display: flex; align-items: center; gap: 7px; margin-bottom: 7px; }
.sec-bar { width: 3px; height: 12px; border-radius: 2px; flex-shrink: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sec-bar.navy { background: #1C3F6E; }
.sec-bar.green { background: #2E7D52; }
.sec-bar.amber { background: #C07800; }
.sec-ttl { font-size: 7.5pt; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
.sec-ttl.navy { color: #3A5272; }
.sec-ttl.green { color: #1B5E35; }
.sec-ttl.amber { color: #92400E; }
/* ── KSO grid ── */
.kso-grid {
  display: grid;
  grid-template-columns: minmax(0,1fr) minmax(0,1fr);
  border: 1px solid #DDE4ED;
  border-radius: 4px;
  overflow: hidden;
}
.kso-row { display: contents; }
.kso-row > div { padding: 4px 9px; border-bottom: 1px solid #EDF1F6; font-size: 9.5pt; }
.kso-row:last-child > div { border-bottom: none; }
.kso-lbl { color: #526070; font-weight: 500; border-right: 1px solid #DDE4ED; background: #F8FAFC; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.kso-val { color: #1A2A3A; font-weight: 600; font-variant-numeric: tabular-nums; }
/* ── CPRR rows ── */
.cprr-tbl { border: 1px solid #DDE4ED; border-radius: 4px; overflow: hidden; }
.cprr-row { display: flex; border-bottom: 1px solid #EDF1F6; }
.cprr-row:last-child { border-bottom: none; }
.cprr-row .cl { flex: 1; padding: 4px 9px; font-size: 9.5pt; color: #526070; font-weight: 500; background: #F8FAFC; border-right: 1px solid #DDE4ED; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.cprr-row .cv { width: 130px; padding: 4px 11px; font-size: 9.5pt; color: #1A2A3A; font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
.cprr-row.hi { background: #FFFBEB; border-top: 1.5px solid #F59E0B; border-bottom: 1.5px solid #F59E0B; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.cprr-row.hi .cl { background: #FFFBEB; color: #78350F; font-weight: 800; font-size: 11pt; }
.cprr-row.hi .cv { color: #78350F; font-weight: 800; font-size: 13pt; }
/* ── Table ── */
table { width: 100%; border-collapse: collapse; border: 1px solid #DDE4ED; border-radius: 4px; overflow: hidden; font-variant-numeric: tabular-nums; }
thead tr { background: #F0F4F9; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
th { padding: 5px 9px; font-size: 7.5pt; font-weight: 700; letter-spacing: 0.7px; text-transform: uppercase; color: #52697A; border-bottom: 1.5px solid #C9D4E0; text-align: left; }
th.r { text-align: right; }
td { padding: 4px 9px; font-size: 9.5pt; color: #1A2A3A; border-bottom: 1px solid #EDF1F6; vertical-align: middle; }
td.r { text-align: right; font-weight: 500; }
td.lbl { font-weight: 600; }
td.muted { color: #64748B; font-weight: 400; }
tbody tr:last-child td { border-bottom: none; }
/* panel header row inside table */
tr.panel-hdr td { background: #F0F4F9; font-size: 8pt; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #3A5272; padding: 4px 9px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
/* ── Info kompetitor ── */
.info-k { background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 4px; padding: 7px 11px; display: flex; gap: 10px; align-items: baseline; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.info-k-lbl { font-size: 7pt; font-weight: 800; letter-spacing: 1.3px; text-transform: uppercase; color: #6D28D9; white-space: nowrap; }
.info-k-val { font-size: 9.5pt; color: #4C3A7A; font-style: italic; }
/* ── Footer ── */
.footer { border-top: 1px solid #E2E8F0; padding: 7px 16px; display: flex; justify-content: space-between; margin-top: auto; }
.footer span { font-size: 7.5pt; color: #94A3B8; }
`;

function openPrint(html) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Popup diblokir browser. Izinkan popup di address bar untuk mencetak PDF.');
    return;
  }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 600);
}

function ksoRows(pairs) {
  const rows = [];
  for (let i = 0; i < pairs.length; i += 2) {
    const [la, va] = pairs[i];
    const [lb, vb] = pairs[i + 1] || ['', ''];
    rows.push(`
      <div class="kso-row">
        <div class="kso-lbl">${esc(la)}</div>
        <div class="kso-val">${esc(va)}</div>
      </div>
      <div class="kso-row">
        <div class="kso-lbl">${esc(lb)}</div>
        <div class="kso-val">${esc(vb)}</div>
      </div>`);
  }
  return rows.join('');
}

// ─── HEMATOLOGI ──────────────────────────────────────────────────────────────

export function printHemato({
  analyzerName, backupLabel, totCap, kso, testsPerMonth, workDays,
  markup, qcFree, capPt, totR, ctrlOverhead, sell, totTest,
  reagentRows,
  salesName = '', faskesName = '', kotaKab = '', kompetitor = '',
}) {
  const d = todayStr();
  const base = capPt + totR + (ctrlOverhead || 0);

  const ksoPairs = [
    ['Nama Analyzer', analyzerName],
    ['Total CAPEX', Rp(totCap)],
    ...(backupLabel ? [['Backup Analyzer', backupLabel], ['Masa KSO', kso + ' bulan']] : [['Masa KSO', kso + ' bulan'], ['Test / Bulan', F(testsPerMonth) + ' test']]),
    ...(!backupLabel ? [['Total Target Test KSO', F(totTest) + ' test'], ['Hari Kerja / Bulan', workDays + ' hari']] : [['Test / Bulan', F(testsPerMonth) + ' test'], ['Total Target Test KSO', F(totTest) + ' test']]),
    ...(backupLabel ? [['Hari Kerja / Bulan', workDays + ' hari'], ['Margin / Markup', markup + '%']] : [['Margin / Markup', markup + '%'], ['QC & Kalibrator', qcFree ? 'FREE — supplier' : 'PAID — mandiri']]),
    ...(backupLabel ? [['QC & Kalibrator', qcFree ? 'FREE — supplier' : 'PAID — mandiri'], ['', '']] : []),
  ];

  const reagenHtml = reagentRows.map(r => `
    <tr>
      <td class="lbl">${esc(r.fn)}</td>
      <td class="muted">${esc(r.pack)}</td>
      <td class="r">${Rp(r.contribTest)}</td>
      <td class="r">${r.excelKit > 0 ? Rp(r.excelKit) : '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8">
<title>KSO CPRR — ${esc(analyzerName)}</title>
<style>${BASE_CSS}</style></head>
<body>
<div class="hdr">
  <div><div class="hdr-title">KSO CPRR — HEMATOLOGI</div><div class="hdr-sub">Cost Per Result Report · Kerja Sama Operasional</div></div>
  <div><div class="hdr-brand">Wahana Lifeline</div><div class="hdr-date">Tanggal: ${d}</div></div>
</div>
<div class="meta">
  <div class="meta-item"><span class="meta-lbl">Nama Sales</span><span class="meta-val">${esc(salesName || '—')}</span></div>
  <div class="meta-item"><span class="meta-lbl">Nama Faskes</span><span class="meta-val">${esc(faskesName || '—')}</span></div>
  <div class="meta-item"><span class="meta-lbl">Kota / Kab</span><span class="meta-val">${esc(kotaKab || '—')}</span></div>
</div>
<div class="body">

  <div>
    <div class="sec-hdr"><div class="sec-bar navy"></div><span class="sec-ttl navy">Ringkasan KSO</span></div>
    <div class="kso-grid">${ksoRows(ksoPairs)}</div>
  </div>

  <div>
    <div class="sec-hdr"><div class="sec-bar green"></div><span class="sec-ttl green">CPRR — Cost Per Test</span></div>
    <div class="cprr-tbl">
      <div class="cprr-row"><span class="cl">CAPEX / Test</span><span class="cv">${Rp(capPt)}</span></div>
      <div class="cprr-row"><span class="cl">Reagen / Test</span><span class="cv">${Rp(totR)}</span></div>
      ${ctrlOverhead > 0 ? `<div class="cprr-row"><span class="cl">QC + Kalibrasi / Test</span><span class="cv">${Rp(ctrlOverhead)}</span></div>` : ''}
      <div class="cprr-row"><span class="cl">Base Cost / Test</span><span class="cv">${Rp(base)}</span></div>
      <div class="cprr-row"><span class="cl">Markup ${markup}%</span><span class="cv">${Rp(sell - base)}</span></div>
      <div class="cprr-row hi"><span class="cl">CPRR (Harga Jual / Test)</span><span class="cv">${Rp(sell)}</span></div>
    </div>
  </div>

  <div>
    <div class="sec-hdr"><div class="sec-bar amber"></div><span class="sec-ttl amber">Rincian Reagen</span></div>
    <table>
      <thead><tr><th>Nama Barang</th><th>Kemasan</th><th class="r">Kontrib / Test</th><th class="r">Sell / Kit KSO</th></tr></thead>
      <tbody>${reagenHtml}</tbody>
    </table>
  </div>

  <div class="info-k">
    <span class="info-k-lbl">Informasi Kompetitor</span>
    <span class="info-k-val">${esc(kompetitor || '—')}</span>
  </div>

</div>
<div class="footer">
  <span>Wahana Lifeline · KSO CPRR Hematologi · ${esc(analyzerName)}</span>
  <span>Dokumen ini bersifat konfidensial</span>
</div>
</body></html>`;
  openPrint(html);
}

// ─── KIMIA KLINIK ─────────────────────────────────────────────────────────────

export function printCC({
  analyzerName, backupLabel, totCap, kso, testsPerMonth, workDays,
  markup, capPt, consumablePerTest, totalOverhead, hasOverhead,
  avgSellCpt, totTest,
  paramRows, consItems, qcRows,
  salesName = '', faskesName = '', kotaKab = '', kompetitor = '',
}) {
  const d = todayStr();

  const ksoPairs = [
    ['Nama Analyzer', analyzerName],
    ['Total CAPEX', Rp(totCap)],
    ...(backupLabel ? [['Backup Analyzer', backupLabel]] : []),
    ['Masa KSO', kso + ' bulan'],
    ['Sampel / Bulan', F(testsPerMonth) + ' sampel'],
    ['Total Target Test KSO', F(totTest) + ' test'],
    ['Hari Kerja / Bulan', workDays + ' hari'],
    ['Margin / Markup', markup + '%'],
  ];

  // Group params by panel
  const panelMap = {};
  paramRows.forEach(r => {
    if (!panelMap[r.panel]) panelMap[r.panel] = [];
    panelMap[r.panel].push(r);
  });

  const paramHtml = Object.entries(panelMap).map(([panel, rows]) => `
    <tr class="panel-hdr"><td colspan="5">${esc(panel)}</td></tr>
    ${rows.map(r => `<tr>
      <td class="lbl">${esc(r.name)}</td>
      <td class="muted">${esc(r.pack)}</td>
      <td class="r">${r.testsPerKit ? F(r.testsPerKit) + 'T' : '—'}</td>
      <td class="r">${Rp(r.sellTest)}</td>
      <td class="r">${Rp(r.sellKit)}</td>
    </tr>`).join('')}`).join('');

  const consHtml = (consItems || []).map(c =>
    `<tr><td class="lbl">${esc(c.name)}</td><td class="r" colspan="4">${Rp(c.cpt)}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8">
<title>KSO CPRR — ${esc(analyzerName)}</title>
<style>${BASE_CSS}</style></head>
<body>
<div class="hdr">
  <div><div class="hdr-title">KSO CPRR — KIMIA KLINIK</div><div class="hdr-sub">Cost Per Result Report · Kerja Sama Operasional</div></div>
  <div><div class="hdr-brand">Wahana Lifeline</div><div class="hdr-date">Tanggal: ${d}</div></div>
</div>
<div class="meta">
  <div class="meta-item"><span class="meta-lbl">Nama Sales</span><span class="meta-val">${esc(salesName || '—')}</span></div>
  <div class="meta-item"><span class="meta-lbl">Nama Faskes</span><span class="meta-val">${esc(faskesName || '—')}</span></div>
  <div class="meta-item"><span class="meta-lbl">Kota / Kab</span><span class="meta-val">${esc(kotaKab || '—')}</span></div>
</div>
<div class="body">

  <div>
    <div class="sec-hdr"><div class="sec-bar navy"></div><span class="sec-ttl navy">Ringkasan KSO</span></div>
    <div class="kso-grid">${ksoRows(ksoPairs)}</div>
  </div>

  <div>
    <div class="sec-hdr"><div class="sec-bar green"></div><span class="sec-ttl green">CPRR — Rata-rata Cost Per Test</span></div>
    <div class="cprr-tbl">
      <div class="cprr-row"><span class="cl">CAPEX / Test</span><span class="cv">${Rp(capPt)}</span></div>
      <div class="cprr-row"><span class="cl">Consumable / Test</span><span class="cv">${Rp(consumablePerTest)}</span></div>
      ${hasOverhead ? `<div class="cprr-row"><span class="cl">QC + Kalibrasi / Test</span><span class="cv">${Rp(totalOverhead)}</span></div>` : ''}
      <div class="cprr-row hi"><span class="cl">CPRR Rata-rata (Harga Jual / Test)</span><span class="cv">${Rp(avgSellCpt)}</span></div>
    </div>
  </div>

  <div>
    <div class="sec-hdr"><div class="sec-bar amber"></div><span class="sec-ttl amber">Rincian Parameter</span></div>
    <table>
      <thead><tr><th>Parameter</th><th>Pack</th><th class="r">Test/Kit</th><th class="r">Sell/Test</th><th class="r">Sell/Kit</th></tr></thead>
      <tbody>${paramHtml}</tbody>
    </table>
  </div>

  ${consItems && consItems.length > 0 ? `
  <div>
    <div class="sec-hdr"><div class="sec-bar navy"></div><span class="sec-ttl navy">Beban Consumable / Test</span></div>
    <table>
      <thead><tr><th>Item</th><th class="r" colspan="4">Cost / Test</th></tr></thead>
      <tbody>${consHtml}</tbody>
    </table>
  </div>` : ''}

  <div class="info-k">
    <span class="info-k-lbl">Informasi Kompetitor</span>
    <span class="info-k-val">${esc(kompetitor || '—')}</span>
  </div>

</div>
<div class="footer">
  <span>Wahana Lifeline · KSO CPRR Kimia Klinik · ${esc(analyzerName)}</span>
  <span>Dokumen ini bersifat konfidensial</span>
</div>
</body></html>`;
  openPrint(html);
}

// ─── CROSSMATCH ───────────────────────────────────────────────────────────────

export function printCrossmatch({
  analyzerName, methodLabel, totCap, kso, testsPerMonth, workDays,
  markup, capPt, totR, sell, totTest,
  reagentRows,
  salesName = '', faskesName = '', kotaKab = '', kompetitor = '',
}) {
  const d = todayStr();
  const base = capPt + totR;

  const ksoPairs = [
    ['Nama Analyzer', analyzerName],
    ['Metode', methodLabel],
    ['Total CAPEX', Rp(totCap)],
    ['Masa KSO', kso + ' bulan'],
    ['Test / Bulan', F(testsPerMonth) + ' test'],
    ['Total Target Test KSO', F(totTest) + ' test'],
    ['Hari Kerja / Bulan', workDays + ' hari'],
    ['Margin / Markup', markup + '%'],
  ];

  const reagenHtml = reagentRows.map(r => `
    <tr>
      <td class="lbl">${esc(r.fn)}</td>
      <td class="muted">${esc(r.pack)}</td>
      <td class="r">${Rp(r.contrib)}</td>
      <td class="r">${Rp(r.sellKit)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8">
<title>KSO CPRR — Crossmatch ${esc(analyzerName)}</title>
<style>${BASE_CSS}</style></head>
<body>
<div class="hdr">
  <div><div class="hdr-title">KSO CPRR — CROSSMATCH</div><div class="hdr-sub">Cost Per Result Report · Kerja Sama Operasional</div></div>
  <div><div class="hdr-brand">Wahana Lifeline</div><div class="hdr-date">Tanggal: ${d}</div></div>
</div>
<div class="meta">
  <div class="meta-item"><span class="meta-lbl">Nama Sales</span><span class="meta-val">${esc(salesName || '—')}</span></div>
  <div class="meta-item"><span class="meta-lbl">Nama Faskes</span><span class="meta-val">${esc(faskesName || '—')}</span></div>
  <div class="meta-item"><span class="meta-lbl">Kota / Kab</span><span class="meta-val">${esc(kotaKab || '—')}</span></div>
</div>
<div class="body">

  <div>
    <div class="sec-hdr"><div class="sec-bar navy"></div><span class="sec-ttl navy">Ringkasan KSO</span></div>
    <div class="kso-grid">${ksoRows(ksoPairs)}</div>
  </div>

  <div>
    <div class="sec-hdr"><div class="sec-bar green"></div><span class="sec-ttl green">CPRR — Cost Per Test</span></div>
    <div class="cprr-tbl">
      <div class="cprr-row"><span class="cl">CAPEX / Test</span><span class="cv">${Rp(capPt)}</span></div>
      <div class="cprr-row"><span class="cl">Reagen / Test</span><span class="cv">${Rp(totR)}</span></div>
      <div class="cprr-row"><span class="cl">Base Cost / Test</span><span class="cv">${Rp(base)}</span></div>
      <div class="cprr-row"><span class="cl">Markup ${markup}%</span><span class="cv">${Rp(sell - base)}</span></div>
      <div class="cprr-row hi"><span class="cl">CPRR (Harga Jual / Test)</span><span class="cv">${Rp(sell)}</span></div>
    </div>
  </div>

  <div>
    <div class="sec-hdr"><div class="sec-bar amber"></div><span class="sec-ttl amber">Rincian Reagen</span></div>
    <table>
      <thead><tr><th>Nama Barang</th><th>Kemasan</th><th class="r">Kontrib / Test</th><th class="r">Sell / Kit KSO</th></tr></thead>
      <tbody>${reagenHtml}</tbody>
    </table>
  </div>

  <div class="info-k">
    <span class="info-k-lbl">Informasi Kompetitor</span>
    <span class="info-k-val">${esc(kompetitor || '—')}</span>
  </div>

</div>
<div class="footer">
  <span>Wahana Lifeline · KSO CPRR Crossmatch · ${esc(analyzerName)}</span>
  <span>Dokumen ini bersifat konfidensial</span>
</div>
</body></html>`;
  openPrint(html);
}

// ─── CLIA ─────────────────────────────────────────────────────────────────────

export function printCLIA({
  analyzerName, brandName, totCap, kso, testsPerMonth, workDays,
  markup, qcFree, capPt, consPerTest, avgSellCpt, totTest,
  panelRows,
  salesName = '', faskesName = '', kotaKab = '', kompetitor = '',
}) {
  const d = todayStr();

  const ksoPairs = [
    ['Nama Analyzer', brandName],
    ['Total CAPEX', Rp(totCap)],
    ['Masa KSO', kso + ' bulan'],
    ['Test / Bulan', F(testsPerMonth) + ' test'],
    ['Total Target Test KSO', F(totTest) + ' test'],
    ['Hari Kerja / Bulan', workDays + ' hari'],
    ['Margin / Markup', markup + '%'],
    ['Konsumabel', qcFree ? 'FREE — supplier' : 'PAID — mandiri'],
  ];

  // Group by panel
  const panelMap = {};
  panelRows.forEach(r => {
    if (!panelMap[r.panel]) panelMap[r.panel] = [];
    panelMap[r.panel].push(r);
  });

  const paramHtml = Object.entries(panelMap).map(([panel, rows]) => `
    <tr class="panel-hdr"><td colspan="4">${esc(panel)}</td></tr>
    ${rows.map(r => `<tr>
      <td class="lbl">${esc(r.name)}</td>
      <td class="r">${r.kit}T</td>
      <td class="r">${Rp(r.sellTest)}</td>
      <td class="r">${Rp(r.sellKit)}</td>
    </tr>`).join('')}`).join('');

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8">
<title>KSO CPRR — CLIA ${esc(brandName)}</title>
<style>${BASE_CSS}</style></head>
<body>
<div class="hdr">
  <div><div class="hdr-title">KSO CPRR — CLIA (IMMUNOASSAY)</div><div class="hdr-sub">Cost Per Result Report · Kerja Sama Operasional</div></div>
  <div><div class="hdr-brand">Wahana Lifeline</div><div class="hdr-date">Tanggal: ${d}</div></div>
</div>
<div class="meta">
  <div class="meta-item"><span class="meta-lbl">Nama Sales</span><span class="meta-val">${esc(salesName || '—')}</span></div>
  <div class="meta-item"><span class="meta-lbl">Nama Faskes</span><span class="meta-val">${esc(faskesName || '—')}</span></div>
  <div class="meta-item"><span class="meta-lbl">Kota / Kab</span><span class="meta-val">${esc(kotaKab || '—')}</span></div>
</div>
<div class="body">

  <div>
    <div class="sec-hdr"><div class="sec-bar navy"></div><span class="sec-ttl navy">Ringkasan KSO</span></div>
    <div class="kso-grid">${ksoRows(ksoPairs)}</div>
  </div>

  <div>
    <div class="sec-hdr"><div class="sec-bar green"></div><span class="sec-ttl green">CPRR — Rata-rata Cost Per Test</span></div>
    <div class="cprr-tbl">
      <div class="cprr-row"><span class="cl">CAPEX / Test</span><span class="cv">${Rp(capPt)}</span></div>
      <div class="cprr-row"><span class="cl">Konsumabel / Test (rata-rata)</span><span class="cv">${Rp(consPerTest)}</span></div>
      <div class="cprr-row hi"><span class="cl">CPRR Rata-rata (Harga Jual / Test)</span><span class="cv">${Rp(avgSellCpt)}</span></div>
    </div>
  </div>

  <div>
    <div class="sec-hdr"><div class="sec-bar amber"></div><span class="sec-ttl amber">Rincian Parameter per Panel</span></div>
    <table>
      <thead><tr><th>Parameter</th><th class="r">Kit</th><th class="r">Sell / Test</th><th class="r">Sell / Kit KSO</th></tr></thead>
      <tbody>${paramHtml}</tbody>
    </table>
  </div>

  <div class="info-k">
    <span class="info-k-lbl">Informasi Kompetitor</span>
    <span class="info-k-val">${esc(kompetitor || '—')}</span>
  </div>

</div>
<div class="footer">
  <span>Wahana Lifeline · KSO CPRR CLIA · ${esc(brandName)}</span>
  <span>Dokumen ini bersifat konfidensial</span>
</div>
</body></html>`;
  openPrint(html);
}
