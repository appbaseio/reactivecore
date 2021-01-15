import { setValue, setInternalValue } from './value';
import {
	handleError,
	isPropertyDefined,
	getSuggestionQuery,
	handleResponse,
	executeQueryListener,
	handleResponseMSearch,
	getQuerySuggestionsId,
} from './utils';
import { pushToStreamHits } from './hits';
import {
	logQuery,
	setLoading,
	logCombinedQuery,
	setQuery,
	setError,
	setStreaming,
	updateQueryOptions,
	setPopularSuggestions,
	setDefaultPopularSuggestions,
} from './misc';
import { buildQuery, isEqual, getSearchState } from '../utils/helper';
import getFilterString, { parseCustomEvents } from '../utils/analytics';
import { updateMapData } from './maps';
import fetchGraphQL from '../utils/graphQL';
import { componentTypes, queryTypes } from '../utils/constants';
import {
	getRSQuery,
	extractPropsFromState,
	getDependentQueries,
	getHistogramComponentID,
	componentToTypeMap,
} from '../utils/transform';

export function loadPopularSuggestions(componentId) {
	return (dispatch, getState) => {
		const {
			config, appbaseRef, props, internalValues,
		} = getState();
		const isAppbaseEnabled = config && config.enableAppbase;
		const componentProps = props[componentId] || {};
		const internalValue = internalValues[componentId];
		const value = (internalValue && internalValue.value) || '';
		// TODO: Remove `enableQuerySuggestions` in v4
		if (
			isAppbaseEnabled
			&& (componentProps.enablePopularSuggestions
			|| componentProps.enableQuerySuggestions)
		) {
			const suggQuery = getSuggestionQuery(getState, componentId);
			appbaseRef
				.getQuerySuggestions(suggQuery)
				.then((suggestions) => {
					const querySuggestion = suggestions[getQuerySuggestionsId(componentId)];
					if (value) {
						// update query suggestions for search components
						dispatch(setPopularSuggestions(
							querySuggestion && querySuggestion.hits && querySuggestion.hits.hits,
							componentId.split('__internal')[0],
						));
					} else {
						dispatch(setDefaultPopularSuggestions(
							querySuggestion && querySuggestion.hits && querySuggestion.hits.hits,
							componentId.split('__internal')[0],
						));
						// dispatch default popular suggestions
					}
				})
				.catch((e) => {
					handleError(
						{
							orderOfQueries: [componentId],
							error: e,
						},
						getState,
						dispatch,
					);
				});
		}
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
			appbaseRef, config, headers, analytics, selectedValues,
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
			// reset error
			dispatch(setError(component, null));
		});

		if (config.graphQLUrl) {
			fetchGraphQL(config.graphQLUrl, config.url, config.credentials, config.app, query)
				.then((res) => {
					handleResponseMSearch(
						{
							res,
							isSuggestionsQuery,
							orderOfQueries,
							appendToHits,
							appendToAggs,
						},
						getState,
						dispatch,
					);
				})
				.catch((err) => {
					handleError(
						{
							orderOfQueries,
							error: err,
						},
						getState,
						dispatch,
					);
				});
		} else {
			appbaseRef.setHeaders({ ...headers, ...searchHeaders });
			appbaseRef
				.msearch({
					type: config.type === '*' ? '' : config.type,
					body: query,
				})
				.then((res) => {
					handleResponseMSearch(
						{
							res,
							isSuggestionsQuery,
							orderOfQueries,
							appendToHits,
							appendToAggs,
						},
						getState,
						dispatch,
					);
				})
				.catch((err) => {
					handleError(
						{
							orderOfQueries,
							error: err,
						},
						getState,
						dispatch,
					);
				});
		}
	};
}

function appbaseSearch({
	query,
	orderOfQueries,
	appendToHits = false,
	isInternalComponent = false,
	appendToAggs = false,
	componentType,
	componentId,
} = {}) {
	return (dispatch, getState) => {
		const { appbaseRef, config, headers } = getState();

		let isAnalyticsEnabled = false;

		if (config) {
			if (isPropertyDefined(config.analytics)) {
				isAnalyticsEnabled = config.analytics;
			} else if (config.analyticsConfig) {
				if (isPropertyDefined(config.analyticsConfig.recordAnalytics)) {
					isAnalyticsEnabled = config.analyticsConfig.recordAnalytics;
				} else if (isPropertyDefined(config.analyticsConfig.analytics)) {
					isAnalyticsEnabled = config.analyticsConfig.analytics;
				}
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
			// reset error
			dispatch(setError(component, null));
		});

		appbaseRef.setHeaders({ ...headers });
		if (isInternalComponent) {
			dispatch(loadPopularSuggestions(componentId));
		}
		appbaseRef
			.reactiveSearchv3(query, settings)
			.then((res) => {
				handleResponse(
					{
						res,
						isInternalComponent,
						orderOfQueries,
						appendToHits,
						appendToAggs,
						componentType,
						componentId,
					},
					getState,
					dispatch,
				);
			})
			.catch((err) => {
				handleError(
					{
						orderOfQueries,
						error: err,
					},
					getState,
					dispatch,
				);
			});
	};
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
			props,
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
								...getDependentQueries(getState(), component, orderOfQueries),
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
				dispatch(appbaseSearch({
					query: finalQuery,
					orderOfQueries,
					isInternalComponent: componentId.endsWith('__internal'),
					componentType,
					props: props[componentId],
					componentId,
				}));
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
		meta = {}, // to store any meta value which gets update on value changes
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
			dispatch(setValue(
				componentId,
				value,
				label,
				showFilter,
				URLParams,
				componentType,
				category,
				meta,
			));
			if (componentType === componentTypes.dynamicRangeSlider) {
				// Dynamic Range Slider has a dependency on histogram which uses different ID
				dispatch(setInternalValue(
					getHistogramComponentID(componentId),
					value,
					componentType,
					category,
					meta,
				));
			} else {
				dispatch(setInternalValue(
					`${componentId}__internal`,
					value,
					componentType,
					category,
					meta,
				));
			}
		} else {
			dispatch(setInternalValue(componentId, value, componentType, category, meta));
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
			const componentProps = store.props[component] || {};
			let compositeAggregationField = componentProps.aggregationField;
			const queryType = componentToTypeMap[componentProps.componentType];
			// For term queries i.e list component `dataField` will be treated as aggregationField
			if (queryType === queryTypes.term) {
				compositeAggregationField = componentProps.dataField;
			}
			// build query
			const query = getRSQuery(
				component,
				extractPropsFromState(store, component, {
					from: options.from,
					after:
						(store.aggregations[component]
							&& store.aggregations[component][compositeAggregationField]
							&& store.aggregations[component][compositeAggregationField].after_key)
						|| undefined,
				}),
			);
			// Apply dependent queries
			appbaseQuery = {
				...{ [component]: query },
				...getDependentQueries(getState(), component, []),
			};
			const finalQuery = Object.keys(appbaseQuery).map(c => appbaseQuery[c]);
			dispatch(appbaseSearch({
				query: finalQuery,
				orderOfQueries: [component],
				appendToHits,
				appendToAggs,
			}));
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
