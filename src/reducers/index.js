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
import propsReducer from './propsReducer';
import mapOnTopMarkerReducer from './mapOnTopMarkerReducer';
import mapOpenMarkerReducer from './mapOpenMarkerReducer';
import { aggsReducer, compositeAggsReducer } from './aggsReducer';

export default combineReducers({
	components: componentsReducer,
	watchMan: watchManReducer, // contains the list of subscribers
	queryList: queryReducer,
	queryOptions: queryOptionsReducer,
	dependencyTree: dependencyTreeReducer,
	appbaseRef: appbaseRefReducer,
	config: configReducer,
	hits: hitsReducer,
	promotedResults: promotedResultsReducer,
	aggregations: aggsReducer,
	compositeAggregations: compositeAggsReducer,
	queryLog: logsReducer,
	combinedLog: combinedLogsReducer,
	selectedValues: valueReducer,
	isLoading: loadingReducer,
	error: errorReducer,
	stream: streamingReducer,
	streamHits: streamHitsReducer,
	timestamp: timestampReducer,
	headers: headersReducer,
	mapData: mapDataReducer, // holds the map id and boolean to execute geo-bound-query
	queryListener: queryListenerReducer,
	analytics: analyticsReducer,
	markerOnTop: mapOnTopMarkerReducer,
	openMarkers: mapOpenMarkerReducer,
	props: propsReducer,
});
