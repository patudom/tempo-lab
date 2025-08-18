
import { magma } from "./magma";
import { inferno } from "./inferno";
import { plasma } from "./plasma";
import { viridis } from "./viridis";
import { cividis } from "./cividis";
import { svsNitrogenDioxide } from "./svs_nitrogen_dioxide";
import type { ColorMaps } from "./types";

export const colormaps: ColorMaps = {

  "magma": magma,
  "inferno": inferno,
  "plasma": plasma,
  "viridis": viridis,
  "cividis": cividis,
  "svs": svsNitrogenDioxide,
};

export type AvailableColorMaps = 'magma' | 'inferno' | 'plasma' | 'viridis' | 'cividis' | 'svs';
// create an AvailableReverseColorMaps which is everything in AvailableColorMaps with '_r' appended to the end
export type AvailableReverseColorMaps = 'magma_r' | 'inferno_r' | 'plasma_r' | 'viridis_r' | 'cividis_r' | 'svs_r';
export type AllAvailableColorMaps = AvailableColorMaps | AvailableReverseColorMaps;