import { JsonHelper } from '@/utils/json';

describe('JsonHelper.isJSON', () => {
  test('returns true for object/array JSON strings', () => {
    expect(JsonHelper.isJSON('{"a":1}')).toBe(true);
    expect(JsonHelper.isJSON('[1,2,3]')).toBe(true);
    expect(JsonHelper.isJSON('  { "x": [1,2] }  ')).toBe(true);
    expect(JsonHelper.isJSON(jsonStr)).toBe(true);
  });

  test('returns false for primitive JSON values or invalid JSON', () => {
    expect(JsonHelper.isJSON('123')).toBe(false);
    expect(JsonHelper.isJSON('"a string"')).toBe(false);
    expect(JsonHelper.isJSON('true')).toBe(false);
    expect(JsonHelper.isJSON('null')).toBe(false);
    expect(JsonHelper.isJSON('')).toBe(false);
    expect(JsonHelper.isJSON(undefined)).toBe(false);
    expect(JsonHelper.isJSON('{ "a": 1, }')).toBe(false); // trailing comma invalid
  });
});

describe('JsonHelper.parse', () => {
  test('parses object/array JSON strings', () => {
    expect(JsonHelper.parse('{"foo": "bar"}')).toEqual({ foo: 'bar' });
    expect(JsonHelper.parse('[1,2]')).toEqual([1, 2]);
  });

  test('parses primitives', () => {
    expect(JsonHelper.parse('123')).toBe(123);
    // eslint-disable-next-line no-useless-escape
    expect(JsonHelper.parse('\"abc\"')).toBe('abc');
    expect(JsonHelper.parse('true')).toBe(true);
    expect(JsonHelper.parse('false')).toBe(false);
    expect(JsonHelper.parse('null')).toBeNull();
  });

  test('recursively parses nested JSON strings and respects primitives', () => {
    const nested = JSON.stringify({ a: JSON.stringify({ b: 2 }), c: '123' });
    const result = JsonHelper.parse(nested);
    // nested.a is parsed into object and nested.c parsed into primitive number
    expect(result).toEqual({ a: { b: 2 }, c: '123' });
  });

  test('parses object input by recursing into its properties', () => {
    const obj = { x: '{"y": [1,2,3]}' };
    const parsed = JsonHelper.parse(obj);
    expect(parsed.x).toEqual({ y: [1, 2, 3] });
  });

  test('does not throw on invalid json: returns original string or object', () => {
    const bad = '{"a":1,}';
    expect(JsonHelper.parse(bad)).toBe(bad);
    const badObj = { a: bad };
    expect(JsonHelper.parse(badObj)).toEqual({ a: bad });
  });

  test('respects reviver passed to JSON.parse for nested parse', () => {
    const s = JSON.stringify({ a: JSON.stringify({ b: 1 }) });
    const res = JsonHelper.parse(s, (key, value) => {
      if (typeof value === 'number') return value + 1;
      return value;
    });
    expect(res).toEqual({ a: { b: 2 } });
  });
});

describe('JsonHelper.isJSON additional cases', () => {
  test('returns false for non-object root tokens and comments', () => {
    expect(JsonHelper.isJSON('// comment\n{"a":1}')).toBe(false);
    expect(JsonHelper.isJSON('{a:1}')).toBe(false); // unquoted keys
    expect(JsonHelper.isJSON('{ "a": 1 /* comment */ }')).toBe(false);
  });
});

describe('JsonHelper.decycle', () => {
  test('removes functions and avoids infinite recursion for circular references', () => {
    const a: any = { name: 'a' };
    const b: any = { name: 'b', fn: () => 1 };
    a.other = b;
    b.self = a; // circular
    const decycled = JsonHelper.decycle(a);
    expect(decycled.name).toBe('a');
    expect(decycled.other.name).toBe('b');
    // functions are removed -> property is undefined
    expect(Object.prototype.hasOwnProperty.call(decycled.other, 'fn')).toBe(
      true
    );
    expect(decycled.other.fn).toBeUndefined();
    // circular replaced with null
    expect(decycled.other.self).toBeNull();
  });

  test('decycles arrays and preserves structure', () => {
    const arr: any[] = [1, () => {}, { a: 2 }];
    arr.push(arr);
    const dec = JsonHelper.decycle(arr);
    expect(Array.isArray(dec)).toBe(true);
    // first element remains
    expect(dec[0]).toBe(1);
    // function element becomes undefined and will become null when stringified
    expect(dec[1]).toBeUndefined();
    // circular becomes null
    expect(dec[3]).toBeNull();
  });
});

describe('JsonHelper.stringify', () => {
  test('returns string input unchanged (prevents double-quoting)', () => {
    expect(JsonHelper.stringify('%s %v')).toBe('%s %v');
    const jsonStr = JSON.stringify({ a: 1 });
    expect(JsonHelper.stringify(jsonStr)).toBe(jsonStr);
  });

  test('decyles circular references when decycle flag is true', () => {
    const a: any = { n: 1 };
    a.self = a;
    const s = JsonHelper.stringify(a, true);
    const parsed = JSON.parse(s);
    expect(parsed.n).toBe(1);
    expect(parsed.self).toBeNull();
  });

  test('throws when circular and decycle flag not set', () => {
    const a: any = { n: 1 };
    a.self = a;
    expect(() => JsonHelper.stringify(a)).toThrow(TypeError);
  });
});

const jsonStr = `{"userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36","ipAddress":"::1","referrer":"http://localhost:3000/","cookie":"pll_language=fr; wp-settings-1=mfold%3Do%26libraryContent%3Dbrowse; wp-settings-time-1=1756872722; __stripe_mid=1d838327-66c3-485b-b8e0-32be81eeb1fece2252; digitorn_auth_locale=en; digitorn_locale=fr; session_id=694a341c182c9d6911ec7a73; access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJvcmlzZm91b21lbjE0QGdtYWlsLmNvbSIsInN1YiI6IjY5NDVkMzQxMjEyYTQ5MjE4ZWZkY2Q3MiIsInN0YXR1cyI6ImFjdGl2ZSIsInNlc3Npb25JZCI6IjY5NGEzNDFjMTgyYzlkNjkxMWVjN2E3MyIsImV4cCI6MTc2NjQ3MjQ4NCwiaWF0IjoxNzY2NDcwNjg0fQ.qTE-t8txG3NxiYVjJdFEsQbhrzvOIUb1dpjKQY3hUUk; refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJvcmlzZm91b21lbjE0QGdtYWlsLmNvbSIsInN1YiI6IjY5NDVkMzQxMjEyYTQ5MjE4ZWZkY2Q3MiIsInN0YXR1cyI6ImFjdGl2ZSIsInNlc3Npb25JZCI6IjY5NGEzNDFjMTgyYzlkNjkxMWVjN2E3MyIsImV4cCI6MTc2NzA3NTQ4NCwiaWF0IjoxNzY2NDcwNjg0fQ.nasNxWWdxl4rrKsPkDiO6LfvlX53DgweldT1dfvUkx0; access_token_expires_at=2025-12-23T06%3A48%3A04.609Z; refresh_token_expires_at=2025-12-30T06%3A18%3A04.609Z; request_metadata=%7B%22userAgent%22%3A%22Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F143.0.0.0%20Safari%2F537.36%22%2C%22ipAddress%22%3A%22%3A%3A1%22%2C%22referrer%22%3A%22http%3A%2F%2Flocalhost%3A3000%2F%22%2C%22cookie%22%3A%22pll_language%3Dfr%3B%20wp-settings-1%3Dmfold%253Do%2526libraryContent%253Dbrowse%3B%20wp-settings-time-1%3D1756872722%3B%20__stripe_mid%3D1d838327-66c3-485b-b8e0-32be81eeb1fece2252%3B%20digitorn_auth_locale%3Den%3B%20digitorn_locale%3Dfr%3B%20session_id%3D694a341c182c9d6911ec7a73%3B%20access_token%3DeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJvcmlzZm91b21lbjE0QGdtYWlsLmNvbSIsInN1YiI6IjY5NDVkMzQxMjEyYTQ5MjE4ZWZkY2Q3MiIsInN0YXR1cyI6ImFjdGl2ZSIsInNlc3Npb25JZCI6IjY5NGEzNDFjMTgyYzlkNjkxMWVjN2E3MyIsImV4cCI6MTc2NjQ3MjQ4NCwiaWF0IjoxNzY2NDcwNjg0fQ.qTE-t8txG3NxiYVjJdFEsQbhrzvOIUb1dpjKQY3hUUk%3B%20refresh_token%3DeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJvcmlzZm91b21lbjE0QGdtYWlsLmNvbSIsInN1YiI6IjY5NDVkMzQxMjEyYTQ5MjE4ZWZkY2Q3MiIsInN0YXR1cyI6ImFjdGl2ZSIsInNlc3Npb25JZCI6IjY5NGEzNDFjMTgyYzlkNjkxMWVjN2E3MyIsImV4cCI6MTc2NzA3NTQ4NCwiaWF0IjoxNzY2NDcwNjg0fQ.nasNxWWdxl4rrKsPkDiO6LfvlX53DgweldT1dfvUkx0%3B%20access_token_expires_at%3D2025-12-23T06%253A48%253A04.609Z%3B%20refresh_token_expires_at%3D2025-12-30T06%253A18%253A04.609Z%22%2C%22xForwardedFor%22%3A%22%3A%3A1%22%2C%22xForwardedHost%22%3A%22localhost%3A3000%22%2C%22xForwardedProto%22%3A%22http%22%2C%22host%22%3A%22localhost%3A3000%22%7D","xForwardedFor":"::1","xForwardedHost":"localhost:3000","xForwardedProto":"http","host":"localhost:3000"}`;
