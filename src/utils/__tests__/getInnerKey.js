import { getInnerKey } from '../helper';

test('returns correct key when it is present in the given object', () => {
	const value = 'hello';
	const obj = {
		value,
	};

	expect(getInnerKey(obj, 'value')).toBe('hello');
});

test('returns empty object when key is not present in the given object', () => {
	const obj = {
		value: 'hello',
	};

	expect(getInnerKey(obj, 'hello')).toEqual({});
});
