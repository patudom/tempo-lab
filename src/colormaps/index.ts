
import { magma } from "./magma";
import { inferno } from "./inferno";
import { plasma } from "./plasma";
import { viridis } from "./viridis";
import { cividis } from "./cividis";
import { gray } from "./gray";
import { svs_nitrogen_dioxide, svsColorRamp } from "./svs_nitrogen_dioxide";
import { sargassum, sargassumColorRamp } from "./sargassum";
import { haline } from "./cmo_haline";

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
  "haline": haline,
};

// add custom colormaps here
export const nonEsriColormaps = {
  'svs': {rgb: svs_nitrogen_dioxide, esriColorRamp: svsColorRamp},
  'sargassum': {rgb: sargassum, esriColorRamp: sargassumColorRamp},
};

export type AvailableColorMaps = 'magma' | 'inferno' | 'plasma' | 'viridis' | 'cividis' | 'svs' | 'gray' | 'sargassum' | 'haline';
export type AvailableReverseColorMaps = `${AvailableColorMaps}_r`;
export type AllAvailableColorMaps = AvailableColorMaps | AvailableReverseColorMaps | 'None';
