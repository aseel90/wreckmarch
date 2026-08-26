import { SCRAP_RAT_RUN_MASTER_0 } from './assets/scrap-rat-run-master-0.js?v=2';
import { SCRAP_RAT_RUN_MASTER_1 } from './assets/scrap-rat-run-master-1.js?v=2';

// Clean two-pose Scrap Rat run master.
// Both frames have complete alpha silhouettes, matching ground contact and alpha-bled transparent edges.
// Runtime code must not recolor, rebuild or synthesize missing body pixels.
export const SCRAP_RAT_RUN_FRAME_COUNT = 2;
export const SCRAP_RAT_RUN_MASTER_DATA = Object.freeze([
  SCRAP_RAT_RUN_MASTER_0,
  SCRAP_RAT_RUN_MASTER_1
]);
