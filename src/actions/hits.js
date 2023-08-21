import { UPDATE_HITS, UPDATE_AGGS, UPDATE_COMPOSITE_AGGS } from '../constants';
import { SET_QUERY_TO_HITS } from '../../lib/constants';
import { setAIResponse, setError, setRawData } from './misc';

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
		if (data.hasOwnProperty('rawData')) {
			dispatch(setRawData(component, data.rawData));
		}
		if (data.hasOwnProperty('AI_RESPONSE')) {
			// set AI response
			dispatch(setAIResponse(component, data.AI_RESPONSE));
			// set rawData
		}
	};
}
