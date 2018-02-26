import { isEqual } from '../helper';

test('returns true for matching objects', () => {
	const object1 = { a: 'xyz', b: 123 };
	const object2 = { b: 123, a: 'xyz' };
	const result = isEqual(object1, object2);
	expect(result).toBe(true);
});

test('returns true for same objects', () => {
	const object1 = { a: 'xyz', b: 123 };
	const object2 = object1;
	const result = isEqual(object1, object2);
	expect(result).toBe(true);
});

test('returns true for matching arrays', () => {
	const array1 = ['abc', 123];
	const array2 = ['abc', 123];
	const result = isEqual(array1, array2);
	expect(result).toBe(true);
});

test('returns true for same arrays', () => {
	const array1 = ['abc', 123];
	const array2 = array1;
	const result = isEqual(array1, array2);
	expect(result).toBe(true);
});

test('returns true for primitive types', () => {
	const val1 = 'abc';
	const val2 = 'abc';
	const result = isEqual(val1, val2);
	expect(result).toBe(true);
});
