// Master data — Zybio KSO Running Cost

// ─── HEMATOLOGI ──────────────────────────────────────────────────────────────

export const HEMATO = {
  Z3: {
    label: 'Z3', diff: '3-Diff',
    dP: 115e6, dPl: 115e6, dD: 0, dK: 60, dM: 20, dT: 500,
    ctrlPl: 1400000, calPl: null,
    testPresets: [250, 500, 750, 1000, 1500, 2000],
    reagents: [
      { id: 'lyse',  fn: 'ZYBIO LYSE Z3 500ML',      pack: '500 mL/btl',        vol: 500,   dp: 1550000, pl: 1400000 },
      { id: 'dil',   fn: 'ZYBIO DILUENT Z3 20L',      pack: '20.000 mL/jeriken', vol: 20000, dp: 1550000, pl: 1400000 },
      { id: 'probe', fn: 'ZYBIO PROBE CLEANSER 50ML', pack: '50 mL/btl',         vol: 50,    dp: 400000,  pl: 400000  },
    ],
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
    dP: 190e6, dPl: 190e6, dD: 0, dK: 60, dM: 20, dT: 750,
    ctrlPl: 2000000, calPl: null,
    testPresets: [250, 500, 750, 1000, 1500, 2000],
    reagents: [
      { id: 'dn',    fn: 'ZYBIO Z5 DN DILUENT 20L',    pack: '20.000 mL/jeriken', vol: 20000, dp: 2000000, pl: 2000000 },
      { id: 'ld',    fn: 'ZYBIO Z5 LD LYSE 500ML',     pack: '500 mL/btl',        vol: 500,   dp: 2500000, pl: 2500000 },
      { id: 'lb',    fn: 'ZYBIO Z5 LB LYSE 200ML',     pack: '200 mL/btl',        vol: 200,   dp: 2000000, pl: 2000000 },
      { id: 'probe', fn: 'ZYBIO PROBE CLEANSER 50ML',  pack: '50 mL/btl',         vol: 50,    dp: 400000,  pl: 400000  },
    ],
    calc(tpm, wd, rp) {
      if (!tpm || !wd) return null;
      const D    = tpm / wd;
      const dnpm = rp.dn / 20000;
      const ldpm = rp.ld / 500;
      const lbpm = rp.lb / 200;
      const cyc  = 42.253 * dnpm + 1.2 * ldpm + 0.205 * lbpm;
      const fix  = ((141.674 + 64.972) * dnpm + 2.2 * ldpm + 0.305 * lbpm) / D;
      return {
        total: cyc + fix, cyc, fix,
        pr: {
          dn:    { c: 42.253 * dnpm, f: (141.674 + 64.972) * dnpm / D },
          ld:    { c: 1.2   * ldpm,  f: 2.2 * ldpm / D },
          lb:    { c: 0.205 * lbpm,  f: 0.305 * lbpm / D },
          probe: { c: 0,             f: 0 },
        },
      };
    },
  },

  Z50: {
    label: 'Z50', diff: '5-Diff',
    dP: 210e6, dPl: 210e6, dD: 0, dK: 60, dM: 20, dT: 750,
    ctrlPl: 2000000, calPl: null,
    testPresets: [250, 500, 750, 1000, 1500, 2000],
    reagents: [
      { id: 'dn',    fn: 'ZYBIO Z5 DN DILUENT 20L',    pack: '20.000 mL/jeriken', vol: 20000, dp: 2000000, pl: 2000000 },
      { id: 'ld',    fn: 'ZYBIO Z5 LD LYSE 500ML',     pack: '500 mL/btl',        vol: 500,   dp: 2500000, pl: 2500000 },
      { id: 'lb',    fn: 'ZYBIO Z5 LB LYSE 200ML',     pack: '200 mL/btl',        vol: 200,   dp: 2000000, pl: 2000000 },
      { id: 'probe', fn: 'ZYBIO PROBE CLEANSER 50ML',  pack: '50 mL/btl',         vol: 50,    dp: 400000,  pl: 400000  },
    ],
    calc(tpm, wd, rp) {
      if (!tpm || !wd) return null;
      const D    = tpm / wd;
      const dnpm = rp.dn / 20000;
      const ldpm = rp.ld / 500;
      const lbpm = rp.lb / 200;
      const cyc  = 42.253 * dnpm + 1.2 * ldpm + 0.205 * lbpm;
      const fix  = ((141.674 + 64.972) * dnpm + 2.2 * ldpm + 0.305 * lbpm) / D;
      return {
        total: cyc + fix, cyc, fix,
        pr: {
          dn:    { c: 42.253 * dnpm, f: (141.674 + 64.972) * dnpm / D },
          ld:    { c: 1.2   * ldpm,  f: 2.2 * ldpm / D },
          lb:    { c: 0.205 * lbpm,  f: 0.305 * lbpm / D },
          probe: { c: 0,             f: 0 },
        },
      };
    },
  },

  EXZ6000: {
    label: 'EXZ6000', diff: '5-Diff',
    dP: 365e6, dPl: 365e6, dD: 0, dK: 60, dM: 20, dT: 1500,
    ctrlPl: null, calPl: null,
    testPresets: [500, 1000, 1500, 2000, 2500, 3000],
    reagents: [
      { id: 'dn',    fn: 'ZYBIO Z5 DN DILUENT 20L',      pack: '20.000 mL/jeriken', vol: 20000, dp: 2000000, pl: 2000000 },
      { id: 'ldi',   fn: 'ZYBIO H56 LD-I LYSE 1L',       pack: '1.000 mL/btl',      vol: 1000,  dp: 2600000, pl: 2600000 },
      { id: 'ldii',  fn: 'ZYBIO H56 LD-II LYSE 500ML',   pack: '500 mL/btl',        vol: 500,   dp: 3250000, pl: 3250000 },
      { id: 'lb',    fn: 'ZYBIO Z5 LB LYSE 500ML',       pack: '500 mL/btl',        vol: 500,   dp: 2250000, pl: 2250000 },
      { id: 'probe', fn: 'ZYBIO PROBE CLEANSER 50ML',    pack: '50 mL/btl',         vol: 50,    dp: 400000,  pl: 400000  },
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
      const esleep= 2 * 9.405 * dnpm;
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

  EXZ8000: {
    label: 'EXZ8000', diff: '6-Diff',
    dP: 754800000, dPl: 754800000, dD: 0, dK: 60, dM: 20, dT: 2000,
    xnCtrlPl: 5720000, xrCtrlPl: 11440000, calPl: 1650000,

    testModes: [
      { id: 'cbc_diff_ret',    label: 'CBC+DIFF+RET',                       short: 'DIFF+RET'    },
      { id: 'cbc_diff_xn',     label: 'CBC+DIFF + Chek XN Ctrl+Cal',        short: 'XN Ctrl+Cal' },
      { id: 'cbc_diff_ret_xr', label: 'CBC+DIFF+RET + Chek XR Ctrl+Cal',    short: 'XR Ctrl+Cal' },
    ],

    testPresets: [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000],

    reagents: [
      { id: 'dn',    fn: 'H58 DN DILUENT 20L',       pack: '20.000 mL/jeriken', vol: 20000, dp: 1870000,  pl: 1815000  },
      { id: 'ld',    fn: 'H58 LD LYSE 4L',            pack: '4.000 mL/btl',     vol: 4000,  dp: 11787000, pl: 11440000 },
      { id: 'ln',    fn: 'H58 LN LYSE 4L',            pack: '4.000 mL/btl',     vol: 4000,  dp: 11787000, pl: 11440000 },
      { id: 'fd',    fn: 'H58 FD DYE 48ML',           pack: '48 mL/btl',        vol: 48,    dp: 8840000,  pl: 8580000  },
      { id: 'fn',    fn: 'H58 FN DYE 48ML',           pack: '48 mL/btl',        vol: 48,    dp: 2550000,  pl: 2475000  },
      { id: 'ls',    fn: 'H58 LS LYSE 1L',            pack: '1.000 mL/btl',     vol: 1000,  dp: 3684000,  pl: 3575000  },
      { id: 'dr',    fn: 'H58 DR DILUENT 1L',         pack: '1.000 mL/btl',     vol: 1000,  dp: 2947000,  pl: 2860000  },
      { id: 'fr',    fn: 'H58 FR DYE 12ML',           pack: '12 mL/btl',        vol: 12,    dp: 9577000,  pl: 9295000  },
      { id: 'probe', fn: 'PROBE CLEANSER 50ML×2',     pack: '100 mL/pack',      vol: 100,   dp: 800000,   pl: 800000   },
    ],

    calc(tpm, wd, rp, mode) {
      if (!tpm || !wd) return null;
      const D    = tpm / wd;
      const m    = mode || 'cbc_diff_ret';
      const dnpm = rp.dn / 20000, ldpm = rp.ld / 4000, lnpm = rp.ln / 4000;
      const fdpm = rp.fd / 48,    fnpm = rp.fn / 48,    lspm = rp.ls / 1000;
      const drpm = rp.dr / 1000,  frpm = rp.fr / 12,    ppm  = rp.probe / 100;

      const isRet = m === 'cbc_diff_ret' || m === 'cbc_diff_ret_xr';

      // cycle per test — DN=56 mL for RET (42 DIFF + 14 RET channel)
      const cc_dn = isRet ? 56 : 42;
      const cc_ld = 1.56, cc_ln = 1.50, cc_fd = 0.02, cc_fn = 0.02, cc_ls = 0.50;
      const cc_dr = isRet ? 1.56 : 0;
      const cc_fr = isRet ? 0.02 : 0;

      // startup/shutdown fixed daily
      const su_dn = 162, su_ld = 3.06, su_ln = 3.00, su_fd = 0.10, su_fn = 0.08, su_ls = 1.50;
      const su_dr = isRet ? 1.56 : 0;
      const su_fr = 0.02;
      const sd_dn = 140, sd_ld = 0.50, sd_ln = 0.50, sd_fd = 0.02, sd_fn = 0.02, sd_ls = 1.00;
      const sd_dr = 0;
      const sd_fr = 0.006667;

      const cyc = cc_dn*dnpm + cc_ld*ldpm + cc_ln*lnpm + cc_fd*fdpm + cc_fn*fnpm +
                  cc_ls*lspm + cc_dr*drpm + cc_fr*frpm;
      const fix = ((su_dn+sd_dn)*dnpm + (su_ld+sd_ld)*ldpm + (su_ln+sd_ln)*lnpm +
                   (su_fd+sd_fd)*fdpm + (su_fn+sd_fn)*fnpm + (su_ls+sd_ls)*lspm +
                   (su_dr+sd_dr)*drpm + (su_fr+sd_fr)*frpm + 3*ppm) / D;

      return {
        total: cyc + fix, cyc, fix,
        pr: {
          dn:    { c: cc_dn*dnpm, f: (su_dn+sd_dn)*dnpm/D },
          ld:    { c: cc_ld*ldpm, f: (su_ld+sd_ld)*ldpm/D },
          ln:    { c: cc_ln*lnpm, f: (su_ln+sd_ln)*lnpm/D },
          fd:    { c: cc_fd*fdpm, f: (su_fd+sd_fd)*fdpm/D },
          fn:    { c: cc_fn*fnpm, f: (su_fn+sd_fn)*fnpm/D },
          ls:    { c: cc_ls*lspm, f: (su_ls+sd_ls)*lspm/D },
          dr:    { c: cc_dr*drpm, f: (su_dr+sd_dr)*drpm/D },
          fr:    { c: cc_fr*frpm, f: (su_fr+sd_fr)*frpm/D },
          probe: { c: 0,          f: 3*ppm/D },
        },
      };
    },
  },
};

// ─── KIMIA KLINIK — PANEL GROUPS ─────────────────────────────────────────────

export const CC_PANELS = ['Hepatic', 'Renal', 'Lipid', 'Metabolic', 'Control', 'Consumable'];

// ─── KIMIA KLINIK — DEFAULT PARAMETER LIST ───────────────────────────────────

export const CC_P = [
  // Hepatic
  { no: 1,  p: 'SGOT',            pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 562500,   pl: 562500   },
  { no: 2,  p: 'SGPT',            pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 562500,   pl: 562500   },
  { no: 3,  p: 'ALB',             pan: 'Hepatic',    pack: 'R:30mL×6',               t: 495, dp: 540000,   pl: 540000   },
  { no: 4,  p: 'ALP',             pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 562500,   pl: 562500   },
  { no: 5,  p: 'TBIL',            pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 226, dp: 562500,   pl: 562500   },
  { no: 6,  p: 'DBIL',            pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 226, dp: 562500,   pl: 562500   },
  { no: 7,  p: 'TP',              pan: 'Hepatic',    pack: 'R:30mL×6',               t: 495, dp: 540000,   pl: 540000   },
  { no: 8,  p: 'GGT',             pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 1102500,  pl: 1102500  },
  // Renal
  { no: 9,  p: 'CREA',            pan: 'Renal',      pack: 'R1:30mL×1  R2:10mL×1',  t: 102, dp: 1200000,  pl: 1200000  },
  { no: 10, p: 'UREA',            pan: 'Renal',      pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 720000,   pl: 720000   },
  { no: 11, p: 'UA',              pan: 'Renal',      pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 720000,   pl: 720000   },
  // Lipid
  { no: 12, p: 'TC',              pan: 'Lipid',      pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 1057500,  pl: 1057500  },
  { no: 13, p: 'TG',              pan: 'Lipid',      pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 1350000,  pl: 1350000  },
  { no: 14, p: 'HDL-C',           pan: 'Lipid',      pack: 'R1:30mL×3  R2:10mL×3',  t: 289, dp: 3360000,  pl: 3360000  },
  { no: 15, p: 'LDL-C',           pan: 'Lipid',      pack: 'R1:30mL×3  R2:10mL×3',  t: 289, dp: 5520000,  pl: 5520000  },
  // Metabolic
  { no: 16, p: 'GLU',             pan: 'Metabolic',  pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 900000,   pl: 900000   },
  // Control
  { no: 17, p: 'Zybio Level 1',    pan: 'Control',    pack: '5 mL/vial',              t: 50,  dp: 1320000,  pl: 1320000  },
  { no: 18, p: 'Zybio Level 2',    pan: 'Control',    pack: '5 mL/vial',              t: 50,  dp: 1320000,  pl: 1320000  },
  // Consumable
  { no: 19, p: 'Conc Detergent',  pan: 'Consumable', pack: '5L×4 (20L)',             t: 132, dp: 10032000, pl: 10032000 },
  { no: 20, p: 'Probe Detergent', pan: 'Consumable', pack: '30mL×8 (240mL)',         t: 950, dp: 4026000,  pl: 4026000  },
];

// ─── CROSSMATCH ───────────────────────────────────────────────────────────────

export const CROSSMATCH = {
  LIBO: {
    label: 'LIBO', brand: 'Libiotic · Coombs Card',
    dP: 46564500, dD: 0, dK: 60, dM: 20, dT: 100,
    testPresets: [50, 100, 150, 200, 300, 500],
    methods: [
      { id: 'm1', label: 'Mayor (1 well)',         cols: 1, liss_ml: 0.67 },
      { id: 'm2', label: 'Mayor + Minor (2 well)', cols: 2, liss_ml: 1.33 },
      { id: 'm3', label: 'Mayor + Minor + AC',     cols: 3, liss_ml: 2.0  },
    ],
    reagents: [
      { id: 'card', fn: 'Coombs Card AHG (Anti-IgG+C3d)', pack: '360 well/kit', vol: 360, dp: 2214000 },
      { id: 'liss', fn: 'LISS (Low Ionic Salt Solution)',   pack: '250 mL/btl',  vol: 250, dp: 1107000 },
    ],
    calc(tpm, wd, rp, method) {
      if (!tpm || !wd) return null;
      const m = this.methods.find(x => x.id === method) || this.methods[2];
      const cardPm  = rp.card / 360;
      const lissPm  = rp.liss / 250;
      const cardCpt = m.cols    * cardPm;
      const lissCpt = m.liss_ml * lissPm;
      return { total: cardCpt + lissCpt, pr: { card: cardCpt, liss: lissCpt } };
    },
  },

  REDCEL: {
    label: 'REDCEL', brand: 'RedCell Biotechnology',
    dP: 0, dD: 0, dK: 60, dM: 20, dT: 100,
    testPresets: [50, 100, 150, 200, 300, 500],
    methods: [
      { id: 'xm',  label: 'Crossmatch (My+Mn+AC)', cols: 3, liss_ml: 1.0 },
      { id: 'dct', label: 'DCT (Direct Coombs)',    cols: 1, liss_ml: 0.5 },
    ],
    reagents: [
      { id: 'ahg',  fn: 'RC AHG (Anti-Human Globulin)', pack: '384 kolom/kit', vol: 384, dp: 3885000 },
      { id: 'liss', fn: 'RC Liss Diluent',               pack: '500 mL/btl',   vol: 500, dp: 2500000 },
    ],
    calc(tpm, wd, rp, method) {
      if (!tpm || !wd) return null;
      const m = this.methods.find(x => x.id === method) || this.methods[0];
      const ahgPm  = rp.ahg  / 384;
      const lissPm = rp.liss / 500;
      const ahgCpt  = m.cols    * ahgPm;
      const lissCpt = m.liss_ml * lissPm;
      return { total: ahgCpt + lissCpt, pr: { ahg: ahgCpt, liss: lissCpt } };
    },
  },
};

// ─── CLIA — PANEL GROUPS ─────────────────────────────────────────────────────

export const CLIA_PANELS = {
  SNIBE: [
    'Cardiac/IGD', 'Diabetes', 'Infeksi screening', 'Sepsis/Inflam',
    'Thyroid', 'Anemia/Bone', 'Fertility/Hormon', 'Dengue',
    'Thyroid lanjut', 'TORCH/ANC', 'Tumor Marker', 'Anemia',
    'Tumor lanjut', 'Bone', 'Inflam lanjut', 'Fertility lanjut',
    'Prenatal', 'Gastric', 'Diabetes lanjut', 'Adrenal/HT',
    'Kidney', 'Drug Monitor', 'EBV', 'Growth',
    'Hepatic', 'Immunoglobulin', 'Autoimmune', 'Khusus',
    'Thyroid niche', 'Lainnya',
  ],
  WONDFO: ['Infectious', 'Thyroid', 'Fertility', 'Tumour', 'Critical', 'Metabolism'],
};

// ─── CLIA — SNIBE MAGLUMI X3 PARAMETERS ──────────────────────────────────────

export const SNIBE_P = [
  // Cardiac/IGD — 100T
  { no:   1, name: 'BNP', pan: 'Cardiac/IGD', kit: 100, dp: 23873000 },
  { no:   2, name: 'CK-MB', pan: 'Cardiac/IGD', kit: 100, dp: 12406000 },
  { no:   3, name: 'D-Dimer', pan: 'Cardiac/IGD', kit: 100, dp: 18985000 },
  { no:   4, name: 'NT-proBNP', pan: 'Cardiac/IGD', kit: 100, dp: 23967000 },
  { no:   5, name: 'cTnI', pan: 'Cardiac/IGD', kit: 100, dp: 11184000 },
  { no:   6, name: 'hs-cTnI', pan: 'Cardiac/IGD', kit: 100, dp: 15038000 },
  { no:   7, name: 'BNP', pan: 'Cardiac/IGD', kit: 50, dp: 11936000 },
  { no:   8, name: 'CK-MB', pan: 'Cardiac/IGD', kit: 50, dp: 8064000 },
  { no:   9, name: 'D-Dimer', pan: 'Cardiac/IGD', kit: 50, dp: 9493000 },
  { no:  10, name: 'NT-proBNP', pan: 'Cardiac/IGD', kit: 50, dp: 11983000 },
  { no:  11, name: 'cTnI', pan: 'Cardiac/IGD', kit: 50, dp: 5592000 },
  { no:  12, name: 'hs-cTnI', pan: 'Cardiac/IGD', kit: 50, dp: 7519000 },
  // Diabetes — 100T
  { no:  13, name: 'Insulin', pan: 'Diabetes', kit: 100, dp: 8835000 },
  { no:  14, name: 'Proinsulin', pan: 'Diabetes', kit: 100, dp: 13346000 },
  { no:  15, name: 'Insulin', pan: 'Diabetes', kit: 50, dp: 5743000 },
  { no:  16, name: 'Proinsulin', pan: 'Diabetes', kit: 50, dp: 8675000 },
  // Infeksi screening — 100T
  { no:  17, name: 'Anti-HCV', pan: 'Infeksi screening', kit: 100, dp: 4890000 },
  { no:  18, name: 'HBsAg Quantitative', pan: 'Infeksi screening', kit: 100, dp: 5360000 },
  { no:  19, name: 'HIV Ab/Ag Combi', pan: 'Infeksi screening', kit: 100, dp: 5380000 },
  { no:  20, name: 'Syphilis', pan: 'Infeksi screening', kit: 100, dp: 4060000 },
  { no:  21, name: 'HBsAg Qualitative', pan: 'Infeksi screening', kit: 100, dp: 2707000 },
  { no:  22, name: 'HBsAg Quantitative', pan: 'Infeksi screening', kit: 50, dp: 3055000 },
  // Sepsis/Inflam — 100T
  { no:  23, name: 'CRP', pan: 'Sepsis/Inflam', kit: 100, dp: 13346000 },
  { no:  24, name: 'PCT', pan: 'Sepsis/Inflam', kit: 100, dp: 28196000 },
  { no:  25, name: 'hs-CRP', pan: 'Sepsis/Inflam', kit: 100, dp: 13534000 },
  { no:  26, name: 'CRP', pan: 'Sepsis/Inflam', kit: 50, dp: 8675000 },
  { no:  27, name: 'PCT', pan: 'Sepsis/Inflam', kit: 50, dp: 18328000 },
  { no:  28, name: 'hs-CRP', pan: 'Sepsis/Inflam', kit: 50, dp: 8797000 },
  // Thyroid — 100T
  { no:  29, name: 'Free T3', pan: 'Thyroid', kit: 100, dp: 3572000 },
  { no:  30, name: 'Free T4', pan: 'Thyroid', kit: 100, dp: 3572000 },
  { no:  31, name: 'TSH', pan: 'Thyroid', kit: 100, dp: 3759000 },
  { no:  32, name: 'Free T3', pan: 'Thyroid', kit: 50, dp: 1786000 },
  { no:  33, name: 'Free T4', pan: 'Thyroid', kit: 50, dp: 1786000 },
  { no:  34, name: 'TSH', pan: 'Thyroid', kit: 50, dp: 2444000 },
  // Anemia/Bone — 100T
  { no:  35, name: 'Ferritin', pan: 'Anemia/Bone', kit: 100, dp: 4605000 },
  { no:  36, name: 'Ferritin', pan: 'Anemia/Bone', kit: 50, dp: 2993000 },
  { no:  37, name: '25-OH Vitamin D', pan: 'Anemia/Bone', kit: 100, dp: 18797000 },
  { no:  38, name: '25-OH Vitamin D', pan: 'Anemia/Bone', kit: 50, dp: 12218000 },
  // Fertility/Hormon — 100T
  { no:  39, name: '17α-OH Progesterone', pan: 'Fertility/Hormon', kit: 100, dp: 8835000 },
  { no:  40, name: 'Estradiol', pan: 'Fertility/Hormon', kit: 100, dp: 4981000 },
  { no:  41, name: 'FSH', pan: 'Fertility/Hormon', kit: 100, dp: 4981000 },
  { no:  42, name: 'Free-Testosterone', pan: 'Fertility/Hormon', kit: 100, dp: 7425000 },
  { no:  43, name: 'LH', pan: 'Fertility/Hormon', kit: 100, dp: 4981000 },
  { no:  44, name: 'Progesterone', pan: 'Fertility/Hormon', kit: 100, dp: 4981000 },
  { no:  45, name: 'Prolactin', pan: 'Fertility/Hormon', kit: 100, dp: 4981000 },
  { no:  46, name: 'Testosterone', pan: 'Fertility/Hormon', kit: 100, dp: 4981000 },
  { no:  47, name: '17α-OH Progesterone', pan: 'Fertility/Hormon', kit: 50, dp: 5743000 },
  { no:  48, name: 'Estradiol', pan: 'Fertility/Hormon', kit: 50, dp: 3238000 },
  { no:  49, name: 'FSH', pan: 'Fertility/Hormon', kit: 50, dp: 3238000 },
  { no:  50, name: 'Free-Testosterone', pan: 'Fertility/Hormon', kit: 50, dp: 4826000 },
  { no:  51, name: 'LH', pan: 'Fertility/Hormon', kit: 50, dp: 3238000 },
  { no:  52, name: 'Progesterone', pan: 'Fertility/Hormon', kit: 50, dp: 3238000 },
  { no:  53, name: 'Prolactin', pan: 'Fertility/Hormon', kit: 50, dp: 3238000 },
  { no:  54, name: 'Testosterone', pan: 'Fertility/Hormon', kit: 50, dp: 3238000 },
  // Dengue — 100T
  { no:  55, name: 'Anti-Dengue Virus IgG', pan: 'Dengue', kit: 100, dp: 12970000 },
  { no:  56, name: 'Anti-Dengue Virus IgM', pan: 'Dengue', kit: 100, dp: 14474000 },
  { no:  57, name: 'Dengue virus NS1 Antigen', pan: 'Dengue', kit: 100, dp: 13910000 },
  { no:  58, name: 'Anti-Dengue Virus IgG', pan: 'Dengue', kit: 50, dp: 6485000 },
  { no:  59, name: 'Anti-Dengue Virus IgM', pan: 'Dengue', kit: 50, dp: 7237000 },
  { no:  60, name: 'Dengue virus NS1 Antigen', pan: 'Dengue', kit: 50, dp: 6955000 },
  // Thyroid lanjut — 100T
  { no:  61, name: 'Anti-TPO', pan: 'Thyroid lanjut', kit: 100, dp: 9869000 },
  { no:  62, name: 'Total T3', pan: 'Thyroid lanjut', kit: 100, dp: 3572000 },
  { no:  63, name: 'Total T4', pan: 'Thyroid lanjut', kit: 100, dp: 3572000 },
  { no:  64, name: 'Anti-TPO', pan: 'Thyroid lanjut', kit: 50, dp: 4934000 },
  { no:  65, name: 'Total T3', pan: 'Thyroid lanjut', kit: 50, dp: 1786000 },
  { no:  66, name: 'Total T4', pan: 'Thyroid lanjut', kit: 50, dp: 1786000 },
  // TORCH/ANC — 100T
  { no:  67, name: 'HSV-1 IgG', pan: 'TORCH/ANC', kit: 100, dp: 9305000 },
  { no:  68, name: 'HSV-1 IgM', pan: 'TORCH/ANC', kit: 100, dp: 9305000 },
  { no:  69, name: 'HSV-1/2 IgG', pan: 'TORCH/ANC', kit: 100, dp: 9305000 },
  { no:  70, name: 'HSV-1/2 IgM', pan: 'TORCH/ANC', kit: 100, dp: 9305000 },
  { no:  71, name: 'HSV-2 IgG', pan: 'TORCH/ANC', kit: 100, dp: 9305000 },
  { no:  72, name: 'HSV-2 IgM', pan: 'TORCH/ANC', kit: 100, dp: 9305000 },
  { no:  73, name: 'CMV IgG', pan: 'TORCH/ANC', kit: 100, dp: 9117000 },
  { no:  74, name: 'CMV IgM', pan: 'TORCH/ANC', kit: 100, dp: 9117000 },
  { no:  75, name: 'Rubella IgG', pan: 'TORCH/ANC', kit: 100, dp: 9117000 },
  { no:  76, name: 'Rubella IgM', pan: 'TORCH/ANC', kit: 100, dp: 9117000 },
  { no:  77, name: 'Toxo IgG', pan: 'TORCH/ANC', kit: 100, dp: 9117000 },
  { no:  78, name: 'Toxo IgM', pan: 'TORCH/ANC', kit: 100, dp: 9117000 },
  { no:  79, name: 'HSV-1 IgG', pan: 'TORCH/ANC', kit: 50, dp: 6048000 },
  { no:  80, name: 'HSV-1 IgM', pan: 'TORCH/ANC', kit: 50, dp: 6048000 },
  { no:  81, name: 'HSV-1/2 IgG', pan: 'TORCH/ANC', kit: 50, dp: 6048000 },
  { no:  82, name: 'HSV-1/2 IgM', pan: 'TORCH/ANC', kit: 50, dp: 6048000 },
  { no:  83, name: 'HSV-2 IgG', pan: 'TORCH/ANC', kit: 50, dp: 6048000 },
  { no:  84, name: 'HSV-2 IgM', pan: 'TORCH/ANC', kit: 50, dp: 6048000 },
  { no:  85, name: 'CMV IgG', pan: 'TORCH/ANC', kit: 50, dp: 5926000 },
  { no:  86, name: 'CMV IgM', pan: 'TORCH/ANC', kit: 50, dp: 5926000 },
  { no:  87, name: 'Rubella IgG', pan: 'TORCH/ANC', kit: 50, dp: 5926000 },
  { no:  88, name: 'Rubella IgM', pan: 'TORCH/ANC', kit: 50, dp: 5926000 },
  { no:  89, name: 'Toxo IgG', pan: 'TORCH/ANC', kit: 50, dp: 5926000 },
  { no:  90, name: 'Toxo IgM', pan: 'TORCH/ANC', kit: 50, dp: 5926000 },
  // Tumor Marker — 100T
  { no:  91, name: 'AFP', pan: 'Tumor Marker', kit: 100, dp: 4605000 },
  { no:  92, name: 'CA 125', pan: 'Tumor Marker', kit: 100, dp: 11560000 },
  { no:  93, name: 'CA 15-3', pan: 'Tumor Marker', kit: 100, dp: 11560000 },
  { no:  94, name: 'CA 19-9', pan: 'Tumor Marker', kit: 100, dp: 11560000 },
  { no:  95, name: 'CEA', pan: 'Tumor Marker', kit: 100, dp: 4605000 },
  { no:  96, name: 'Free PSA', pan: 'Tumor Marker', kit: 100, dp: 8459000 },
  { no:  97, name: 'Total PSA', pan: 'Tumor Marker', kit: 100, dp: 7613000 },
  { no:  98, name: 'AFP', pan: 'Tumor Marker', kit: 50, dp: 2993000 },
  { no:  99, name: 'CA 125', pan: 'Tumor Marker', kit: 50, dp: 5780000 },
  { no: 100, name: 'CA 15-3', pan: 'Tumor Marker', kit: 50, dp: 5780000 },
  { no: 101, name: 'CA 19-9', pan: 'Tumor Marker', kit: 50, dp: 5780000 },
  { no: 102, name: 'CEA', pan: 'Tumor Marker', kit: 50, dp: 2303000 },
  { no: 103, name: 'Free PSA', pan: 'Tumor Marker', kit: 50, dp: 4229000 },
  { no: 104, name: 'Total PSA', pan: 'Tumor Marker', kit: 50, dp: 3806000 },
  // Anemia — 100T
  { no: 105, name: 'EPO', pan: 'Anemia', kit: 100, dp: 16542000 },
  { no: 106, name: 'Folate', pan: 'Anemia', kit: 100, dp: 7425000 },
  { no: 107, name: 'Vitamin B12', pan: 'Anemia', kit: 100, dp: 11560000 },
  { no: 108, name: 'EPO', pan: 'Anemia', kit: 50, dp: 10752000 },
  { no: 109, name: 'Folate', pan: 'Anemia', kit: 50, dp: 4826000 },
  { no: 110, name: 'Vitamin B12', pan: 'Anemia', kit: 50, dp: 7514000 },
  // Tumor lanjut — 100T
  { no: 111, name: 'Calcitonin', pan: 'Tumor lanjut', kit: 100, dp: 13346000 },
  // Bone — 100T
  { no: 112, name: 'Intact PTH', pan: 'Bone', kit: 100, dp: 14004000 },
  { no: 113, name: 'Osteocalcin', pan: 'Bone', kit: 100, dp: 13346000 },
  { no: 114, name: 'total P1NP', pan: 'Bone', kit: 100, dp: 14474000 },
  { no: 115, name: 'β-CTx', pan: 'Bone', kit: 100, dp: 14474000 },
  // Tumor lanjut — 50T
  { no: 116, name: 'Calcitonin', pan: 'Tumor lanjut', kit: 50, dp: 8675000 },
  // Bone — 50T
  { no: 117, name: 'Intact PTH', pan: 'Bone', kit: 50, dp: 9103000 },
  { no: 118, name: 'Osteocalcin', pan: 'Bone', kit: 50, dp: 8675000 },
  { no: 119, name: 'total P1NP', pan: 'Bone', kit: 50, dp: 9408000 },
  { no: 120, name: 'β-CTx', pan: 'Bone', kit: 50, dp: 9408000 },
  // Inflam lanjut — 100T
  { no: 121, name: 'Myoglobin', pan: 'Inflam lanjut', kit: 100, dp: 12406000 },
  { no: 122, name: 'Myoglobin', pan: 'Inflam lanjut', kit: 50, dp: 6203000 },
  // Fertility lanjut — 100T
  { no: 123, name: 'AMH', pan: 'Fertility lanjut', kit: 100, dp: 45208000 },
  { no: 124, name: 'DHEA-S', pan: 'Fertility lanjut', kit: 100, dp: 13158000 },
  // Prenatal — 100T
  { no: 125, name: 'PlGF', pan: 'Prenatal', kit: 100, dp: 58648000 },
  // Fertility lanjut — 100T
  { no: 126, name: 'SHBG', pan: 'Fertility lanjut', kit: 100, dp: 7989000 },
  // Prenatal — 100T
  { no: 127, name: 'sFlt-1', pan: 'Prenatal', kit: 100, dp: 58648000 },
  // Fertility lanjut — 50T
  { no: 128, name: 'AMH', pan: 'Fertility lanjut', kit: 50, dp: 29385000 },
  { no: 129, name: 'DHEA-S', pan: 'Fertility lanjut', kit: 50, dp: 8553000 },
  // Prenatal — 50T
  { no: 130, name: 'PlGF', pan: 'Prenatal', kit: 50, dp: 38121000 },
  // Fertility lanjut — 50T
  { no: 131, name: 'SHBG', pan: 'Fertility lanjut', kit: 50, dp: 5193000 },
  // Prenatal — 50T
  { no: 132, name: 'sFlt-1', pan: 'Prenatal', kit: 50, dp: 38121000 },
  // Gastric — 100T
  { no: 133, name: 'Gastrin-17', pan: 'Gastric', kit: 100, dp: 8459000 },
  { no: 134, name: 'H.pylori IgA', pan: 'Gastric', kit: 100, dp: 11466000 },
  { no: 135, name: 'H.pylori IgG', pan: 'Gastric', kit: 100, dp: 11466000 },
  { no: 136, name: 'H.pylori IgM', pan: 'Gastric', kit: 100, dp: 11466000 },
  { no: 137, name: 'Pepsinogen I', pan: 'Gastric', kit: 100, dp: 18328000 },
  { no: 138, name: 'Pepsinogen II', pan: 'Gastric', kit: 100, dp: 18328000 },
  { no: 139, name: 'Gastrin-17', pan: 'Gastric', kit: 50, dp: 5498000 },
  { no: 140, name: 'H.pylori IgA', pan: 'Gastric', kit: 50, dp: 7453000 },
  { no: 141, name: 'H.pylori IgG', pan: 'Gastric', kit: 50, dp: 7453000 },
  { no: 142, name: 'H.pylori IgM', pan: 'Gastric', kit: 50, dp: 7453000 },
  { no: 143, name: 'Pepsinogen I', pan: 'Gastric', kit: 50, dp: 11913000 },
  { no: 144, name: 'Pepsinogen II', pan: 'Gastric', kit: 50, dp: 11913000 },
  // Diabetes lanjut — 100T
  { no: 145, name: 'Anti-GAD', pan: 'Diabetes lanjut', kit: 100, dp: 14192000 },
  { no: 146, name: 'Anti-IA2', pan: 'Diabetes lanjut', kit: 100, dp: 14568000 },
  { no: 147, name: 'C-Peptide', pan: 'Diabetes lanjut', kit: 100, dp: 8835000 },
  { no: 148, name: 'IAA', pan: 'Diabetes lanjut', kit: 100, dp: 13346000 },
  { no: 149, name: 'ICA', pan: 'Diabetes lanjut', kit: 100, dp: 14192000 },
  { no: 150, name: 'Anti-GAD', pan: 'Diabetes lanjut', kit: 50, dp: 9225000 },
  { no: 151, name: 'Anti-IA2', pan: 'Diabetes lanjut', kit: 50, dp: 9469000 },
  { no: 152, name: 'C-Peptide', pan: 'Diabetes lanjut', kit: 50, dp: 5743000 },
  { no: 153, name: 'IAA', pan: 'Diabetes lanjut', kit: 50, dp: 8675000 },
  { no: 154, name: 'ICA', pan: 'Diabetes lanjut', kit: 50, dp: 9225000 },
  // Adrenal/HT — 100T
  { no: 155, name: 'ACTH', pan: 'Adrenal/HT', kit: 100, dp: 13346000 },
  { no: 156, name: 'Aldosterone', pan: 'Adrenal/HT', kit: 100, dp: 13346000 },
  { no: 157, name: 'Cortisol', pan: 'Adrenal/HT', kit: 100, dp: 8459000 },
  { no: 158, name: 'Direct Renin', pan: 'Adrenal/HT', kit: 100, dp: 17858000 },
  { no: 159, name: 'ACTH', pan: 'Adrenal/HT', kit: 50, dp: 6673000 },
  { no: 160, name: 'Aldosterone', pan: 'Adrenal/HT', kit: 50, dp: 6673000 },
  { no: 161, name: 'Cortisol', pan: 'Adrenal/HT', kit: 50, dp: 5498000 },
  { no: 162, name: 'Direct Renin', pan: 'Adrenal/HT', kit: 50, dp: 8929000 },
  // Inflam lanjut — 100T
  { no: 163, name: 'IL-6', pan: 'Inflam lanjut', kit: 100, dp: 22745000 },
  { no: 164, name: 'IL-6', pan: 'Inflam lanjut', kit: 50, dp: 14784000 },
  // Kidney — 100T
  { no: 165, name: 'Albumin', pan: 'Kidney', kit: 100, dp: 9117000 },
  { no: 166, name: 'β2-Microglobulin', pan: 'Kidney', kit: 100, dp: 9117000 },
  { no: 167, name: 'Albumin', pan: 'Kidney', kit: 50, dp: 4558000 },
  { no: 168, name: 'β2-Microglobulin', pan: 'Kidney', kit: 50, dp: 5926000 },
  // Prenatal — 100T
  { no: 169, name: 'PAPP-A', pan: 'Prenatal', kit: 100, dp: 10903000 },
  { no: 170, name: 'free β-HCG', pan: 'Prenatal', kit: 100, dp: 10903000 },
  { no: 171, name: 'PAPP-A', pan: 'Prenatal', kit: 50, dp: 7087000 },
  { no: 172, name: 'free β-HCG', pan: 'Prenatal', kit: 50, dp: 7087000 },
  // Tumor lanjut — 100T
  { no: 173, name: 'CA 72-4', pan: 'Tumor lanjut', kit: 100, dp: 15038000 },
  { no: 174, name: 'CYFRA 21-1', pan: 'Tumor lanjut', kit: 100, dp: 15038000 },
  { no: 175, name: 'HE4', pan: 'Tumor lanjut', kit: 100, dp: 23309000 },
  { no: 176, name: 'NSE', pan: 'Tumor lanjut', kit: 100, dp: 16730000 },
  { no: 177, name: 'ProGRP', pan: 'Tumor lanjut', kit: 100, dp: 22745000 },
  { no: 178, name: 'SCCA', pan: 'Tumor lanjut', kit: 100, dp: 25001000 },
  { no: 179, name: 'TPA', pan: 'Tumor lanjut', kit: 100, dp: 22275000 },
  { no: 180, name: 'CA 72-4', pan: 'Tumor lanjut', kit: 50, dp: 7519000 },
  { no: 181, name: 'CYFRA 21-1', pan: 'Tumor lanjut', kit: 50, dp: 7519000 },
  { no: 182, name: 'HE4', pan: 'Tumor lanjut', kit: 50, dp: 11654000 },
  { no: 183, name: 'NSE', pan: 'Tumor lanjut', kit: 50, dp: 8365000 },
  { no: 184, name: 'ProGRP', pan: 'Tumor lanjut', kit: 50, dp: 11372000 },
  { no: 185, name: 'SCCA', pan: 'Tumor lanjut', kit: 50, dp: 12500000 },
  { no: 186, name: 'TPA', pan: 'Tumor lanjut', kit: 50, dp: 11138000 },
  // Autoimmune — 50T
  { no: 187, name: 'AMA-M2 IgG', pan: 'Autoimmune', kit: 50, dp: 10997000 },
  { no: 188, name: 'ANA Screen', pan: 'Autoimmune', kit: 50, dp: 8083000 },
  { no: 189, name: 'Anti-CCP', pan: 'Autoimmune', kit: 50, dp: 12782000 },
  { no: 190, name: 'Anti-Cardiolipin IgG', pan: 'Autoimmune', kit: 50, dp: 17294000 },
  { no: 191, name: 'Anti-Cardiolipin IgM', pan: 'Autoimmune', kit: 50, dp: 17294000 },
  { no: 192, name: 'Anti-Centromeres IgG', pan: 'Autoimmune', kit: 50, dp: 10997000 },
  { no: 193, name: 'Anti-DGP IgA', pan: 'Autoimmune', kit: 50, dp: 9023000 },
  { no: 194, name: 'Anti-DGP IgG', pan: 'Autoimmune', kit: 50, dp: 8271000 },
  { no: 195, name: 'Anti-Histones IgG', pan: 'Autoimmune', kit: 50, dp: 10997000 },
  { no: 196, name: 'Anti-Jo-1 IgG', pan: 'Autoimmune', kit: 50, dp: 10997000 },
  { no: 197, name: 'Anti-MPO IgG', pan: 'Autoimmune', kit: 50, dp: 10997000 },
  { no: 198, name: 'Anti-Rib-P IgG', pan: 'Autoimmune', kit: 50, dp: 10997000 },
  { no: 199, name: 'Anti-SS-A/Ro IgG', pan: 'Autoimmune', kit: 50, dp: 10997000 },
  { no: 200, name: 'Anti-SS-B IgG', pan: 'Autoimmune', kit: 50, dp: 10997000 },
  { no: 201, name: 'Anti-Scl-70 IgG', pan: 'Autoimmune', kit: 50, dp: 10997000 },
  { no: 202, name: 'Anti-Sm IgG', pan: 'Autoimmune', kit: 50, dp: 10997000 },
  { no: 203, name: 'Anti-Sm/RNP IgG', pan: 'Autoimmune', kit: 50, dp: 10997000 },
  { no: 204, name: 'Anti-dsDNA IgG', pan: 'Autoimmune', kit: 50, dp: 8741000 },
  { no: 205, name: 'Anti-tissue Transglutaminase IgA', pan: 'Autoimmune', kit: 50, dp: 13534000 },
  { no: 206, name: 'Anti-tissue Transglutaminase IgG', pan: 'Autoimmune', kit: 50, dp: 13534000 },
  { no: 207, name: 'Anti-β2-Glycoprotein 1 IgG', pan: 'Autoimmune', kit: 50, dp: 15790000 },
  { no: 208, name: 'Anti-β2-Glycoprotein 1 IgM', pan: 'Autoimmune', kit: 50, dp: 15790000 },
  { no: 209, name: 'ENA Screen', pan: 'Autoimmune', kit: 50, dp: 8083000 },
  // Drug Monitor — 100T
  { no: 210, name: 'Cyclosporine', pan: 'Drug Monitor', kit: 100, dp: 27444000 },
  { no: 211, name: 'Digoxin', pan: 'Drug Monitor', kit: 100, dp: 12030000 },
  { no: 212, name: 'Tacrolimus', pan: 'Drug Monitor', kit: 100, dp: 33647000 },
  { no: 213, name: 'Cyclosporine', pan: 'Drug Monitor', kit: 50, dp: 17839000 },
  { no: 214, name: 'Digoxin', pan: 'Drug Monitor', kit: 50, dp: 6015000 },
  { no: 215, name: 'Tacrolimus', pan: 'Drug Monitor', kit: 50, dp: 16824000 },
  // EBV — 100T
  { no: 216, name: 'EBV EA IgA', pan: 'EBV', kit: 100, dp: 10245000 },
  { no: 217, name: 'EBV EA IgG', pan: 'EBV', kit: 100, dp: 10245000 },
  { no: 218, name: 'EBV NA IgA', pan: 'EBV', kit: 100, dp: 10245000 },
  { no: 219, name: 'EBV NA IgG', pan: 'EBV', kit: 100, dp: 10245000 },
  { no: 220, name: 'EBV VCA IgA', pan: 'EBV', kit: 100, dp: 10245000 },
  { no: 221, name: 'EBV VCA IgG', pan: 'EBV', kit: 100, dp: 10245000 },
  { no: 222, name: 'EBV VCA IgM', pan: 'EBV', kit: 100, dp: 10245000 },
  { no: 223, name: 'EBV EA IgA', pan: 'EBV', kit: 50, dp: 6659000 },
  { no: 224, name: 'EBV EA IgG', pan: 'EBV', kit: 50, dp: 6659000 },
  { no: 225, name: 'EBV NA IgA', pan: 'EBV', kit: 50, dp: 6659000 },
  { no: 226, name: 'EBV NA IgG', pan: 'EBV', kit: 50, dp: 6659000 },
  { no: 227, name: 'EBV VCA IgA', pan: 'EBV', kit: 50, dp: 6659000 },
  { no: 228, name: 'EBV VCA IgG', pan: 'EBV', kit: 50, dp: 6659000 },
  { no: 229, name: 'EBV VCA IgM', pan: 'EBV', kit: 50, dp: 6659000 },
  // Growth — 100T
  { no: 230, name: 'Growth Hormone', pan: 'Growth', kit: 100, dp: 8459000 },
  { no: 231, name: 'IGF-I', pan: 'Growth', kit: 100, dp: 21617000 },
  { no: 232, name: 'IGFBP-3', pan: 'Growth', kit: 100, dp: 20489000 },
  { no: 233, name: 'Growth Hormone', pan: 'Growth', kit: 50, dp: 5498000 },
  { no: 234, name: 'IGF-I', pan: 'Growth', kit: 50, dp: 14051000 },
  { no: 235, name: 'IGFBP-3', pan: 'Growth', kit: 50, dp: 13318000 },
  // Hepatic — 100T
  { no: 236, name: 'Cholylglycine', pan: 'Hepatic', kit: 100, dp: 11091000 },
  { no: 237, name: 'Col IV', pan: 'Hepatic', kit: 100, dp: 11091000 },
  { no: 238, name: 'GP73', pan: 'Hepatic', kit: 100, dp: 15884000 },
  { no: 239, name: 'Hyaluronic Acid', pan: 'Hepatic', kit: 100, dp: 11091000 },
  { no: 240, name: 'Laminin', pan: 'Hepatic', kit: 100, dp: 11091000 },
  { no: 241, name: 'PIIIP NP', pan: 'Hepatic', kit: 100, dp: 11091000 },
  { no: 242, name: 'Cholylglycine', pan: 'Hepatic', kit: 50, dp: 5545000 },
  { no: 243, name: 'Col IV', pan: 'Hepatic', kit: 50, dp: 5545000 },
  { no: 244, name: 'GP73', pan: 'Hepatic', kit: 50, dp: 7942000 },
  { no: 245, name: 'Hyaluronic Acid', pan: 'Hepatic', kit: 50, dp: 7209000 },
  { no: 246, name: 'Laminin', pan: 'Hepatic', kit: 50, dp: 5545000 },
  { no: 247, name: 'PIIIP NP', pan: 'Hepatic', kit: 50, dp: 5545000 },
  // Immunoglobulin — 100T
  { no: 248, name: 'IgA', pan: 'Immunoglobulin', kit: 100, dp: 7989000 },
  { no: 249, name: 'IgE', pan: 'Immunoglobulin', kit: 100, dp: 11936000 },
  { no: 250, name: 'IgG', pan: 'Immunoglobulin', kit: 100, dp: 7989000 },
  { no: 251, name: 'IgM', pan: 'Immunoglobulin', kit: 100, dp: 7989000 },
  { no: 252, name: 'IgA', pan: 'Immunoglobulin', kit: 50, dp: 3994000 },
  { no: 253, name: 'IgE', pan: 'Immunoglobulin', kit: 50, dp: 7759000 },
  { no: 254, name: 'IgG', pan: 'Immunoglobulin', kit: 50, dp: 3994000 },
  { no: 255, name: 'IgM', pan: 'Immunoglobulin', kit: 50, dp: 3994000 },
  // Khusus — 100T
  { no: 256, name: 'SARS-CoV-2 S-RBD IgG II', pan: 'Khusus', kit: 100, dp: 10527000 },
  { no: 257, name: 'SARS-CoV-2 S-RBD IgG II', pan: 'Khusus', kit: 50, dp: 5263000 },
  // Thyroid niche — 100T
  { no: 258, name: 'Anti-TM', pan: 'Thyroid niche', kit: 100, dp: 9869000 },
  { no: 259, name: 'Anti-Tg', pan: 'Thyroid niche', kit: 100, dp: 9869000 },
  { no: 260, name: 'TRAb', pan: 'Thyroid niche', kit: 100, dp: 15696000 },
  { no: 261, name: 'Thyroglobulin', pan: 'Thyroid niche', kit: 100, dp: 6109000 },
  { no: 262, name: 'Anti-TM', pan: 'Thyroid niche', kit: 50, dp: 4934000 },
  { no: 263, name: 'Anti-Tg', pan: 'Thyroid niche', kit: 50, dp: 4934000 },
  { no: 264, name: 'TRAb', pan: 'Thyroid niche', kit: 50, dp: 7848000 },
  { no: 265, name: 'Thyroglobulin', pan: 'Thyroid niche', kit: 50, dp: 3055000 },
  // Lainnya — 100T
  { no: 266, name: 'H-FABP', pan: 'Lainnya', kit: 100, dp: 12218000 },
  { no: 267, name: 'Homocysteine', pan: 'Lainnya', kit: 100, dp: 21053000 },
  { no: 268, name: 'Lp-PLA2', pan: 'Lainnya', kit: 100, dp: 19737000 },
  { no: 269, name: 'MPO', pan: 'Lainnya', kit: 100, dp: 14098000 },
  { no: 270, name: 'H-FABP', pan: 'Lainnya', kit: 50, dp: 6109000 },
  { no: 271, name: 'Homocysteine', pan: 'Lainnya', kit: 50, dp: 10527000 },
  { no: 272, name: 'Lp-PLA2', pan: 'Lainnya', kit: 50, dp: 9869000 },
  { no: 273, name: 'MPO', pan: 'Lainnya', kit: 50, dp: 7049000 },
  { no: 274, name: 'Androstenedione', pan: 'Lainnya', kit: 100, dp: 17106000 },
  { no: 275, name: 'Unconjugated Estriol', pan: 'Lainnya', kit: 100, dp: 4981000 },
  { no: 276, name: 'Androstenedione', pan: 'Lainnya', kit: 50, dp: 11119000 },
  { no: 277, name: 'Total β HCG', pan: 'Lainnya', kit: 50, dp: 3238000 },
  { no: 278, name: 'Unconjugated Estriol', pan: 'Lainnya', kit: 50, dp: 3238000 },
  { no: 279, name: 'Anti-HBc IgM', pan: 'Lainnya', kit: 100, dp: 8271000 },
  { no: 280, name: 'Anti-HBc', pan: 'Lainnya', kit: 100, dp: 5639000 },
  { no: 281, name: 'Anti-HBe', pan: 'Lainnya', kit: 100, dp: 5639000 },
  { no: 282, name: 'Anti-HBs', pan: 'Lainnya', kit: 100, dp: 5075000 },
  { no: 283, name: 'HAV IgM', pan: 'Lainnya', kit: 100, dp: 8835000 },
  { no: 284, name: 'HBeAg', pan: 'Lainnya', kit: 100, dp: 5639000 },
  { no: 285, name: 'Anti-HBc IgM', pan: 'Lainnya', kit: 50, dp: 4135000 },
  { no: 286, name: 'Anti-HBc', pan: 'Lainnya', kit: 50, dp: 2820000 },
  { no: 287, name: 'Anti-HBe', pan: 'Lainnya', kit: 50, dp: 2820000 },
  { no: 288, name: 'Anti-HBs', pan: 'Lainnya', kit: 50, dp: 2538000 },
  { no: 289, name: 'HAV IgM', pan: 'Lainnya', kit: 50, dp: 4417000 },
  { no: 290, name: 'HBeAg', pan: 'Lainnya', kit: 50, dp: 2820000 },
  { no: 291, name: 'Serum Amyloid A', pan: 'Lainnya', kit: 100, dp: 17294000 },
  { no: 292, name: 'TNF-α', pan: 'Lainnya', kit: 100, dp: 22557000 },
  { no: 293, name: 'Serum Amyloid A', pan: 'Lainnya', kit: 50, dp: 11241000 },
  { no: 294, name: 'TNF-α', pan: 'Lainnya', kit: 50, dp: 14662000 },
  { no: 295, name: 'T-Uptake', pan: 'Lainnya', kit: 100, dp: 14662000 },
  { no: 296, name: 'Rev T3', pan: 'Lainnya', kit: 100, dp: 13910000 },
  { no: 297, name: 'T-Uptake', pan: 'Lainnya', kit: 50, dp: 7331000 },
  { no: 298, name: 'Rev T3', pan: 'Lainnya', kit: 50, dp: 6955000 },
  { no: 299, name: 'CA 242', pan: 'Lainnya', kit: 100, dp: 15038000 },
  { no: 300, name: 'CA 50', pan: 'Lainnya', kit: 100, dp: 15038000 },
  { no: 301, name: 'HER-2', pan: 'Lainnya', kit: 100, dp: 18328000 },
  { no: 302, name: 'PAP', pan: 'Lainnya', kit: 100, dp: 11278000 },
  { no: 303, name: 'PIVKA-Ⅱ', pan: 'Lainnya', kit: 100, dp: 20301000 },
  { no: 304, name: 'S100', pan: 'Lainnya', kit: 100, dp: 29888000 },
  { no: 305, name: 'CA 242', pan: 'Lainnya', kit: 50, dp: 7519000 },
  { no: 306, name: 'CA 50', pan: 'Lainnya', kit: 50, dp: 7519000 },
  { no: 307, name: 'HER-2', pan: 'Lainnya', kit: 50, dp: 9164000 },
  { no: 308, name: 'PAP', pan: 'Lainnya', kit: 50, dp: 5639000 },
  { no: 309, name: 'PIVKA-Ⅱ', pan: 'Lainnya', kit: 50, dp: 10151000 },
  { no: 310, name: 'S100', pan: 'Lainnya', kit: 50, dp: 14944000 },
];

// ─── CLIA — WONDFO PARAMETERS ────────────────────────────────────────────────

export const WONDFO_P = [
  // Infectious — 50T (inf=true → intensive wash)
  { no:  1, name: 'Anti-Treponema', pan: 'Infectious', kit: 50, dp:  2117880, inf: true  },
  { no:  2, name: 'HBsAg', pan: 'Infectious', kit: 50, dp:  2117880, inf: true  },
  { no:  3, name: 'Anti-HBs', pan: 'Infectious', kit: 50, dp:  2957040, inf: true  },
  { no:  4, name: 'Anti-Hbe', pan: 'Infectious', kit: 50, dp:  3396600, inf: true  },
  { no:  5, name: 'Anti-HCV', pan: 'Infectious', kit: 50, dp:  2957040, inf: true  },
  { no:  6, name: 'HIV Ab/Ag', pan: 'Infectious', kit: 50, dp:  3396600, inf: true  },
  // Thyroid — 50T
  { no:  7, name: 'TSH', pan: 'Thyroid', kit: 50, dp:  4870125, inf: false },
  { no:  8, name: 'Total T3', pan: 'Thyroid', kit: 50, dp:  4870125, inf: false },
  { no:  9, name: 'Total T4', pan: 'Thyroid', kit: 50, dp:  4870125, inf: false },
  { no: 10, name: 'Free T3', pan: 'Thyroid', kit: 50, dp:  4870125, inf: false },
  { no: 11, name: 'Free T4', pan: 'Thyroid', kit: 50, dp:  4870125, inf: false },
  // Fertility — 50T
  { no: 12, name: 'AMH', pan: 'Fertility', kit: 50, dp: 12737250, inf: false },
  { no: 13, name: 'B-HCG', pan: 'Fertility', kit: 50, dp:  4870125, inf: false },
  { no: 14, name: 'Testosterone', pan: 'Fertility', kit: 50, dp:  4870125, inf: false },
  { no: 15, name: 'Estradiol (E2)', pan: 'Fertility', kit: 50, dp:  4870125, inf: false },
  // Tumour — 50T
  { no: 16, name: 'CA 125', pan: 'Tumour', kit: 50, dp:  5994000, inf: false },
  { no: 17, name: 'CA 15-3', pan: 'Tumour', kit: 50, dp:  5994000, inf: false },
  { no: 18, name: 'CA 19-9', pan: 'Tumour', kit: 50, dp:  5994000, inf: false },
  { no: 19, name: 'CEA', pan: 'Tumour', kit: 50, dp:  5994000, inf: false },
  { no: 20, name: 'AFP', pan: 'Tumour', kit: 50, dp:  5994000, inf: false },
  { no: 21, name: 'Free PSA', pan: 'Tumour', kit: 50, dp:  5994000, inf: false },
  { no: 22, name: 'Total PSA', pan: 'Tumour', kit: 50, dp:  5994000, inf: false },
  // Critical — 50T
  { no: 23, name: 'PCT', pan: 'Critical', kit: 50, dp: 11238750, inf: false },
  { no: 24, name: 'hs-cTnI', pan: 'Critical', kit: 50, dp:  9365625, inf: false },
  { no: 25, name: 'NT-proBNP', pan: 'Critical', kit: 50, dp: 13111875, inf: false },
  { no: 26, name: 'D-Dimer', pan: 'Critical', kit: 50, dp:  8616375, inf: false },
  // Metabolism — 50T
  { no: 27, name: 'Ferritin', pan: 'Metabolism', kit: 50, dp:  7867125, inf: false },
  { no: 28, name: 'Vitamin D', pan: 'Metabolism', kit: 50, dp:  7117875, inf: false },
  // Infectious — 100T (inf=true → intensive wash)
  { no: 29, name: 'Anti-Treponema', pan: 'Infectious', kit: 100, dp:  3136860, inf: true  },
  { no: 30, name: 'HBsAg', pan: 'Infectious', kit: 100, dp:  3136860, inf: true  },
  { no: 31, name: 'Anti-HBs', pan: 'Infectious', kit: 100, dp:  4391604, inf: true  },
  { no: 32, name: 'Anti-Hbe', pan: 'Infectious', kit: 100, dp:  5018976, inf: true  },
  { no: 33, name: 'Anti-HCV', pan: 'Infectious', kit: 100, dp:  4391604, inf: true  },
  { no: 34, name: 'HIV Ab/Ag', pan: 'Infectious', kit: 100, dp:  5018976, inf: true  },
  // Thyroid — 100T
  { no: 35, name: 'TSH', pan: 'Thyroid', kit: 100, dp:  5994000, inf: false },
  { no: 36, name: 'Total T3', pan: 'Thyroid', kit: 100, dp:  5994000, inf: false },
  { no: 37, name: 'Total T4', pan: 'Thyroid', kit: 100, dp:  5994000, inf: false },
  { no: 38, name: 'Free T3', pan: 'Thyroid', kit: 100, dp:  5994000, inf: false },
  { no: 39, name: 'Free T4', pan: 'Thyroid', kit: 100, dp:  5994000, inf: false },
  // Fertility — 100T
  { no: 40, name: 'AMH', pan: 'Fertility', kit: 100, dp: 23226750, inf: false },
  { no: 41, name: 'B-HCG', pan: 'Fertility', kit: 100, dp:  7492500, inf: false },
  { no: 42, name: 'Testosterone', pan: 'Fertility', kit: 100, dp:  7492500, inf: false },
  { no: 43, name: 'Estradiol (E2)', pan: 'Fertility', kit: 100, dp:  7492500, inf: false },
  // Tumour — 100T
  { no: 44, name: 'CA 125', pan: 'Tumour', kit: 100, dp:  8616375, inf: false },
  { no: 45, name: 'CA 15-3', pan: 'Tumour', kit: 100, dp:  8616375, inf: false },
  { no: 46, name: 'CA 19-9', pan: 'Tumour', kit: 100, dp:  8616375, inf: false },
  { no: 47, name: 'CEA', pan: 'Tumour', kit: 100, dp:  8616375, inf: false },
  { no: 48, name: 'AFP', pan: 'Tumour', kit: 100, dp:  8616375, inf: false },
  { no: 49, name: 'Free PSA', pan: 'Tumour', kit: 100, dp:  8616375, inf: false },
  { no: 50, name: 'Total PSA', pan: 'Tumour', kit: 100, dp:  8616375, inf: false },
  // Critical — 100T
  { no: 51, name: 'PCT', pan: 'Critical', kit: 100, dp: 18731250, inf: false },
  { no: 52, name: 'hs-cTnI', pan: 'Critical', kit: 100, dp: 14985000, inf: false },
  { no: 53, name: 'NT-proBNP', pan: 'Critical', kit: 100, dp: 22477500, inf: false },
  { no: 54, name: 'D-Dimer', pan: 'Critical', kit: 100, dp: 14235750, inf: false },
  // Metabolism — 100T
  { no: 55, name: 'Ferritin', pan: 'Metabolism', kit: 100, dp: 12737250, inf: false },
  { no: 56, name: 'Vitamin D', pan: 'Metabolism', kit: 100, dp: 10864125, inf: false },
];

// ─── CLIA — ANALYZERS ────────────────────────────────────────────────────────

export const CLIA = {
  SNIBE: {
    label: 'Snibe', brand: 'Snibe Maglumi X3',
    dP: 375000000, dD: 0, dK: 60, dM: 45, dT: 3200,
    testPresets: [500, 1000, 2000, 3000, 4000, 5000],
    cons: [
      { id: 'starter',    fn: 'Starter Kit 1+2 (2×230mL)',     pack: '265 test/box',  yield: 265, dp: 949767  },
      { id: 'wash',       fn: 'Wash / System Liquid (10L)',     pack: '270 test/btl',  yield: 270, dp: 474884  },
      { id: 'cuvette',    fn: 'Cuvettes (3×182 cuv/case)',      pack: '296 test/case', yield: 296, dp: 633178  },
      { id: 'lightcheck', fn: 'Light Check (5 Btl/box)',        pack: '760 test/box',  yield: 760, dp: 831046  },
      { id: 'tubing',     fn: 'Tubing Cleaning Solution',       pack: '760 test/btl',  yield: 760, dp: 1582944 },
    ],
  },
  WONDFO: {
    label: 'Wondfo', brand: 'Wondfo CLIA',
    dP: 0, dD: 0, dK: 60, dM: 30, dT: 3200,
    testPresets: [500, 1000, 2000, 3000, 4000, 5000],
    cons: [
      { id: 'wash',      fn: 'Wash Buffer (1L)',           pack: '200 test/btl',  yield: 200,  dp: 728438,  inf: false },
      { id: 'iwash',     fn: 'Intensive Wash Buffer',      pack: '300 test/btl',  yield: 300,  dp: 728438,  inf: true  },
      { id: 'substrate', fn: 'Substrate Solution',         pack: '400 test/btl',  yield: 400,  dp: 874125,  inf: false },
      { id: 'cuvette',   fn: 'Disposable Cuvette',         pack: '1000 pcs/box',  yield: 1000, dp: 1456875, inf: false },
    ],
  },
};

// ─── HPLC — HbA1c ────────────────────────────────────────────────────────────

export const HPLC = {
  AH600PRO: {
    label: 'AH600pro',
    brand: 'Arkray AH600pro — HbA1c HPLC',
    dP: 357000000, dK: 60, dM: 20, dT: 300,
    calPl: 2700000, ctrlPl: 1500000,
    testPresets: [100, 200, 300, 500, 700, 1000],
    reagents: [
      { id: 'el1', fn: 'AH-600 Elution Buffer His No.1 (STD)', pack: '800 mL/btl',     dp: 2432000 },
      { id: 'el2', fn: 'AH-600 Elution Buffer His No.2 (STD)', pack: '800 mL/btl',     dp: 2432000 },
      { id: 'el3', fn: 'AH-600 Elution Buffer His No.3 (STD)', pack: '800 mL/btl',     dp: 2432000 },
      { id: 'hws', fn: 'HSi Hemolysis & Wash Solution',         pack: '2000 mL/btl',   dp: 3242000 },
      { id: 'col', fn: 'TSKgel AH-600 His Column (STD)',        pack: '4000 test/unit', dp: 32415000 },
      { id: 'flt', fn: 'Filter Element AH-600',                  pack: '600 test/unit',  dp: 3039000 },
    ],
    calc(tpm, wd, rp) {
      if (!tpm || !wd) return null;
      const D = tpm / wd;
      // Price per effective mL for liquid reagents (5% waste factor: 800×0.95=760 eff, 2000×0.90=1800 eff)
      const pel1 = rp.el1 / 760;
      const pel2 = rp.el2 / 760;
      const pel3 = rp.el3 / 760;
      const phws = rp.hws / 1800;
      // Per-test (analysis) mL from AH600pro spec sheet
      const el1c = 0.72  * pel1;
      const el2c = 0.63  * pel2;
      const el3c = 0.15  * pel3;
      const hwsc = 4.471 * phws;
      // Daily fixed (warmup + 90-min clean + wash) amortized per test
      const el1f = (3.45 + 1.95 + 1.50) * pel1 / D;
      const el2f = (3.45 + 1.95)         * pel2 / D;
      const el3f = (3.45 + 1.50)         * pel3 / D;
      const hwsf = (9.425 + 8.45 + 8.45) * phws / D;
      // Column & filter: fixed degradation per test
      const colc = rp.col / 4000;
      const fltc = rp.flt / 600;
      const total = el1c + el1f + el2c + el2f + el3c + el3f + hwsc + hwsf + colc + fltc;
      return {
        total,
        cyc: el1c + el2c + el3c + hwsc,
        fix: el1f + el2f + el3f + hwsf,
        pr: {
          el1: { c: el1c, f: el1f },
          el2: { c: el2c, f: el2f },
          el3: { c: el3c, f: el3f },
          hws: { c: hwsc, f: hwsf },
          col: { c: colc, f: 0 },
          flt: { c: fltc, f: 0 },
        },
      };
    },
  },
};

// ─── KIMIA KLINIK — ANALYZER ─────────────────────────────────────────────────

export const CC = {
  EXC200: {
    label: 'EXC200', dP: 210e6, dPl: 358000000, dD: 30, dK: 60, dM: 20, dT: 1800,
    testPresets: [500, 1000, 1500, 2000, 2500, 3000],
    cons: [
      { id: 'conc',    fn: 'Conc Detergent',   pack: '5L×4 (20L)',      vol: 20000, dp: 10032000, pl: 10032000 },
      { id: 'probe_d', fn: 'Probe Detergent',  pack: '30mL×8 (240mL)', vol: 240,   dp: 4026000,  pl: 4026000  },
    ],
    det(tpm, wd, cn, pn, batch) {
      if (!tpm || !wd) return null;
      const bat = batch > 0 ? batch : 5;
      const D   = tpm / 30;          // Excel D2 always uses 30 calendar days
      const cpm = cn / 20000;
      const prm = pn / 240;
      const cd  = 1.68 + 25.88 * bat + 0.28 * D;
      const pd  = 2.4  + 3.15  * bat;
      const concCpt  = cd * cpm / D;
      const probeCpt = pd * prm / D;
      return { total: concCpt + probeCpt, conc: concCpt, probe: probeCpt };
    },
  },

  EXC400: {
    label: 'EXC400', dP: 765765000, dPl: 765765000, dD: 0, dK: 60, dM: 20, dT: 5000,
    testPresets: [1000, 2000, 3000, 5000, 7000, 10000],
    cons: [
      { id: 'conc',    fn: 'Conc Detergent',   pack: '5L×4 (20L)',      vol: 20000, dp: 10032000, pl: 10032000 },
      { id: 'probe_d', fn: 'Probe Detergent',  pack: '30mL×8 (240mL)', vol: 240,   dp: 4026000,  pl: 4026000  },
    ],
    det(tpm, wd, cn, pn, batch) {
      if (!tpm || !wd) return null;
      const bat = batch > 0 ? batch : 5;
      const D   = tpm / 30;          // Excel D2 always uses 30 calendar days
      const cpm = cn / 20000;
      const prm = pn / 240;          // D2 uses $E$11 = 4,026,000/240 for both EXC200 and EXC400
      const cd  = 1.2  + 25.4  * bat + 0.2  * D;
      const pd  = 4.26 + 4.26  * bat;               // EXC400: 0.71×3×2 + 0.71×3×bat×2
      const concCpt  = cd * cpm / D;
      const probeCpt = pd * prm / D;
      return { total: concCpt + probeCpt, conc: concCpt, probe: probeCpt };
    },
  },
};
