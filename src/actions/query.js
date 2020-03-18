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
} from '../constants';

import { setValue, setInternalValue } from './value';
import { updateHits, updateAggs, pushToStreamHits, updateCompositeAggs } from './hits';
import { buildQuery, isEqual, getSearchState } from '../utils/helper';
import getFilterString, { parseCustomEvents } from '../utils/analytics';
import { updateMapData } from './maps';
import fetchGraphQL from '../utils/graphQL';
import { componentTypes } from '../../lib/utils/constants';
import {
	getRSQuery,
	extractPropsFromState,
	getDependentQueries,
	getHistogramComponentID,
} from '../utils/transform';
import { setRawData } from './rawData';

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

function setLoading(component, isLoading) {
	return {
		type: SET_LOADING,
		component,
		isLoading,
	};
}

function setError(component, error) {
	return {
		type: SET_ERROR,
		component,
		error,
	};
}

function setTimestamp(component, timestamp) {
	return {
		type: SET_TIMESTAMP,
		component,
		timestamp,
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

function setSearchId(searchId = null) {
	return {
		type: SET_SEARCH_ID,
		searchId,
	};
}

function setSuggestionsSearchId(searchId = null) {
	return {
		type: SET_SUGGESTIONS_SEARCH_ID,
		searchId,
	};
}

function msearch(
	query,
	orderOfQueries,
	appendToHits = false,
	isInternalComponent = false,
	appendToAggs = false,
	componentType,
) {
	return (dispatch, getState) => {
		const {
			appbaseRef,
			config,
			headers,
			queryListener,
			analytics,
			selectedValues,
		} = getState();

		let searchHeaders = {};
		const suggestionsComponents = [componentTypes.dataSearch, componentTypes.categorySearch];
		const isSuggestionsQuery
			= isInternalComponent && suggestionsComponents.indexOf(componentType) !== -1;
		// send search id or term in headers
		if (config.analytics) {
			if (config.analyticsConfig.suggestionAnalytics && isSuggestionsQuery) {
				const { suggestionsSearchValue } = analytics;
				const shouldIncludeQuery = !!(
					config.analyticsConfig.emptyQuery || suggestionsSearchValue
				);
				if (shouldIncludeQuery) {
					searchHeaders = {
						'X-Search-Query': suggestionsSearchValue || '',
					};
				}
			} else {
				const { searchValue, searchId } = analytics;

				// if a filter string exists append that to the search headers
				const filterString = getFilterString(selectedValues);
				// if search id exists use that otherwise
				// it implies a new query in which case I send X-Search-Query
				if (searchId) {
					searchHeaders = Object.assign(
						{
							'X-Search-Id': searchId,
							'X-Search-Query': searchValue || '',
						},
						filterString && {
							'X-Search-Filters': filterString,
						},
					);
				} else {
					const shouldIncludeQuery = !!(config.analyticsConfig.emptyQuery || searchValue);
					searchHeaders = Object.assign(
						shouldIncludeQuery && {
							'X-Search-Query': searchValue || '',
						},
						filterString && {
							'X-Search-Filters': filterString,
						},
					);
				}
			}
			if (config.analyticsConfig.searchStateHeader) {
				const searchState = getSearchState(getState(), true);
				if (searchState && Object.keys(searchState).length) {
					searchHeaders['X-Search-State'] = JSON.stringify(searchState);
				}
			}

			if (config.analyticsConfig.userId) {
				searchHeaders['X-User-Id'] = config.analyticsConfig.userId;
			}

			if (config.analyticsConfig.customEvents) {
				searchHeaders['X-Search-CustomEvent'] = parseCustomEvents(config.analyticsConfig.customEvents);
			}
		}

		// set loading as active for the given component
		orderOfQueries.forEach((component) => {
			dispatch(setLoading(component, true));
		});

		const handleTransformResponse = (res, component) => {
			if (config.transformResponse && typeof config.transformResponse === 'function') {
				return config.transformResponse(res, component);
			}
			return new Promise(resolve => resolve(res));
		};

		const handleError = (error) => {
			console.error(error);
			orderOfQueries.forEach((component) => {
				if (queryListener[component] && queryListener[component].onError) {
					queryListener[component].onError(error);
				}
				dispatch(setError(component, error));
				dispatch(setLoading(component, false));
			});
		};

		const handleResponse = (res) => {
			const searchId = res._headers ? res._headers.get('X-Search-Id') : null;
			if (searchId) {
				if (isSuggestionsQuery) {
					// set suggestions search id for internal request of search components
					dispatch(setSuggestionsSearchId(searchId));
				} else {
					// if search id was updated set it in store
					dispatch(setSearchId(searchId));
				}
			}

			// handle promoted results
			orderOfQueries.forEach((component, index) => {
				handleTransformResponse(res.responses[index], component)
					.then((response) => {
						const { timestamp } = getState();
						if (
							timestamp[component] === undefined
							|| timestamp[component] < res._timestamp
						) {
							// set raw response in rawData
							dispatch(setRawData(component, response));
							const promotedResults = response.promoted || res.promoted;
							if (promotedResults) {
								dispatch(setPromotedResults(promotedResults, component));
							} else {
								dispatch(setPromotedResults([], component));
							}
							if (response.hits) {
								dispatch(setTimestamp(component, res._timestamp));
								dispatch(updateHits(
									component,
									response.hits,
									response.took,
									response.hits && response.hits.hidden,
									appendToHits,
								));
								dispatch(setLoading(component, false));
							}

							if (response.aggregations) {
								dispatch(updateAggs(component, response.aggregations, appendToAggs));
								dispatch(updateCompositeAggs(
									component,
									response.aggregations,
									appendToAggs,
								));
							}
						}
					})
					.catch((err) => {
						handleError(err);
					});
			});
		};

		if (config.graphQLUrl) {
			fetchGraphQL(config.graphQLUrl, config.url, config.credentials, config.app, query)
				.then((res) => {
					handleResponse(res);
				})
				.catch((err) => {
					handleError(err);
				});
		} else {
			appbaseRef.setHeaders({ ...headers, ...searchHeaders });
			appbaseRef
				.msearch({
					type: config.type === '*' ? '' : config.type,
					body: query,
				})
				.then((res) => {
					handleResponse(res);
				})
				.catch((err) => {
					handleError(err);
				});
		}
	};
}

const isPropertyDefined = property => property !== undefined && property !== null;

function appbaseSearch(
	query,
	orderOfQueries,
	appendToHits = false,
	isInternalComponent,
	appendToAggs = false,
	componentType,
) {
	return (dispatch, getState) => {
		const {
			appbaseRef, config, headers, queryListener,
		} = getState();

		let isAnalyticsEnabled = false;

		if (config) {
			if (config.analyticsConfig) {
				if (isPropertyDefined(config.analyticsConfig.recordAnalytics)) {
					isAnalyticsEnabled = config.analyticsConfig.recordAnalytics;
				} else if (isPropertyDefined(config.analyticsConfig.analytics)) {
					isAnalyticsEnabled = config.analyticsConfig.analytics;
				}
			} else if (isPropertyDefined(config.analytics)) {
				isAnalyticsEnabled = config.analytics;
			}
		}

		const settings = {
			recordAnalytics: isAnalyticsEnabled,
		};

		if (config.analyticsConfig) {
			settings.userId = isPropertyDefined(config.analyticsConfig.userId)
				? config.analyticsConfig.userId
				: undefined;
			settings.enableQueryRules = isPropertyDefined(config.analyticsConfig.enableQueryRules)
				? config.analyticsConfig.enableQueryRules
				: undefined;
			settings.customEvents = isPropertyDefined(config.analyticsConfig.customEvents)
				? config.analyticsConfig.customEvents
				: undefined;
		}

		// set loading as active for the given component
		orderOfQueries.forEach((component) => {
			dispatch(setLoading(component, true));
		});

		const handleTransformResponse = (res, component) => {
			if (config.transformResponse && typeof config.transformResponse === 'function') {
				return config.transformResponse(res, component);
			}
			return new Promise(resolve => resolve(res));
		};

		const handleError = (error) => {
			console.error(error);
			orderOfQueries.forEach((component) => {
				if (queryListener[component] && queryListener[component].onError) {
					queryListener[component].onError(error);
				}
				dispatch(setError(component, error));
				dispatch(setLoading(component, false));
			});
		};

		const handleResponse = (res) => {
			const suggestionsComponents = [
				componentTypes.dataSearch,
				componentTypes.categorySearch,
			];
			const isSuggestionsQuery
				= isInternalComponent && suggestionsComponents.indexOf(componentType) !== -1;
			const searchId = res._headers ? res._headers.get('X-Search-Id') : null;
			if (searchId) {
				if (isSuggestionsQuery) {
					// set suggestions search id for internal request of search components
					dispatch(setSuggestionsSearchId(searchId));
				} else {
					// if search id was updated set it in store
					dispatch(setSearchId(searchId));
				}
			}

			// handle promoted results
			orderOfQueries.forEach((component) => {
				// Update applied settings
				if (res.settings) {
					dispatch(setAppliedSettings(res.settings, component));
				}
				handleTransformResponse(res[component], component)
					.then((response) => {
						if (response) {
							const { timestamp } = getState();
							if (
								timestamp[component] === undefined
								|| timestamp[component] < res._timestamp
							) {
								const promotedResults = response.promoted;
								if (promotedResults) {
									const parsedPromotedResults = promotedResults.map(promoted => ({
										...promoted.doc,
										_position: promoted.position,
									}));
									dispatch(setPromotedResults(parsedPromotedResults, component));
								} else {
									dispatch(setPromotedResults([], component));
								}
								// Update custom data
								if (response.customData) {
									dispatch(setCustomData(response.customData, component));
								}
								if (response.hits) {
									dispatch(setTimestamp(component, res._timestamp));
									dispatch(updateHits(
										component,
										response.hits,
										response.took,
										response.hits && response.hits.hidden,
										appendToHits,
									));
									dispatch(setLoading(component, false));
								}

								if (response.aggregations) {
									dispatch(updateAggs(component, response.aggregations, appendToAggs));
									dispatch(updateCompositeAggs(
										component,
										response.aggregations,
										appendToAggs,
									));
								}
							}
						}
					})
					.catch((err) => {
						handleError(err);
					});
			});
		};

		appbaseRef.setHeaders({ ...headers });
		appbaseRef
			.reactiveSearchv3(query, settings)
			.then((res) => {
				handleResponse(res);
			})
			.catch((err) => {
				handleError(err);
			});
	};
}

function executeQueryListener(listener, oldQuery, newQuery) {
	if (listener && listener.onQueryChange) {
		listener.onQueryChange(oldQuery, newQuery);
	}
}

export function executeQuery(
	componentId,
	executeWatchList = false,
	mustExecuteMapQuery = false,
	componentType,
	metaOptions,
) {
	return (dispatch, getState) => {
		const {
			queryLog,
			stream,
			appbaseRef,
			config,
			mapData,
			watchMan,
			dependencyTree,
			queryList,
			queryOptions,
			queryListener,
		} = getState();

		let componentList = [componentId];
		let finalQuery = [];
		let appbaseQuery = {}; // Use object to prevent duplicate query added by react prop
		let orderOfQueries = [];
		const isAppbaseEnabled = config && config.enableAppbase;
		if (executeWatchList) {
			const watchList = watchMan[componentId] || [];
			componentList = [...componentList, ...watchList];
		}

		const matchAllQuery = { match_all: {} };

		componentList.forEach((component) => {
			// eslint-disable-next-line
			let { queryObj, options } = buildQuery(
				component,
				dependencyTree,
				queryList,
				queryOptions,
			);

			const validOptions = ['aggs', 'from', 'sort'];
			// check if query or options are valid - non-empty
			if (
				(queryObj && !!Object.keys(queryObj).length)
				|| (options && Object.keys(options).some(item => validOptions.includes(item)))
			) {
				// attach a match-all-query if empty
				if (!queryObj || (queryObj && !Object.keys(queryObj).length)) {
					queryObj = { ...matchAllQuery };
				}

				const currentQuery = {
					query: { ...queryObj },
					...options,
					...queryOptions[component],
				};

				const queryToLog = {
					query: { ...queryObj },
					...options,
					...queryOptions[component],
				};

				const oldQuery = queryLog[component];

				if (mustExecuteMapQuery || !isEqual(currentQuery, oldQuery)) {
					orderOfQueries = [...orderOfQueries, component];

					// log query before adding the map query,
					// since we don't do gatekeeping on the map query in the `queryLog`
					dispatch(logQuery(component, queryToLog));

					// add maps query here
					const isMapComponent = Object.keys(mapData).includes(component);

					if (isMapComponent && mapData[component].query) {
						// attach mapQuery to exisiting query via "must" type
						const existingQuery = currentQuery.query;
						currentQuery.query = {
							bool: {
								must: [existingQuery, mapData[component].query],
							},
						};

						if (!mapData[component].persistMapQuery) {
							// clear mapQuery if we don't want it to persist
							dispatch(updateMapData(componentId, null, false));
						}

						// skip the query execution if the combined query [component + map Query]
						// matches the logged combined query
						const { combinedLog } = getState();
						if (isEqual(combinedLog[component], currentQuery)) return;

						// log query after adding the map query,
						// to separately support gatekeeping for combined map queries
						dispatch(logCombinedQuery(component, currentQuery));
					}

					executeQueryListener(queryListener[component], oldQuery, currentQuery);

					// execute streaming query if applicable
					if (stream[component] && stream[component].status) {
						if (stream[component].ref) {
							stream[component].ref.stop();
						}

						const ref = appbaseRef.searchStream(
							{
								type: config.type === '*' ? '' : config.type,
								body: currentQuery,
							},
							(response) => {
								if (response._id) {
									dispatch(pushToStreamHits(component, response));
								}
							},
							(error) => {
								if (queryListener[component] && queryListener[component].onError) {
									queryListener[component].onError(error);
								}
								/**
								 * In android devices, sometime websocket throws error when there is no activity
								 * for a long time, console.error crashes the app, so changed it to console.warn
								 */
								console.warn(error);
								dispatch(setError(component, error));
								dispatch(setLoading(component, false));
							},
						);

						// update streaming ref
						dispatch(setStreaming(component, true, ref));
					}

					// push to combined query for msearch
					if (isAppbaseEnabled) {
						// build query
						const query = getRSQuery(
							component,
							extractPropsFromState(
								getState(),
								component,
								metaOptions ? { from: metaOptions.from } : null,
							),
						);
						if (query) {
							// Apply dependent queries
							appbaseQuery = {
								...appbaseQuery,
								...{ [component]: query },
								...getDependentQueries(getState(), component),
							};
						}
					} else {
						finalQuery = [
							...finalQuery,
							{
								preference: component,
							},
							currentQuery,
						];
					}
				}
			}
		});

		if (isAppbaseEnabled) {
			finalQuery = Object.keys(appbaseQuery).map(component => appbaseQuery[component]);
		}

		if (finalQuery.length) {
			if (isAppbaseEnabled) {
				dispatch(appbaseSearch(
					finalQuery,
					orderOfQueries,
					false,
					componentId.endsWith('__internal'),
					undefined,
					componentType,
				));
			} else {
				// in case of an internal component the analytics headers should not be included
				dispatch(msearch(
					finalQuery,
					orderOfQueries,
					false,
					componentId.endsWith('__internal'),
					undefined,
					componentType,
				));
			}
		}
	};
}

export function setQueryOptions(component, queryOptions, execute = true) {
	return (dispatch) => {
		dispatch(updateQueryOptions(component, queryOptions));

		if (execute) {
			dispatch(executeQuery(component, true));
		}
	};
}

export function updateQuery(
	{
		componentId,
		query,
		value,
		label = null,
		showFilter = true,
		URLParams = false,
		componentType = null,
		category = null,
	},
	execute = true,
) {
	return (dispatch) => {
		let queryToDispatch = query;
		if (query && query.query) {
			queryToDispatch = query.query;
		}
		// don't set filters for internal components
		if (!componentId.endsWith('__internal')) {
			dispatch(setValue(componentId, value, label, showFilter, URLParams, componentType, category));
			if (componentType === componentTypes.dynamicRangeSlider) {
				// Dynamic Range Slider has a dependency on histogram which uses different ID
				dispatch(setInternalValue(
					getHistogramComponentID(componentId),
					value,
					componentType,
					category,
				));
			} else {
				dispatch(setInternalValue(`${componentId}__internal`, value, componentType, category));
			}
		} else {
			dispatch(setInternalValue(componentId, value, componentType, category));
		}
		dispatch(setQuery(componentId, queryToDispatch));
		if (execute) dispatch(executeQuery(componentId, true, false, componentType));
	};
}

export function loadMore(component, newOptions, appendToHits = true, appendToAggs = false) {
	// `appendToAggs` will be `true` in case of consecutive loading
	// of data-driven components via composite aggregations.

	// This approach will enable us to reset the component's query (aggs)
	// whenever there is a change in the component's subscribed source.
	return (dispatch, getState) => {
		const store = getState();
		let { queryObj, options } = buildQuery(
			component,
			store.dependencyTree,
			store.queryList,
			store.queryOptions,
		);

		const { queryLog } = store;

		if (!options) options = {};
		options = { ...options, ...newOptions };

		if (!queryObj || (queryObj && !Object.keys(queryObj).length)) {
			queryObj = { match_all: {} };
		}

		const currentQuery = {
			query: { ...queryObj },
			...options,
		};

		// query gatekeeping
		if (isEqual(queryLog[component], currentQuery)) return;

		dispatch(logQuery(component, currentQuery));

		if (store.config && store.config.enableAppbase) {
			let appbaseQuery = {};
			// build query
			const query = getRSQuery(
				component,
				extractPropsFromState(store, component, { from: options.from }),
			);
			// Apply dependent queries
			appbaseQuery = {
				...{ [component]: query },
				...getDependentQueries(getState(), component),
			};
			const finalQuery = Object.keys(appbaseQuery).map(c => appbaseQuery[c]);
			dispatch(appbaseSearch(finalQuery, [component], appendToHits, false, appendToAggs));
		} else {
			const finalQuery = [
				{
					preference: component,
				},
				currentQuery,
			];
			dispatch(msearch(finalQuery, [component], appendToHits, false, appendToAggs));
		}
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
