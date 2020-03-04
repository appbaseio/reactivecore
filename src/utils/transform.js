import { componentTypes, queryTypes } from './constants';
// CategoryValue     *string                 `json:"categoryValue,omitempty"`
// From              *int                    `json:"from,omitempty"`
// After             *map[string]interface{} `json:"after,omitempty"`
// HighlightOptions  *map[string]interface{} `json:"highlightOptions,omitempty"`
// DefaultQuery      *map[string]interface{} `json:"defaultQuery,omitempty"`
// CustomQuery       *map[string]interface{} `json:"customQuery,omitempty"`


const componentToTypeMap = {
	// search components
	[componentTypes.reactiveList]: queryTypes.search,
	[componentTypes.dataSearch]: queryTypes.search,
	[componentTypes.categorySearch]: queryTypes.search,
	// term components
	[componentTypes.singleList]: queryTypes.term,
	[componentTypes.multiList]: queryTypes.term,
	[componentTypes.singleDataList]: queryTypes.term,
	[componentTypes.singleDropdownList]: queryTypes.term,
	[componentTypes.multiDataList]: queryTypes.term,
	[componentTypes.multiDropdownList]: queryTypes.term,
	[componentTypes.singleDropdownRange]: queryTypes.term,
	[componentTypes.tagCloud]: queryTypes.term,
	[componentTypes.toggleButton]: queryTypes.term,
	// basic components
	[componentTypes.numberBox]: queryTypes.term,

	// range components
	[componentTypes.datePicker]: queryTypes.range,
	[componentTypes.dateRange]: queryTypes.range,
	[componentTypes.dynamicRangeSlider]: queryTypes.range,
	[componentTypes.multiDropdownRange]: queryTypes.range,
	[componentTypes.singleRange]: queryTypes.range,
	[componentTypes.multiRange]: queryTypes.range,
	[componentTypes.rangeSlider]: queryTypes.range,
	[componentTypes.ratingsFilter]: queryTypes.range,
	[componentTypes.rangeInput]: queryTypes.range,
};
export const getNormalizedField = (field) => {
	if (field && field.constructor !== Array) {
		return [field];
	}
	return field;
};

export const getRSQuery = (componentId, props, selectedValue, react, execute) => {
	const isInternalComponent = componentId.endsWith('__internal');
	return {
		id: componentId,
		type: props && componentToTypeMap[props.componentType],
		dataField: getNormalizedField(props && props.dataField),
		execute: execute !== undefined ? execute : !isInternalComponent,
		react,
		highlight: props && props.highlight,
		highlightField: getNormalizedField(props && props.highlightField),
		fuzziness: props && props.fuzziness,
		value: selectedValue ? selectedValue.value : undefined,
		searchOperators: props && props.searchOperators,
		includeFields: props && props.includeFields,
		excludeFields: props && props.excludeFields,
		size: props && props.size,
		from: props && props.from, // Need to maintain for RL
		queryFormat: props && props.queryFormat,
		sortBy: props && props.sortBy,
		fieldWeights: getNormalizedField(props && props.fieldWeights),
		includeNullValues: props && props.includeNullValues,
		aggregationField: props && props.aggregationField,
		categoryField: props && props.categoryField,
		missingLabel: props && props.missingLabel,
		showMissing: props && props.showMissing,
		nestedField: props && props.nestedField,
		interval: props && props.interval,
		// highlightOptions: Need to handle in a similar way like customQuery
		customQuery: props && props.customQuery,
		defaultQuery: props && props.defaultQuery,
	};
};

export const extractPropsFromState = (store, component, customOptions) => ({
	...store.props[component],
	customQuery: store.customQueries[component],
	defaultQuery: store.defaultQueries[component],
	...customOptions,
});
