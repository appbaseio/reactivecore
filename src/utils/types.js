import PropTypes from "prop-types";

import dateFormats from "./dateFormats";

const reactKeyType = PropTypes.oneOfType([
	PropTypes.string,
	PropTypes.arrayOf(PropTypes.string),
	PropTypes.object
]);

const types = {
	addComponent: PropTypes.func.isRequired,
	any: PropTypes.any,
	app: PropTypes.string.isRequired,
	autoSuggest: PropTypes.bool,
	beforeValueChange: PropTypes.func,
	checked: PropTypes.bool.isRequired,
	children: PropTypes.any,
	components: PropTypes.arrayOf(PropTypes.string),
	componentId: PropTypes.string.isRequired,
	credentials: PropTypes.string,
	title: PropTypes.string,
	customQuery: PropTypes.func,
	data: PropTypes.arrayOf(PropTypes.object),
	dataField: PropTypes.string.isRequired,
	dataFieldArray: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
	date: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
	dateRange: PropTypes.shape({
		start: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
		end: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
	}),
	defaultQuery: PropTypes.func,
	fieldWeights: PropTypes.arrayOf(PropTypes.number),
	filterLabel: PropTypes.string,
	fuzziness: PropTypes.oneOf([0, 1, 2, "AUTO"]),
	highlight: PropTypes.bool,
	highlightField: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
	hits: PropTypes.arrayOf(PropTypes.object),
	interval: PropTypes.number,
	label: PropTypes.string.isRequired,
	loadMore: PropTypes.func.isRequired,
	onAllData: PropTypes.func,
	onData: PropTypes.func,
	onEndReached: PropTypes.func.isRequired,
	onValueChange: PropTypes.func,
	onSuggestions: PropTypes.func,
	onPress: PropTypes.func.isRequired,
	onQueryChange: PropTypes.func,
	options: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object), PropTypes.object]),
	paddingHorizontal: PropTypes.number.isRequired,
	pagination: PropTypes.bool,
	paginationAt: PropTypes.oneOf(["top", "bottom", "both"]),
	pages: PropTypes.number,
	placeholder: PropTypes.string,
	pressColor: PropTypes.string,
	pressOpacity: PropTypes.number,
	range: PropTypes.shape({
		start: PropTypes.number,
		end: PropTypes.number
	}),
	react: PropTypes.shape({
		and: reactKeyType,
		or: reactKeyType,
		not: reactKeyType
	}),
	removeComponent: PropTypes.func.isRequired,
	setQueryOptions: PropTypes.func.isRequired,
	setRef: PropTypes.func.isRequired,
	showHistogram: PropTypes.bool,
	size: PropTypes.number,
	suggestions: PropTypes.arrayOf(PropTypes.object),
	supportedOrientations: PropTypes.oneOf(["portrait", "portrait-upside-down", "landscape", "landscape-left", "landscape-right"]),
	sortBy: PropTypes.oneOf(["asc", "desc"]),
	sortByWithCount: PropTypes.oneOf(["asc", "desc", "count"]),
	stats: PropTypes.arrayOf(PropTypes.object),
	stepValue: PropTypes.number,
	string: PropTypes.string,
	stringArray: PropTypes.arrayOf(PropTypes.string),
	style: PropTypes.object,
	queryFormatDate: PropTypes.oneOf(Object.keys(dateFormats)),
	queryFormatSearch: PropTypes.oneOf(["and", "or"]),
	total: PropTypes.number,
	type: PropTypes.string,
	updateQuery: PropTypes.func.isRequired,
	url: PropTypes.string,
	onBlur: PropTypes.func,
	onFocus: PropTypes.func,
	onKeyPress: PropTypes.func,
	onKeyDown: PropTypes.func,
	onKeyUp: PropTypes.func,
	autoFocus: PropTypes.bool,
	selectedValues: PropTypes.object,
	selectedValue: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.arrayOf(PropTypes.string),
		PropTypes.object
	]),
	setValue: PropTypes.func,
	clearValues: PropTypes.func,
	params: PropTypes.object.isRequired
}

export default types;
