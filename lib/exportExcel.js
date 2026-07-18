// Excel export utility — A4 print-ready CPRR sheets

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
const safeFilename = (s) => s.replace(/[\s·()/\\:*?"<>|]/g, '_');

function dlXlsx(XLSX, wb, fname) {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 1000);
}

function applySetup(ws, colWidths) {
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
  ws['!pageSetup'] = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  ws['!margins'] = { left: 0.75, right: 0.75, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
  return ws;
}

const CPRR_STYLE = {
  font:    { bold: true, sz: 12 },
  fill:    { fgColor: { rgb: 'FFF9C4' } },
  border:  {
    top:    { style: 'thin', color: { rgb: 'F9A825' } },
    bottom: { style: 'thin', color: { rgb: 'F9A825' } },
  },
};

function boldRow(ws, rowIdx, numCols) {
  const cols = 'ABCDEFG'.slice(0, numCols).split('');
  cols.forEach(col => {
    const addr = col + (rowIdx + 1);
    if (!ws[addr]) ws[addr] = { v: '', t: 's' };
    ws[addr].s = CPRR_STYLE;
  });
}

// ─── HEMATOLOGI ───────────────────────────────────────────────────────────────

export async function exportHemato({
  analyzerName, backupLabel, totCap, kso, testsPerMonth, workDays,
  markup, qcFree, capPt, totR, ctrlOverhead, sell, totTest,
  reagentRows,
  capexBreakdown,
  salesName = '', faskesName = '', kotaKab = '', kompetitor = '',
}) {
  const _xl = await import('xlsx-js-style'); const XLSX = _xl.default ?? _xl;
  const d = todayStr();
  const base = capPt + totR + (ctrlOverhead || 0);

  const aoa = [
    ['KSO CPRR — HEMATOLOGI', '', '', ''],
    ['Wahana Lifeline', '', '', 'Tanggal: ' + d],
    ['Nama Sales', salesName || '—', '', ''],
    ['Nama Faskes', faskesName || '—', '', ''],
    ['Kota / Kab', kotaKab || '—', '', ''],
    ['', '', '', ''],
    ['RINGKASAN KSO', '', '', ''],
    ['Nama Analyzer', analyzerName, '', ''],
    ...(backupLabel ? [['Backup Analyzer', backupLabel, '', '']] : []),
    ['Total CAPEX', Rp(totCap), '', ''],
    ...(capexBreakdown?.alat > 0 ? [['  └ Harga Alat', Rp(capexBreakdown.alat), '', '']] : []),
    ...(capexBreakdown?.backup > 0 ? [['  └ Backup Analyzer', Rp(capexBreakdown.backup), '', '']] : []),
    ...(capexBreakdown?.ups > 0 ? [['  └ UPS', Rp(capexBreakdown.ups), '', '']] : []),
    ...(capexBreakdown?.lis > 0 ? [['  └ LIS', Rp(capexBreakdown.lis), '', '']] : []),
    ['Masa KSO', kso + ' bulan', '', ''],
    ['Test / Bulan', F(testsPerMonth) + ' test', '', ''],
    ['Total Target Test KSO', F(totTest) + ' test', '', ''],
    ['Hari Kerja / Bulan', workDays + ' hari', '', ''],
    ['Margin / Markup', markup + '%', '', ''],
    ['QC & Kalibrator', qcFree ? 'FREE — ditanggung supplier' : 'PAID — dibeli sendiri', '', ''],
    ['', '', '', ''],
    ['CPRR — COST PER TEST', '', '', ''],
    ['CAPEX / Test', Rp(capPt), '', ''],
    ['Reagen / Test', Rp(totR), '', ''],
    ...(ctrlOverhead > 0 ? [['QC + Kalibrasi / Test', Rp(ctrlOverhead), '', '']] : []),
    ['Base Cost / Test', Rp(base), '', ''],
    ['Markup ' + markup + '%', Rp(sell - base), '', ''],
    ['CPRR (Harga Jual / Test)', Rp(sell), '', ''],
    ['', '', '', ''],
    ['RINCIAN REAGEN', '', '', ''],
    ['Nama Barang', 'Kemasan', 'Kontrib/Test', 'Sell/Kit KSO'],
    ...reagentRows.map(r => [
      r.fn,
      r.pack,
      Rp(r.contribTest),
      r.excelKit > 0 ? Rp(r.excelKit) : '—',
    ]),
    ['', '', '', ''],
    ['Informasi Kompetitor', kompetitor || '—', '', ''],
  ];

  const hSupplyRows = (reagentRows || []).filter(r => (r.nettKit ?? 0) > 0);
  if (hSupplyRows.length > 0) {
    aoa.push(['', '', '', '']);
    aoa.push(['SUPPLY CHAIN FORECAST — KEBUTUHAN REAGEN / BULAN', '', '', '']);
    aoa.push(['Nama Barang', 'Kemasan', 'Kebutuhan/Bulan (kit)', 'Kebutuhan/Tahun (kit)']);
    hSupplyRows.forEach(r => {
      const kpmVal = r.nettKit > 0 && testsPerMonth > 0
        ? +((r.contribTest * testsPerMonth / r.nettKit).toFixed(2))
        : 0;
      const kpyVal = +(kpmVal * 12).toFixed(2);
      aoa.push([r.fn, r.pack, kpmVal, kpyVal]);
    });
  }

  const cprrTopIdx = aoa.findIndex(row => row[0] === 'CPRR (Harga Jual / Test)');

  const ws = applySetup(XLSX.utils.aoa_to_sheet(aoa), [34, 28, 20, 22]);
  if (cprrTopIdx >= 0) boldRow(ws, cprrTopIdx, 4);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hematologi');
  dlXlsx(XLSX, wb, 'KSO_CPRR_Hemato_' + safeFilename(analyzerName) + '_' + d.replace(/\//g, '-') + '.xlsx');
}

// ─── KIMIA KLINIK ─────────────────────────────────────────────────────────────

export async function exportCC({
  analyzerName, backupLabel, totCap, kso, testsPerMonth, workDays,
  markup, capPt, consumablePerTest, totalOverhead, hasOverhead,
  avgSellCpt, totTest,
  paramRows,  // [{name, panel, pack, testsPerKit, sellTest, sellKit}]
  consItems,  // [{name, cpt}]
  qcRows,     // [{label, value}] — QC overhead detail rows
  capexBreakdown,
  supplyRows,  // [{name, panel, pack, testsPerKit, tpmParam}]
  salesName = '', faskesName = '', kotaKab = '', kompetitor = '',
}) {
  const _xl = await import('xlsx-js-style'); const XLSX = _xl.default ?? _xl;
  const d = todayStr();

  const aoa = [
    ['KSO CPRR — KIMIA KLINIK', '', '', '', '', '', ''],
    ['Wahana Lifeline', '', '', '', '', '', 'Tanggal: ' + d],
    ['Nama Sales', salesName || '—', '', '', '', '', ''],
    ['Nama Faskes', faskesName || '—', '', '', '', '', ''],
    ['Kota / Kab', kotaKab || '—', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['RINGKASAN KSO', '', '', '', '', '', ''],
    ['Nama Analyzer', analyzerName, '', '', '', '', ''],
    ...(backupLabel ? [['Backup Analyzer', backupLabel, '', '', '', '', '']] : []),
    ['Total CAPEX', Rp(totCap), '', '', '', '', ''],
    ...(capexBreakdown?.alat > 0 ? [['  └ Harga Alat', Rp(capexBreakdown.alat), '', '', '', '', '']] : []),
    ...(capexBreakdown?.backup > 0 ? [['  └ Backup Analyzer', Rp(capexBreakdown.backup), '', '', '', '', '']] : []),
    ...(capexBreakdown?.ups > 0 ? [['  └ UPS', Rp(capexBreakdown.ups), '', '', '', '', '']] : []),
    ...(capexBreakdown?.lis > 0 ? [['  └ LIS', Rp(capexBreakdown.lis), '', '', '', '', '']] : []),
    ['Masa KSO', kso + ' bulan', '', '', '', '', ''],
    ['Sampel / Bulan', F(testsPerMonth) + ' sampel', '', '', '', '', ''],
    ['Total Target Test KSO', F(totTest) + ' test', '', '', '', '', ''],
    ['Hari Kerja / Bulan', workDays + ' hari', '', '', '', '', ''],
    ['Margin / Markup', markup + '%', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['CPRR — RATA-RATA (SEMUA PARAMETER)', '', '', '', '', '', ''],
    ['CAPEX / Test', Rp(capPt), '', '', '', '', ''],
    ['Consumable / Test', Rp(consumablePerTest), '', '', '', '', ''],
    ...(hasOverhead ? [['QC + Kalibrasi / Test', Rp(totalOverhead), '', '', '', '', '']] : []),
    ['CPRR Rata-rata (Harga Jual / Test)', Rp(avgSellCpt), '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['RINCIAN PARAMETER', '', '', '', '', '', ''],
    ['No', 'Parameter', 'Panel', 'Pack', 'Test/Kit', 'Sell/Test', 'Sell/Kit'],
    ...paramRows.map((r, i) => [
      i + 1, r.name, r.panel, r.pack,
      r.testsPerKit ? F(r.testsPerKit) + 'T' : '—',
      Rp(r.sellTest),
      Rp(r.sellKit),
    ]),
    ['', '', '', '', '', '', ''],
    ['BEBAN CONSUMABLE / TEST', '', '', '', '', '', ''],
    ['Item', 'Cost / Test', '', '', '', '', ''],
    ...consItems.map(c => [c.name, Rp(c.cpt), '', '', '', '', '']),
    ['Total Consumable / Test', Rp(consumablePerTest), '', '', '', '', ''],
    ['+ CAPEX / Test', Rp(capPt), '', '', '', '', ''],
    ...(hasOverhead ? [
      ['', '', '', '', '', '', ''],
      ['QC & KALIBRATOR — OVERHEAD / TEST (FREE)', '', '', '', '', '', ''],
      ...(qcRows || []).map(q => [q.label, Rp(q.value), '', '', '', '', '']),
      ['Total Overhead QC + Cal / Test', Rp(totalOverhead), '', '', '', '', ''],
    ] : []),
    ['', '', '', '', '', '', ''],
    ['Total Beban Tetap / Test', Rp(capPt + consumablePerTest + (totalOverhead || 0)), '', '', '', '', ''],
    ['Informasi Kompetitor', kompetitor || '—', '', '', '', '', ''],
  ];

  if (supplyRows && supplyRows.length > 0) {
    aoa.push(['', '', '', '', '', '', '']);
    aoa.push(['SUPPLY CHAIN FORECAST — KEBUTUHAN REAGEN / BULAN', '', '', '', '', '', '']);
    aoa.push(['Parameter', 'Panel', 'Pack', 'Test/Kit', 'Est. Test/Bulan', 'Kit/Bulan', 'Kit/Tahun']);
    supplyRows.forEach(r => {
      const tpm = r.tpmParam || 0;
      const kpm = r.testsPerKit > 0 && tpm > 0 ? Math.ceil(tpm / r.testsPerKit) : 0;
      aoa.push([r.name, r.panel, r.pack, r.testsPerKit ? r.testsPerKit : '—', tpm || '—', kpm || '—', kpm > 0 ? kpm * 12 : '—']);
    });
  }

  const cprrIdx = aoa.findIndex(row => String(row[0]).startsWith('CPRR Rata-rata'));

  const ws = applySetup(XLSX.utils.aoa_to_sheet(aoa), [6, 32, 14, 14, 10, 18, 18]);
  if (cprrIdx >= 0) boldRow(ws, cprrIdx, 7);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Kimia Klinik');
  dlXlsx(XLSX, wb, 'KSO_CPRR_CC_' + analyzerName + '_' + d.replace(/\//g, '-') + '.xlsx');
}

// ─── CROSSMATCH ───────────────────────────────────────────────────────────────

export async function exportCrossmatch({
  analyzerName, methodLabel, totCap, kso, testsPerMonth, workDays,
  markup, capPt, totR, sell, totTest,
  reagentRows,  // [{fn, pack, contrib, sellKit}]
  capexBreakdown,
  salesName = '', faskesName = '', kotaKab = '', kompetitor = '',
}) {
  const _xl = await import('xlsx-js-style'); const XLSX = _xl.default ?? _xl;
  const d = todayStr();
  const base = capPt + totR;

  const aoa = [
    ['KSO CPRR — CROSSMATCH', '', '', ''],
    ['Wahana Lifeline', '', '', 'Tanggal: ' + d],
    ['Nama Sales', salesName || '—', '', ''],
    ['Nama Faskes', faskesName || '—', '', ''],
    ['Kota / Kab', kotaKab || '—', '', ''],
    ['', '', '', ''],
    ['RINGKASAN KSO', '', '', ''],
    ['Nama Analyzer', analyzerName, '', ''],
    ['Metode', methodLabel, '', ''],
    ['Total CAPEX', Rp(totCap), '', ''],
    ...(capexBreakdown?.alat > 0 ? [['  └ Harga Alat', Rp(capexBreakdown.alat), '', '']] : []),
    ...(capexBreakdown?.backup > 0 ? [['  └ Backup Analyzer', Rp(capexBreakdown.backup), '', '']] : []),
    ...(capexBreakdown?.ups > 0 ? [['  └ UPS', Rp(capexBreakdown.ups), '', '']] : []),
    ...(capexBreakdown?.lis > 0 ? [['  └ LIS', Rp(capexBreakdown.lis), '', '']] : []),
    ['Masa KSO', kso + ' bulan', '', ''],
    ['Test / Bulan', F(testsPerMonth) + ' test', '', ''],
    ['Total Target Test KSO', F(totTest) + ' test', '', ''],
    ['Hari Kerja / Bulan', workDays + ' hari', '', ''],
    ['Margin / Markup', markup + '%', '', ''],
    ['', '', '', ''],
    ['CPRR — COST PER TEST', '', '', ''],
    ['CAPEX / Test', Rp(capPt), '', ''],
    ['Reagen / Test', Rp(totR), '', ''],
    ['Base Cost / Test', Rp(base), '', ''],
    ['Markup ' + markup + '%', Rp(sell - base), '', ''],
    ['CPRR (Harga Jual / Test)', Rp(sell), '', ''],
    ['', '', '', ''],
    ['RINCIAN REAGEN', '', '', ''],
    ['Nama Barang', 'Kemasan', 'Kontrib/Test', 'Sell/Kit KSO'],
    ...reagentRows.map(r => [r.fn, r.pack, Rp(r.contrib), Rp(r.sellKit)]),
    ['', '', '', ''],
    ['Informasi Kompetitor', kompetitor || '—', '', ''],
  ];

  const cprrTopIdx = aoa.findIndex(row => row[0] === 'CPRR (Harga Jual / Test)');

  const ws = applySetup(XLSX.utils.aoa_to_sheet(aoa), [34, 22, 20, 22]);
  if (cprrTopIdx >= 0) boldRow(ws, cprrTopIdx, 4);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Crossmatch');
  dlXlsx(XLSX, wb, 'KSO_CPRR_XM_' + safeFilename(analyzerName) + '_' + d.replace(/\//g, '-') + '.xlsx');
}

// ─── HPLC ─────────────────────────────────────────────────────────────────────

export async function exportHPLC({
  analyzerName, totCap, kso, testsPerMonth, workDays,
  markup, qcFree, capPt, totR, ctrlOverhead, sell, totTest,
  reagentRows,
  capexBreakdown,
  salesName = '', faskesName = '', kotaKab = '', kompetitor = '',
}) {
  const _xl = await import('xlsx-js-style'); const XLSX = _xl.default ?? _xl;
  const d = todayStr();
  const base = capPt + totR + (ctrlOverhead || 0);

  const aoa = [
    ['KSO CPRR — HPLC HbA1c', '', '', ''],
    ['Wahana Lifeline', '', '', 'Tanggal: ' + d],
    ['Nama Sales', salesName || '—', '', ''],
    ['Nama Faskes', faskesName || '—', '', ''],
    ['Kota / Kab', kotaKab || '—', '', ''],
    ['', '', '', ''],
    ['RINGKASAN KSO', '', '', ''],
    ['Nama Analyzer', analyzerName, '', ''],
    ['Total CAPEX', Rp(totCap), '', ''],
    ...(capexBreakdown?.alat > 0 ? [['  └ Harga Alat', Rp(capexBreakdown.alat), '', '']] : []),
    ...(capexBreakdown?.backup > 0 ? [['  └ Backup Analyzer', Rp(capexBreakdown.backup), '', '']] : []),
    ...(capexBreakdown?.ups > 0 ? [['  └ UPS', Rp(capexBreakdown.ups), '', '']] : []),
    ...(capexBreakdown?.lis > 0 ? [['  └ LIS', Rp(capexBreakdown.lis), '', '']] : []),
    ['Masa KSO', kso + ' bulan', '', ''],
    ['Test / Bulan', F(testsPerMonth) + ' test', '', ''],
    ['Total Target Test KSO', F(totTest) + ' test', '', ''],
    ['Hari Kerja / Bulan', workDays + ' hari', '', ''],
    ['Margin / Markup', markup + '%', '', ''],
    ['QC & Kalibrator', qcFree ? 'FREE — ditanggung supplier' : 'PAID — dibeli sendiri', '', ''],
    ['', '', '', ''],
    ['CPRR — COST PER TEST', '', '', ''],
    ['CAPEX / Test', Rp(capPt), '', ''],
    ['Reagen / Test', Rp(totR), '', ''],
    ...(ctrlOverhead > 0 ? [['QC + Kalibrasi / Test', Rp(ctrlOverhead), '', '']] : []),
    ['Base Cost / Test', Rp(base), '', ''],
    ['Markup ' + markup + '%', Rp(sell - base), '', ''],
    ['CPRR (Harga Jual / Test)', Rp(sell), '', ''],
    ['', '', '', ''],
    ['RINCIAN REAGEN', '', '', ''],
    ['Nama Barang', 'Kemasan', 'Kontrib/Test', 'Sell/Kit KSO'],
    ...reagentRows.map(r => [
      r.fn,
      r.pack,
      Rp(r.contribTest),
      r.excelKit > 0 ? Rp(r.excelKit) : '—',
    ]),
    ['', '', '', ''],
    ['Informasi Kompetitor', kompetitor || '—', '', ''],
  ];

  const cprrTopIdx = aoa.findIndex(row => row[0] === 'CPRR (Harga Jual / Test)');

  const ws = applySetup(XLSX.utils.aoa_to_sheet(aoa), [34, 28, 20, 22]);
  if (cprrTopIdx >= 0) boldRow(ws, cprrTopIdx, 4);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'HPLC HbA1c');
  dlXlsx(XLSX, wb, 'KSO_CPRR_HPLC_' + safeFilename(analyzerName) + '_' + d.replace(/\//g, '-') + '.xlsx');
}

// ─── Elektrolit ───────────────────────────────────────────────────────────────

export async function exportElektro({
  analyzerName, modeName, totCap, kso, testsPerMonth, workDays,
  markup, qcFree, capPt, totR, ctrlOverhead, sell, totTest,
  reagentRows, runDays, testsPerPack,
  capexBreakdown,
  salesName = '', faskesName = '', kotaKab = '', kompetitor = '',
}) {
  const _xl = await import('xlsx-js-style'); const XLSX = _xl.default ?? _xl;
  const d = todayStr();
  const base = capPt + totR + (ctrlOverhead || 0);

  const aoa = [
    ['KSO CPRR — Elektrolit DN-X6', '', '', ''],
    ['Wahana Lifeline', '', '', 'Tanggal: ' + d],
    ['Nama Sales', salesName || '—', '', ''],
    ['Nama Faskes', faskesName || '—', '', ''],
    ['Kota / Kab', kotaKab || '—', '', ''],
    ['', '', '', ''],
    ['RINGKASAN KSO', '', '', ''],
    ['Nama Analyzer', analyzerName + ' (' + modeName + ')', '', ''],
    ['Total CAPEX', Rp(totCap), '', ''],
    ...(capexBreakdown?.alat > 0 ? [['  └ Harga Alat', Rp(capexBreakdown.alat), '', '']] : []),
    ...(capexBreakdown?.backup > 0 ? [['  └ Backup Analyzer', Rp(capexBreakdown.backup), '', '']] : []),
    ...(capexBreakdown?.ups > 0 ? [['  └ UPS', Rp(capexBreakdown.ups), '', '']] : []),
    ...(capexBreakdown?.lis > 0 ? [['  └ LIS', Rp(capexBreakdown.lis), '', '']] : []),
    ['Masa KSO', kso + ' bulan', '', ''],
    ['Test / Bulan', F(testsPerMonth) + ' test', '', ''],
    ['Total Target Test KSO', F(totTest) + ' test', '', ''],
    ['Hari Kerja / Bulan', workDays + ' hari', '', ''],
    ['Margin / Markup', markup + '%', '', ''],
    ['QC Solution', qcFree ? 'FREE — ditanggung supplier' : 'PAID — dibeli sendiri', '', ''],
    ['Test / Pack', F(testsPerPack) + ' test (' + F(runDays) + ' hari/pack)', '', ''],
    ['', '', '', ''],
    ['CPRR — COST PER TEST', '', '', ''],
    ['CAPEX / Test', Rp(capPt), '', ''],
    ['Reagen / Test', Rp(totR), '', ''],
    ...(ctrlOverhead > 0 ? [['QC Solution / Test', Rp(ctrlOverhead), '', '']] : []),
    ['Base Cost / Test', Rp(base), '', ''],
    ['Markup ' + markup + '%', Rp(sell - base), '', ''],
    ['CPRR (Harga Jual / Test)', Rp(sell), '', ''],
    ['', '', '', ''],
    ['RINCIAN REAGEN', '', '', ''],
    ['Nama Barang', 'Kemasan', 'Kontrib/Test', 'Sell/Kit KSO'],
    ...reagentRows.map(r => [r.fn, r.pack, Rp(r.contribTest), r.excelKit > 0 ? Rp(r.excelKit) : '—']),
    ['', '', '', ''],
    ['Informasi Kompetitor', kompetitor || '—', '', ''],
  ];

  const cprrTopIdx = aoa.findIndex(row => row[0] === 'CPRR (Harga Jual / Test)');

  const ws = applySetup(XLSX.utils.aoa_to_sheet(aoa), [34, 28, 20, 22]);
  if (cprrTopIdx >= 0) boldRow(ws, cprrTopIdx, 4);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Elektrolit DN-X6');
  dlXlsx(XLSX, wb, 'KSO_CPRR_Elektrolit_' + safeFilename(analyzerName) + '_' + d.replace(/\//g, '-') + '.xlsx');
}

// ─── CLIA ─────────────────────────────────────────────────────────────────────

export async function exportCLIA({
  analyzerName, brandName, totCap, kso, testsPerMonth, workDays,
  markup, qcFree, capPt, consPerTest, avgSellCpt, totTest,
  panelRows,  // [{panel, name, kit, sellTest, sellKit}]
  capexBreakdown,
  salesName = '', faskesName = '', kotaKab = '', kompetitor = '',
}) {
  const _xl = await import('xlsx-js-style'); const XLSX = _xl.default ?? _xl;
  const d = todayStr();

  const aoa = [
    ['KSO CPRR — CLIA (IMMUNOASSAY)', '', '', '', ''],
    ['Wahana Lifeline', '', '', '', 'Tanggal: ' + d],
    ['Nama Sales', salesName || '—', '', '', ''],
    ['Nama Faskes', faskesName || '—', '', '', ''],
    ['Kota / Kab', kotaKab || '—', '', '', ''],
    ['', '', '', '', ''],
    ['RINGKASAN KSO', '', '', '', ''],
    ['Nama Analyzer', brandName, '', '', ''],
    ['Total CAPEX', Rp(totCap), '', '', ''],
    ...(capexBreakdown?.alat > 0 ? [['  └ Harga Alat', Rp(capexBreakdown.alat), '', '', '']] : []),
    ...(capexBreakdown?.backup > 0 ? [['  └ Backup Analyzer', Rp(capexBreakdown.backup), '', '', '']] : []),
    ...(capexBreakdown?.ups > 0 ? [['  └ UPS', Rp(capexBreakdown.ups), '', '', '']] : []),
    ...(capexBreakdown?.lis > 0 ? [['  └ LIS', Rp(capexBreakdown.lis), '', '', '']] : []),
    ['Masa KSO', kso + ' bulan', '', '', ''],
    ['Test / Bulan', F(testsPerMonth) + ' test', '', '', ''],
    ['Total Target Test KSO', F(totTest) + ' test', '', '', ''],
    ['Hari Kerja / Bulan', workDays + ' hari', '', '', ''],
    ['Margin / Markup', markup + '%', '', '', ''],
    ['Konsumabel', qcFree ? 'FREE — ditanggung supplier' : 'PAID — dibeli sendiri', '', '', ''],
    ['', '', '', '', ''],
    ['CPRR — RATA-RATA COST PER TEST', '', '', '', ''],
    ['CAPEX / Test', Rp(capPt), '', '', ''],
    ['Konsumabel / Test (rata-rata)', Rp(consPerTest), '', '', ''],
    ['CPRR Rata-rata (Harga Jual / Test)', Rp(avgSellCpt), '', '', ''],
    ['', '', '', '', ''],
    ['RINCIAN PARAMETER PER PANEL', '', '', '', ''],
    ['Panel', 'Parameter', 'Kit', 'Sell/Test', 'Sell/Kit'],
    ...panelRows.map(r => [r.panel, r.name, r.kit + 'T', Rp(r.sellTest), Rp(r.sellKit)]),
    ['', '', '', '', ''],
    ['Informasi Kompetitor', kompetitor || '—', '', '', ''],
  ];

  const cprrIdx = aoa.findIndex(row => String(row[0]).startsWith('CPRR Rata-rata'));

  const ws = applySetup(XLSX.utils.aoa_to_sheet(aoa), [22, 34, 10, 18, 18]);
  if (cprrIdx >= 0) boldRow(ws, cprrIdx, 5);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'CLIA');
  dlXlsx(XLSX, wb, 'KSO_CPRR_CLIA_' + safeFilename(analyzerName) + '_' + d.replace(/\//g, '-') + '.xlsx');
}

// ─── Blood Gas ────────────────────────────────────────────────────────────────

export async function exportBloodGas({
  bgMode, totCap, kso, testsPerMonth, workDays,
  markup, qcFree, capPt, hpp, hppBase, hppResidu,
  qcOh, base, sell, totTest,
  cartFn, cartPack, cartNett, kitCap, real21d, residue, stability,
  capexBreakdown,
  salesName = '', faskesName = '', kotaKab = '', kompetitor = '',
}) {
  const _xl = await import('xlsx-js-style'); const XLSX = _xl.default ?? _xl;
  const d = todayStr();
  const isCprr = bgMode === 'cprr';
  const modeLabel = isCprr ? 'KSO CPRR — Supplier Provide Cartridge' : 'KSO — Faskes Beli Cartridge';
  const sellLabel = isCprr ? 'CPRR (Harga Jual / Test)' : 'Running Cost / Test (KSO)';

  const aoa = [
    ['KSO — BLOOD GAS EASY DIAGNOSIS PT1000', '', '', ''],
    ['Wahana Lifeline', '', '', 'Tanggal: ' + d],
    ['Nama Sales', salesName || '—', '', ''],
    ['Nama Faskes', faskesName || '—', '', ''],
    ['Kota / Kab', kotaKab || '—', '', ''],
    ['', '', '', ''],
    ['RINGKASAN KSO', '', '', ''],
    ['Nama Analyzer', 'Easy Diagnosis PT1000', '', ''],
    ['Skema Kerjasama', modeLabel, '', ''],
    ['Total CAPEX Alat', Rp(totCap), '', ''],
    ...(capexBreakdown?.alat > 0 ? [['  └ Harga Alat', Rp(capexBreakdown.alat), '', '']] : []),
    ...(capexBreakdown?.backup > 0 ? [['  └ Backup Analyzer', Rp(capexBreakdown.backup), '', '']] : []),
    ...(capexBreakdown?.ups > 0 ? [['  └ UPS', Rp(capexBreakdown.ups), '', '']] : []),
    ...(capexBreakdown?.lis > 0 ? [['  └ LIS', Rp(capexBreakdown.lis), '', '']] : []),
    ['Masa KSO', kso + ' bulan', '', ''],
    ['Test / Bulan', F(testsPerMonth) + ' test', '', ''],
    ['Total Target Test KSO', F(totTest) + ' test', '', ''],
    ['Hari Kerja / Bulan', workDays + ' hari', '', ''],
    ['Margin / Markup', markup + '%', '', ''],
    ['Open Stability Cartridge', stability + ' hari', '', ''],
    ['Real Test / Siklus 21 Hari', F(Math.round(real21d)) + ' test', '', ''],
    ['Kapasitas Kit Cartridge', F(kitCap) + ' test/kit', '', ''],
    ...(residue > 0 ? [['Residu Terbuang', F(Math.round(residue)) + ' test/siklus', '', '']] : []),
    ['QC Control', qcFree ? 'FREE — ditanggung supplier' : 'PAID — dibeli faskes', '', ''],
    ['', '', '', ''],
    ['COST — RINCIAN / TEST', '', '', ''],
    ['HPP Cartridge (base)', Rp(hppBase), '', 'nett ÷ ' + F(kitCap) + ' kit cap'],
    ...(isCprr && residue > 0 ? [['+ Residu Cartridge', Rp(hppResidu), '', F(Math.round(residue)) + ' test terbuang / ' + F(Math.round(real21d)) + ' real test']] : []),
    ['HPP / Real Test', Rp(hpp), '', isCprr ? 'nett ÷ ' + F(Math.round(real21d)) + ' real test' : 'nett ÷ ' + F(kitCap) + ' kit cap'],
    ...(qcOh > 0 ? [['QC / Test (Free)', Rp(qcOh), '', '']] : []),
    ['CAPEX / Test', Rp(capPt), '', ''],
    ['Base Cost / Test', Rp(base), '', ''],
    ['Markup ' + markup + '%', Rp(sell - base), '', ''],
    [sellLabel, Rp(sell), '', ''],
    ['', '', '', ''],
    ['CARTRIDGE', '', '', ''],
    [cartFn, cartPack, Rp(cartNett), ''],
    ['', '', '', ''],
    ['Informasi Kompetitor', kompetitor || '—', '', ''],
  ];

  const sellIdx = aoa.findIndex(row => row[0] === sellLabel);

  const ws = applySetup(XLSX.utils.aoa_to_sheet(aoa), [36, 24, 20, 30]);
  if (sellIdx >= 0) boldRow(ws, sellIdx, 4);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Blood Gas');
  dlXlsx(XLSX, wb, 'KSO_BloodGas_PT1000_' + d.replace(/\//g, '-') + '.xlsx');
}
