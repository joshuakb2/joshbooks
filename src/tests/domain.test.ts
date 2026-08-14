import { describe, expect, test } from "vitest";
import { decimal } from "~/types/decimal";
import { formatCommodity } from "~/types/domain";

describe('formatCommodity', () => {
  const DOLLAR_FORMAT = '$0.00';
  const GALLONS_FORMAT = '0.000 gallons';
  const CALORIES_FORMAT = '0 kcal';

  const bigNumber = decimal(54321, 5);
  const bigNumberWithFraction = decimal(987654321, -2);
  const smallNumber = decimal(5, 0);
  const smallNumberWithFraction = decimal(7, -3);

  test('dollars look right', () => {
    expect(formatCommodity(bigNumber, DOLLAR_FORMAT)).toBe('$5,432,100,000.00');
    expect(formatCommodity(bigNumberWithFraction, DOLLAR_FORMAT)).toBe('$9,876,543.21');
    expect(formatCommodity(smallNumber, DOLLAR_FORMAT)).toBe('$5.00');
    expect(formatCommodity(smallNumberWithFraction, DOLLAR_FORMAT)).toBe('$0.01');
  });

  test('gallons look right', () => {
    expect(formatCommodity(bigNumber, GALLONS_FORMAT)).toBe('5,432,100,000.000 gallons');
    expect(formatCommodity(bigNumberWithFraction, GALLONS_FORMAT)).toBe('9,876,543.210 gallons');
    expect(formatCommodity(smallNumber, GALLONS_FORMAT)).toBe('5.000 gallons');
    expect(formatCommodity(smallNumberWithFraction, GALLONS_FORMAT)).toBe('0.007 gallons');
  });

  test('calories look right', () => {
    expect(formatCommodity(bigNumber, CALORIES_FORMAT)).toBe('5,432,100,000 kcal');
    expect(formatCommodity(bigNumberWithFraction, CALORIES_FORMAT)).toBe('9,876,543 kcal');
    expect(formatCommodity(smallNumber, CALORIES_FORMAT)).toBe('5 kcal');
    expect(formatCommodity(smallNumberWithFraction, CALORIES_FORMAT)).toBe('0 kcal');
  });
});
