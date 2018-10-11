import {
	UPDATE_HITS,
	UPDATE_AGGS,
	PUSH_TO_STREAM_HITS,
} from '../constants';

export function updateAggs(component, aggregations, append = false) {
	return {
		type: UPDATE_AGGS,
		component,
		aggregations,
		append,
	};
}

export function updateHits(component, hits, time, append = false) {
	return {
		type: UPDATE_HITS,
		component,
		hits: hits.hits,
		total: hits.total,
		time,
		append,
	};
}

export function pushToStreamHits(component, hit) {
	return {
		type: PUSH_TO_STREAM_HITS,
		component,
		hit,
	};
}
