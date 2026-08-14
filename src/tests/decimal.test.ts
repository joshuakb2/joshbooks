import { describe, expect, test } from 'vitest';
import { add, Decimal, decimal, equals, format, negate, round } from '../types/decimal';

describe('equals', () => {
  test('0 = 0', () => {
    expect(decimal(0, 0)).toSatisfy(equals(decimal(0, 0)));
    expect(decimal(0, -1)).toSatisfy(equals(decimal(0, 0)));
    expect(decimal(0, 0)).toSatisfy(equals(decimal(0, 1)));
    expect(decimal(0, -2)).toSatisfy(equals(decimal(0, 3)));
  });

  test('1 = 1', () => {
    expect(decimal(1, 0)).toSatisfy(equals(decimal(1, 0)));
    expect(decimal(10, -1)).toSatisfy(equals(decimal(100, -2)));
  });

  test('0.5 = 0.50', () => {
    expect(decimal(5, -1)).toSatisfy(equals(decimal(50, -2)));
  });

  test('0.1 != 1', () => {
    expect(decimal(1, -1)).not.toSatisfy(equals(decimal(1, 0)));
  });

  test('20 != 200', () => {
    expect(decimal(2, 1)).not.toSatisfy(equals(decimal(2, 2)));
  });
});

describe('add', () => {
  test('1 + 2 = 3', () => {
    const one = decimal(1, 0);
    const two = decimal(2, 0);
    const three = decimal(3, 0);

    expect(add(one, two)).toSatisfy(equals(three));
  });

  test('5 + (-2) = 3', () => {
    const five = decimal(5, 0);
    const negative_two = decimal(-2, 0);
    const three = decimal(3, 0);

    expect(add(five, negative_two)).toSatisfy(equals(three));
  });

  test('50 + 0.2 = 50.2', () => {
    const fifty = decimal(5, 1);
    const point_two = decimal(2, -1);
    const fifty_point_two = decimal(502, -1);

    expect(add(fifty, point_two)).toSatisfy(equals(fifty_point_two));
  });
});

describe('round', () => {
  test('rounding to 2 decimal places', () => {
    expect(round(-2, decimal(3120, -3))).toSatisfy(equals(decimal(312, -2)));
    expect(round(-2, decimal(3121, -3))).toSatisfy(equals(decimal(312, -2)));
    expect(round(-2, decimal(3122, -3))).toSatisfy(equals(decimal(312, -2)));
    expect(round(-2, decimal(3123, -3))).toSatisfy(equals(decimal(312, -2)));
    expect(round(-2, decimal(3124, -3))).toSatisfy(equals(decimal(312, -2)));
    expect(round(-2, decimal(3125, -3))).toSatisfy(equals(decimal(313, -2)));
    expect(round(-2, decimal(3126, -3))).toSatisfy(equals(decimal(313, -2)));
    expect(round(-2, decimal(3127, -3))).toSatisfy(equals(decimal(313, -2)));
    expect(round(-2, decimal(3128, -3))).toSatisfy(equals(decimal(313, -2)));
    expect(round(-2, decimal(3129, -3))).toSatisfy(equals(decimal(313, -2)));
  });

  test('rounding to 0 decimal places', () => {
    expect(round(0, decimal(5, 0))).toSatisfy(equals(decimal(5, 0)));
    expect(round(0, decimal(50, 0))).toSatisfy(equals(decimal(50, 0)));
    expect(round(0, decimal(4, -1))).toSatisfy(equals(decimal(0, 0)));
    expect(round(0, decimal(5, -1))).toSatisfy(equals(decimal(1, 0)));
    expect(round(0, decimal(6, -1))).toSatisfy(equals(decimal(1, 0)));
    expect(round(0, decimal(6, -2))).toSatisfy(equals(decimal(0, 0)));
    expect(round(0, decimal(689, -4))).toSatisfy(equals(decimal(0, 0)));
    expect(round(0, decimal(-689, -4))).toSatisfy(equals(decimal(0, 0)));
    expect(round(0, decimal(-689, -3))).toSatisfy(equals(decimal(-1, 0)));
    expect(round(0, decimal(-499, -3))).toSatisfy(equals(decimal(0, 0)));
    expect(round(0, decimal(-500, -3))).toSatisfy(equals(decimal(0, 0)));
    expect(round(0, decimal(-501, -3))).toSatisfy(equals(decimal(-1, 0)));
  });
});

describe('negate', () => {
  test('negating 0', () => {
    expect(negate(decimal(0, 0))).toSatisfy(equals(decimal(0, 0)));
  });

  test('negating positives', () => {
    expect(negate(decimal(1, 2))).toSatisfy(equals(decimal(-1, 2)));
    expect(negate(decimal(123, 2))).toSatisfy(equals(decimal(-123, 2)));
    expect(negate(decimal(123, -2))).toSatisfy(equals(decimal(-123, -2)));
    expect(negate(decimal(456, -2))).toSatisfy(equals(decimal(-45600, -4)));
    expect(negate(decimal(15, -2))).toSatisfy(equals(decimal(-150, -3)));
  });

  test('negating negatives', () => {
    expect(negate(decimal(-1, 2))).toSatisfy(equals(decimal(1, 2)));
    expect(negate(decimal(-123, 2))).toSatisfy(equals(decimal(123, 2)));
    expect(negate(decimal(-123, -2))).toSatisfy(equals(decimal(123, -2)));
    expect(negate(decimal(-456, -2))).toSatisfy(equals(decimal(45600, -4)));
    expect(negate(decimal(-15, -2))).toSatisfy(equals(decimal(150, -3)));
  });

  test('x + (-x) = 0', () => {
    const op = (x: Decimal) => add(x, negate(x));
    const zero = decimal(0, 0);

    expect(op(zero)).toSatisfy(equals(zero));
    expect(op(decimal(92, -1))).toSatisfy(equals(zero));
    expect(op(decimal(-723, 2))).toSatisfy(equals(zero));
  });
});

describe('format', () => {
  test('whole numbers', () => {
    expect(format(decimal(0, 0))).toEqual('0.0');
    expect(format(decimal(4, 0))).toEqual('4.0');
    expect(format(decimal(8, 1))).toEqual('80.0');
    expect(format(decimal(1230, 1))).toEqual('12300.0');
  });

  test('less than one', () => {
    expect(format(decimal(0, -2))).toEqual('0.00');
    expect(format(decimal(4, -2))).toEqual('0.04');
    expect(format(decimal(8, -1))).toEqual('0.8');
    expect(format(decimal(1230, -4))).toEqual('0.1230');
  });

  test('mixed', () => {
    expect(format(decimal(1230, -2))).toEqual('12.30');
    expect(format(decimal(278, -1))).toEqual('27.8');
    expect(format(decimal(123456, -3))).toEqual('123.456');
    expect(format(decimal(901, -2))).toEqual('9.01');
  });

  test('negatives', () => {
    expect(format(decimal(-0, 0))).toEqual('0.0');
    expect(format(decimal(-4, 0))).toEqual('-4.0');
    expect(format(decimal(-8, 1))).toEqual('-80.0');
    expect(format(decimal(-1230, 1))).toEqual('-12300.0');
    expect(format(decimal(-4, -2))).toEqual('-0.04');
    expect(format(decimal(-8, -1))).toEqual('-0.8');
    expect(format(decimal(-123456, -3))).toEqual('-123.456');
  });
});
