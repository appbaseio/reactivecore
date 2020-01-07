import {
	SET_SUGGESTIONS_SEARCH_VALUE,
	CLEAR_SUGGESTIONS_SEARCH_VALUE,
	UPDATE_ANALYTICS_CONFIG,
} from '../constants';

/**
 * Sets the suggestionsSearchValue in analytics
 * @param {String} value
 */
export function setSuggestionsSearchValue(value) {
	return {
		type: SET_SUGGESTIONS_SEARCH_VALUE,
		value,
	};
}

/**
 * Clears the suggestionsSearchValue in analytics
 * @param {String} value
 */
export function clearSuggestionsSearchValue() {
	return {
		type: CLEAR_SUGGESTIONS_SEARCH_VALUE,
	};
}

/**
 * Updates the analytics config object
 * @param {Object} analyticsConfig
 */
export function updateAnalyticsConfig(analyticsConfig) {
	return {
		type: UPDATE_ANALYTICS_CONFIG,
		analyticsConfig,
	};
}

export function recordResultClick(searchPosition) {
	return (dispatch, getState) => {
		const {
			config,
			analytics: { searchId },
			headers,
		} = getState();
		const { url, app, credentials } = config;
		if (config.analytics && searchId) {
			const parsedHeaders = headers;
			delete parsedHeaders['X-Search-Query'];
			fetch(`${url}/${app}/_analytics`, {
				method: 'POST',
				headers: {
					...parsedHeaders,
					'Content-Type': 'application/json',
					Authorization: `Basic ${btoa(credentials)}`,
					'X-Search-Id': searchId,
					'X-Search-Click': true,
					'X-Search-ClickPosition': searchPosition + 1,
				},
			});
		}
	};
}

export function recordSuggestionClick(searchPosition) {
	return (dispatch, getState) => {
		const {
			config,
			analytics: { suggestionsSearchId },
			headers,
		} = getState();
		const { url, app, credentials } = config;
		if (config.analytics && suggestionsSearchId) {
			const parsedHeaders = headers;
			delete parsedHeaders['X-Search-Query'];
			fetch(`${url}/${app}/_analytics`, {
				method: 'POST',
				headers: {
					...parsedHeaders,
					'Content-Type': 'application/json',
					Authorization: `Basic ${btoa(credentials)}`,
					'X-Search-Id': suggestionsSearchId,
					'X-Search-Suggestions-Click': true,
					...(searchPosition !== undefined && {
						'X-Search-Suggestions-ClickPosition': searchPosition + 1,
					}),
				},
			});
		}
	};
}
