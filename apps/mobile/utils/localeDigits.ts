const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function localizeDigits(num: number, language: string): string {
  if (language !== 'ar') return String(num);
  return String(num).replace(/\d/g, (d) => ARABIC_DIGITS[parseInt(d, 10)]);
}
