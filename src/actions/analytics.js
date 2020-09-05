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

function recordClick({
	url,
	app,
	credentials,
	headers,
	documentId,
	clickPosition,
	queryId,
	clickType,
}) {
	if (!documentId) {
		console.warn('ReactiveSearch: document id is required to record the click analytics');
	} else {
		// Use record click API for clusters
		fetch(`${url}/${app}/_analytics/click`, {
			method: 'PUT',
			body: JSON.stringify({
				query_id: queryId,
				click_type: clickType || 'result',
				click_on: {
					[documentId]: clickPosition + 1,
				},
			}),
			headers: {
				...headers,
				'Content-Type': 'application/json',
				Authorization: `Basic ${btoa(credentials)}`,
			},
		});
	}
}

export function recordResultClick(searchPosition, documentId) {
	return (dispatch, getState) => {
		const {
			config,
			analytics: { searchId },
			headers,
			appbaseRef: { url, protocol, credentials },
		} = getState();
		const { app } = config;
		const esURL = `${protocol}://${url}`;
		if (config.analytics && searchId) {
			const parsedHeaders = headers;
			delete parsedHeaders['X-Search-Query'];
			const parsedURL = (esURL || '').replace(/\/+$/, '');
			if (parsedURL.includes('scalr.api.appbase.io')) {
				fetch(`${parsedURL}/${app}/_analytics`, {
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
			} else {
				recordClick({
					url: parsedURL,
					app,
					credentials,
					parsedHeaders,
					documentId,
					clickPosition: searchPosition,
					queryId: searchId,
				});
			}
		}
	};
}

export function recordSuggestionClick(searchPosition, documentId) {
	return (dispatch, getState) => {
		const {
			config,
			analytics: { suggestionsSearchId },
			headers,
			appbaseRef: { url, protocol, credentials },
		} = getState();
		const { app } = config;
		const esURL = `${protocol}://${url}`;
		if (config.analytics && suggestionsSearchId && searchPosition !== undefined) {
			const parsedHeaders = headers;
			delete parsedHeaders['X-Search-Query'];
			const parsedURL = (esURL || '').replace(/\/+$/, '');
			if (parsedURL.includes('scalr.api.appbase.io')) {
				fetch(`${parsedURL}/${app}/_analytics`, {
					method: 'POST',
					headers: {
						...parsedHeaders,
						'Content-Type': 'application/json',
						Authorization: `Basic ${btoa(credentials)}`,
						'X-Search-Id': suggestionsSearchId,
						'X-Search-Suggestions-Click': true,
						'X-Search-Suggestions-ClickPosition': searchPosition + 1,
					},
				});
			} else {
				recordClick({
					url: parsedURL,
					app,
					credentials,
					parsedHeaders,
					documentId,
					clickPosition: searchPosition,
					clickType: 'suggestion',
					queryId: suggestionsSearchId,
				});
			}
		}
	};
}

// impressions represents an array of impression objects, for e.g {"index": "test", "id": 1213}
export function recordImpressions(queryId, impressions = []) {
	return (dispatch, getState) => {
		const {
			config: { app },
			headers,
			appbaseRef: { url, protocol, credentials },
		} = getState();
		const esURL = `${protocol}://${url}`;
		const parsedURL = esURL.replace(/\/+$/, '');
		if (!parsedURL.includes('scalr.api.appbase.io') && queryId && impressions.length) {
			fetch(`${parsedURL}/${app}/_analytics/search`, {
				method: 'PUT',
				body: JSON.stringify({
					query_id: queryId,
					impressions,
				}),
				keepalive: true,
				headers: {
					...headers,
					'Content-Type': 'application/json',
					Authorization: `Basic ${btoa(credentials)}`,
				},
			});
		}
	};
}
