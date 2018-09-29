/* eslint-disable */
// when we want to perform deep equality check, especially in objects
export function isEqual(x, y) {
	if (x === y) return true;
	if (!(x instanceof Object) || !(y instanceof Object)) return false;
	if (x.constructor !== y.constructor) return false;

	for (const p in x) {
		if (!x.hasOwnProperty(p)) continue;
		if (!y.hasOwnProperty(p)) return false;
		if (x[p] === y[p]) continue;
		if (typeof (x[p]) !== 'object') return false;
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
		if (props.includeFields) { source.includes = props.includeFields; }
		if (props.excludeFields) { source.excludes = props.excludeFields; }
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
			const queryArr = react[conjunction].map((comp) => {
				if (typeof comp !== 'string') {
					// in this case, we have { <conjunction>: <> } objects inside the array
					return getQuery(comp, queryList);
				} else if (comp in queryList) {
					return queryList[comp];
				}
				return null;
			}).filter(item => !!item);

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
		} else if (
			typeof react[conjunction] === 'object'
			&& react[conjunction] !== null
		) {
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
		} else if (typeof react[conjunction] === 'object'
			&& react[conjunction] !== null
			&& !Array.isArray(react[conjunction])) {
			queryOptions = { ...queryOptions, ...getExternalQueryOptions(react[conjunction], options) };
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
	if (beforeValueChange) {
		beforeValueChange(selectedValue)
			.then(performUpdate)
			.catch((e) => {
				console.warn(`${componentId} - beforeValueChange rejected the promise with `, e);
			});
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

export const parseHits = (hits) => {
	let results = null;
	if (hits) {
		results = [...hits].map((item) => {
			const streamProps = {};

			if (item._updated) {
				streamProps._updated = item._updated;
			} else if (item._deleted) {
				streamProps._deleted = item._deleted;
			}

			const data = highlightResults(item);
			return {
				_id: data._id,
				_index: data._index,
				...data._source,
				...streamProps,
			};
		});
	}
	return results;
};
