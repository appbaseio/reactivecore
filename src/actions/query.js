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
					if (timestamp[component] && timestamp[component] > response._timestamp) {
						return;
					}

					if (response.hits) {
						dispatch(setTimestamp(component, response._timestamp));
						dispatch(updateHits(component, response.hits, response.took, appendToHits));
						dispatch(setLoading(component, false));
					}

					if (response.aggregations) {
						dispatch(updateAggs(component, response.aggregations));
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
			mapData,
			watchMan,
			dependencyTree,
			queryList,
			queryOptions,
		} = getState();
		let orderOfQueries = [];
		let finalQuery = [];

		// const handleResponse = (response) => {
		// 	if (response._id) {
		// 		dispatch(pushToStreamHits(componentId, response));
		// 	}
		// };

		// const handleError = (error) => {
		// 	console.error(error);
		// 	dispatch(setLoading(component, false));
		// };

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

			const validOptions = ['aggs', 'from', 'sort', 'size'];

			if (
				(queryObj && Object.keys(queryObj).length)
				|| (options && (
					Object.keys(options).some(item => validOptions.includes(item)))
				)
			) {
				if (!queryObj || (queryObj && !Object.keys(queryObj).length)) {
					queryObj = { match_all: {} };
				}

				orderOfQueries = [...orderOfQueries, component];

				const currentQuery = {
					query: { ...queryObj },
					...options,
					...queryOptions[component],
				};

				if (isEqual(currentQuery, queryLog[component])) { return; }

				dispatch(logQuery(component, currentQuery));
				finalQuery = [
					...finalQuery,
					{
						preference: component,
					},
					currentQuery,
				];
			}
		});

		if (finalQuery.length) {
			dispatch(msearch(finalQuery, orderOfQueries));
		}

		if (stream[componentId] && stream[componentId].status) {
			// handle streaming query
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

		const finalQuery = {
			query: { ...queryObj },
			...options,
		};
		dispatch(msearch(finalQuery, [component], append));
	};
}
