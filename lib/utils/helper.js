"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.isEqual = isEqual;
exports.debounce = debounce;
exports.getQueryOptions = getQueryOptions;
exports.buildQuery = buildQuery;
exports.pushToAndClause = pushToAndClause;
exports.checkValueChange = checkValueChange;
exports.getAggsOrder = getAggsOrder;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function isEqual(x, y) {
	if (x === y) return true;
	if (!(x instanceof Object) || !(y instanceof Object)) return false;
	if (x.constructor !== y.constructor) return false;

	for (var p in x) {
		if (!x.hasOwnProperty(p)) continue;
		if (!y.hasOwnProperty(p)) return false;
		if (x[p] === y[p]) continue;
		if (_typeof(x[p]) !== "object") return false;
		if (!isEqual(x[p], y[p])) return false;
	}

	for (p in y) {
		if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
	}
	return true;
}

function debounce(callback, wait) {
	var context = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this;

	var timeout = null;
	var callbackArgs = null;

	var later = function later() {
		return callback.apply(context, callbackArgs);
	};

	return function () {
		callbackArgs = arguments;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

function getQueryOptions(props) {
	var options = {};
	if (props.size !== undefined) {
		options.size = props.size;
	}
	if (props.from !== undefined) {
		options.from = props.from;
	}
	return options;
}

function buildQuery(component, dependencyTree, queryList, queryOptions) {
	var queryObj = null,
	    options = null;

	if (component in dependencyTree) {
		queryObj = getQuery(dependencyTree[component], queryList);
		options = getExternalQueryOptions(dependencyTree[component], queryOptions, component);
	}
	return { queryObj: queryObj, options: options };
}

function getQuery(react, queryList) {
	var query = {};
	for (conjunction in react) {
		if (Array.isArray(react[conjunction])) {
			var operation = getOperation(conjunction);
			var queryArr = react[conjunction].map(function (comp) {
				if (comp in queryList) {
					return queryList[comp];
				}
				return null;
			}).filter(function (item) {
				return item !== null;
			});

			query = createBoolQuery(operation, queryArr);
		} else if (typeof react[conjunction] === "string") {
			var _operation = getOperation(conjunction);
			query = createBoolQuery(_operation, queryList[react[conjunction]]);
		} else if (_typeof(react[conjunction]) === "object" && react[conjunction] !== null && !Array.isArray(react[conjunction])) {
			query = getQuery(react[conjunction], queryList);
		}
	}
	return query;
}

function getOperation(conjunction) {
	if (conjunction === "and") {
		return "must";
	}
	if (conjunction === "or") {
		return "should";
	}
	return "must_not";
}

function createBoolQuery(operation, query) {
	if (Array.isArray(query) && query.length || !Array.isArray(query) && query) {
		return {
			bool: _defineProperty({}, operation, query)
		};
	}
	return null;
}

function pushToAndClause(react, component) {
	if (react.and) {
		if (Array.isArray(react.and)) {
			react.and.push(component);
			return react;
		} else if (typeof react.and === "string") {
			react.and = [react.and, component];
			return react;
		} else {
			react.and = this.pushToAndClause(react.and, component);
			return react;
		}
	} else {
		return _extends({}, react, { and: component });
	}
}

// checks and executes before/onValueChange for sensors
function checkValueChange(componentId, value, beforeValueChange, onValueChange, performUpdate) {
	var executeUpdate = function executeUpdate() {
		performUpdate();
		if (onValueChange) {
			onValueChange(value);
		}
	};
	if (beforeValueChange) {
		beforeValueChange(value).then(executeUpdate).catch(function (e) {
			console.warn(componentId + " - beforeValueChange rejected the promise with ", e);
		});
	} else {
		executeUpdate();
	}
}

function getAggsOrder(sortBy) {
	if (sortBy === "count") {
		return {
			_count: "desc"
		};
	}
	return {
		_term: sortBy
	};
}

function getExternalQueryOptions(react, options, component) {
	var queryOptions = {};

	for (conjunction in react) {
		if (Array.isArray(react[conjunction])) {
			react[conjunction].forEach(function (comp) {
				if (options[comp]) {
					queryOptions = _extends({}, queryOptions, options[comp]);
				}
			});
		} else if (typeof react[conjunction] === "string") {
			if (options[react[conjunction]]) {
				queryOptions = _extends({}, queryOptions, options[react[conjunction]]);
			}
		} else if (_typeof(react[conjunction]) === "object" && react[conjunction] !== null && !Array.isArray(react[conjunction])) {
			queryOptions = _extends({}, queryOptions, getExternalQueryOptions(react[conjunction], options));
		}
	}
	if (options[component]) {
		queryOptions = _extends({}, queryOptions, options[component]);
	}
	return queryOptions;
}