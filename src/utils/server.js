/* eslint-disable max-len */
import { queryTypes } from './constants';
import { handleTransformResponse, isPropertyDefined } from '../actions/utils';
import {
	componentToTypeMap,
	extractPropsFromState,
	getDependentQueries,
	getRSQuery,
} from './transform';

import valueReducer from '../reducers/valueReducer';
import { buildQuery } from './helper';

function getValue(state, id, defaultValue) {
	if (state && state[id]) {
		try {
			// parsing for next.js - since it uses extra set of quotes to wrap params
			const parsedValue = JSON.parse(state[id]);

			return {
				...(typeof parsedValue === 'object' && parsedValue.value
					? {
						value: parsedValue.value,
						...(parsedValue.category ? { category: parsedValue.category } : {}),
					  }
					: { value: parsedValue }),
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
	if (str.split('?')[1]) {
		s = str.split('?')[1].split('&');
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
	let storeReference = null;

	return (App, queryString = '', ssrRenderFunc) => {
		try {
			// parse the query String to respect url params in SSR
			const parsedQueryString = parseQuery(queryString);
			if (!storeReference) {
				let newSelectedValues = {};
				// callback function to collect SearchBase context
				const contextCollector = (params) => {
					if (params.ctx) {
						// store collected
						storeReference = params.ctx;

						// collect selected values from the URL query string
						Object.keys(parsedQueryString).forEach((componentId) => {
							const { value, reference } = getValue(
								parsedQueryString,
								componentId,
								null,
							);
							if (value) {
								newSelectedValues = valueReducer(newSelectedValues, {
									type: 'PATCH_VALUE',
									component: componentId,
									payload: {
										value,
										reference,
									},
								});
							}
						});
					}

					return {
						// send back to ReactiveBase to hydrate the store with values from queryParams(if present)
						selectedValues: newSelectedValues,
					};
				};

				// render the app server-side to collect context and build initial state
				// for hydration on client side
				// in case of React, ssrRenderFunc === renderToString || renderToStaticMarkup
				// in case of Vue, ssrRenderFunc === renderToString (import { renderToString } from 'vue/server-renderer')
				ssrRenderFunc(App({ contextCollector }));

				if (storeReference) {
					const extractedState = storeReference.getState();
					const {
						components,
						config,
						appbaseRef,
						queryOptions,
						internalValues,
						props,
						queryList,
						dependencyTree,
					} = extractedState;

					let { queryLog } = extractedState;

					let finalQuery = [];
					let appbaseQuery = {}; // Use object to prevent duplicate query added by react prop
					let orderOfQueries = [];
					let hits = {};
					let aggregations = {};
					let state = { ...extractedState };

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
											[q]: {
												...dependentQueries[q],
												execute: false,
												...(dependentQueries[q].type
												=== queryTypes.suggestion
													? { type: 'search' }
													: {}),
											},
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
												[q]: {
													...dependentQueries[q],
													execute: false,
													...(dependentQueries[q].type
													=== queryTypes.suggestion
														? { type: 'search' }
														: {}),
												},
											}),
											{},
										),
									};
								}
								// if (!compareQueries(queryToLog, currentQuery, false)) {
								orderOfQueries = [...orderOfQueries, componentId];
								queryLog = {
									...queryLog,
									[componentId]: queryToLog,
								};
								// }

								if (query) {
									// Apply dependent queries
									const dependentQueriesToAppend = getDependentQueries(
										state,
										componentId,
										orderOfQueries,
									);
									appbaseQuery = {
										...appbaseQuery,
										...{ [componentId]: query },
									};
									Object.keys(dependentQueriesToAppend).forEach((cId) => {
										if (appbaseQuery[cId]) {
											appbaseQuery[cId + Math.random()]
												= dependentQueriesToAppend[cId];
										} else {
											appbaseQuery[cId] = dependentQueriesToAppend[cId];
										}
									});
								}
							}
						});

					const handleRSResponse = (res) => {
						const promotedResults = {};
						const rawData = {};
						const customData = {};
						const allPromises = orderOfQueries.map(component =>
							new Promise((responseResolve, responseReject) => {
								handleTransformResponse(res[component], config, component)
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
											const hitsObj = response.hits || {};
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
								selectedValues: newSelectedValues,
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
						finalQuery = Object.values(appbaseQuery);
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
							.catch(err => Promise.reject(err));
					}
					throw new Error('Could not compute server-side initial state of the app!');
				} else {
					return null;
				}
			} else {
				return null;
			}
		} catch (error) {
			return Promise.reject(error);
		}
	};
};
export default getServerResults;
