const filterComponents = [
	'NUMBERBOX',
	'TAGCLOUD',
	'TOGGLEBUTTON',
	'DATEPICKER',
	'DATERANGE',
	'MULTIDATALIST',
	'MULTIDROPDOWNLIST',
	'MULTILIST',
	'SINGLEDATALIST',
	'SINGLEDROPDOWNLIST',
	'SINGLELIST',
	'DYNAMICRANGESLIDER',
	'MULTIDROPDOWNRANGE',
	'MULTIRANGE',
	'RANGESLIDER',
	'RATINGSFILTER',
	'SINGLEDROPDOWNRANGE',
	'SINGLERANGE',
];

// components storing range as array
const rangeComponents = [
	'DATERANGE',
	'DYNAMICRANGESLIDER',
	'RANGESLIDER',
	'RANGEINPUT',
	'RATINGSFILTER',
];

// components storing range as object
const rangeObjectComponents = [
	'SINGLERANGE',
	'SINGLEDROPDOWNRANGE',
	'MULTIRANGE',
	'MULTIDROPDOWNRANGE',
];

function parseRangeObject(filterKey, rangeObject) {
	return `${filterKey}=${rangeObject.start}~${rangeObject.end}`;
}

function parseFilterValue(componentId, componentValues) {
	const { label, value, componentType } = componentValues;
	const filterKey = label || componentId;
	if (rangeComponents.includes(componentType)) {
		// range components store values as an array to depict start and end range
		return `${filterKey}=${value[0]}~${value[1]}`;
	} else if (rangeObjectComponents.includes(componentType)) {
		// for range components with values in the form { start, end }
		if (Array.isArray(value)) {
			return value.map(item => parseRangeObject(filterKey, item))
				.join();
		}
		return parseRangeObject(filterKey, value);
	} else if (Array.isArray(value)) {
		// for components having values in the form { label, value }
		const isObject = typeof value[0] === 'object' && value[0] !== null;
		return isObject
			? value.map(item => `${filterKey}=${item.value}`).join()
			: value.map(item => `${filterKey}=${item}`).join();
	}
	return `${filterKey}=${value}`;
}

// transforms the selectedValues from store into the X-Search-Filters string for analytics
function getFilterString(selectedValues) {
	if (selectedValues && Object.keys(selectedValues).length) {
		return Object
			// take all selectedValues
			.entries(selectedValues)
			// filter out filter components having some value
			.filter(([, componentValues]) =>
				filterComponents.includes(componentValues.componentType)
					// in case of an array filter out empty array values as well
					&& (
						(componentValues.value && componentValues.value.length)
						// also consider range values in the shape { start, end }
						|| componentValues.value.start || componentValues.value.end
					))
			// parse each filter value
			.map(([componentId, componentValues]) => parseFilterValue(componentId, componentValues))
			// return as a string separated with comma
			.join();
	}
	return null;
}

export {
	filterComponents,
	rangeComponents,
	rangeObjectComponents,
	parseFilterValue,
	parseRangeObject,
};
export default getFilterString;
