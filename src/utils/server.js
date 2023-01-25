import { componentTypes, queryTypes } from './constants';
import { isPropertyDefined } from '../actions/utils';
import {
	componentToTypeMap,
	extractPropsFromState,
	getDependentQueries,
	getRSQuery,
} from './transform';

import valueReducer from '../reducers/valueReducer';
import queryReducer from '../reducers/queryReducer';
import { buildQuery } from './helper';

function getValue(state, id, defaultValue) {
	if (state && state[id]) {
		try {
			// parsing for next.js - since it uses extra set of quotes to wrap params
			const parsedValue = JSON.parse(state[id]);
			return {
				value: parsedValue,
				reference: 'URL',
			};
		} catch (error) {
			// using react-dom-server for ssr
			return {
				value: state[id],
				reference: 'URL',
			};
		}
	}
	return {
		value: defaultValue,
		reference: 'DEFAULT',
	};
}
const componentsWithInternalComponent = {
	// search components
	[componentTypes.reactiveList]: true,
	[componentTypes.searchBox]: true,
	// term components
	[componentTypes.singleList]: true,
	[componentTypes.multiList]: true,
	[componentTypes.singleDropdownList]: true,
	[componentTypes.singleDataList]: false,
	[componentTypes.multiDataList]: false,
	[componentTypes.multiDropdownList]: true,
	[componentTypes.tagCloud]: true,
	[componentTypes.toggleButton]: false,
	[componentTypes.reactiveChart]: true,
	[componentTypes.treeList]: true,
	// basic components
	[componentTypes.numberBox]: false,

	// range components
	[componentTypes.datePicker]: false,
	[componentTypes.dateRange]: false,
	[componentTypes.dynamicRangeSlider]: true,
	[componentTypes.singleDropdownRange]: true,
	[componentTypes.multiDropdownRange]: true,
	[componentTypes.singleRange]: false,
	[componentTypes.multiRange]: false,
	[componentTypes.rangeSlider]: true,
	[componentTypes.ratingsFilter]: false,
	[componentTypes.rangeInput]: true,

	// map components
	[componentTypes.geoDistanceDropdown]: true,
	[componentTypes.geoDistanceSlider]: true,
	[componentTypes.reactiveMap]: true,
};

const componentsWithoutFilters = [componentTypes.numberBox, componentTypes.ratingsFilter];

const resultComponents = [componentTypes.reactiveList, componentTypes.reactiveMap];
function parseValue(componentId, value, props) {
	switch (props.componentType) {
		default:
			return value;
	}
}

function getQuery(componentId, value, props) {
	// get default query of result components
	// if (resultComponents.includes(props.componentType)) {
	// 	return component.defaultQuery ? component.defaultQuery() : {};
	// }

	// get custom or default query of sensor components
	const currentValue = parseValue(componentId, value, props);
	// if (component.customQuery) {
	// 	const customQuery = component.customQuery(currentValue, component);
	// 	return customQuery && customQuery.query;
	// }

	switch (props.componentType) {
		case componentTypes.multiList:
			return {
				query: {
					queryFormat: props.queryFormat,
					dataField: props.dataField,
					value,
					showMissing: props.showMissing,
				},
			};

		case componentTypes.numberBox:
			return {
				query: {
					queryFormat: props.queryFormat,
					dataField: props.dataField,
					value,
					nestedField: props.nestedField,
				},
			};

		default:
			return null;
	}
}
// parse query string
// ref: https://stackoverflow.com/a/13896633/10822996
function parseQuery(str) {
	if (str instanceof Object) {
		return str;
	}
	if (typeof str !== 'string' || str.length === 0) return {};
	let s;
	if (str.split('/?')[1]) {
		s = str.split('/?')[1].split('&');
	}
	if (!s) return {};
	const sLength = s.length;
	let bit;
	const query = {};
	let first;
	let second;
	for (let i = 0; i < sLength; i += 1) {
		bit = s[i].split('=');
		first = decodeURIComponent(bit[0]);
		// eslint-disable-next-line no-continue
		if (first.length === 0) continue;
		second = decodeURIComponent(bit[1]);
		if (typeof query[first] === 'undefined') query[first] = second;
		else if (query[first] instanceof Array) query[first].push(second);
		else query[first] = [query[first], second];
	}
	return query;
}

const getServerResults = () => {
	let appContext = null;

	return (App, queryString = '', ssrRenderFunc) => {
		try {
			// parse the query String to respect url params in SSR
			const parsedQueryString = parseQuery(queryString);

			if (!appContext) {
				// callback function to collect SearchBase context
				const contextCollector = (params) => {
					if (params.ctx) {
						appContext = params.ctx;
					}
				};

				// render the app server-side to collect context and build initial state
				// for hydration on client side
				ssrRenderFunc(App({ contextCollector }));

				if (appContext) {
					const extractedState = appContext.getState();
					const {
						components,
						config,
						appbaseRef,
						dependencyTree,
						queryOptions,
						selectedValues,
						internalValues,
						props,
					} = extractedState;
					let { queryList } = extractedState;

					let queryLog = {};

					let finalQuery = [];
					let appbaseQuery = {}; // Use object to prevent duplicate query added by react prop
					let orderOfQueries = [];
					let hits = {};
					let aggregations = {};
					let state = { ...extractedState };
					let newselectedValues = { ...selectedValues };

					components
						.filter(t => !t.endsWith('__internal'))
						.forEach((componentId) => {
							const { value, reference } = getValue(
								parsedQueryString,
								componentId,
								newselectedValues[componentId]
									? newselectedValues[componentId].value
									: null,
							);
							if (value) {
								newselectedValues = valueReducer(newselectedValues, {
									type: 'PATCH_VALUE',
									component: componentId,
									payload: {
										label: props[componentId].filterLabel || componentId,
										value,
										reference,
										componentType: props[componentId].componentType,
									},
								});

								const isResultComponent = resultComponents.includes(props[componentId].componentType);
								if (isResultComponent) {
									const { query } = getQuery(
										componentId,
										value,
										props[componentId],
									);
									queryList = queryReducer(queryList, {
										type: 'SET_QUERY',
										component: `${componentId}__internal`,
										query,
									});
								} else {
									queryList = queryReducer(queryList, {
										type: 'SET_QUERY',
										component: componentId,
										query: getQuery(componentId, value, props[componentId]),
									});
								}
							}
						});

					// Generate finalQuery for search
					components
						.filter(t => !t.endsWith('__internal'))
						.forEach((componentId) => {
							// eslint-disable-next-line
							let { queryObj, options } = buildQuery(
								componentId,
								dependencyTree,
								queryList,
								queryOptions,
							);
							if (!queryObj && !options) {
								return;
							}

							const query = getRSQuery(
								componentId,
								extractPropsFromState(
									state,
									componentId,
									queryOptions && queryOptions[componentId]
										? { from: queryOptions[componentId].from }
										: null,
								),
							);

							// check if query or options are valid - non-empty
							if (query && !!Object.keys(query).length) {
								const currentQuery = query;

								const dependentQueries = getDependentQueries(
									state,
									componentId,
									orderOfQueries,
								);
								let queryToLog = {
									...{ [componentId]: currentQuery },
									...Object.keys(dependentQueries).reduce(
										(acc, q) => ({
											...acc,
											[q]: { ...dependentQueries[q], execute: false },
										}),
										{},
									),
								};
								if (
									[queryTypes.range, queryTypes.term].includes(componentToTypeMap[props[componentId].componentType])
								) {
									// Avoid logging `value` for term type of components
									// eslint-disable-next-line
									const { value, ...rest } = currentQuery;

									queryToLog = {
										...{ [componentId]: rest },
										...Object.keys(dependentQueries).reduce(
											(acc, q) => ({
												...acc,
												[q]: { ...dependentQueries[q], execute: false },
											}),
											{},
										),
									};
								}

								orderOfQueries = [...orderOfQueries, componentId];

								queryLog = {
									...queryLog,
									[componentId]: queryToLog,
								};

								if (query) {
									// Apply dependent queries
									appbaseQuery = {
										...appbaseQuery,
										...{ [componentId]: query },
										...getDependentQueries(state, componentId, orderOfQueries),
									};
								}
							}
						});
					state.queryLog = queryLog;
					const handleTransformResponse = (res, component) => {
						if (
							config.transformResponse
							&& typeof config.transformResponse === 'function'
						) {
							return config.transformResponse(res, component);
						}
						return new Promise(resolveTransformResponse =>
							resolveTransformResponse(res));
					};
					const handleRSResponse = (res) => {
						const promotedResults = {};
						const rawData = {};
						const customData = {};
						const allPromises = orderOfQueries.map(component =>
							new Promise((responseResolve, responseReject) => {
								handleTransformResponse(res[component], component)
									.then((response) => {
										if (response) {
											if (response.promoted) {
												promotedResults[component]
														= response.promoted.map(promoted => ({
														...promoted.doc,
														_position: promoted.position,
													}));
											}
											rawData[component] = response;
											// Update custom data
											if (response.customData) {
												customData[component] = response.customData;
											}

											if (response.aggregations) {
												aggregations = {
													...aggregations,
													[component]: response.aggregations,
												};
											}
											const hitsObj = response.hits
												? response.hits
												: response[component].hits;
											hits = {
												...hits,
												[component]: {
													hits: hitsObj.hits,
													total:
															typeof hitsObj.total === 'object'
																? hitsObj.total.value
																: hitsObj.total,
													time: response.took,
												},
											};
											responseResolve();
										}
									})
									.catch((err) => {
										responseReject(err);
									});
							}));

						return Promise.all(allPromises).then(() => {
							state = {
								queryList,
								queryOptions,
								selectedValues: newselectedValues,
								internalValues,
								queryLog,
								hits,
								aggregations,
								promotedResults,
								customData,
								rawData,
								dependencyTree,
							};
							return Promise.resolve(JSON.parse(JSON.stringify(state)));
						});
					};
					if (Object.keys(appbaseQuery).length) {
						finalQuery = Object.keys(appbaseQuery).map(c => appbaseQuery[c]);
						// Call RS API
						const rsAPISettings = {};
						if (config.analyticsConfig) {
							rsAPISettings.recordAnalytics = isPropertyDefined(config.analyticsConfig.recordAnalytics)
								? config.analyticsConfig.recordAnalytics
								: undefined;
							rsAPISettings.userId = isPropertyDefined(config.analyticsConfig.userId)
								? config.analyticsConfig.userId
								: undefined;
							rsAPISettings.enableQueryRules = isPropertyDefined(config.analyticsConfig.enableQueryRules)
								? config.analyticsConfig.enableQueryRules
								: undefined;
							rsAPISettings.customEvents = isPropertyDefined(config.analyticsConfig.customEvents)
								? config.analyticsConfig.customEvents
								: undefined;
						}
						return appbaseRef
							.reactiveSearchv3(finalQuery, rsAPISettings)
							.then(res => handleRSResponse(res))
							.catch((err) => {
								console.log('err', err);
								return Promise.reject(err);
							});
					}
					throw new Error('Could not compute server-side initial state of the app!');
				} else {
					return null;
				}
			} else {
				return null;
			}
		} catch (error) {
			console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫', error.stack);
			return Promise.reject(new Error('Could not compute server-side initial state of the app!'));
		}
	};
};
export default getServerResults;
