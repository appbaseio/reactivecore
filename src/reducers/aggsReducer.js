import { UPDATE_AGGS, REMOVE_COMPONENT, UPDATE_COMPOSITE_AGGS } from '../constants';

function aggsReducer(state = {}, action) {
	if (action.type === UPDATE_AGGS) {
		if (action.append) {
			const field = Object.keys(state[action.component])[0];
			const { buckets: newBuckets, ...aggsData } = action.aggregations[field];
			// console.log('received aggs', action.aggregations);
			// eslint-disable-next-line
			// debugger;
			return {
				...state,
				[action.component]: {
					[field]: {
						buckets: [...state[action.component][field].buckets, ...newBuckets],
						...aggsData,
					},
				},
			};
		}
		return { ...state, [action.component]: action.aggregations };
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}

// get top hits from composite aggregations response
function compositeAggsReducer(state = {}, action) {
	if (action.type === UPDATE_COMPOSITE_AGGS) {
		const aggsResponse
			= Object.values(action.aggregations) && Object.values(action.aggregations)[0];
		if (!aggsResponse) return state;
		const buckets = aggsResponse.buckets || [];
		const parsedAggs = buckets.map((bucket) => {
			// eslint-disable-next-line camelcase
			const { doc_count, key } = bucket;
			const _key = Object.values(key) && Object.values(key)[0];
			const hits = Object.values(Object.values(bucket)[2])[0];
			return {
				_doc_count: doc_count,
				_key,
				...hits.hits[0],
			};
		});
		return {
			...state,
			[action.component]: parsedAggs,
		};
	}
	return state;
}

export { aggsReducer, compositeAggsReducer };
