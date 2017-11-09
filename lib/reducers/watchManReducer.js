"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = watchManReducer;

var _constants = require("../constants");

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function watchManReducer() {
	var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	var action = arguments[1];

	if (action.type === _constants.WATCH_COMPONENT) {
		var watchList = getWatchList(action.react);
		var newState = _extends({}, state);
		watchList.forEach(function (item) {
			if (Array.isArray(newState[item])) {
				newState[item].push(action.component);
			} else {
				newState[item] = [action.component];
			}
		});
		return newState;
	} else if (action.type === _constants.REMOVE_COMPONENT) {
		var _newState = _extends({}, state);
		for (var component in _newState) {
			if (component === action.component) {
				delete _newState[component];
			} else {
				_newState[component] = _newState[component].filter(function (item) {
					return item !== action.component;
				});
			}
		}
		return _newState;
	}
	return state;
}

function getWatchList(depTree) {
	var list = Object.values(depTree);
	var components = [];

	list.forEach(function (item) {
		if (typeof item === "string") {
			components.push(item);
		} else if (Array.isArray(item)) {
			components.push.apply(components, _toConsumableArray(item));
		} else if ((typeof item === "undefined" ? "undefined" : _typeof(item)) === "object" && item !== null) {
			components.push.apply(components, _toConsumableArray(getWatchList(item)));
		}
	});

	return [].concat(_toConsumableArray(new Set(components)));
}