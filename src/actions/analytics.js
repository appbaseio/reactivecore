import {
	SET_SUGGESTIONS_SEARCH_VALUE,
	CLEAR_SUGGESTIONS_SEARCH_VALUE,
	UPDATE_ANALYTICS_CONFIG,
	RECENT_SEARCHES_SUCCESS,
	RECENT_SEARCHES_ERROR,
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

export function getRecentSearches(queryOptions = {
	size: 5,
	minChars: 3,
}) {
	return (dispatch, getState) => {
		const {
			config,
			headers,
			appbaseRef: { url, protocol, credentials },
		} = getState();
		const { app, mongodb } = config;
		const esURL = `${protocol}://${url}`;
		const parsedURL = (esURL || '').replace(/\/+$/, '');

		const requestOptions = {
			headers: {
				...headers,
				'Content-Type': 'application/json',
				Authorization: `Basic ${btoa(credentials)}`,
			},
		};
		let queryString = '';
		const addParam = (key, value) => {
			if (queryString) {
				queryString += `&${key}=${value}`;
			} else {
				queryString += `${key}=${value}`;
			}
		};
		// Add user id in query param if defined
		if (config.analyticsConfig && config.analyticsConfig.userId) {
			addParam('user_id', config.analyticsConfig.userId);
		}
		if (queryOptions) {
			if (queryOptions.size) {
				addParam('size', String(queryOptions.size));
			}
			if (queryOptions.from) {
				addParam('from', queryOptions.from);
			}
			if (queryOptions.to) {
				addParam('to', queryOptions.to);
			}
			if (queryOptions.minChars) {
				addParam('min_chars', String(queryOptions.minChars));
			}
			if (queryOptions.customEvents) {
				Object.keys(queryOptions.customEvents).forEach((key) => {
					addParam(key, queryOptions.customEvents[key]);
				});
			}
		}
		if (mongodb) {
			return dispatch({
				type: RECENT_SEARCHES_SUCCESS,
				data: [],
			});
		}
		return fetch(
			`${parsedURL}/_analytics/${app}/recent-searches?${queryString}`,
			requestOptions,
		)
			.then((res) => {
				if (res.status >= 500 || res.status >= 400) {
					return dispatch({
						type: RECENT_SEARCHES_ERROR,
						error: res,
					});
				}
				return res
					.json()
					.then(recentSearches =>
						dispatch({
							type: RECENT_SEARCHES_SUCCESS,
							data: recentSearches,
						}))
					.catch(e =>
						dispatch({
							type: RECENT_SEARCHES_ERROR,
							error: e,
						}));
			})
			.catch(e =>
				dispatch({
					type: RECENT_SEARCHES_ERROR,
					error: e,
				}));
	};
}

function recordClick({
	documentId, clickPosition, analyticsInstance, isSuggestionClick,
}) {
	if (!documentId) {
		console.warn('ReactiveSearch: document id is required to record the click analytics');
	} else {
		analyticsInstance.click({
			queryID: analyticsInstance.getQueryID(),
			objects: {
				[documentId]: clickPosition + 1,
			},
			isSuggestionClick,
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
			analyticsRef: analyticsInstance,
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
					documentId,
					clickPosition: searchPosition,
					analyticsInstance,
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
			analyticsRef: analyticsInstance,
		} = getState();
		const { app } = config;
		const esURL = `${protocol}://${url}`;
		if (
			config.analytics
			&& (config.analyticsConfig === undefined
				|| config.analyticsConfig.suggestionAnalytics === undefined
				|| config.analyticsConfig.suggestionAnalytics)
		) {
			const parsedHeaders = headers;
			delete parsedHeaders['X-Search-Query'];
			const parsedURL = (esURL || '').replace(/\/+$/, '');
			if (
				parsedURL.includes('scalr.api.appbase.io')
				&& searchPosition !== undefined
				&& suggestionsSearchId
			) {
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
			} else if (searchPosition !== undefined) {
				recordClick({
					documentId,
					clickPosition: searchPosition,
					analyticsInstance,
					isSuggestionClick: true,
				});
			}
		}
	};
}

// impressions represents an array of impression objects, for e.g {"index": "test", "id": 1213}
export function recordImpressions(queryId, impressions = []) {
	return (dispatch, getState) => {
		const {
			appbaseRef: { url, protocol },
			analyticsRef: analyticsInstance,
			config,
		} = getState();
		const esURL = `${protocol}://${url}`;
		const parsedURL = esURL.replace(/\/+$/, '');
		if (
			config.analytics
			&& !parsedURL.includes('scalr.api.appbase.io')
			&& queryId
			&& impressions.length
		) {
			analyticsInstance.search({
				queryID: analyticsInstance.getQueryID(),
				impressions,
			});
		}
	};
}

export function recordAISessionUsefulness(sessionId, otherInfo) {
	return (dispatch, getState) => {
		const { analyticsRef: analyticsInstance, config } = getState();
		if (!config || !config.analyticsConfig || !config.analyticsConfig.recordAnalytics) {
			console.warn('ReactiveSearch: Unable to record usefulness of session. To enable analytics, make sure to include the following prop on your <ReactiveBase> component: reactivesearchAPIConfig={{ recordAnalytics: true }}');
			return;
		}

		const userID = config && config.analyticsConfig && config.analyticsConfig.userId;
		if (!sessionId) {
			console.warn('ReactiveSearch: AI sessionID is required to record the usefulness of session.');
			return;
		}
		// Save session usefulness
		analyticsInstance.saveSessionUsefulness(
			sessionId,
			{
				...otherInfo,
				userID,
			},
			(err, res) => {
				// eslint-disable-next-line no-console
				console.log('res', res);
			},
		);
	};
}
