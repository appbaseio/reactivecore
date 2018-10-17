import {
	oneOfType,
	string,
	arrayOf,
	object,
	func,
	any,
	bool,
	oneOf,
	shape,
	number,
} from 'prop-types';

import dateFormats from './dateFormats';

const reactKeyType = oneOfType([
	string,
	arrayOf(string),
	object,
	arrayOf(object),
]);

function validateLocation(props, propName) {
	if (isNaN(props[propName])) { // eslint-disable-line
		return new Error(`${propName} value must be a number`);
	}
	if (propName === 'lat' && (props[propName] < -90 || props[propName] > 90)) {
		return new Error(`${propName} value should be between -90 and 90.`);
	} else if (propName === 'lng' && (props[propName] < -180 || props[propName] > 180)) {
		return new Error(`${propName} value should be between -180 and 180.`);
	}
	return null;
}

const types = {
	any,
	bool,
	boolRequired: bool.isRequired,
	components: arrayOf(string),
	children: any,
	data: arrayOf(object),
	dataFieldArray: oneOfType([string, arrayOf(string)]).isRequired,
	dataNumberBox: shape({
		label: string,
		start: number.isRequired,
		end: number.isRequired,
	}).isRequired,
	date: oneOfType([string, arrayOf(string)]),
	dateObject: object,
	excludeFields: arrayOf(string),
	fieldWeights: arrayOf(number),
	filterLabel: string,
	func,
	funcRequired: func.isRequired,
	fuzziness: oneOf([0, 1, 2, 'AUTO']),
	headers: object,
	hits: arrayOf(object),
	iconPosition: oneOf(['left', 'right']),
	includeFields: arrayOf(string),
	labelPosition: oneOf(['left', 'right', 'top', 'bottom']),
	number,
	options: oneOfType([arrayOf(object), object]),
	paginationAt: oneOf(['top', 'bottom', 'both']),
	range: shape({
		start: number.isRequired,
		end: number.isRequired,
	}),
	rangeLabels: shape({
		start: string.isRequired,
		end: string.isRequired,
	}),
	react: shape({
		and: reactKeyType,
		or: reactKeyType,
		not: reactKeyType,
	}),
	selectedValues: object,
	selectedValue: oneOfType([
		string,
		arrayOf(string),
		arrayOf(object),
		object,
		number,
		arrayOf(number),
	]),
	suggestions: arrayOf(object),
	supportedOrientations: oneOf([
		'portrait',
		'portrait-upside-down',
		'landscape',
		'landscape-left',
		'landscape-right',
	]),
	tooltipTrigger: oneOf(['hover', 'none', 'focus', 'always']),
	sortBy: oneOf(['asc', 'desc']),
	sortOptions: arrayOf(shape({
		label: string,
		dataField: string,
		sortBy: string,
	})),
	sortByWithCount: oneOf(['asc', 'desc', 'count']),
	stats: arrayOf(object),
	string,
	stringArray: arrayOf(string),
	stringOrArray: oneOfType([string, arrayOf(string)]),
	stringRequired: string.isRequired,
	style: object,
	themePreset: oneOf(['light', 'dark']),
	queryFormatDate: oneOf(Object.keys(dateFormats)),
	queryFormatSearch: oneOf(['and', 'or']),
	queryFormatNumberBox: oneOf(['exact', 'lte', 'gte']),
	params: object.isRequired,
	props: object,
	rangeLabelsAlign: oneOf(['left', 'right']),
	title: oneOfType([string, any]),
	location: shape({
		lat: validateLocation,
		lng: validateLocation,
	}),
	unit: oneOf([
		'mi',
		'miles',
		'yd',
		'yards',
		'ft',
		'feet',
		'in',
		'inch',
		'km',
		'kilometers',
		'm',
		'meters',
		'cm',
		'centimeters',
		'mm',
		'millimeters',
		'NM',
		'nmi',
		'nauticalmiles',
	]),
};

export default types;
