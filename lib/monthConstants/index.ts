/** Ethiopian calendar month constants with parts and songs */

export type { MonthWithParts, MonthPart } from '../types';

import type { MonthWithParts } from '../types';
import { MESKEREM } from './meskerem';
import { TIKIMT } from './tikimt';
import { HIDAR } from './hidar';
import { TAHSAS } from './tahsas';
import { TIR } from './tir';
import { YEKATIT } from './yekatit';
import { MEGABIT } from './megabit';
import { ABIY_TSOM } from './abiyTsom';
import { TINSAE } from './tinsae';
import { MIYAZYA } from './miyazya';
import { GNBOT } from './gnbot';
import { SENE } from './sene';
import { HAMLE } from './hamle';
import { NEHASE } from './nehase';
import { PAGUMEN } from './pagumen';
import { TSIGE } from './tsige';
import { ERGET } from './erget';
import { PERAQLITOS } from './peraqlitos';

export { MESKEREM, TIKIMT, HIDAR, TAHSAS, TIR, YEKATIT, MEGABIT, ABIY_TSOM, TINSAE, MIYAZYA, GNBOT, SENE, HAMLE, NEHASE, PAGUMEN, TSIGE, ERGET, PERAQLITOS };

/** All 18 months/sections in order (15 Ethiopian months + Tsige, Erget, Peraqlitos) */
export const ALL_ETHIOPIAN_MONTHS: MonthWithParts[] = [
  MESKEREM,
  TIKIMT,
  HIDAR,
  TAHSAS,
  TIR,
  YEKATIT,
  MEGABIT,
  ABIY_TSOM,
  TINSAE,
  MIYAZYA,
  GNBOT,
  SENE,
  HAMLE,
  NEHASE,
  PAGUMEN,
  TSIGE,
  ERGET,
  PERAQLITOS,
];
