// Master data — Zybio KSO Running Cost
// Harga default dari sheet "Running Cost Zybio DL" & "Running Cost Zybio CC"

// ─── HEMATOLOGI ──────────────────────────────────────────────────────────────

export const HEMATO = {
  Z3: {
    label: 'Z3', diff: '3-Diff',
    dP: 115e6, dD: 0, dK: 60, dM: 20, dT: 500,
    reagents: [
      { id: 'lyse',  fn: 'ZYBIO LYSE Z3 500ML',      pack: '500 mL/btl',      vol: 500,   dp: 1550000 },
      { id: 'dil',   fn: 'ZYBIO DILUENT Z3 20L',      pack: '20.000 mL/jeriken', vol: 20000, dp: 1550000 },
      { id: 'probe', fn: 'ZYBIO PROBE CLEANSER 50ML', pack: '50 mL/btl',       vol: 50,    dp: 400000  },
    ],
    // tpm = test/bln, wd = hari kerja/bln, rp = { lyse, dil, probe } harga per pack
    calc(tpm, wd, rp) {
      if (!tpm || !wd) return null;
      const D = tpm / wd;
      const lpm = rp.lyse  / 500;
      const dpm = rp.dil   / 20000;
      const ppm = rp.probe / 50;
      const cyc = 0.344 * lpm + 21.09 * dpm;
      const fix = (0.894 * lpm + (77.64 + 59.92) * dpm + 1 * ppm) / D;
      return {
        total: cyc + fix, cyc, fix,
        pr: {
          lyse:  { c: 0.344 * lpm,          f: 0.894 * lpm / D },
          dil:   { c: 21.09 * dpm,           f: (77.64 + 59.92) * dpm / D },
          probe: { c: 0,                     f: 1 * ppm / D },
        },
      };
    },
  },

  Z52: {
    label: 'Z52', diff: '5-Diff',
    dP: 190e6, dD: 0, dK: 60, dM: 20, dT: 750,
    reagents: [
      { id: 'dn',    fn: 'ZYBIO Z5 DN DILUENT 20L',    pack: '20.000 mL/jeriken', vol: 20000, dp: 2000000 },
      { id: 'ld',    fn: 'ZYBIO Z5 LD LYSE 500ML',     pack: '500 mL/btl',       vol: 500,   dp: 2500000 },
      { id: 'lb',    fn: 'ZYBIO Z5 LB LYSE 200ML',     pack: '200 mL/btl',       vol: 200,   dp: 2000000 },
      { id: 'probe', fn: 'ZYBIO PROBE CLEANSER 50ML',  pack: '50 mL/btl',        vol: 50,    dp: 400000  },
    ],
    calc(tpm, wd, rp) {
      if (!tpm || !wd) return null;
      const D    = tpm / wd;
      const dnpm = rp.dn    / 20000;
      const ldpm = rp.ld    / 500;
      const lbpm = rp.lb    / 200;
      const cyc  = 42.253 * dnpm + 1.2 * ldpm + 0.205 * lbpm;
      const fix  = ((141.674 + 64.972) * dnpm + 2.2 * ldpm + 0.305 * lbpm) / D;
      const pb   = tpm > 0 ? (2 * rp.probe) / tpm : 0;     // 24 btl/tahun = 2/bln
      return {
        total: cyc + fix + pb, cyc, fix, pb,
        pr: {
          dn:    { c: 42.253 * dnpm,                      f: (141.674 + 64.972) * dnpm / D },
          ld:    { c: 1.2   * ldpm,                       f: 2.2 * ldpm / D },
          lb:    { c: 0.205 * lbpm,                       f: 0.305 * lbpm / D },
          probe: { c: 0,                                  f: 0, pb },
        },
      };
    },
  },

  Z50: {
    label: 'Z50', diff: '5-Diff',
    dP: 210e6, dD: 0, dK: 60, dM: 20, dT: 750,
    reagents: [
      { id: 'dn',    fn: 'ZYBIO Z5 DN DILUENT 20L',    pack: '20.000 mL/jeriken', vol: 20000, dp: 2000000 },
      { id: 'ld',    fn: 'ZYBIO Z5 LD LYSE 500ML',     pack: '500 mL/btl',       vol: 500,   dp: 2500000 },
      { id: 'lb',    fn: 'ZYBIO Z5 LB LYSE 200ML',     pack: '200 mL/btl',       vol: 200,   dp: 2000000 },
      { id: 'probe', fn: 'ZYBIO PROBE CLEANSER 50ML',  pack: '50 mL/btl',        vol: 50,    dp: 400000  },
    ],
    calc(tpm, wd, rp) {
      if (!tpm || !wd) return null;
      const D    = tpm / wd;
      const dnpm = rp.dn    / 20000;
      const ldpm = rp.ld    / 500;
      const lbpm = rp.lb    / 200;
      const cyc  = 42.253 * dnpm + 1.2 * ldpm + 0.205 * lbpm;
      const fix  = ((141.674 + 64.972) * dnpm + 2.2 * ldpm + 0.305 * lbpm) / D;
      const pb   = tpm > 0 ? (2 * rp.probe) / tpm : 0;
      return {
        total: cyc + fix + pb, cyc, fix, pb,
        pr: {
          dn:    { c: 42.253 * dnpm,                      f: (141.674 + 64.972) * dnpm / D },
          ld:    { c: 1.2   * ldpm,                       f: 2.2 * ldpm / D },
          lb:    { c: 0.205 * lbpm,                       f: 0.305 * lbpm / D },
          probe: { c: 0,                                  f: 0, pb },
        },
      };
    },
  },

  EXZ8000: {
    label: 'EXZ8000', diff: '6-Diff',
    dP: 500e6, dD: 0, dK: 60, dM: 20, dT: 2000,
    reagents: [
      { id: 'dn',    fn: 'H58 DN DILUENT 20L',       pack: '20.000 mL/jeriken', vol: 20000, dp: 1870000  },
      { id: 'ld',    fn: 'H58 LD LYSE 4L',            pack: '4.000 mL/btl',     vol: 4000,  dp: 11787000 },
      { id: 'ln',    fn: 'H58 LN LYSE 4L',            pack: '4.000 mL/btl',     vol: 4000,  dp: 11787000 },
      { id: 'fd',    fn: 'H58 FD DYE 48ML',           pack: '48 mL/btl',        vol: 48,    dp: 8840000  },
      { id: 'fn',    fn: 'H58 FN DYE 48ML',           pack: '48 mL/btl',        vol: 48,    dp: 2550000  },
      { id: 'ls',    fn: 'H58 LS LYSE 1L',            pack: '1.000 mL/btl',     vol: 1000,  dp: 3684000  },
      { id: 'dr',    fn: 'H58 DR DILUENT 1L',         pack: '1.000 mL/btl',     vol: 1000,  dp: 2947000  },
      { id: 'fr',    fn: 'H58 FR DYE 12ML',           pack: '12 mL/btl',        vol: 12,    dp: 9577000  },
      { id: 'probe', fn: 'PROBE CLEANSER 50ML×2',     pack: '100 mL/pack',      vol: 100,   dp: 800000   },
    ],
    // CBC+DIFF mode (WB Autoloader). tpm = test/bln, wd = hari kerja/bln
    // cyclic mL/test: DN=42, LD=1.56, LN=1.50, FD=0.02, FN=0.02, LS=0.50
    // startup mL/hari: DN=162, LD=3.06, LN=3.00, FD=0.10, FN=0.08, LS=1.50, DR=1.56, FR=0.02
    // shutdown mL/hari: DN=140, LD=0.50, LN=0.50, FD=0.02, FN=0.02, LS=1.00, FR=0.01, Probe=3.00
    calc(tpm, wd, rp) {
      if (!tpm || !wd) return null;
      const D     = tpm / wd;
      const dnpm  = rp.dn    / 20000;
      const ldpm  = rp.ld    / 4000;
      const lnpm  = rp.ln    / 4000;
      const fdpm  = rp.fd    / 48;
      const fnpm  = rp.fn    / 48;
      const lspm  = rp.ls    / 1000;
      const drpm  = rp.dr    / 1000;
      const frpm  = rp.fr    / 12;
      const ppm   = rp.probe / 100;
      const cyc   = 42.00 * dnpm + 1.56 * ldpm + 1.50 * lnpm + 0.02 * fdpm + 0.02 * fnpm + 0.50 * lspm;
      const start = 162.00 * dnpm + 3.06 * ldpm + 3.00 * lnpm + 0.10 * fdpm + 0.08 * fnpm + 1.50 * lspm + 1.56 * drpm + 0.02 * frpm;
      const stop  = 140.00 * dnpm + 0.50 * ldpm + 0.50 * lnpm + 0.02 * fdpm + 0.02 * fnpm + 1.00 * lspm + 0.01 * frpm + 3.00 * ppm;
      const fix   = (start + stop) / D;
      return {
        total: cyc + fix, cyc, fix,
        pr: {
          dn:    { c: 42.00 * dnpm, f: (162.00 + 140.00) * dnpm / D },
          ld:    { c: 1.56  * ldpm, f: (3.06   + 0.50)   * ldpm  / D },
          ln:    { c: 1.50  * lnpm, f: (3.00   + 0.50)   * lnpm  / D },
          fd:    { c: 0.02  * fdpm, f: (0.10   + 0.02)   * fdpm  / D },
          fn:    { c: 0.02  * fnpm, f: (0.08   + 0.02)   * fnpm  / D },
          ls:    { c: 0.50  * lspm, f: (1.50   + 1.00)   * lspm  / D },
          dr:    { c: 0,            f: 1.56               * drpm  / D },
          fr:    { c: 0,            f: (0.02   + 0.01)   * frpm  / D },
          probe: { c: 0,            f: 3.00               * ppm   / D },
        },
      };
    },
  },

  EXZ6000: {
    label: 'EXZ6000', diff: '5-Diff',
    dP: 365e6, dD: 0, dK: 60, dM: 20, dT: 1500,
    reagents: [
      { id: 'dn',    fn: 'ZYBIO Z5 DN DILUENT 20L',      pack: '20.000 mL/jeriken', vol: 20000, dp: 2000000 },
      { id: 'ldi',   fn: 'ZYBIO H56 LD-I LYSE 1L',       pack: '1.000 mL/btl',     vol: 1000,  dp: 2600000 },
      { id: 'ldii',  fn: 'ZYBIO H56 LD-II LYSE 500ML',   pack: '500 mL/btl',       vol: 500,   dp: 3250000 },
      { id: 'lb',    fn: 'ZYBIO Z5 LB LYSE 500ML',       pack: '500 mL/btl',       vol: 500,   dp: 2250000 },
      { id: 'probe', fn: 'ZYBIO PROBE CLEANSER 50ML',    pack: '50 mL/btl',        vol: 50,    dp: 400000  },
    ],
    calc(tpm, wd, rp) {
      if (!tpm || !wd) return null;
      const D     = tpm / wd;
      const dnpm  = rp.dn   / 20000;
      const ldipm = rp.ldi  / 1000;
      const ldiipm= rp.ldii / 500;
      const lbpm  = rp.lb   / 500;
      const ppm   = rp.probe/ 50;
      const cyc   = 49.814 * dnpm + 0.94 * ldipm + 0.45 * ldiipm + 0.4 * lbpm;
      const start = 183.40284 * dnpm + 4.14  * ldipm + 2.8  * ldiipm + 2.9  * lbpm;
      const stop  = 138.36125 * dnpm + 1.02  * ldipm + 0.15 * ldiipm + 0.2  * lbpm + 2 * ppm;
      const esleep= 2 * 9.405 * dnpm;                        // exit sleep mode ×2
      const fix   = (start + stop + esleep) / D;
      return {
        total: cyc + fix, cyc, fix,
        pr: {
          dn:    { c: 49.814 * dnpm,      f: (183.40284 + 138.36125 + 2 * 9.405) * dnpm / D },
          ldi:   { c: 0.94  * ldipm,     f: (4.14  + 1.02)  * ldipm  / D },
          ldii:  { c: 0.45  * ldiipm,    f: (2.8   + 0.15)  * ldiipm / D },
          lb:    { c: 0.4   * lbpm,      f: (2.9   + 0.2)   * lbpm   / D },
          probe: { c: 0,                 f: 2 * ppm / D },
        },
      };
    },
  },
};

// ─── KIMIA KLINIK — PARAMETER LIST ───────────────────────────────────────────

export const CC_P = [
  { no: 1,  p: 'SGOT',  pan: 'Hepatic',  pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 562500  },
  { no: 2,  p: 'SGPT',  pan: 'Hepatic',  pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 562500  },
  { no: 3,  p: 'CREA',  pan: 'Renal',    pack: 'R1:30mL×1  R2:10mL×1',  t: 102, dp: 1200000 },
  { no: 4,  p: 'UREA',  pan: 'Renal',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 720000  },
  { no: 5,  p: 'UA',    pan: 'Renal',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 720000  },
  { no: 6,  p: 'TC',    pan: 'Lipid',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 1057500 },
  { no: 7,  p: 'TG',    pan: 'Lipid',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 1350000 },
  { no: 8,  p: 'GLU',   pan: 'Diabetes', pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 900000  },
  { no: 9,  p: 'HDL-C', pan: 'Lipid',    pack: 'R1:30mL×3  R2:10mL×3',  t: 289, dp: 3360000 },
  { no: 10, p: 'LDL-C', pan: 'Lipid',    pack: 'R1:30mL×3  R2:10mL×3',  t: 289, dp: 5520000 },
  { no: 11, p: 'ALB',   pan: 'Hepatic',  pack: 'R:30mL×6',               t: 495, dp: 540000  },
  { no: 12, p: 'ALP',   pan: 'Hepatic',  pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 562500  },
  { no: 13, p: 'TBIL',  pan: 'Hepatic',  pack: 'R1:30mL×3  R2:7,5mL×3', t: 226, dp: 562500  },
  { no: 14, p: 'DBIL',  pan: 'Hepatic',  pack: 'R1:30mL×3  R2:7,5mL×3', t: 226, dp: 562500  },
  { no: 15, p: 'TP',    pan: 'Hepatic',  pack: 'R:30mL×6',               t: 495, dp: 540000  },
  { no: 16, p: 'GGT',   pan: 'Hepatic',  pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 1102500 },
];

// ─── KIMIA KLINIK — ANALYZER ─────────────────────────────────────────────────

export const CC = {
  EXC200: {
    label: 'EXC200', dP: 210e6, dD: 30, dK: 60, dM: 20, dT: 1800,
    cons: [
      { id: 'conc',    fn: 'Conc Detergent',   pack: '5L×4 (20L)',      vol: 20000, dp: 10032000 },
      { id: 'probe_d', fn: 'Probe Detergent',  pack: '30mL×8 (240mL)', vol: 240,   dp: 4026000  },
    ],
    // cn = harga conc per pack (20L), pn = harga probe_d per pack (240mL)
    det(tpm, wd, cn, pn) {
      if (!tpm || !wd) return null;
      const D   = tpm / wd;
      const cpm = cn / 20000;
      const prm = pn / 240;
      const cd  = 131.08 + 0.28 * D;     // mL conc / hari
      const pd  = 18.15;                  // mL probe_d / hari (tetap)
      const concCpt  = cd * cpm / D;
      const probeCpt = pd * prm / D;
      return { total: concCpt + probeCpt, conc: concCpt, probe: probeCpt };
    },
  },

  EXC400: {
    label: 'EXC400', dP: 765765000, dD: 0, dK: 60, dM: 20, dT: 5000,
    cons: [
      { id: 'conc',    fn: 'Conc Detergent',   pack: '5L×4 (20L)',      vol: 20000, dp: 10032000 },
      { id: 'probe_d', fn: 'Probe Detergent',  pack: '30mL×8 (240mL)', vol: 240,   dp: 4026000  },
    ],
    det(tpm, wd, cn, pn) {
      if (!tpm || !wd) return null;
      const D   = tpm / wd;
      const cpm = cn / 20000;
      const prm = pn / 240;
      const cd  = 128.2 + 0.20 * D;
      const pd  = 18.15;
      const concCpt  = cd * cpm / D;
      const probeCpt = pd * prm / D;
      return { total: concCpt + probeCpt, conc: concCpt, probe: probeCpt };
    },
  },
};
