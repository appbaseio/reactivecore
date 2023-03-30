import dayjs from 'dayjs';
import { componentTypes, queryTypes } from './constants';
import dateFormats from './dateFormats';
import { formatDate, isValidDateRangeQueryFormat } from './helper';

export const componentToTypeMap = {
	// search components
	[componentTypes.reactiveList]: queryTypes.search,
	[componentTypes.dataSearch]: queryTypes.search,
	[componentTypes.categorySearch]: queryTypes.search,
	[componentTypes.searchBox]: queryTypes.suggestion,
	[componentTypes.AIAnswer]: queryTypes.search,
	// term components
	[componentTypes.singleList]: queryTypes.term,
	[componentTypes.multiList]: queryTypes.term,
	[componentTypes.singleDataList]: queryTypes.term,
	[componentTypes.singleDropdownList]: queryTypes.term,
	[componentTypes.multiDataList]: queryTypes.term,
	[componentTypes.multiDropdownList]: queryTypes.term,
	[componentTypes.tagCloud]: queryTypes.term,
	[componentTypes.toggleButton]: queryTypes.term,
	[componentTypes.reactiveChart]: queryTypes.term,
	[componentTypes.treeList]: queryTypes.term,
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
	|| componentType === componentTypes.singleDataList
	|| componentType === componentTypes.tabDataList;

export const hasPaginationSupport = (componentType = '') =>
	listComponentsWithPagination.includes(componentType);

export const getRSQuery = (componentId, props, execute = true) => {
	if (props && componentId) {
		const queryType = props.type ? props.type : componentToTypeMap[props.componentType];
		// dataField is a required field for components other than search
		// TODO: Revisit this logic based on the Appbase version
		// dataField is no longer a required field in RS API
		if (
			props.componentType !== componentTypes.AIAnswer
			&& !isSearchComponent(props.componentType)
			&& !props.dataField
		) {
			return null;
		}
		let endpoint;
		if (props.endpoint instanceof Object) {
			endpoint = props.endpoint;
		}
		return {
			id: componentId,
			type: queryType || queryTypes.search,
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
			from: props.from || undefined, // Need to maintain for RL
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
			highlightConfig: props.customHighlight || props.highlightConfig,
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
					enableEndpointSuggestions: props.enableEndpointSuggestions,
					enableRecentSuggestions: props.enableRecentSuggestions,
					popularSuggestionsConfig: props.popularSuggestionsConfig,
					recentSuggestionsConfig: props.recentSuggestionsConfig,
					applyStopwords: props.applyStopwords,
					customStopwords: props.customStopwords,
					enablePredictiveSuggestions: props.enablePredictiveSuggestions,
					featuredSuggestionsConfig: props.featuredSuggestionsConfig,
					indexSuggestionsConfig: props.indexSuggestionsConfig,
					enableFeaturedSuggestions: props.enableFeaturedSuggestions,
					enableIndexSuggestions: props.enableIndexSuggestions,
					...(props.searchboxId ? { searchboxId: props.searchboxId } : {}),
				  }
				: {}),
			calendarInterval: props.calendarInterval,
			endpoint,
			range: props.range,
			...(props.enableAI
				? {
					enableAI: true,
					...(props.AIConfig ? { AIConfig: props.AIConfig } : {}),
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
	const queryType = componentProps.type
		? componentProps.type
		: componentToTypeMap[componentProps.componentType];

	const calcValues = store.selectedValues[component];
	let value = calcValues !== undefined && calcValues !== null ? calcValues.value : undefined;
	let queryFormat = componentProps.queryFormat;
	// calendarInterval only supported when using date types
	let calendarInterval;
	const { interval } = componentProps;
	let type = queryType;
	let dataField = componentProps.dataField;
	let aggregations = componentProps.aggregations;
	let pagination; // pagination for `term` type of queries
	let from = componentProps.from; // offset for RL
	let range; // applicable for range components supporting histogram

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
			}
		}

		if (isDRSRangeComponent(component)) {
			aggregations = ['min', 'max'];
		} else if (componentProps.showHistogram) {
			aggregations = ['histogram'];
		}

		// handle number box, number box query changes based on the `queryFormat` value
		if (
			componentProps.componentType === componentTypes.dynamicRangeSlider
			|| componentProps.componentType === componentTypes.rangeSlider
		) {
			calendarInterval = Object.keys(dateFormats).includes(queryFormat)
				? componentProps.calendarInterval
				: undefined;

			// Set value
			if (value) {
				if (isValidDateRangeQueryFormat(componentProps.queryFormat)) {
					// check if date types are dealt with
					value = {
						start: formatDate(dayjs(new Date(value.start)), componentProps),
						end: formatDate(dayjs(new Date(value.end)), componentProps),
					};
				} else {
					value = {
						start: parseFloat(value.start),
						end: parseFloat(value.end),
					};
				}
			}

			let rangeValue;
			if (componentProps.componentType === componentTypes.dynamicRangeSlider) {
				rangeValue = store.aggregations[`${component}__range__internal`];
				if (componentProps.nestedField) {
					rangeValue
						= rangeValue
						&& store.aggregations[`${component}__range__internal`][
							componentProps.nestedField
						].min
							? {
								start: store.aggregations[`${component}__range__internal`][componentProps.nestedField].min.value,
								end: store.aggregations[`${component}__range__internal`][componentProps.nestedField].max.value,
							} // prettier-ignore
							: null;
				} else {
					rangeValue
						= rangeValue
						&& store.aggregations[`${component}__range__internal`].min
						&& store.aggregations[`${component}__range__internal`].min.value
							? {
								start: store.aggregations[`${component}__range__internal`].min.value,
								end: store.aggregations[`${component}__range__internal`].max.value,
							} // prettier-ignore
							: null;
				}
			} else {
				rangeValue = componentProps.range;
			}
			if (rangeValue) {
				if (isValidDateRangeQueryFormat(componentProps.queryFormat)) {
					// check if date types are dealt with
					range = {
						start: formatDate(dayjs(rangeValue.start), componentProps),
						end: formatDate(dayjs(rangeValue.end), componentProps),
					};
				} else {
					range = {
						start: parseFloat(rangeValue.start),
						end: parseFloat(rangeValue.end),
					};
				}
			}
		}

		// handle date components
		if (dateRangeComponents.includes(componentProps.componentType)) {
			// Set value
			if (value) {
				if (isValidDateRangeQueryFormat(componentProps.queryFormat)) {
					if (typeof value === 'string') {
						value = {
							// value would be an ISO Date string
							start: formatDate(dayjs(value).subtract(24, 'hour'), componentProps),
							end: formatDate(dayjs(value), componentProps),
						};
					} else if (Array.isArray(value)) {
						value = value.map(val => ({
							// value would be one of ISO Date string, number, native date
							start: formatDate(dayjs(val).subtract(24, 'hour'), componentProps),
							end: formatDate(dayjs(val), componentProps),
						}));
					} else {
						value = {
							start: formatDate(
								dayjs(value.start).subtract(24, 'hour'),
								componentProps,
							),
							end: formatDate(dayjs(value.end), componentProps),
						};
					}
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
		const { data, selectAllLabel } = componentProps;
		let absValue = [];
		if (value && Array.isArray(value)) {
			absValue = value;
		} else if (value && typeof value === 'string') {
			absValue = [value];
		}
		let normalizedValue = [];
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
		if (selectAllLabel && absValue.length && absValue.includes(selectAllLabel)) {
			normalizedValue = absValue;
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
	let queryValue = value || undefined;
	if (componentProps.componentType === componentTypes.searchBox) {
		if (Array.isArray(queryValue)) {
			queryValue = undefined;
		}
	}
	let endpoint;
	if (componentProps.endpoint instanceof Object) {
		endpoint = { ...(endpoint || {}), ...componentProps.endpoint };
	}
	return {
		...componentProps,
		endpoint,
		calendarInterval,
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
		value: queryValue,
		pagination,
		from,
		range,
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
			if (((calcValues && calcValues.value) || customQuery) && !finalQuery[component]) {
				let execute = false;
				if (Array.isArray(orderOfQueries) && orderOfQueries.includes(component)) {
					execute = true;
				}
				const componentProps = store.props[component];
				// build query
				const dependentQuery = getRSQuery(
					component,
					extractPropsFromState(store, component, {
						...(componentProps && {
							...(componentProps.componentType === componentTypes.searchBox
								? {
									...(execute === false ? { type: queryTypes.search } : {}),
									...(calcValues.category
										? { categoryValue: calcValues.category }
										: { categoryValue: undefined }),
									...(calcValues.value ? { value: calcValues.value } : {}),
								  }
								: {}),
							...(componentProps.componentType === componentTypes.categorySearch
								? {
									...(calcValues.category
										? { categoryValue: calcValues.category }
										: { categoryValue: undefined }),
								  }
								: {}),
						}),
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

export const transformValueToComponentStateFormat = (value, componentProps) => {
	const { componentType, data, queryFormat } = componentProps;
	let transformedValue = value;
	const meta = {};

	if (value) {
		switch (componentType) {
			case componentTypes.singleDataList:
			case componentTypes.tabDataList:
				transformedValue = '';
				if (Array.isArray(value) && typeof value[0] === 'string') {
					transformedValue = value[0];
				} else if (typeof value === 'object' && value.label) {
					transformedValue = value.label;
				} else {
					transformedValue = value;
				}

				break;
			case componentTypes.multiDataList:
				transformedValue = [];
				if (Array.isArray(value)) {
					value.forEach((valObj) => {
						if (typeof valObj === 'object' && (valObj.label || valObj.value)) {
							transformedValue.push(valObj.label || valObj.value);
						} else if (typeof valObj === 'string') {
							transformedValue.push(valObj);
						}
					});
				}

				break;
			case componentTypes.toggleButton:
				transformedValue = []; // array of objects

				if (Array.isArray(value)) {
					value.forEach((valObj) => {
						if (typeof valObj === 'object' && valObj.label && valObj.value) {
							transformedValue.push(valObj);
						} else if (typeof valObj === 'string') {
							const findDataObj = data.find(item =>
								item.label.trim() === valObj.trim()
									|| item.value.trim() === valObj.trim());
							transformedValue.push(findDataObj);
						}
					});
				} else if (typeof value === 'object' && value.label && value.value) {
					transformedValue = value.value;
				} else if (typeof value === 'string') {
					const findDataObj = data.find(item =>
						item.label.trim() === value.trim()
							|| item.value.trim() === value.trim());
					transformedValue = findDataObj.value;
				}
				break;
			case componentTypes.singleRange:
			case componentTypes.singleDropdownRange:
				transformedValue = {};

				if (!Array.isArray(value) && typeof value === 'object') {
					transformedValue = { ...value };
				} else if (typeof value === 'string') {
					const findDataObj = data.find(item => item.label.trim() === value.trim());
					transformedValue = { ...findDataObj };
				}

				break;
			case componentTypes.multiDropdownRange:
			case componentTypes.multiRange:
				transformedValue = []; // array of objects

				if (Array.isArray(value)) {
					value.forEach((valObj) => {
						if (
							typeof valObj === 'object'
							&& typeof valObj.start === 'number'
							&& typeof valObj.end === 'number'
						) {
							let findDataObj = { ...valObj };
							if (!findDataObj.label) {
								findDataObj = data.find(item =>
									item.start === valObj.start && item.end === valObj.end);
							}
							transformedValue.push(findDataObj);
						} else if (typeof valObj === 'string') {
							const findDataObj = data.find(item => item.label.trim() === valObj.trim());
							transformedValue.push(findDataObj);
						}
					});
				} else if (typeof value === 'string') {
					const findDataObj = data.find(item => item.label.trim() === value.trim());
					transformedValue.push(findDataObj);
				}
				break;
			case componentTypes.rangeSlider:
			case componentTypes.ratingsFilter:
			case componentTypes.dynamicRangeSlider:
			case componentTypes.reactiveChart:
				transformedValue = [];
				if (queryFormat) {
					if (Array.isArray(value)) {
						transformedValue = value.map(item =>
							formatDate(dayjs(item), componentProps));
					} else if (typeof value === 'object') {
						transformedValue = [
							formatDate(dayjs(value.start), componentProps),
							formatDate(dayjs(value.end), componentProps),
						];
					}
				} else if (Array.isArray(value)) {
					transformedValue = [...value];
				} else if (typeof value === 'object') {
					transformedValue = [value.start, value.end];
				} else {
					transformedValue = value;
				}
				break;
			case componentTypes.numberBox:
				transformedValue = [];

				if (!Array.isArray(value) && typeof value === 'object') {
					transformedValue = value.start;
				} else if (typeof value === 'number') {
					transformedValue = value;
				}
				break;
			case componentTypes.datePicker:
				transformedValue = '';
				if (typeof value !== 'object') {
					transformedValue = dayjs(value).format('YYYY-MM-DD');
				} else if (value.end) {
					transformedValue = dayjs(value.end).format('YYYY-MM-DD');
				} else if (value.start) {
					transformedValue = dayjs(value.start).add(24, 'hour').format('YYYY-MM-DD');
				}
				break;
			case componentTypes.dateRange:
				transformedValue = []; // array of strings
				if (Array.isArray(value)) {
					transformedValue = value.map(t => dayjs(t).format('YYYY-MM-DD'));
				} else if (typeof value === 'object') {
					transformedValue = [
						dayjs(value.start).format('YYYY-MM-DD'),
						dayjs(value.end).format('YYYY-MM-DD'),
					];
				}
				break;
			case componentTypes.categorySearch:
				transformedValue = '';
				if (typeof value === 'object') {
					transformedValue = value.value;
					if (value.category !== undefined) {
						meta.category = value.category;
					}
				} else if (typeof value === 'string') {
					transformedValue = value;
				}
				break;
			default:
				break;
		}
	}
	return { value: transformedValue, meta };
};
