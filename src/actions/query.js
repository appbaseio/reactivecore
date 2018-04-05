import {
	SET_QUERY,
	SET_QUERY_OPTIONS,
	LOG_QUERY,
	SET_LOADING,
	SET_TIMESTAMP,
	SET_HEADERS,
	SET_STREAMING,
} from '../constants';

import { setValue } from './value';
import { updateHits, updateAggs, pushToStreamHits } from './hits';
import { buildQuery, isEqual } from '../utils/helper';

export function setQuery(component, query) {
	return {
		type: SET_QUERY,
		component,
		query,
	};
}

export function updateQueryOptions(component, options) {
	return {
		type: SET_QUERY_OPTIONS,
		component,
		options,
	};
}

export function logQuery(component, query) {
	return {
		type: LOG_QUERY,
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

function msearch(query, orderOfQueries, appendToHits = false) {
	return (dispatch, getState) => {
		const {
			appbaseRef,
			config,
			headers,
			timestamp,
		} = getState();

		appbaseRef.setHeaders(headers);
		appbaseRef.msearch({
			type: config.type === '*' ? '' : config.type,
			body: query,
		})
			.on('data', (res) => {
				orderOfQueries.forEach((component, index) => {
					const response = res.responses[index];

					if (!timestamp[component] || timestamp[component] < response._timestamp) {
						if (response.hits) {
							dispatch(setTimestamp(component, response._timestamp));
							dispatch(updateHits(component, response.hits, response.took, appendToHits));
							dispatch(setLoading(component, false));
						}

						if (response.aggregations) {
							dispatch(updateAggs(component, response.aggregations));
						}
					}
				});
			})
			.on('error', (error) => {
				console.error(error);
				orderOfQueries.forEach((component) => {
					dispatch(setLoading(component, false));
				});
			});
	};
}

export function executeQuery(componentId, executeWatchList = false) {
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
		} = getState();
		let orderOfQueries = [];
		let finalQuery = [];
		const matchAllQuery = { match_all: {} };

		let componentList = [componentId];

		if (executeWatchList) {
			const watchList = watchMan[componentId] || [];
			componentList = [...componentList, ...watchList];
		}

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
				|| (options && (
					Object.keys(options).some(item => validOptions.includes(item)))
				)
			) {
				const isMapComponent = Object.keys(mapData).includes(component);

				// apply map-query if applicable
				if (
					isMapComponent
					&& mapData[component].mustExecute
					&& mapData[component].query
				) {
					// add geo-bound-query if mustExecute is true
					queryObj = (queryObj && Object.keys(queryObj).length)
						? [queryObj.bool.must]
						: [matchAllQuery];

					queryObj = {
						bool: {
							must: [
								...queryObj,
								mapData[component].query,
							],
						},
					};
				} else if (
					(!queryObj || (queryObj && !Object.keys(queryObj).length))
					&& isMapComponent
					&& !!mapData[component].query
				) {
					// add geo-bound-query if no query is present
					queryObj = {
						bool: {
							must: [
								matchAllQuery,
								mapData[component].query,
							],
						},
					};
				}

				if (!queryObj || (queryObj && !Object.keys(queryObj).length)) {
					queryObj = { ...matchAllQuery };
				}

				const currentQuery = {
					query: { ...queryObj },
					...options,
					...queryOptions[component],
				};

				if (!isEqual(currentQuery, queryLog[component])) {
					orderOfQueries = [...orderOfQueries, component];
					dispatch(logQuery(component, currentQuery));

					// execute streaming query if applicable
					if (stream[component] && stream[component].status) {
						if (stream[component].ref) {
							stream[component].ref.stop();
						}

						const ref = appbaseRef.searchStream({
							type: config.type === '*' ? '' : config.type,
							body: currentQuery,
						})
							.on('data', (response) => {
								if (response._id) {
									dispatch(pushToStreamHits(component, response));
								}
							})
							.on('error', (error) => {
								console.error(error);
								dispatch(setLoading(component, false));
							});

						// update streaming ref
						dispatch(setStreaming(component, true, ref));
					}

					// push to combined query for msearch
					finalQuery = [
						...finalQuery,
						{
							preference: component,
						},
						currentQuery,
					];
				}
			}
		});

		if (finalQuery.length) {
			dispatch(msearch(finalQuery, orderOfQueries));
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

export function updateQuery({
	componentId,
	query,
	value,
	label = null,
	showFilter = true,
	onQueryChange,
	URLParams = false,
}) {
	return (dispatch) => {
		let queryToDispatch = query;
		if (query && query.query) {
			queryToDispatch = query.query;
		}
		// don't set filters for internal components
		if (!componentId.endsWith('__internal')) {
			dispatch(setValue(componentId, value, label, showFilter, URLParams));
		}
		dispatch(setQuery(componentId, queryToDispatch));
		dispatch(executeQuery(componentId, true));
	};
}

export function loadMore(component, newOptions, append = true) {
	return (dispatch, getState) => {
		const store = getState();
		let { queryObj, options } = buildQuery(
			component,
			store.dependencyTree,
			store.queryList,
			store.queryOptions,
		);

		if (!options) options = {};
		options = { ...options, ...newOptions };

		if (!queryObj || (queryObj && !Object.keys(queryObj).length)) {
			queryObj = { match_all: {} };
		}

		const finalQuery = [
			{
				preference: component,
			},
			{
				query: { ...queryObj },
				...options,
			},
		];
		dispatch(msearch(finalQuery, [component], append));
	};
}
