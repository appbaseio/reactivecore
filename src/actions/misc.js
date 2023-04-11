import {
	SET_QUERY,
	SET_QUERY_OPTIONS,
	LOG_QUERY,
	LOG_COMBINED_QUERY,
	SET_LOADING,
	SET_TIMESTAMP,
	SET_HEADERS,
	SET_QUERY_LISTENER,
	SET_SEARCH_ID,
	SET_ERROR,
	SET_PROMOTED_RESULTS,
	SET_APPLIED_SETTINGS,
	SET_SUGGESTIONS_SEARCH_ID,
	SET_CUSTOM_DATA,
	SET_DEFAULT_QUERY,
	SET_CUSTOM_HIGHLIGHT_OPTIONS,
	SET_CUSTOM_QUERY,
	SET_POPULAR_SUGGESTIONS,
	SET_RAW_DATA,
	SET_DEFAULT_POPULAR_SUGGESTIONS,
	SET_GOOGLE_MAP_SCRIPT_LOADING,
	SET_GOOGLE_MAP_SCRIPT_LOADED,
	SET_GOOGLE_MAP_SCRIPT_ERROR,
	SET_APPBASE_QUERY,
	SET_AI_RESPONSE,
	REMOVE_AI_RESPONSE,
	SET_AI_RESPONSE_ERROR,
	SET_AI_RESPONSE_LOADING,
} from '../constants';

import { transformValueToComponentStateFormat } from '../utils/transform';
import { updateAggs, updateCompositeAggs, updateHits } from './hits';
import { setValues } from './value';

export function setRawData(component, response) {
	return {
		type: SET_RAW_DATA,
		component,
		response,
	};
}

export function setLoading(component, isLoading) {
	return {
		type: SET_LOADING,
		component,
		isLoading,
	};
}

export function setError(component, error) {
	return {
		type: SET_ERROR,
		component,
		error,
	};
}

export function setTimestamp(component, timestamp) {
	return {
		type: SET_TIMESTAMP,
		component,
		timestamp,
	};
}

export function setSearchId(searchId = null) {
	return {
		type: SET_SEARCH_ID,
		searchId,
	};
}

export function setSuggestionsSearchId(searchId = null) {
	return {
		type: SET_SUGGESTIONS_SEARCH_ID,
		searchId,
	};
}

export function setQuery(component, query) {
	return {
		type: SET_QUERY,
		component,
		query,
	};
}

export function setCustomQuery(component, query) {
	return {
		type: SET_CUSTOM_QUERY,
		component,
		query,
	};
}

export function setDefaultQuery(component, query) {
	return {
		type: SET_DEFAULT_QUERY,
		component,
		query,
	};
}

export function setCustomHighlightOptions(component, data) {
	return {
		type: SET_CUSTOM_HIGHLIGHT_OPTIONS,
		component,
		data,
	};
}

export function updateQueryOptions(component, options) {
	return {
		type: SET_QUERY_OPTIONS,
		component,
		options,
	};
}

// gatekeeping for normal queries
export function logQuery(component, query) {
	return {
		type: LOG_QUERY,
		component,
		query,
	};
}

// gatekeeping for queries combined with map queries
export function logCombinedQuery(component, query) {
	return {
		type: LOG_COMBINED_QUERY,
		component,
		query,
	};
}

export function setHeaders(headers) {
	return {
		type: SET_HEADERS,
		headers,
	};
}

export function setPromotedResults(results = [], component) {
	return {
		type: SET_PROMOTED_RESULTS,
		results,
		component,
	};
}

export function setPopularSuggestions(suggestions = [], component) {
	return {
		type: SET_POPULAR_SUGGESTIONS,
		suggestions,
		component,
	};
}

export function setDefaultPopularSuggestions(suggestions = [], component) {
	return {
		type: SET_DEFAULT_POPULAR_SUGGESTIONS,
		suggestions,
		component,
	};
}

export function setCustomData(data = null, component) {
	return {
		type: SET_CUSTOM_DATA,
		data,
		component,
	};
}

export function setAppliedSettings(data = null, component) {
	return {
		type: SET_APPLIED_SETTINGS,
		data,
		component,
	};
}

export function setQueryListener(component, onQueryChange, onError) {
	return {
		type: SET_QUERY_LISTENER,
		component,
		onQueryChange,
		onError,
	};
}

export function setGoogleMapScriptLoading(bool) {
	return { type: SET_GOOGLE_MAP_SCRIPT_LOADING, loading: bool };
}
export function setGoogleMapScriptLoaded(bool) {
	return { type: SET_GOOGLE_MAP_SCRIPT_LOADED, loaded: bool };
}
export function setGoogleMapScriptError(error) {
	return { type: SET_GOOGLE_MAP_SCRIPT_ERROR, error };
}

export function resetStoreForComponent(componentId) {
	return (dispatch) => {
		dispatch(setRawData(componentId, null));
		dispatch(setCustomData(null, componentId));
		dispatch(setPromotedResults([], componentId));
		dispatch(setPopularSuggestions([], componentId));
		dispatch(setDefaultPopularSuggestions([], componentId));
		dispatch(updateAggs(componentId, null));
		dispatch(updateCompositeAggs(componentId, {}));
		dispatch(updateHits(componentId, { hits: [], total: 0 }, 0));
	};
}

export function setLastUsedAppbaseQuery(query) {
	return {
		type: SET_APPBASE_QUERY,
		query,
	};
}

export function setSearchState(componentsValueAndTypeMap = {}) {
	return (dispatch) => {
		const componentValues = {};
		Object.keys(componentsValueAndTypeMap).forEach((componentId) => {
			const { value, componentProps } = componentsValueAndTypeMap[componentId];
			const { value: transformedValue, meta = {} } = transformValueToComponentStateFormat(
				value,
				componentProps,
			);
			componentValues[componentId] = {
				value: transformedValue,
				...meta,
			};
		});

		dispatch(setValues(componentValues));
	};
}

export function setAIResponse(component, payload) {
	return {
		type: SET_AI_RESPONSE,
		component,
		payload,
	};
}

export function removeAIResponse(component) {
	return {
		type: REMOVE_AI_RESPONSE,
		component,
	};
}

export function setAIResponseError(component, error, meta = {}) {
	return {
		type: SET_AI_RESPONSE_ERROR,
		component,
		error,
		meta,
	};
}

export function setAIResponseLoading(component, isLoading) {
	return {
		type: SET_AI_RESPONSE_LOADING,
		component,
		isLoading,
	};
}
