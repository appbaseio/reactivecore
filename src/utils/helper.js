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

export function debounce(callback, wait, context = this) {
	let timeout = null;
	let callbackArgs = null;

	const later = () => callback.apply(context, callbackArgs);

	return function () {
		callbackArgs = arguments;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

export function getQueryOptions(props) {
	const options = {};
	if (props.size !== undefined) {
		options.size = props.size;
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
	if ((Array.isArray(query) && query.length) || (!Array.isArray(query) && query)) {
		return {
			bool: {
				[operation]: query,
			},
		};
	}
	return null;
}

function getQuery(react, queryList) {
	let query = {};
	Object.keys(react).forEach((conjunction) => {
		if (Array.isArray(react[conjunction])) {
			const operation = getOperation(conjunction);
			const queryArr = react[conjunction].map((comp) => {
				if (comp in queryList) {
					return queryList[comp];
				}
				return null;
			}).filter(item => !!item);

			query = createBoolQuery(operation, queryArr);
		} else if (typeof react[conjunction] === 'string') {
			const operation = getOperation(conjunction);
			query = createBoolQuery(operation, queryList[react[conjunction]]);
		} else if (typeof react[conjunction] === 'object'
			&& react[conjunction] !== null
			&& !Array.isArray(react[conjunction])) {
			query = getQuery(react[conjunction], queryList);
		}
	});
	return query;
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
		react.and = this.pushToAndClause(react.and, component);
		return react;
	}
	return { ...react, and: component };
}

// checks and executes before/onValueChange for sensors
export function checkValueChange(
	componentId, value, beforeValueChange,
	onValueChange, performUpdate,
) {
	let selectedValue = value;
	// To ensure that the returned values are consistent across all the components
	// null is returned in case of an empty array
	if (Array.isArray(value) && !value.length) {
		selectedValue = null;
	}
	const executeUpdate = () => {
		performUpdate();
		if (onValueChange) {
			onValueChange(selectedValue);
		}
	};
	if (beforeValueChange) {
		beforeValueChange(selectedValue)
			.then(executeUpdate)
			.catch((e) => {
				console.warn(`${componentId} - beforeValueChange rejected the promise with `, e);
			});
	} else {
		executeUpdate();
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
				...data._source,
				...streamProps,
			};
		});
	}
	return results;
};
