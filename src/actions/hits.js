import { UPDATE_HITS, UPDATE_AGGS, UPDATE_COMPOSITE_AGGS, SET_QUERY_TO_HITS } from '../constants';
import { setError } from './misc';

export function updateAggs(component, aggregations, append = false) {
	return {
		type: UPDATE_AGGS,
		component,
		aggregations,
		append,
	};
}

export function updateCompositeAggs(component, aggregations, append = false) {
	return {
		type: UPDATE_COMPOSITE_AGGS,
		component,
		aggregations,
		append,
	};
}

export function updateHits(component, hits, time, hidden, append = false) {
	return {
		type: UPDATE_HITS,
		component,
		hits: hits.hits,
		// make compatible with es7
		total: typeof hits.total === 'object' ? hits.total.value : hits.total,
		hidden,
		time,
		append,
	};
}

export function saveQueryToHits(component, query) {
	return {
		type: SET_QUERY_TO_HITS,
		component,
		query,
	};
}

export function mockDataForTesting(component, data) {
	return (dispatch) => {
		if (data.hasOwnProperty('error')) {
			dispatch(setError(component, data.error));
		}
		if (data.hasOwnProperty('aggregations')) {
			// set aggs
			dispatch(updateAggs(component, data.aggregations));
		}
		if (data.hasOwnProperty('hits')) {
			// set hits
			dispatch(updateHits(component, data, data.time || undefined));
		}
	};
}
