import XDate from 'xdate';
import { componentTypes, queryTypes } from './constants';
import { formatDate } from './helper';

export const componentToTypeMap = {
	// search components
	[componentTypes.reactiveList]: queryTypes.search,
	[componentTypes.dataSearch]: queryTypes.search,
	[componentTypes.categorySearch]: queryTypes.search,
	[componentTypes.searchBox]: queryTypes.suggestion,
	// term components
	[componentTypes.singleList]: queryTypes.term,
	[componentTypes.multiList]: queryTypes.term,
	[componentTypes.singleDataList]: queryTypes.term,
	[componentTypes.singleDropdownList]: queryTypes.term,
	[componentTypes.multiDataList]: queryTypes.term,
	[componentTypes.multiDropdownList]: queryTypes.term,
	[componentTypes.tagCloud]: queryTypes.term,
	[componentTypes.toggleButton]: queryTypes.term,
	// basic components
	[componentTypes.numberBox]: queryTypes.term,

	// range components
	[componentTypes.datePicker]: queryTypes.range,
	[componentTypes.dateRange]: queryTypes.range,
	[componentTypes.dynamicRangeSlider]: queryTypes.range,
	[componentTypes.singleDropdownRange]: queryTypes.range,
	[componentTypes.multiDropdownRange]: queryTypes.range,
	[componentTypes.singleRange]: queryTypes.range,
	[componentTypes.multiRange]: queryTypes.range,
	[componentTypes.rangeSlider]: queryTypes.range,
	[componentTypes.ratingsFilter]: queryTypes.range,
	[componentTypes.rangeInput]: queryTypes.range,

	// map components
	[componentTypes.geoDistanceDropdown]: queryTypes.geo,
	[componentTypes.geoDistanceSlider]: queryTypes.geo,
	[componentTypes.reactiveMap]: queryTypes.geo,
};

const multiRangeComponents = [componentTypes.multiRange, componentTypes.multiDropdownRange];
const dateRangeComponents = [componentTypes.dateRange, componentTypes.datePicker];
const searchComponents = [
	componentTypes.categorySearch,
	componentTypes.dataSearch,
	componentTypes.searchBox,
];
const listComponentsWithPagination = [
	componentTypes.singleList,
	componentTypes.multiList,
	componentTypes.singleDropdownList,
	componentTypes.multiDropdownList,
];

export const getNormalizedField = (field) => {
	if (field && !Array.isArray(field)) {
		return [field];
	}
	return field;
};

export const isInternalComponent = (componentID = '') => componentID.endsWith('__internal');

export const getInternalComponentID = (componentID = '') => `${componentID}__internal`;

export const getHistogramComponentID = (componentID = '') => `${componentID}__histogram__internal`;

export const isDRSRangeComponent = (componentID = '') => componentID.endsWith('__range__internal');

export const isSearchComponent = (componentType = '') => searchComponents.includes(componentType);

export const isComponentUsesLabelAsValue = (componentType = '') =>
	componentType === componentTypes.multiDataList
	|| componentType === componentTypes.singleDataList;

export const hasPaginationSupport = (componentType = '') =>
	listComponentsWithPagination.includes(componentType);

export const getRSQuery = (componentId, props, execute = true) => {
	if (props && componentId) {
		const queryType = props.type ? props.type : componentToTypeMap[props.componentType];
		// dataField is a required field for components other than search
		// TODO: Revisit this logic based on the Appbase version
		// dataField is no longer a required field in RS API
		if (!isSearchComponent(props.componentType) && !props.dataField) {
			return null;
		}
		return {
			id: componentId,
			type: queryType,
			dataField: getNormalizedField(props.dataField),
			execute,
			react: props.react,
			highlight: props.highlight,
			highlightField: getNormalizedField(props.highlightField),
			fuzziness: props.fuzziness,
			searchOperators: props.searchOperators,
			includeFields: props.includeFields,
			excludeFields: props.excludeFields,
			size: props.size,
			aggregationSize: props.aggregationSize,
			from: props.from, // Need to maintain for RL
			queryFormat: props.queryFormat,
			sortBy: props.sortBy,
			fieldWeights: getNormalizedField(props.fieldWeights),
			includeNullValues: props.includeNullValues,
			aggregationField: props.aggregationField || undefined,
			categoryField: props.categoryField || undefined,
			missingLabel: props.missingLabel || undefined,
			showMissing: props.showMissing,
			nestedField: props.nestedField || undefined,
			interval: props.interval,
			customHighlight: props.customHighlight,
			customQuery: props.customQuery,
			defaultQuery: props.defaultQuery,
			value: props.value,
			categoryValue: props.categoryValue || undefined,
			after: props.after || undefined,
			aggregations: props.aggregations || undefined,
			enableSynonyms: props.enableSynonyms,
			selectAllLabel: props.selectAllLabel,
			pagination: props.pagination,
			queryString: props.queryString,
			distinctField: props.distinctField,
			distinctFieldConfig: props.distinctFieldConfig,
			index: props.index,
			...(queryType === queryTypes.suggestion
				? {
					enablePopularSuggestions: props.enablePopularSuggestions,
					enableRecentSuggestions: props.enableRecentSuggestions,
					popularSuggestionsConfig: props.popularSuggestionsConfig,
					recentSuggestionsConfig: props.recentSuggestionsConfig,
					applyStopwords: props.applyStopwords,
					customStopwords: props.customStopwords,
					enablePredictiveSuggestions: props.enablePredictiveSuggestions,
				}
				: {}),
		};
	}
	return null;
};

export const getValidInterval = (interval, range = {}) => {
	const min = Math.ceil((range.end - range.start) / 100) || 1;
	if (!interval) {
		return min;
	} else if (interval < min) {
		return min;
	}
	return interval;
};

export const extractPropsFromState = (store, component, customOptions) => {
	const componentProps = store.props[component];
	if (!componentProps) {
		return null;
	}
	const queryType = componentToTypeMap[componentProps.componentType];
	const calcValues = store.selectedValues[component] || store.internalValues[component];
	let value = calcValues !== undefined && calcValues !== null ? calcValues.value : undefined;
	let queryFormat = componentProps.queryFormat;
	let { interval } = componentProps;
	let type = componentToTypeMap[componentProps.componentType];
	let dataField = componentProps.dataField;
	let aggregations;
	let pagination; // pagination for `term` type of queries
	let from = componentProps.from; // offset for RL

	// For term queries i.e list component `dataField` will be treated as aggregationField
	if (queryType === queryTypes.term) {
		// Only apply pagination prop for the components which supports it otherwise it can break the UI
		if (componentProps.showLoadMore && hasPaginationSupport(componentProps.componentType)) {
			pagination = true;
		}
		// Extract values from components that are type of objects
		// This code handles the controlled behavior in list components for e.g ToggleButton
		if (value != null && typeof value === 'object' && value.value) {
			value = value.value;
		} else if (Array.isArray(value)) {
			const parsedValue = [];
			value.forEach((val) => {
				if (val != null && typeof val === 'object' && val.value) {
					parsedValue.push(val.value);
				} else {
					parsedValue.push(val);
				}
			});
			value = parsedValue;
		}
	}
	if (queryType === queryTypes.range) {
		if (Array.isArray(value)) {
			if (multiRangeComponents.includes(componentProps.componentType)) {
				value = value.map(({ start, end }) => ({
					start,
					end,
				}));
			} else {
				value = {
					start: value[0],
					end: value[1],
				};
			}
		} else if (componentProps.showHistogram) {
			const internalComponentID = getInternalComponentID(component);
			let internalComponentValue = store.internalValues[internalComponentID];
			if (!internalComponentValue) {
				// Handle dynamic range slider
				const histogramComponentID = getHistogramComponentID(component);
				internalComponentValue = store.internalValues[histogramComponentID];
			}
			if (internalComponentValue && Array.isArray(internalComponentValue.value)) {
				value = {
					start: internalComponentValue.value[0],
					end: internalComponentValue.value[1],
				};
				// Set interval
				interval = getValidInterval(interval, value);
			}
		}
		if (isDRSRangeComponent(component)) {
			aggregations = ['min', 'max'];
		} else if (componentProps.showHistogram) {
			aggregations = ['histogram'];
		}

		// handle date components
		if (dateRangeComponents.includes(componentProps.componentType)) {
			// Remove query format for `date` components
			queryFormat = 'or';
			// Set value
			if (value) {
				if (typeof value === 'string') {
					value = {
						start: formatDate(new XDate(value).addHours(-24), componentProps),
						end: formatDate(new XDate(value), componentProps),
					};
				} else if (Array.isArray(value)) {
					value = value.map(val => ({
						start: formatDate(new XDate(val).addHours(-24), componentProps),
						end: formatDate(new XDate(val), componentProps),
					}));
				}
			}
		}
	}
	if (queryType === queryTypes.geo) {
		// override the value extracted from selectedValues reducer
		value = undefined;
		const geoCalcValues
			= store.selectedValues[component]
			|| store.internalValues[component]
			|| store.internalValues[getInternalComponentID(component)];
		if (geoCalcValues && geoCalcValues.meta) {
			if (geoCalcValues.meta.distance && geoCalcValues.meta.coordinates) {
				value = {
					distance: geoCalcValues.meta.distance,
					location: geoCalcValues.meta.coordinates,
				};
				if (componentProps.unit) {
					value.unit = componentProps.unit;
				}
			}
			if (
				geoCalcValues.meta.mapBoxBounds
				&& geoCalcValues.meta.mapBoxBounds.top_left
				&& geoCalcValues.meta.mapBoxBounds.bottom_right
			) {
				value = {
					// Note: format will be reverse of what we're using now
					geoBoundingBox: {
						topLeft: `${geoCalcValues.meta.mapBoxBounds.top_left[1]}, ${geoCalcValues.meta.mapBoxBounds.top_left[0]}`,
						bottomRight: `${geoCalcValues.meta.mapBoxBounds.bottom_right[1]}, ${geoCalcValues.meta.mapBoxBounds.bottom_right[0]}`,
					},
				};
			}
		}
	}
	// handle number box, number box query changes based on the `queryFormat` value
	if (componentProps.componentType === componentTypes.numberBox) {
		if (queryFormat === 'exact') {
			type = 'term';
		} else {
			type = 'range';
			if (queryFormat === 'lte') {
				value = {
					end: value,
					boost: 2.0,
				};
			} else {
				value = {
					start: value,
					boost: 2.0,
				};
			}
		}
		// Remove query format
		queryFormat = 'or';
	}
	// Fake dataField for ReactiveComponent
	// TODO: Remove it after some time. The `dataField` is no longer required
	if (componentProps.componentType === componentTypes.reactiveComponent) {
		// Set the type to `term`
		type = 'term';
		dataField = 'reactive_component_field';
		// Don't set value property for ReactiveComponent
		// since it is driven by `defaultQuery` and `customQuery`
		value = undefined;
	}
	// Assign default value as an empty string for search components so search relevancy can work
	if (isSearchComponent(componentProps.componentType) && !value) {
		value = '';
	}

	// Handle components which uses label instead of value as the selected value
	if (isComponentUsesLabelAsValue(componentProps.componentType)) {
		const { data } = componentProps;
		let absValue = [];
		if (value && Array.isArray(value)) {
			absValue = value;
		} else if (value && typeof value === 'string') {
			absValue = [value];
		}
		const normalizedValue = [];
		if (absValue.length) {
			if (data && Array.isArray(data)) {
				absValue.forEach((val) => {
					const dataItem = data.find(o => o.label === val);
					if (dataItem && dataItem.value) {
						normalizedValue.push(dataItem.value);
					}
				});
			}
		}
		if (normalizedValue.length) {
			value = normalizedValue;
		} else {
			value = undefined;
		}
	}
	if (componentProps.componentType === componentTypes.reactiveList) {
		// We set selected page as the value in the redux store for RL.
		// It's complex to change this logic in the component so changed it here.
		if (value > 0) {
			from = (value - 1) * (componentProps.size || 10);
		}
		value = undefined;
	}
	return {
		...componentProps,
		dataField,
		queryFormat,
		type,
		aggregations,
		interval,
		react: store.dependencyTree ? store.dependencyTree[component] : undefined,
		customQuery: store.customQueries ? store.customQueries[component] : undefined,
		defaultQuery: store.defaultQueries ? store.defaultQueries[component] : undefined,
		customHighlight: store.customHighlightOptions
			? store.customHighlightOptions[component]
			: undefined,
		categoryValue: store.internalValues[component]
			? store.internalValues[component].category
			: undefined,
		value:
			componentProps.componentType === componentTypes.searchBox ? value || undefined : value,
		pagination,
		from,
		...customOptions,
	};
};

export function flatReactProp(reactProp, componentID) {
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
	// Remove cyclic dependencies
	flattenReact = flattenReact.filter(react => react !== componentID);
	return flattenReact;
}

export const getDependentQueries = (store, componentID, orderOfQueries = []) => {
	const finalQuery = {};
	const react = flatReactProp(store.dependencyTree[componentID], componentID);
	react.forEach((componentObject) => {
		const component = componentObject;
		const customQuery = store.customQueries[component];
		if (!isInternalComponent(component)) {
			const calcValues = store.selectedValues[component] || store.internalValues[component];
			// Only include queries for that component that has `customQuery` or `value` defined
			if ((calcValues || customQuery) && !finalQuery[component]) {
				let execute = false;
				if (Array.isArray(orderOfQueries) && orderOfQueries.includes(component)) {
					execute = true;
				}
				// build query
				const dependentQuery = getRSQuery(
					component,
					extractPropsFromState(store, component, {
						...(store.props[component].componentType === componentTypes.searchBox
							? {
								...(execute === false ? { type: queryTypes.search } : {}),
								...(calcValues.category
									? { categoryValue: calcValues.category }
									: {}),
							}
							: {}),
					}),
					execute,
				);
				if (dependentQuery) {
					finalQuery[component] = dependentQuery;
				}
			}
		}
	});
	return finalQuery;
};
