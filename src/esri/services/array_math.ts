export function isBad(v: number | null | undefined): boolean {
  return v === null || v === undefined || isNaN(v);
}

export function mean(arr: number[]): number {
  // filter nan, null, undefined
  if (arr.length === 0 || arr.some(v => isBad(v))) {
    return NaN;
  }
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum / arr.length;
}

export function nanmean(_arr: number[]): number {
  // filter nan, null, undefined
  const arr = _arr.filter(v => !isBad(v));
  if (arr.length === 0) return NaN;
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum / arr.length;
}

export function diff(arr: number[]): number[] {
  const result: number[] = [];
  for (let i = 1; i < arr.length; i++) {
    result.push(arr[i] - arr[i - 1]);
  }
  return result;
}
