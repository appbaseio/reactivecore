"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = componentsReducer;

var _constants = require("../constants");

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function componentsReducer() {
	var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
	var action = arguments[1];

	if (action.type === _constants.ADD_COMPONENT) {
		return [].concat(_toConsumableArray(state), [action.component]);
	} else if (action.type === _constants.REMOVE_COMPONENT) {
		return state.filter(function (element) {
			return element !== action.component;
		});
	}
	return state;
}