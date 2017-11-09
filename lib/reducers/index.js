"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _redux = require("redux");

var _componentsReducer = require("./componentsReducer");

var _componentsReducer2 = _interopRequireDefault(_componentsReducer);

var _watchManReducer = require("./watchManReducer");

var _watchManReducer2 = _interopRequireDefault(_watchManReducer);

var _dependencyTreeReducer = require("./dependencyTreeReducer");

var _dependencyTreeReducer2 = _interopRequireDefault(_dependencyTreeReducer);

var _queryReducer = require("./queryReducer");

var _queryReducer2 = _interopRequireDefault(_queryReducer);

var _queryOptionsReducer = require("./queryOptionsReducer");

var _queryOptionsReducer2 = _interopRequireDefault(_queryOptionsReducer);

var _configReducer = require("./configReducer");

var _configReducer2 = _interopRequireDefault(_configReducer);

var _appbaseRefReducer = require("./appbaseRefReducer");

var _appbaseRefReducer2 = _interopRequireDefault(_appbaseRefReducer);

var _hitsReducer = require("./hitsReducer");

var _hitsReducer2 = _interopRequireDefault(_hitsReducer);

var _aggsReducer = require("./aggsReducer");

var _aggsReducer2 = _interopRequireDefault(_aggsReducer);

var _logsReducer = require("./logsReducer");

var _logsReducer2 = _interopRequireDefault(_logsReducer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _redux.combineReducers)({
	components: _componentsReducer2.default,
	watchMan: _watchManReducer2.default,
	queryList: _queryReducer2.default,
	queryOptions: _queryOptionsReducer2.default,
	dependencyTree: _dependencyTreeReducer2.default,
	appbaseRef: _appbaseRefReducer2.default,
	config: _configReducer2.default,
	hits: _hitsReducer2.default,
	aggregations: _aggsReducer2.default,
	queryLog: _logsReducer2.default
});