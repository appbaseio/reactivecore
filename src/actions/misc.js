import {
	SET_QUERY,
	SET_QUERY_OPTIONS,
	LOG_QUERY,
	LOG_COMBINED_QUERY,
	SET_LOADING,
	SET_TIMESTAMP,
	SET_HEADERS,
	SET_STREAMING,
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
	SET_QUERY_SUGGESTIONS,
	SET_RAW_DATA,
} from '../constants';

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

export function setStreaming(component, status = false, ref = null) {
	return {
		type: SET_STREAMING,
		component,
		status,
		ref,
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

export function setQuerySuggestions(suggestions = [], component) {
	return {
		type: SET_QUERY_SUGGESTIONS,
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
