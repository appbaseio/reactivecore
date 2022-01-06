// get top hits from composite aggregations response
import { UPDATE_COMPOSITE_AGGS } from '../constants';

export default function compositeAggsReducer(state = {}, action) {
	if (action.type === UPDATE_COMPOSITE_AGGS) {
		const aggsResponse
			= Object.values(action.aggregations) && Object.values(action.aggregations)[0];
		const fieldName = Object.keys(action.aggregations)[0];
		if (!aggsResponse) return state;
		let buckets = [];
		if (aggsResponse.buckets && Array.isArray(aggsResponse.buckets)) {
			buckets = aggsResponse.buckets;
		}
		const parsedAggs = buckets.map((bucket) => {
			// eslint-disable-next-line camelcase
			const { doc_count, key, [fieldName]: hitsData } = bucket;
			let flatData = {};
			let _source = {};
			if (hitsData && hitsData.hits) {
				({ _source, ...flatData } = hitsData.hits.hits[0]);
			}
			return {
				_doc_count: doc_count,
				_key: typeof key === 'string' ? key : key[fieldName],
				top_hits: hitsData,
				...flatData,
				..._source,
			};
		});
		return {
			...state,
			[action.component]: action.append
				? [...state[action.component], ...parsedAggs]
				: parsedAggs,
		};
	}
	return state;
}
