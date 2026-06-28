// Master data — Zybio KSO Running Cost

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

  EXZ8000: {
    label: 'EXZ8000', diff: '6-Diff',
    dP: 754800000, dD: 0, dK: 60, dM: 20, dT: 2000,

    testModes: [
      { id: 'cbc_diff_ret',    label: 'CBC+DIFF+RET',                       short: 'DIFF+RET'    },
      { id: 'cbc_diff_xn',     label: 'CBC+DIFF + Chek XN Ctrl+Cal',        short: 'XN Ctrl+Cal' },
      { id: 'cbc_diff_ret_xr', label: 'CBC+DIFF+RET + Chek XR Ctrl+Cal',    short: 'XR Ctrl+Cal' },
    ],

    testPresets: [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000],

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
};

// ─── KIMIA KLINIK — PANEL GROUPS ─────────────────────────────────────────────

export const CC_PANELS = ['Hepatic', 'Renal', 'Lipid', 'Metabolic', 'Control', 'Consumable'];

// ─── KIMIA KLINIK — DEFAULT PARAMETER LIST ───────────────────────────────────

export const CC_P = [
  // Hepatic
  { no: 1,  p: 'SGOT',            pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 562500   },
  { no: 2,  p: 'SGPT',            pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 562500   },
  { no: 3,  p: 'ALB',             pan: 'Hepatic',    pack: 'R:30mL×6',               t: 495, dp: 540000   },
  { no: 4,  p: 'ALP',             pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 562500   },
  { no: 5,  p: 'TBIL',            pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 226, dp: 562500   },
  { no: 6,  p: 'DBIL',            pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 226, dp: 562500   },
  { no: 7,  p: 'TP',              pan: 'Hepatic',    pack: 'R:30mL×6',               t: 495, dp: 540000   },
  { no: 8,  p: 'GGT',             pan: 'Hepatic',    pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 1102500  },
  // Renal
  { no: 9,  p: 'CREA',            pan: 'Renal',      pack: 'R1:30mL×1  R2:10mL×1',  t: 102, dp: 1200000  },
  { no: 10, p: 'UREA',            pan: 'Renal',      pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 720000   },
  { no: 11, p: 'UA',              pan: 'Renal',      pack: 'R1:30mL×3  R2:7,5mL×3', t: 311, dp: 720000   },
  // Lipid
  { no: 12, p: 'TC',              pan: 'Lipid',      pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 1057500  },
  { no: 13, p: 'TG',              pan: 'Lipid',      pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 1350000  },
  { no: 14, p: 'HDL-C',           pan: 'Lipid',      pack: 'R1:30mL×3  R2:10mL×3',  t: 289, dp: 3360000  },
  { no: 15, p: 'LDL-C',           pan: 'Lipid',      pack: 'R1:30mL×3  R2:10mL×3',  t: 289, dp: 5520000  },
  // Metabolic
  { no: 16, p: 'GLU',             pan: 'Metabolic',  pack: 'R1:30mL×3  R2:7,5mL×3', t: 261, dp: 900000   },
  // Control
  { no: 17, p: 'Biorad Lv.1',     pan: 'Control',    pack: '5mL×10 vial',            t: 50,  dp: 1500000  },
  { no: 18, p: 'Biorad Lv.2',     pan: 'Control',    pack: '5mL×10 vial',            t: 50,  dp: 1500000  },
  // Consumable
  { no: 19, p: 'Conc Detergent',  pan: 'Consumable', pack: '5L×4 (20L)',             t: 132, dp: 10032000 },
  { no: 20, p: 'Probe Detergent', pan: 'Consumable', pack: '30mL×8 (240mL)',         t: 950, dp: 4026000  },
];

// ─── CROSSMATCH ───────────────────────────────────────────────────────────────

export const CROSSMATCH = {
  LIBO: {
    label: 'LIBO', brand: 'Libiotic · Coombs Card',
    dP: 46564500, dD: 0, dK: 60, dM: 20, dT: 100,
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
    label: 'Redcel', brand: 'RedCell Biotechnology',
    dP: 0, dD: 0, dK: 60, dM: 20, dT: 100,
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
  SNIBE:  ['Cardiac/IGD', 'Infeksi', 'Diabetes', 'Sepsis/Inflam', 'Thyroid', 'Anemia/Bone', 'Fertility/Hormon', 'Dengue'],
  WONDFO: ['Infectious', 'Thyroid', 'Fertility', 'Tumour', 'Critical', 'Metabolism'],
};

// ─── CLIA — SNIBE MAGLUMI X3 PARAMETERS ──────────────────────────────────────

export const SNIBE_P = [
  // Cardiac/IGD — 100T
  { no: 1,  name: 'BNP',                  pan: 'Cardiac/IGD',    kit: 100, dp: 9549114  },
  { no: 2,  name: 'CK-MB',                pan: 'Cardiac/IGD',    kit: 100, dp: 4962532  },
  { no: 3,  name: 'D-Dimer',              pan: 'Cardiac/IGD',    kit: 100, dp: 7594177  },
  { no: 4,  name: 'NT-proBNP',            pan: 'Cardiac/IGD',    kit: 100, dp: 9586709  },
  { no: 5,  name: 'cTnI',                 pan: 'Cardiac/IGD',    kit: 100, dp: 4473797  },
  { no: 6,  name: 'hs-cTnI',              pan: 'Cardiac/IGD',    kit: 100, dp: 6015190  },
  // Infeksi — 100T
  { no: 7,  name: 'Anti-HCV',             pan: 'Infeksi',        kit: 100, dp: 1624101  },
  { no: 8,  name: 'HBsAg Quantitative',   pan: 'Infeksi',        kit: 100, dp: 1879747  },
  { no: 9,  name: 'HIV Ab/Ag Combi',      pan: 'Infeksi',        kit: 100, dp: 1894785  },
  { no: 10, name: 'Syphilis',             pan: 'Infeksi',        kit: 100, dp: 1624101  },
  { no: 11, name: 'HBsAg Qualitative',    pan: 'Infeksi',        kit: 100, dp: 1082734  },
  // Diabetes — 100T
  { no: 12, name: 'Insulin',              pan: 'Diabetes',       kit: 100, dp: 3533924  },
  { no: 13, name: 'Proinsulin',           pan: 'Diabetes',       kit: 100, dp: 5338481  },
  // Sepsis/Inflam — 100T
  { no: 14, name: 'CRP',                  pan: 'Sepsis/Inflam',  kit: 100, dp: 5338481  },
  { no: 15, name: 'PCT',                  pan: 'Sepsis/Inflam',  kit: 100, dp: 11278481 },
  { no: 16, name: 'hs-CRP',              pan: 'Sepsis/Inflam',  kit: 100, dp: 5413671  },
  // Thyroid — 100T
  { no: 17, name: 'Free T3',              pan: 'Thyroid',        kit: 100, dp: 1428608  },
  { no: 18, name: 'Free T4',              pan: 'Thyroid',        kit: 100, dp: 1428608  },
  { no: 19, name: 'TSH',                  pan: 'Thyroid',        kit: 100, dp: 1503797  },
  // Anemia/Bone — 100T
  { no: 20, name: 'Ferritin',             pan: 'Anemia/Bone',    kit: 100, dp: 1842152  },
  { no: 21, name: '25-OH Vitamin D',      pan: 'Anemia/Bone',    kit: 100, dp: 7518987  },
  // Fertility/Hormon — 100T
  { no: 22, name: '17α-OH Progesterone',  pan: 'Fertility/Hormon', kit: 100, dp: 3533924 },
  { no: 23, name: 'Estradiol',            pan: 'Fertility/Hormon', kit: 100, dp: 1992532 },
  { no: 24, name: 'FSH',                  pan: 'Fertility/Hormon', kit: 100, dp: 1992532 },
  { no: 25, name: 'Free-Testosterone',    pan: 'Fertility/Hormon', kit: 100, dp: 2970000 },
  { no: 26, name: 'LH',                   pan: 'Fertility/Hormon', kit: 100, dp: 1992532 },
  { no: 27, name: 'Progesterone',         pan: 'Fertility/Hormon', kit: 100, dp: 1992532 },
  { no: 28, name: 'Prolactin',            pan: 'Fertility/Hormon', kit: 100, dp: 1992532 },
  { no: 29, name: 'Testosterone',         pan: 'Fertility/Hormon', kit: 100, dp: 1992532 },
  // Dengue — 50T
  { no: 30, name: 'Dengue IgG',           pan: 'Dengue',         kit: 50,  dp: 2594051  },
  { no: 31, name: 'Dengue IgM',           pan: 'Dengue',         kit: 50,  dp: 2894810  },
  { no: 32, name: 'Dengue NS1 Ag',        pan: 'Dengue',         kit: 50,  dp: 2782025  },
];

// ─── CLIA — WONDFO PARAMETERS ────────────────────────────────────────────────

export const WONDFO_P = [
  // Infectious — 50T (inf=true → needs intensive wash)
  { no: 1,  name: 'HIV Ab/Ag',        pan: 'Infectious', kit: 50, dp: 3396600,  inf: true  },
  { no: 2,  name: 'Anti-HCV',         pan: 'Infectious', kit: 50, dp: 2957040,  inf: true  },
  { no: 3,  name: 'HBsAg',            pan: 'Infectious', kit: 50, dp: 2117880,  inf: true  },
  { no: 4,  name: 'Anti-Treponema',   pan: 'Infectious', kit: 50, dp: 2117880,  inf: true  },
  { no: 5,  name: 'Anti-HBs',         pan: 'Infectious', kit: 50, dp: 2957040,  inf: true  },
  { no: 6,  name: 'Anti-Hbe',         pan: 'Infectious', kit: 50, dp: 3396600,  inf: true  },
  // Thyroid — 50T
  { no: 7,  name: 'TSH',              pan: 'Thyroid',    kit: 50, dp: 4870125,  inf: false },
  { no: 8,  name: 'Total T3',         pan: 'Thyroid',    kit: 50, dp: 4870125,  inf: false },
  { no: 9,  name: 'Total T4',         pan: 'Thyroid',    kit: 50, dp: 4870125,  inf: false },
  { no: 10, name: 'Free T3',          pan: 'Thyroid',    kit: 50, dp: 4870125,  inf: false },
  { no: 11, name: 'Free T4',          pan: 'Thyroid',    kit: 50, dp: 4870125,  inf: false },
  // Fertility — 50T
  { no: 12, name: 'AMH',              pan: 'Fertility',  kit: 50, dp: 12737250, inf: false },
  { no: 13, name: 'B-HCG',            pan: 'Fertility',  kit: 50, dp: 4870125,  inf: false },
  { no: 14, name: 'Testosterone',     pan: 'Fertility',  kit: 50, dp: 4870125,  inf: false },
  { no: 15, name: 'Estradiol (E2)',   pan: 'Fertility',  kit: 50, dp: 4870125,  inf: false },
  // Tumour — 50T
  { no: 16, name: 'CA 125',           pan: 'Tumour',     kit: 50, dp: 5994000,  inf: false },
  { no: 17, name: 'CA 15-3',          pan: 'Tumour',     kit: 50, dp: 5994000,  inf: false },
  { no: 18, name: 'CA 19-9',          pan: 'Tumour',     kit: 50, dp: 5994000,  inf: false },
  { no: 19, name: 'CEA',              pan: 'Tumour',     kit: 50, dp: 5994000,  inf: false },
  { no: 20, name: 'AFP',              pan: 'Tumour',     kit: 50, dp: 5994000,  inf: false },
  { no: 21, name: 'Free PSA',         pan: 'Tumour',     kit: 50, dp: 5994000,  inf: false },
  { no: 22, name: 'Total PSA',        pan: 'Tumour',     kit: 50, dp: 5994000,  inf: false },
  // Critical — 50T
  { no: 23, name: 'PCT',              pan: 'Critical',   kit: 50, dp: 11238750, inf: false },
  { no: 24, name: 'hs-cTnI',          pan: 'Critical',   kit: 50, dp: 9365625,  inf: false },
  { no: 25, name: 'NT-proBNP',        pan: 'Critical',   kit: 50, dp: 13111875, inf: false },
  { no: 26, name: 'D-Dimer',          pan: 'Critical',   kit: 50, dp: 8616375,  inf: false },
  // Metabolism — 50T
  { no: 27, name: 'Ferritin',         pan: 'Metabolism', kit: 50, dp: 7867125,  inf: false },
  { no: 28, name: 'Vitamin D',        pan: 'Metabolism', kit: 50, dp: 7117875,  inf: false },
];

// ─── CLIA — ANALYZERS ────────────────────────────────────────────────────────

export const CLIA = {
  SNIBE: {
    label: 'Snibe', brand: 'Snibe Maglumi X3',
    dP: 375000000, dD: 0, dK: 60, dM: 45, dT: 3200,
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
    cons: [
      { id: 'wash',      fn: 'Wash Buffer (1L)',           pack: '200 test/btl',  yield: 200,  dp: 728438,  inf: false },
      { id: 'iwash',     fn: 'Intensive Wash Buffer',      pack: '300 test/btl',  yield: 300,  dp: 728438,  inf: true  },
      { id: 'substrate', fn: 'Substrate Solution',         pack: '400 test/btl',  yield: 400,  dp: 874125,  inf: false },
      { id: 'cuvette',   fn: 'Disposable Cuvette',         pack: '1000 pcs/box',  yield: 1000, dp: 1456875, inf: false },
    ],
  },
};

// ─── KIMIA KLINIK — ANALYZER ─────────────────────────────────────────────────

export const CC = {
  EXC200: {
    label: 'EXC200', dP: 210e6, dD: 30, dK: 60, dM: 20, dT: 1800,
    cons: [
      { id: 'conc',    fn: 'Conc Detergent',   pack: '5L×4 (20L)',      vol: 20000, dp: 10032000 },
      { id: 'probe_d', fn: 'Probe Detergent',  pack: '30mL×8 (240mL)', vol: 240,   dp: 4026000  },
    ],
    det(tpm, wd, cn, pn) {
      if (!tpm || !wd) return null;
      const D   = tpm / wd;
      const cpm = cn / 20000;
      const prm = pn / 240;
      const cd  = 131.08 + 0.28 * D;
      const pd  = 18.15;
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
