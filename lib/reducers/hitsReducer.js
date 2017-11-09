"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = hitsReducer;

var _constants = require("../constants");

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function hitsReducer() {
	var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	var action = arguments[1];

	if (action.type === _constants.UPDATE_HITS) {
		if (action.append) {
			return _extends({}, state, _defineProperty({}, action.component, {
				hits: [].concat(_toConsumableArray(state[action.component].hits), _toConsumableArray(action.hits)),
				total: action.total
			}));
		}
		return _extends({}, state, _defineProperty({}, action.component, { hits: action.hits, total: action.total }));
	} else if (action.type == _constants.REMOVE_COMPONENT) {
		var del = state[action.component],
		    obj = _objectWithoutProperties(state, [action.component]);

		return obj;
	}
	return state;
}