import { C0 } from './assets/scrap-rat-sheet-0.js?v=3';
import { C1 } from './assets/scrap-rat-sheet-1.js?v=3';
import { C2 } from './assets/scrap-rat-sheet-2.js?v=3';
import { C3 } from './assets/scrap-rat-sheet-3.js?v=3';
import { C4 } from './assets/scrap-rat-sheet-4.js?v=3';
import { C5 } from './assets/scrap-rat-sheet-5.js?v=3';
import { C6 } from './assets/scrap-rat-sheet-6.js?v=3';
import { C7 } from './assets/scrap-rat-sheet-7.js?v=3';

// WRECKMARCH Scrap Rat master sheet v3.
// The palette and lighting are baked into the asset; runtime code must not recolor frames.
// 4 columns x 3 rows; 12 frames; 128x128 per frame.
export const SCRAP_RAT_FRAME_SIZE = 128;
export const SCRAP_RAT_FRAME_COUNT = 12;
export const SCRAP_RAT_SHEET_DATA_URI = `data:image/webp;base64,${C0}${C1}${C2}${C3}${C4}${C5}${C6}${C7}`;
