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
