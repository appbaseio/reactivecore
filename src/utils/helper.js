// when we want to perform deep equality check, especially in objects
import dateFormats from './dateFormats';
import getSuggestions from './suggestions';

export const updateCustomQuery = (componentId, props, value) => {
	if (props.customQuery && typeof props.customQuery === 'function') {
		props.setCustomQuery(componentId, props.customQuery(value, props));
	}
};

export const updateDefaultQuery = (componentId, props, value) => {
	if (props.defaultQuery && typeof props.defaultQuery === 'function') {
		props.setDefaultQuery(componentId, props.defaultQuery(value, props));
	}
};

export function isEqual(x, y) {
	if (x === y) return true;
	if (!(x instanceof Object) || !(y instanceof Object)) return false;
	if (x.constructor !== y.constructor) return false;

	/* eslint-disable */
	for (const p in x) {
		if (!x.hasOwnProperty(p)) continue;
		if (!y.hasOwnProperty(p)) return false;
		if (x[p] === y[p]) continue;
		if (typeof x[p] !== 'object') return false;
		if (!isEqual(x[p], y[p])) return false;
	}

	for (const p in y) {
		if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
	}
	/* eslint-enable */
	return true;
}
/* eslint-enable */

export function compareQueries(x, y) {
	try {
		// de-reference objects then compare
		return isEqual(JSON.parse(JSON.stringify(x)), JSON.parse(JSON.stringify(y)));
	} catch (e) {
		return false;
	}
}

export function debounce(callback, wait, context = this) {
	let timeout = null;
	let callbackArgs = null;

	const later = () => callback.apply(context, callbackArgs);

	return function debouncedFunction() {
		callbackArgs = arguments; // eslint-disable-line
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

export function getQueryOptions(props) {
	const options = {};
	if (props.size !== undefined) {
		options.size = props.size;
	}
	if (props.includeFields || props.excludeFields) {
		const source = {};
		if (props.includeFields) {
			source.includes = props.includeFields;
		}
		if (props.excludeFields) {
			source.excludes = props.excludeFields;
		}
		options._source = source;
	}
	return options;
}

function getOperation(conjunction) {
	if (conjunction === 'and') {
		return 'must';
	}
	if (conjunction === 'or') {
		return 'should';
	}
	return 'must_not';
}

function createBoolQuery(operation, query) {
	let resultQuery = null;
	if ((Array.isArray(query) && query.length) || (!Array.isArray(query) && query)) {
		resultQuery = {
			bool: {
				[operation]: query,
			},
		};
	}

	if (operation === 'should' && resultQuery) {
		resultQuery = {
			bool: {
				...resultQuery.bool,
				minimum_should_match: 1,
			},
		};
	}
	return resultQuery;
}

function getQuery(react, queryList) {
	let query = [];
	Object.keys(react).forEach((conjunction) => {
		if (Array.isArray(react[conjunction])) {
			const operation = getOperation(conjunction);
			const queryArr = react[conjunction]
				.map((comp) => {
					if (typeof comp !== 'string') {
						// in this case, we have { <conjunction>: <> } objects inside the array
						return getQuery(comp, queryList);
					} else if (comp in queryList) {
						if (queryList[comp] && Object.keys(queryList[comp]).length) {
							return queryList[comp];
						}
					}
					return null;
				})
				.filter(item => !!item);

			const boolQuery = createBoolQuery(operation, queryArr);
			if (boolQuery && Object.keys(boolQuery).length) {
				query = [...query, boolQuery];
			}
		} else if (typeof react[conjunction] === 'string') {
			const operation = getOperation(conjunction);
			const boolQuery = createBoolQuery(operation, queryList[react[conjunction]]);
			if (boolQuery && Object.keys(boolQuery).length) {
				query = [...query, boolQuery];
			}
		} else if (typeof react[conjunction] === 'object' && react[conjunction] !== null) {
			const boolQuery = getQuery(react[conjunction], queryList);
			if (boolQuery && Object.keys(boolQuery).length) {
				query = [...query, boolQuery];
			}
		}
	});

	if (Array.isArray(query) && query.length) {
		return {
			bool: { must: query },
		};
	}

	if (query && Object.keys(query).length) {
		return query;
	}

	return null;
}

function getExternalQueryOptions(react, options, component) {
	let queryOptions = {};

	Object.keys(react).forEach((conjunction) => {
		if (Array.isArray(react[conjunction])) {
			react[conjunction].forEach((comp) => {
				if (options[comp]) {
					queryOptions = { ...queryOptions, ...options[comp] };
				}
			});
		} else if (typeof react[conjunction] === 'string') {
			if (options[react[conjunction]]) {
				queryOptions = { ...queryOptions, ...options[react[conjunction]] };
			}
		} else if (
			typeof react[conjunction] === 'object'
			&& react[conjunction] !== null
			&& !Array.isArray(react[conjunction])
		) {
			queryOptions = {
				...queryOptions,
				...getExternalQueryOptions(react[conjunction], options),
			};
		}
	});
	if (options[component]) {
		queryOptions = { ...queryOptions, ...options[component] };
	}
	return queryOptions;
}

export function buildQuery(component, dependencyTree, queryList, queryOptions) {
	let queryObj = null;
	let options = null;

	if (component in dependencyTree) {
		queryObj = getQuery(dependencyTree[component], queryList);
		options = getExternalQueryOptions(dependencyTree[component], queryOptions, component);
	}
	return { queryObj, options };
}

export function pushToAndClause(reactProp, component) {
	const react = Object.assign({}, reactProp);
	if (react.and) {
		if (Array.isArray(react.and)) {
			react.and = [...react.and, component];
			return react;
		} else if (typeof react.and === 'string') {
			react.and = [react.and, component];
			return react;
		}
		react.and = pushToAndClause(react.and, component);
		return react;
	}
	return { ...react, and: component };
}

// checks and executes beforeValueChange for sensors
export function checkValueChange(componentId, value, beforeValueChange, performUpdate) {
	let selectedValue = value;
	// To ensure that the returned values are consistent across all the components
	// null is returned in case of an empty array
	if (Array.isArray(value) && !value.length) {
		selectedValue = null;
	}
	const handleError = (e) => {
		console.warn(`${componentId} - beforeValueChange rejected the promise with `, e);
	};

	if (beforeValueChange) {
		try {
			const promise = beforeValueChange(selectedValue);
			if (promise instanceof Promise) {
				promise.then(performUpdate).catch(handleError);
			} else {
				performUpdate();
			}
		} catch (e) {
			handleError(e);
		}
	} else {
		performUpdate();
	}
}

export function getAggsOrder(sortBy) {
	if (sortBy === 'count') {
		return {
			_count: 'desc',
		};
	}
	return {
		_key: sortBy,
	};
}

// checks for props changes that would need to update the query via callback
export const checkPropChange = (prevProp, nextProp, callback) => {
	if (!isEqual(prevProp, nextProp)) {
		callback();
		return true;
	}
	return false;
};

// checks for any prop change in the propsList and invokes the callback
export const checkSomePropChange = (prevProps = {}, nextProps = {}, propsList, callback) => {
	propsList.some(prop => checkPropChange(prevProps[prop], nextProps[prop], callback));
};

export const getClassName = (classMap, component) => (classMap && classMap[component]) || '';

export const getInnerKey = (obj, key) => (obj && obj[key]) || {};

export const handleA11yAction = (e, callback) => {
	if (e.key === 'Enter' || e.key === ' ') {
		e.preventDefault();
		callback();
	}
};

const highlightResults = (result) => {
	const data = { ...result };
	if (data.highlight) {
		Object.keys(data.highlight).forEach((highlightItem) => {
			const highlightValue = data.highlight[highlightItem][0];
			data._source = Object.assign({}, data._source, { [highlightItem]: highlightValue });
		});
	}
	return data;
};

export const parseHits = (hits, showHighlighted = true) => {
	let results = null;
	if (hits) {
		results = [...hits].map((item) => {
			let data = { ...item };
			if (showHighlighted) data = highlightResults(item);
			const result = Object.keys(data)
				.filter(key => key !== '_source')
				.reduce(
					(obj, key) => {
						// eslint-disable-next-line
						obj[key] = data[key];
						return obj;
					},
					{
						highlight: data.highlight || {},
						...data._source,
					},
				);
			return result;
		});
	}
	return results;
};

export function formatDate(date, props) {
	if (props.parseDate) {
		return props.parseDate(date, props);
	}
	switch (props.queryFormat) {
		case 'epoch_millis':
			return date.getTime();
		case 'epoch_second':
			return Math.floor(date.getTime() / 1000);
		default: {
			if (dateFormats[props.queryFormat]) {
				return date.toString(dateFormats[props.queryFormat]);
			}
			return date.getTime();
		}
	}
}

/**
 * To extract query options from custom or default query
 * @param {Object} customQuery
 */
export const getOptionsFromQuery = (customQuery = {}) => {
	if (customQuery) {
		const { query, ...rest } = customQuery;
		return Object.keys(rest).length ? rest : null;
	}
	return null;
};

/**
 * To extract query options from custom query
 * @param {Object} customQuery
 */
export const getOptionsForCustomQuery = (customQuery = {}) => {
	if (customQuery) {
		const {
			query, id, params, ...rest
		} = customQuery;
		return Object.keys(rest).length ? rest : null;
	}
	return null;
};

// Returns the query key from custom query
// It handles the stored queries for Appbase which can have `id` at top-level
export const extractQueryFromCustomQuery = (customQuery) => {
	if (customQuery) {
		// handle stored queries
		if (customQuery.id) {
			return {
				id: customQuery.id,
				params: customQuery.params,
			};
		}
		// else returns the query key
		return customQuery.query;
	}
	return null;
};

function computeResultStats(hits, searchState, promotedResults) {
	Object.keys(hits).forEach((componentId) => {
		const { hidden, total, time } = hits[componentId] || {};
		// eslint-disable-next-line no-param-reassign
		searchState[componentId] = {
			...searchState[componentId],
			resultStats: {
				...searchState[componentId].resultStats,
				numberOfResults: total,
				time,
				promoted: promotedResults[componentId] && promotedResults[componentId].length,
				hidden: hidden || 0,
			},
		};
	});
}

export const getSearchState = (state = {}, forHeaders = false) => {
	const {
		selectedValues,
		queryLog,
		dependencyTree,
		props,
		hits,
		aggregations,
		isLoading,
		error,
		promotedResults,
		settings,
		customData,
		rawData,
	} = state;
	const searchState = {};

	const populateState = (obj = {}, key) =>
		Object.keys(obj).forEach((componentId) => {
			searchState[componentId] = {
				...searchState[componentId],
				...(key ? { [key]: obj[componentId] } : obj[componentId]),
			};
		});

	populateState(props);

	Object.keys(selectedValues).forEach((componentId) => {
		const componentState = searchState[componentId];
		const selectedValue = selectedValues[componentId];
		if (selectedValue) {
			searchState[componentId] = {
				...componentState,
				...{
					title: selectedValue.label,
					componentType: selectedValue.componentType,
					value: selectedValue.value,
					...(selectedValue.category && {
						category: selectedValue.category,
					}),
					URLParams: selectedValue.URLParams,
				},
			};
		}
	});
	if (!forHeaders) {
		populateState(queryLog);
		populateState(hits, 'hits');
		populateState(aggregations, 'aggregations');
		populateState(isLoading, 'isLoading');
		populateState(error, 'error');
		populateState(promotedResults, 'promotedData');
		populateState(settings, 'settings');
		populateState(customData, 'customData');
		populateState(rawData, 'rawData');
		computeResultStats(hits, searchState, promotedResults);
	}
	populateState(dependencyTree, 'react');
	return searchState;
};
/**
 * Updates the query for the internal component
 */
export const updateInternalQuery = (
	componentId,
	queryOptions,
	value,
	props,
	defaultQueryToExecute,
	queryParams,
) => {
	const { defaultQuery } = props;
	let defaultQueryOptions;
	let query;
	if (defaultQuery) {
		const queryTobeSet = defaultQuery(value, props);
		({ query } = queryTobeSet || {});
		defaultQueryOptions = getOptionsFromQuery(queryTobeSet);
		// Update calculated default query in store
		updateDefaultQuery(componentId, props, value);
	}
	props.setQueryOptions(componentId, {
		...defaultQueryOptions,
		...(queryOptions || defaultQueryToExecute),
	});
	if (query) {
		props.updateQuery({
			componentId,
			query,
			value,
			...queryParams,
		});
	}
};
// extracts query options from defaultQuery if set
export const extractQueryFromDefaultQuery = (props, value) => {
	let queryToBeReturned = {};
	const { defaultQuery } = props;
	/*
	 do not call props.defaultQuery() directly as the client may be accessing props directly
	 E.g.
	 <MultiList defaultQuery={(value, props) => ({query: [props.dataField]: value})} />
	*/
	if (defaultQuery) {
		const evaluateQuery = defaultQuery(value, props);
		if (evaluateQuery) {
			// we should only retrieve and set the query options here.
			// [Not implemented yet] `query` key should be handled separately for
			// adding it to `queryList` in the redux store
			const { query, ...options } = evaluateQuery;
			if (options) {
				queryToBeReturned = options;
			}
		}
	}
	return queryToBeReturned;
};
export const getAggsQuery = (value, query, props) => {
	const clonedQuery = query;
	const {
		dataField, size, sortBy, showMissing, missingLabel,
	} = props;
	clonedQuery.size = 0;
	clonedQuery.aggs = {
		[dataField]: {
			terms: {
				field: dataField,
				size,
				order: getAggsOrder(sortBy || 'count'),
				...(showMissing ? { missing: missingLabel } : {}),
			},
		},
	};

	if (props.nestedField) {
		clonedQuery.aggs = {
			reactivesearch_nested: {
				nested: {
					path: props.nestedField,
				},
				aggs: clonedQuery.aggs,
			},
		};
	}
	return { ...clonedQuery, ...extractQueryFromDefaultQuery(props, value) };
};

export const getCompositeAggsQuery = ({
	query = {},
	props,
	after = null,
	showTopHits = false,
	value,
} = {}) => {
	const clonedQuery = query;
	// missing label not available in composite aggs
	const {
		dataField, size, sortBy, showMissing, aggregationField,
	} = props;

	// first preference will be given to aggregationField
	const finalField = aggregationField || dataField;

	// composite aggs only allows asc and desc
	const order = sortBy === 'count' ? {} : { order: sortBy };

	clonedQuery.aggs = {
		[finalField]: {
			composite: {
				sources: [
					{
						[finalField]: {
							terms: {
								field: finalField,
								...order,
								...(showMissing ? { missing_bucket: true } : {}),
							},
						},
					},
				],
				size,
				...after,
			},
			...(showTopHits
				? {
					aggs: {
						[finalField]: {
							top_hits: { size: 1 },
						},
					},
				  }
				: {}),
		},
	};
	clonedQuery.size = 0;

	if (props.nestedField) {
		clonedQuery.aggs = {
			reactivesearch_nested: {
				nested: {
					path: props.nestedField,
				},
				aggs: clonedQuery.aggs,
			},
		};
	}
	return { ...clonedQuery, ...extractQueryFromDefaultQuery(props, value) };
};
/**
 * Adds click ids in the hits(useful for trigger analytics)
 */
export const withClickIds = (results = []) =>
	results.map((result, index) => ({
		...result,
		_click_id: index,
	}));

export function getResultStats(props) {
	const {
		total, size, time, hidden, promotedResults,
	} = props;
	return {
		numberOfResults: total,
		...(size > 0 ? { numberOfPages: Math.ceil(total / size) } : null),
		time: time || 0,
		hidden,
		promoted: promotedResults && promotedResults.length,
	};
}

// Util method to extract the fields from elasticsearch source object
// It can handle nested objects and arrays too.
// Example 1:
// Input: { a: 1, b: { b_1: 2, b_2: 3}}
// Output: ['a', 'b.b_1', 'b.b_2']
// Example 2:
// Input: { a: 1, b: [{c: 1}, {d: 2}, {c: 3}]}
// Output: ['a', 'b.c', 'b.d']
export function extractFieldsFromSource(esSource) {
	function getFields(source = {}, prefix = '') {
		return Object.keys(source).reduce((acc = {}, k) => {
			let key = prefix ? `${prefix}.${k}` : k;
			if (!Number.isNaN(parseInt(k, 10))) {
				key = prefix || k;
			}
			if (source[k] && typeof source[k] === 'object') {
				return { ...acc, ...getFields(source[k], key) };
			}
			return { ...acc, ...{ [key]: true } };
		}, []);
	}
	const fields = getFields(esSource);
	return Object.keys(fields);
}

// Normalizes the dataField into an array of objects
// { "field": x, "weight": y }
export function normalizeDataField(dataField, fieldWeights = []) {
	if (typeof dataField === 'string') {
		return [
			{
				field: dataField,
				weight: fieldWeights.length ? fieldWeights[0] : undefined,
			},
		];
	}
	if (Array.isArray(dataField)) {
		return dataField.map((field, index) => {
			const normalizedField = {};
			if (typeof field === 'string') {
				normalizedField.field = field;
				if (fieldWeights.length > index) {
					normalizedField.weight = fieldWeights[index];
				}
			} else if (typeof field === 'object' && field && field.field) {
				normalizedField.field = field.field;
				normalizedField.weight = field.weight;
			}
			return normalizedField;
		});
	}
	if (typeof dataField === 'object' && dataField) {
		return [
			{
				field: dataField.field,
				weight: dataField.weight,
			},
		];
	}
	return [];
}

export function handleOnSuggestions(results, currentValue, props) {
	const { parseSuggestion, promotedResults, enablePredictiveSuggestions } = props;

	let fields = [];
	if (props.dataField) {
		fields = normalizeDataField(props.dataField).map(f => f.field);
	} else if (
		results
		&& Array.isArray(results)
		&& results.length > 0
		&& results[0]
		&& results[0]._source
	) {
		// Extract fields from _source
		fields = extractFieldsFromSource(results[0]._source);
	}

	// hits as flat structure
	let newResults = parseHits(results, false);

	const parsedPromotedResults = parseHits(promotedResults, false);

	if (parsedPromotedResults && parsedPromotedResults.length) {
		const ids = parsedPromotedResults.map(item => item._id).filter(Boolean);
		if (ids) {
			newResults = newResults.filter(item => !ids.includes(item._id));
		}
		newResults = [...parsedPromotedResults, ...newResults];
	}

	const parsedSuggestions = getSuggestions({
		fields,
		suggestions: newResults,
		currentValue: currentValue.toLowerCase(),
		showDistinctSuggestions: props.showDistinctSuggestions,
		enablePredictiveSuggestions,
		enableSynonyms: props.enableSynonyms,
	});

	if (parseSuggestion) {
		return parsedSuggestions.map(suggestion => parseSuggestion(suggestion));
	}

	return parsedSuggestions;
}

export const getTopSuggestions = (querySuggestions, currentValue = '', showDistinctSuggestions) => {
	const parsedSuggestions = parseHits(querySuggestions, false);
	const finalSuggestions = getSuggestions({
		fields: ['key', 'key.autosuggest', 'key.search'],
		suggestions: parsedSuggestions || [],
		currentValue: currentValue.toLowerCase(),
		showDistinctSuggestions,
	});
	return withClickIds(finalSuggestions);
};

/* isValidDateRangeQueryFormat() checks if the queryFormat is one of the dateFormats
	accepted by the elasticsearch or not. */
export function isValidDateRangeQueryFormat(queryFormat) {
	return Object.keys(dateFormats).includes(queryFormat);
}

export const suggestionTypes = {
	Popular: 'popular',
	Index: 'index',
	Recent: 'recent',
	Promoted: 'promoted',
	Featured: 'featured',
};

// this map helps to get the interval divider
// for histogram, since the calendarinterval prop leaves
export const queryFormatMillisecondsMap = {
	// the below are arranged in asscending order
	// please maintain the order if adding/ removing property(s)
	minute: 60000,
	hour: 3600000,
	day: 86400000,
	week: 604800000,
	month: 2629746000,
	quarter: 7889238000,
	year: 31556952000,
};

// this function checks for subsequent calendarIntervals that would
// yield intervals well within a max cap of 100
// since displaying more than 100 bars on histogram isn't diserable
export const getCalendarIntervalErrorMessage = (totalRange, calendarInterval = 'minute') => {
	const queryFormatMillisecondsMapKeys = Object.keys(queryFormatMillisecondsMap);
	const indexOfCurrentCalendarInterval = queryFormatMillisecondsMapKeys.indexOf(calendarInterval);
	if (indexOfCurrentCalendarInterval === -1) {
		console.error('Invalid calendarInterval Passed');
	}

	if (calendarInterval === 'year') {
		return 'Try using a shorter range of values.';
	}

	for (
		let index = indexOfCurrentCalendarInterval + 1;
		index < queryFormatMillisecondsMapKeys.length;
		index += 1
	) {
		if (totalRange / Object.values(queryFormatMillisecondsMap)[index] <= 100) {
			const calendarIntervalKey = queryFormatMillisecondsMapKeys[index];
			return {
				errorMessage: `Please pass calendarInterval prop with value greater than or equal to a \`${calendarIntervalKey}\` for a meaningful resolution of histogram.`,
				calculatedCalendarInterval: calendarIntervalKey,
			};
		}
	}

	return {
		errorMessage: 'Try using a shorter range of values.',
		calculatedCalendarInterval: 'year',
	}; // we return the highest possible interval to shorten then interval value
};
/**
 * To determine wether an element is a function
 * @param {any} element
 */
export const isFunction = element => typeof element === 'function';

/**
 * Extracts the render prop from props and returns a valid React element
 * @param {Object} data
 * @param {Object} props
 */
export const getComponent = (data = {}, props = {}) => {
	const { children, render } = props;
	// Render function as child
	if (isFunction(children)) {
		return children(data);
	}
	// Render function as render prop
	if (isFunction(render)) {
		return render(data);
	}
	return null;
};
/**
 * To determine whether a component has render prop defined or not
 * @returns {Boolean}
 */
export const hasCustomRenderer = (props = {}) => {
	const { render, children } = props;
	return isFunction(children) || isFunction(render);
};
