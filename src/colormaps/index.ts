
import { magma } from "./magma";
import { inferno } from "./inferno";
import { plasma } from "./plasma";
import { viridis } from "./viridis";
import { cividis } from "./cividis";
import { gray } from "./gray";
import { svs_nitrogen_dioxide, svsColorRamp } from "./svs_nitrogen_dioxide";
import { sargassum, sargassumColorRamp } from "./sargassum";

import type { ColorMaps } from "./types";

export const colormaps: ColorMaps = {

  "magma": magma,
  "inferno": inferno,
  "plasma": plasma,
  "viridis": viridis,
  "cividis": cividis,
  "svs": svs_nitrogen_dioxide,
  "sargassum": sargassum,
  "gray": gray,
};

// add custom colormaps here
export const nonEsriColormaps = {
  'svs': {rgb: svs_nitrogen_dioxide, esriColorRamp: svsColorRamp},
  'sargassum': {rgb: sargassum, esriColorRamp: sargassumColorRamp},
};

export type AvailableColorMaps = 'magma' | 'inferno' | 'plasma' | 'viridis' | 'cividis' | 'svs' | 'gray' | 'sargassum';
// create an AvailableReverseColorMaps which is everything in AvailableColorMaps with '_r' appended to the end
export type AvailableReverseColorMaps = 'magma_r' | 'inferno_r' | 'plasma_r' | 'viridis_r' | 'cividis_r' | 'svs_r' | 'gray_r' | 'sargassum_r';
export type AllAvailableColorMaps = AvailableColorMaps | AvailableReverseColorMaps | 'None';