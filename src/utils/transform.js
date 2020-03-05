import { componentTypes, queryTypes } from './constants';
// After             *map[string]interface{} `json:"after,omitempty"`

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
	if (props) {
		return {
			id: componentId,
			type: componentToTypeMap[props.componentType],
			dataField: getNormalizedField(props.dataField),
			execute: execute !== undefined ? execute : !isInternalComponent,
			react,
			highlight: props.highlight,
			highlightField: getNormalizedField(props.highlightField),
			fuzziness: props.fuzziness,
			value: selectedValue ? selectedValue.value : undefined,
			searchOperators: props.searchOperators,
			includeFields: props.includeFields,
			excludeFields: props.excludeFields,
			size: props.size,
			from: props.from, // Need to maintain for RL
			queryFormat: props.queryFormat,
			sortBy: props.sortBy,
			fieldWeights: getNormalizedField(props.fieldWeights),
			includeNullValues: props.includeNullValues,
			aggregationField: props.aggregationField,
			categoryField: props.categoryField,
			missingLabel: props.missingLabel,
			showMissing: props.showMissing,
			nestedField: props.nestedField,
			interval: props.interval,
			highlightOptions: props.highlightOptions,
			customQuery: props.customQuery,
			defaultQuery: props.defaultQuery,
			categoryValue: props.categoryValue || undefined,
		};
	}
	return null;
};

export const extractPropsFromState = (store, component, customOptions) => ({
	...store.props[component],
	customQuery: store.customQueries[component],
	defaultQuery: store.defaultQueries[component],
	highlightOptions: store.customHighlightOptions[component],
	categoryValue: store.internalValues[component]
		? store.internalValues[component].category
		: undefined,
	...customOptions,
});

export function flatReactProp(reactProp) {
	let flattenReact = [];
	const flatReact = (react) => {
		if (react && Object.keys(react)) {
			Object.keys(react).forEach((r) => {
				if (react[r]) {
					if (typeof react[r] === 'string') {
						flattenReact = [...flattenReact, react[r]];
					} else if (Array.isArray(react[r])) {
						flattenReact = [...flattenReact, ...react[r]];
					} else if (typeof react[r] === 'object') {
						flatReact(react[r]);
					}
				}
			});
		}
	};
	flatReact(reactProp);
	return flattenReact;
}

export const getDependentQueries = (store, componentID) => {
	const finalQuery = {};
	const addDependentQueries = (react = []) => {
		react.forEach((component) => {
			const calcValues = store.selectedValues[component] || store.internalValues[component];
			// Only apply component that has some value
			if (calcValues && !finalQuery[component]) {
				// build query
				const dependentQuery = getRSQuery(
					component,
					extractPropsFromState(store, component),
					calcValues,
					store.dependencyTree[component],
					false,
				);
				finalQuery[component] = dependentQuery;
			}
			const componentReactDependency = store.dependencyTree[component];
			if (componentReactDependency) {
				const flattenReact = flatReactProp(componentReactDependency);
				if (flattenReact.length) {
					addDependentQueries(flattenReact, store, finalQuery);
				}
			}
		});
	};
	addDependentQueries(flatReactProp(store.dependencyTree[componentID]), store);
	return finalQuery;
};
