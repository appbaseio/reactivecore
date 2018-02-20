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
]);

function validateLocation(props, propName) {
	if (isNaN(props[propName])) { // eslint-disable-line
		return new Error(`${propName} value must be number`);
	}
	if (propName === 'lat' && (props[propName] < -90 || props[propName] > 90)) {
		return new Error(`${propName} value should be between -90 and 90.`);
	} else if (propName === 'lng' && (props[propName] < -180 || props[propName] > 180)) {
		return new Error(`${propName} value should be between -180 and 180.`);
	}
	return true;
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
	dateRange: shape({
		start: oneOfType([string, arrayOf(string)]),
		end: oneOfType([string, arrayOf(string)]),
	}),
	fieldWeights: arrayOf(number),
	filterLabel: string,
	func,
	funcRequired: func.isRequired,
	fuzziness: oneOf([0, 1, 2, 'AUTO']),
	headers: object,
	highlightField: oneOfType([string, arrayOf(string)]),
	hits: arrayOf(object),
	iconPosition: oneOf(['left', 'right']),
	labelPosition: oneOf(['left', 'right', 'top', 'bottom']),
	number,
	options: oneOfType([arrayOf(object), object]),
	paginationAt: oneOf(['top', 'bottom', 'both']),
	range: shape({
		start: number,
		end: number,
	}),
	rangeLabels: shape({
		start: string,
		end: string,
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
	stringRequired: string.isRequired,
	style: object,
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
};

export default types;
