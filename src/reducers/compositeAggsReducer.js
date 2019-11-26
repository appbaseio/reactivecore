// get top hits from composite aggregations response
import { UPDATE_COMPOSITE_AGGS } from '../constants';

export default function compositeAggsReducer(state = {}, action) {
	if (action.type === UPDATE_COMPOSITE_AGGS) {
		const aggsResponse
			= Object.values(action.aggregations) && Object.values(action.aggregations)[0];
		const fieldName = Object.keys(action.aggregations)[0];
		if (!aggsResponse) return state;
		const buckets = aggsResponse.buckets || [];
		const parsedAggs = buckets.map((bucket) => {
			// eslint-disable-next-line camelcase
			const { doc_count, key, [fieldName]: hitsData } = bucket;
			return {
				_doc_count: doc_count,
				_key: key[fieldName],
				...(hitsData && hitsData.hits.hits[0]),
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
