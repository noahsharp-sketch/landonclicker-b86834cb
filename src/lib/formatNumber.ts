export function formatNumber(num: number): string {
  if (num < 1000) return Math.floor(num).toString();
  
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
  
  if (tier >= suffixes.length) {
    return num.toExponential(2);
  }
  
  const scaled = num / Math.pow(1000, tier);
  const formatted = scaled >= 100 ? Math.floor(scaled) : scaled.toFixed(1);
  
  return `${formatted}${suffixes[tier]}`;
}
