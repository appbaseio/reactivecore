import getFilterString, { filterComponents, rangeComponents, rangeObjectComponents, parseRangeObject, parseFilterValue } from '../analytics';

test('snapshot filter components', () => {
	expect(filterComponents).toMatchSnapshot();
});

test('snapshot range components', () => {
	expect(rangeComponents).toMatchSnapshot();
});

test('snapshot range object components', () => {
	expect(rangeObjectComponents).toMatchSnapshot();
});

test('parseRangeObject should parse the range object', () => {
	const filterKey = 'filter';
	const rangeObject = {
		start: 1,
		end: 3,
	};
	const res = parseRangeObject(filterKey, rangeObject);
	expect(res).toBe('filter=1~3');
});

test('parseFilterValue should parse string values', () => {
	const componentId = 'id1';
	const componentValues = {
		label: 'Filter',
		value: 'value1',
	};
	const res = parseFilterValue(componentId, componentValues);
	expect(res).toBe('Filter=value1');
});

test('parseFilterValue should parse string values and fallback to componentId', () => {
	const componentId = 'id1';
	const componentValues = {
		value: 'value1',
	};
	const res = parseFilterValue(componentId, componentValues);
	expect(res).toBe('id1=value1');
});

test('parseFilterValue should parse array values', () => {
	const componentId = 'id1';
	const componentValues = {
		label: 'Filter',
		value: ['value1', 'value2'],
	};
	const res = parseFilterValue(componentId, componentValues);
	expect(res).toBe('Filter=value1,Filter=value2');
});

test('parseFilterValue should parse array of object values', () => {
	const componentId = 'id1';
	const componentValues = {
		label: 'Filter',
		value: [{ label: 'label1', value: 'value1' }],
	};
	const res = parseFilterValue(componentId, componentValues);
	expect(res).toBe('Filter=value1');
});

test('parseFilterValue should parse range values for DateRange', () => {
	const componentId = 'id1';
	const componentValues = {
		label: 'Filter',
		componentType: 'DATERANGE',
		value: ['date1', 'date2'],
	};
	const res = parseFilterValue(componentId, componentValues);
	expect(res).toBe('Filter=date1~date2');
});

test('getFilterString should return null for falsy value', () => {
	const selectedValues = {};
	const res = getFilterString(selectedValues);
	expect(res).toBe(null);
});

test('getFilterString should return filter string', () => {
	const selectedValues = {
		filter1: {
			value: 'value1',
			label: 'Filter1',
			componentType: 'SINGLELIST',
		},
		filter2: {
			value: ['value2', 'value3'],
			componentType: 'MULTILIST',
		},
	};
	const res = getFilterString(selectedValues);
	expect(res).toBe('Filter1=value1,filter2=value2,filter2=value3');
});
