import { UPDATE_AGGS, REMOVE_COMPONENT } from '../constants';

export default function aggsReducer(state = {}, action) {
	if (action.type === UPDATE_AGGS) {
		if (action.append) {
			const field = Object.keys(state[action.component])[0];
			const { buckets: newBuckets, ...aggsData } = action.aggregations[field];
			// console.log('received aggs', action.aggregations);
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
