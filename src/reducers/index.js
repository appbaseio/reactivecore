import { combineReducers } from 'redux';

import componentsReducer from './componentsReducer';
import watchManReducer from './watchManReducer';
import dependencyTreeReducer from './dependencyTreeReducer';
import queryReducer from './queryReducer';
import queryOptionsReducer from './queryOptionsReducer';
import configReducer from './configReducer';
import appbaseRefReducer from './appbaseRefReducer';
import hitsReducer from './hitsReducer';
import logsReducer from './logsReducer';
import combinedLogsReducer from './combinedLogsReducer';
import valueReducer from './valueReducer';
import internalValueReducer from './internalValueReducer';
import loadingReducer from './loadingReducer';
import errorReducer from './errorReducer';
import streamingReducer from './streamingReducer';
import streamHitsReducer from './streamHitsReducer';
import timestampReducer from './timestampReducer';
import headersReducer from './headersReducer';
import mapDataReducer from './mapDataReducer';
import queryListenerReducer from './queryListenerReducer';
import analyticsReducer from './analyticsReducer';
import promotedResultsReducer from './promotedResultsReducer';
import customDataReducer from './customDataReducer';
import defaultQueriesReducer from './defaultQueryReducer';
import customQueriesReducer from './customQueryReducer';
import propsReducer from './propsReducer';
import aggsReducer from './aggsReducer';
import compositeAggsReducer from './compositeAggsReducer';
import appliedSettingsReducer from './appliedSettingsReducer';
import customHighlightReducer from './customHighlightReducer';
import rawDataReducer from './rawDataReducer';

export default combineReducers({
	components: componentsReducer,
	customQueries: customQueriesReducer,
	defaultQueries: defaultQueriesReducer,
	customHighlightOptions: customHighlightReducer,
	settings: appliedSettingsReducer,
	watchMan: watchManReducer, // contains the list of subscribers
	queryList: queryReducer,
	queryOptions: queryOptionsReducer,
	dependencyTree: dependencyTreeReducer,
	appbaseRef: appbaseRefReducer,
	config: configReducer,
	hits: hitsReducer,
	promotedResults: promotedResultsReducer,
	customData: customDataReducer,
	aggregations: aggsReducer,
	compositeAggregations: compositeAggsReducer,
	queryLog: logsReducer,
	combinedLog: combinedLogsReducer,
	selectedValues: valueReducer,
	internalValues: internalValueReducer,
	isLoading: loadingReducer,
	error: errorReducer,
	stream: streamingReducer,
	streamHits: streamHitsReducer,
	timestamp: timestampReducer,
	headers: headersReducer,
	mapData: mapDataReducer, // holds the map id and boolean to execute geo-bound-query
	queryListener: queryListenerReducer,
	analytics: analyticsReducer,
	props: propsReducer,
	rawData: rawDataReducer,
});
