/* eslint-disable */
// when we want to perform deep equality check, especially in objects
import dateFormats from './dateFormats';
import getSuggestions from './suggestions';

export function isEqual(x, y) {
	if (x === y) return true;
	if (!(x instanceof Object) || !(y instanceof Object)) return false;
	if (x.constructor !== y.constructor) return false;

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
	return true;
}
/* eslint-enable */

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
						return queryList[comp];
					}
					return null;
				})
				.filter(item => !!item);

			const boolQuery = createBoolQuery(operation, queryArr);
			if (boolQuery) {
				query = [...query, boolQuery];
			}
		} else if (typeof react[conjunction] === 'string') {
			const operation = getOperation(conjunction);
			const boolQuery = createBoolQuery(operation, queryList[react[conjunction]]);
			if (boolQuery) {
				query = [...query, boolQuery];
			}
		} else if (typeof react[conjunction] === 'object' && react[conjunction] !== null) {
			const boolQuery = getQuery(react[conjunction], queryList);
			if (boolQuery) {
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
		_term: sortBy,
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
export const checkSomePropChange = (prevProps, nextProps, propsList, callback) => {
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
			const streamProps = {};

			if (item._updated) {
				streamProps._updated = item._updated;
			} else if (item._deleted) {
				streamProps._deleted = item._deleted;
			}

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
						...streamProps,
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
		case 'epoch_seconds':
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
	}
	props.setQueryOptions(componentId, {
		...defaultQueryOptions,
		...(queryOptions || defaultQueryToExecute),
	});
	if (query) {
		props.updateQuery({
			componentId,
			query,
			...queryParams,
		});
	}
};
// extracts query options from defaultQuery if set
export const extractQueryFromDefaultQuery = (defaultQuery) => {
	let queryToBeReturned = {};
	if (defaultQuery) {
		const evaluateQuery = defaultQuery();
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
export const getAggsQuery = (query, props) => {
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
	return { ...clonedQuery, ...extractQueryFromDefaultQuery(props.defaultQuery) };
};
export const getCompositeAggsQuery = (query, props, after, showTopHits = false) => {
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
	return { ...clonedQuery, ...extractQueryFromDefaultQuery(props.defaultQuery) };
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
		time,
		hidden,
		promoted: promotedResults && promotedResults.length,
	};
}

export function handleOnSuggestions(results, currentValue, props) {
	const { parseSuggestion, promotedResults } = props;

	const fields = Array.isArray(props.dataField) ? props.dataField : [props.dataField];

	// hits as flat structure
	let newResults = parseHits(results, false);

	if (promotedResults.length) {
		const ids = promotedResults.map(item => item._id).filter(Boolean);
		if (ids) {
			newResults = newResults.filter(item => !ids.includes(item._id));
		}
		newResults = [...promotedResults, ...newResults];
	}

	const parsedSuggestions = getSuggestions({
		fields,
		suggestions: newResults,
		currentValue: currentValue.toLowerCase(),
		showDistinctSuggestions: props.showDistinctSuggestions,
	});

	if (parseSuggestion) {
		return parsedSuggestions.map(suggestion => parseSuggestion(suggestion));
	}

	return parsedSuggestions;
}
