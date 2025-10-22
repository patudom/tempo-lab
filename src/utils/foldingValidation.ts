export type TimeBinOptions = 'hour' | 'day' | 'week' | 'month';
export type FoldingPeriodOptions = 'day' | 'week' | 'month' | 'year' | 'weekdayWeekend' | 'none';



const validFoldingPeriodsForTimeBin: Record<TimeBinOptions, FoldingPeriodOptions[]> = {
  'hour': ['day', 'week', 'month', 'year', 'weekdayWeekend', 'none'],
  'day': ['week', 'month', 'year', 'weekdayWeekend', 'none'],
  'week': ['month', 'year', 'none'],
  'month': ['year', 'none'],
};


const validTimeBinsForFoldingPeriod: Record<FoldingPeriodOptions, (keyof typeof validFoldingPeriodsForTimeBin)[]> = {
  'day': ['hour'],
  'week': ['hour', 'day'],
  'month': ['hour', 'day', 'week'],
  'year': ['hour', 'day', 'week', 'month'],
  'weekdayWeekend': ['hour', 'day'],
  'none': ['hour', 'day', 'week', 'month'],
};


export function getValidFoldingPeriods(timeBin: TimeBinOptions): FoldingPeriodOptions[] {
  return validFoldingPeriodsForTimeBin[timeBin] || [];
}


export function getValidTimeBins(foldingPeriod: FoldingPeriodOptions): TimeBinOptions[] {
  return validTimeBinsForFoldingPeriod[foldingPeriod] || [];
}

export function isValidCombination(timeBin: TimeBinOptions, foldingPeriod: FoldingPeriodOptions): boolean {
  return validTimeBinsForFoldingPeriod[foldingPeriod]?.includes(timeBin) ?? false;
}

export function getFirstValidTimeBin(foldingPeriod: FoldingPeriodOptions): TimeBinOptions {
  const validTimeBins = validTimeBinsForFoldingPeriod[foldingPeriod];
  return validTimeBins[0];
}

export function getFirstValidFoldingPeriod(timeBin: TimeBinOptions): FoldingPeriodOptions {
  const validFoldingPeriods = validFoldingPeriodsForTimeBin[timeBin];
  return validFoldingPeriods[0];
}