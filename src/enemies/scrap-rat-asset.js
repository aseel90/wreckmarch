import { SCRAP_RAT_RUN_MASTER_0 } from './assets/scrap-rat-run-master-0.js?v=1';
import { SCRAP_RAT_RUN_MASTER_1 } from './assets/scrap-rat-run-master-1.js?v=1';
import { SCRAP_RAT_RUN_MASTER_2 } from './assets/scrap-rat-run-master-2.js?v=1';
import { SCRAP_RAT_RUN_MASTER_3 } from './assets/scrap-rat-run-master-3.js?v=1';

// Static Scrap Rat run master.
// Palette, lighting, silhouette and ground contact are baked into these assets.
// Runtime code must not recolor or rebuild these frames.
export const SCRAP_RAT_FRAME_SIZE = 128;
export const SCRAP_RAT_RUN_FRAME_COUNT = 4;
export const SCRAP_RAT_RUN_MASTER_DATA = Object.freeze([
  SCRAP_RAT_RUN_MASTER_0,
  SCRAP_RAT_RUN_MASTER_1,
  SCRAP_RAT_RUN_MASTER_2,
  SCRAP_RAT_RUN_MASTER_3
]);
