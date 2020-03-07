export const componentTypes = {
	reactiveList: 'REACTIVELIST',
	// search components
	dataSearch: 'DATASEARCH',
	categorySearch: 'CATEGORYSEARCH',
	// list components
	singleList: 'SINGLELIST',
	multiList: 'MULTILIST',
	singleDataList: 'SINGLEDATALIST',
	singleDropdownList: 'SINGLEDROPDOWNLIST',
	multiDataList: 'MULTIDATALIST',
	multiDropdownList: 'MULTIDROPDOWNLIST',
	singleDropdownRange: 'SINGLEDROPDOWNRANGE',
	// basic components
	numberBox: 'NUMBERBOX',
	tagCloud: 'TAGCLOUD',
	toggleButton: 'TOGGLEBUTTON',
	// range components
	datePicker: 'DATEPICKER',
	dateRange: 'DATERANGE',
	dynamicRangeSlider: 'DYNAMICRANGESLIDER',
	multiDropdownRange: 'MULTIDROPDOWNRANGE',
	singleRange: 'SINGLERANGE',
	multiRange: 'MULTIRANGE',
	rangeSlider: 'RANGESLIDER',
	ratingsFilter: 'RATINGSFILTER',
	rangeInput: 'RANGEINPUT',
};

export const queryTypes = {
	search: 'search',
	term: 'term',
	range: 'range',
	geo: 'geo',
};
export const validProps = [
	// common
	'componentType',
	'aggregationField',
	// Specific to ReactiveList
	'dataField',
	'includeFields',
	'excludeFields',
	'size',
	'sortBy',
	'sortOptions',
	'pagination',
	// Specific to DataSearch
	'autoFocus',
	'autosuggest',
	'debounce',
	'defaultValue',
	'defaultSuggestions',
	'fieldWeights',
	'filterLabel',
	'fuzziness',
	'highlight',
	'highlightField',
	'nestedField',
	'placeholder',
	'queryFormat',
	'searchOperators',
	// Specific to Category Search
	'categoryField',
	'strictSelection',
	// Specific to List Components
	'selectAllLabel',
	'showCheckbox',
	'showFilter',
	'showSearch',
	'showCount',
	'showLoadMore',
	'loadMoreLabel',
	'showMissing',
	'missingLabel',
	'data',
	'showRadio',
	// TagCloud and ToggleButton
	'multiSelect',
	// Range Components
	'includeNullValues',
	'interval',
	'showHistogram',
	'snap',
	'stepValue',
	'range',
	'showSlider',
	'parseDate',
];

export const CLEAR_ALL = {
	NEVER: 'never',
	ALWAYS: 'always',
	DEFAULT: 'default',
};
