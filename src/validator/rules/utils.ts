import { isEmpty } from '@utils/isEmpty';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toNumber = (value: any): number => {
  if (isEmpty(value)) return NaN;
  if (typeof value === 'number') return value;
  try {
    const v = Number(value);
    return isNaN(v) ? NaN : v;
    // eslint-disable-next-line no-empty
  } catch {}
  return NaN;
};
