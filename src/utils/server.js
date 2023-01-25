import { componentTypes } from './constants';
import { isPropertyDefined } from '../actions/utils';
import { extractPropsFromState, getDependentQueries, getRSQuery } from './transform';

import valueReducer from '../reducers/valueReducer';
import queryReducer from '../reducers/queryReducer';
import { buildQuery } from './helper';

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

function getSourceFromComponentType() {
	return { [componentTypes.multiList]: 'MultiList' };
}

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
const resultComponents = [componentTypes.reactiveList, componentTypes.reactiveMap];
function parseValue(value, component) {
	if (component.source && component.source.parseValue) {
		return component.source.parseValue(value, component);
	}
	return value;
}
function getQuery(component, value, componentType) {
	// get default query of result components
	if (resultComponents.includes(componentType)) {
		return component.defaultQuery ? component.defaultQuery() : {};
	}

	// get custom or default query of sensor components
	const currentValue = parseValue(value, component);
	if (component.customQuery) {
		const customQuery = component.customQuery(currentValue, component);
		return customQuery && customQuery.query;
	}
	return component.source.defaultQuery
		? component.source.defaultQuery(currentValue, component)
		: {};
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
										{
											componentId,
											...props[componentId],
											source: getSourceFromComponentType(props[componentId].componentType),
										},
										value,
										props[componentId].componentType,
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
										query: getQuery(
											{
												componentId,
												...props[componentId],
												source: getSourceFromComponentType(props[componentId].componentType),
											},
											value,
											props[componentId].componentType,
										),
									});
								}
							}
						});

					console.log('⛈⛈⛈⛈⛈⛈⛈⛈⛈⛈⛈⛈⛈', newselectedValues);

					// Generate finalQuery for search
					components
						.filter(t => !t.endsWith('__internal'))
						.forEach((componentId) => {
							// eslint-disable-next-line prefer-const
							let { queryObj, options } = buildQuery(
								componentId,
								dependencyTree,
								queryList,
								queryOptions,
							);

							const validOptions = ['aggs', 'from', 'sort'];
							// check if query or options are valid - non-empty
							if (
								(queryObj && !!Object.keys(queryObj).length)
								|| (options
									&& Object.keys(options).some(item =>
										validOptions.includes(item)))
							) {
								if (!queryObj || (queryObj && !Object.keys(queryObj).length)) {
									queryObj = { match_all: {} };
								}

								orderOfQueries = [...orderOfQueries, componentId];

								const currentQuery = {
									query: { ...queryObj },
									...options,
									...queryOptions[componentId],
								};

								queryLog = {
									...queryLog,
									[componentId]: currentQuery,
								};

								if (config.enableAppbase) {
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
									if (query) {
										// Apply dependent queries
										appbaseQuery = {
											...appbaseQuery,
											...{ [componentId]: query },
											...getDependentQueries(
												state,
												componentId,
												orderOfQueries,
											),
										};
									}
								} else {
									const preference
										= config
										&& config.analyticsConfig
										&& config.analyticsConfig.userId
											? `${config.analyticsConfig.userId}_${componentId}`
											: componentId;
									finalQuery = [
										...finalQuery,
										{
											preference,
										},
										currentQuery,
									];
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
									.catch(err => responseReject(err));
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
								// registeredComponentsTimestamps,
								dependencyTree,
							};
							return Promise.resolve(state);
						});
					};

					if (config.enableAppbase && Object.keys(appbaseQuery).length) {
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
			console.log('🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫🚫', error);
			return Promise.reject(new Error('Could not compute server-side initial state of the app!', error.stack));
		}
	};
};

export default getServerResults;
