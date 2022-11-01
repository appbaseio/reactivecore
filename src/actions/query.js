import { setValue, setInternalValue } from './value';
import {
	handleError,
	isPropertyDefined,
	getSuggestionQuery,
	handleResponse,
	executeQueryListener,
	handleResponseMSearch,
	getQuerySuggestionsId,
	updateStoreConfig,
} from './utils';
import {
	logQuery,
	setLoading,
	logCombinedQuery,
	setQuery,
	setError,
	updateQueryOptions,
	setPopularSuggestions,
	setDefaultPopularSuggestions,
	setLastUsedAppbaseQuery,
} from './misc';
import { buildQuery, compareQueries } from '../utils/helper';
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
	isSearchComponent,
} from '../utils/transform';
import { getInternalComponentID } from '../../lib/utils/transform';

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
			&& (componentProps.enablePopularSuggestions || componentProps.enableQuerySuggestions)
		) {
			if (config.mongodb) {
				dispatch(setDefaultPopularSuggestions([], componentId.split('__internal')[0]));
				return;
			}
			const suggQuery = getSuggestionQuery(getState, componentId);
			appbaseRef
				.getQuerySuggestions(suggQuery)
				.then((suggestions) => {
					const querySuggestion = suggestions[getQuerySuggestionsId(componentId)];
					if (value) {
						// update query suggestions for search components
						dispatch(setPopularSuggestions(
							querySuggestion
									&& querySuggestion.hits
									&& querySuggestion.hits.hits,
							componentId.split('__internal')[0],
						));
					} else {
						dispatch(setDefaultPopularSuggestions(
							querySuggestion
									&& querySuggestion.hits
									&& querySuggestion.hits.hits,
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

const handleTransformRequest = (transformRequest, res) => {
	if (transformRequest && typeof transformRequest === 'function') {
		const transformRequestPromise = transformRequest(res);
		return transformRequestPromise instanceof Promise
			? transformRequestPromise
			: Promise.resolve(transformRequestPromise);
	}
	return Promise.resolve(res);
};

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
			const requestOptions = {
				graphQLUrl: config.graphQLUrl,
				url: config.url,
				credentials: config.credentials,
				app: config.app,
				query,
				headers,
			};
			handleTransformRequest(appbaseRef.transformRequest, requestOptions)
				.then((modifiedRequest) => {
					fetchGraphQL(modifiedRequest)
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
	queryId,
	query,
	orderOfQueries,
	appendToHits = false,
	isSuggestionsQuery = false,
	searchComponentID,
	appendToAggs = false,
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
			settings.emptyQuery = isPropertyDefined(config.analyticsConfig.emptyQuery)
				? config.analyticsConfig.emptyQuery
				: undefined;
			settings.enableSearchRelevancy = isPropertyDefined(config
				.analyticsConfig
				.enableSearchRelevancy)
				? config.analyticsConfig.enableSearchRelevancy
				: undefined;
			settings.suggestionAnalytics = isPropertyDefined(config.analyticsConfig.suggestionAnalytics)
				? config.analyticsConfig.suggestionAnalytics
				: undefined;
			settings.useCache = isPropertyDefined(config.analyticsConfig.useCache)
				? config.analyticsConfig.useCache
				: undefined;
			settings.queryParams = isPropertyDefined(config.analyticsConfig.queryParams)
				? config.analyticsConfig.queryParams
				: undefined;
		}

		// set loading as active for the given component
		orderOfQueries.forEach((component) => {
			dispatch(setLoading(component, true));
			// reset error
			dispatch(setError(component, null));
		});

		appbaseRef.setHeaders({ ...headers });
		if (isSuggestionsQuery && searchComponentID) {
			dispatch(loadPopularSuggestions(searchComponentID));
		}
		appbaseRef
			.reactiveSearch(query, settings, settings.queryParams)
			.then((res) => {
				handleResponse(
					{
						res,
						orderOfQueries,
						appendToHits,
						appendToAggs,
						query,
						queryId,
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
						queryId,
					},
					getState,
					dispatch,
				);
			});
	};
}

// latest request would be at the end
let requestStack = [];

export function executeQuery(
	componentId,
	executeWatchList = false,
	mustExecuteMapQuery = false,
	componentType,
	metaOptions,
	// A unique identifier for map query to recognize
	// the results for latest requests
	requestId,
) {
	return (dispatch, getState) => {
		const {
			queryLog,
			config,
			mapData,
			watchMan,
			dependencyTree,
			queryList,
			queryOptions,
			queryListener,
			props,
			internalValues,
			lock,
		} = getState();
		let lockTime = config.initialQueriesSyncTime;
		let initialTimestamp = config.initialTimestamp;
		const queryId = requestId || new Date().getTime();
		// override logic for locking queries for a period of time
		// The block only runs when setSearchState method of StateProvider sets the
		// queryLockConfig property in then store
		if (config.queryLockConfig instanceof Object) {
			lockTime = config.queryLockConfig.lockTime;
			initialTimestamp = config.queryLockConfig.initialTimestamp;
		}

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

				if (mustExecuteMapQuery || !compareQueries(currentQuery, oldQuery, false)) {
					orderOfQueries = [...orderOfQueries, component];

					const isMapComponent = Object.keys(mapData).includes(component);
					if (isMapComponent) {
						dispatch(setLastUsedAppbaseQuery({
							[component]: {
								queryId,
							},
						}));
					}

					// log query before adding the map query,
					// since we don't do gatekeeping on the map query in the `queryLog`
					dispatch(logQuery(component, queryToLog));

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
						if (compareQueries(combinedLog[component], currentQuery)) return;

						// log query after adding the map query,
						// to separately support gatekeeping for combined map queries
						dispatch(logCombinedQuery(component, currentQuery));
					}

					executeQueryListener(queryListener[component], oldQuery, currentQuery);

					// push to combined query for msearch
					if (isAppbaseEnabled) {
						// use internal value for suggestions query
						let value;
						const isInternalComponent = componentId.endsWith('__internal');
						const mainComponentProps = props[componentId];
						if (
							isInternalComponent
							&& mainComponentProps
							&& isSearchComponent(mainComponentProps.componentType)
						) {
							value
								= internalValues[componentId] && internalValues[componentId].value;
						}
						// build query
						const query = getRSQuery(
							component,
							extractPropsFromState(getState(), component, {
								...(value ? { value } : null),
								...(metaOptions ? { from: metaOptions.from } : null),
							}),
						);
						if (query) {
							// Apply dependent queries
							appbaseQuery = {
								...appbaseQuery,
								...{ [component]: query },
								...getDependentQueries(getState(), component, orderOfQueries),
							};
						}
						if (isMapComponent) {
							const internalComponent = getInternalComponentID(component);
							const internalQuery = getRSQuery(
								internalComponent,
								extractPropsFromState(
									getState(),
									internalComponent,
									metaOptions ? { from: metaOptions.from } : null,
								),
							);
							if (internalQuery) {
								appbaseQuery[internalComponent] = {
									...internalQuery,
									execute: false,
								};
							}
						}
					} else {
						const preference
							= config && config.analyticsConfig && config.analyticsConfig.userId
								? `${config.analyticsConfig.userId}_${component}`
								: component;
						finalQuery = [
							...finalQuery,
							{
								preference,
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
				const suggestionsComponents = [
					componentTypes.dataSearch,
					componentTypes.categorySearch,
				];
				const isInternalComponent = componentId.endsWith('__internal');
				const isSuggestionsQuery
					= isInternalComponent && suggestionsComponents.indexOf(componentType) !== -1;
				const currentTime = new Date().getTime();

				if (currentTime - initialTimestamp < lockTime) {
					// set timeout if lock is not false
					if (!lock || config.queryLockConfig) {
						setTimeout(() => {
							let finalOrderOfQueries = [];
							let finalIsSuggestionsQuery = false;
							let finalSearchComponentID = '';
							const orderOfQueriesMap = {};
							const processedQueriesMap = {};
							const queryExecutionMap = {};

							// construct the request body with latest requests
							// dispatch the `appbaseSearch` action with a single request
							requestStack.forEach((request) => {
								if (!finalIsSuggestionsQuery) {
									finalIsSuggestionsQuery = request.isSuggestionsQuery;
								}
								if (!finalSearchComponentID) {
									finalSearchComponentID = request.searchComponentID;
								}
								if (Array.isArray(request.query)) {
									request.query.forEach((query) => {
										if (query.execute) {
											queryExecutionMap[query.id] = query.execute;
										}
										const newQuery = query;
										// override by the latest query
										// set the query execution to true if map has value
										if (queryExecutionMap[query.id]) {
											newQuery.execute = true;
										}
										if (
											processedQueriesMap[query.id]
											&& processedQueriesMap[query.id].type
												=== queryTypes.suggestion
											&& newQuery.type !== queryTypes.suggestion
										) {
											processedQueriesMap[`${query.id}__suggestion_type`] = {
												...processedQueriesMap[query.id],
											};
											processedQueriesMap[query.id] = {
												...newQuery,
												execute: false,
											};
											return;
										}
										processedQueriesMap[query.id] = newQuery;
									});
								}
								if (Array.isArray(request.orderOfQueries)) {
									request.orderOfQueries.forEach((query) => {
										if (!orderOfQueriesMap[query.id]) {
											finalOrderOfQueries = [query, ...finalOrderOfQueries];
										} else {
											orderOfQueriesMap[query.id] = true;
										}
									});
								}
							});
							const finalCombinedQuery = Object.values(processedQueriesMap);
							if (finalCombinedQuery.length) {
								dispatch(appbaseSearch({
									query: finalCombinedQuery,
									orderOfQueries: finalOrderOfQueries,
									isSuggestionsQuery: finalIsSuggestionsQuery,
									searchComponentID: finalSearchComponentID,
								}));
							}
							// empty the request stack
							requestStack = [];
							dispatch(updateStoreConfig({
								queryLockConfig: undefined,
							}));
						}, lockTime);
					}
					dispatch(updateStoreConfig({ lock: true }));
					requestStack.push({
						query: finalQuery,
						orderOfQueries,
						isSuggestionsQuery,
						searchComponentID: componentId,
					});
				} else {
					dispatch(appbaseSearch({
						queryId,
						query: finalQuery,
						orderOfQueries,
						isSuggestionsQuery,
						searchComponentID: componentId,
					}));
				}
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
	shouldSetInternalValue = true,
) {
	return (dispatch) => {
		// eslint-disable-next-line
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
			if (shouldSetInternalValue) {
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
		if (compareQueries(queryLog[component], currentQuery)) return;

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
			const preference
				= store.config && store.config.analyticsConfig && store.config.analyticsConfig.userId
					? `${store.config.analyticsConfig.userId}_${component}`
					: component;
			const finalQuery = [
				{
					preference,
				},
				currentQuery,
			];
			dispatch(msearch(finalQuery, [component], appendToHits, false, appendToAggs));
		}
	};
}

export function loadDataToExport(componentId, deepPaginationCursor = '', totalResults, data = []) {
	return (dispatch, getState) => {
		const { appbaseRef, lastUsedAppbaseQuery } = getState();
		const queryFromStore = lastUsedAppbaseQuery[componentId];
		if (queryFromStore) {
			const query = queryFromStore.map((queryItem) => {
				if (queryItem.id === componentId) {
					const finalQueryItem = {
						...queryItem,
						deepPaginationConfig: {
							cursor: deepPaginationCursor,
						},
						deepPagination: true,
						size: totalResults < 1000 ? totalResults : 1000,
						sortField: '_id',
						sortBy: 'asc',
					};

					delete finalQueryItem.from;
					return finalQueryItem;
				}
				return queryItem;
			});

			if (totalResults && Array.isArray(data) && totalResults <= data.length) {
				return data;
			}

			return appbaseRef
				.reactiveSearchv3(query)
				.then((res) => {
					const newDataChunk = res[componentId].hits.hits;
					if (!Array.isArray(newDataChunk) || newDataChunk.length === 0) {
						return data;
					}
					return dispatch(loadDataToExport(
						componentId,
						newDataChunk[newDataChunk.length - 1]._id,
						res[componentId].hits.total.value,
						[...data, ...newDataChunk],
					));
				})
				.catch((err) => {
					console.error('Error fetching data to export! ', err);
				});
		}
		return console.error('Error fetching data to export!');
	};
}
