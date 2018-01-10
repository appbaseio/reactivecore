import { PUSH_TO_STREAM_HITS, SET_STREAMING, REMOVE_COMPONENT } from '../constants';

export default function streamHitsReducer(state = {}, action) {
	if (action.type === PUSH_TO_STREAM_HITS) {
		let currentHits = state[action.component] || [];

		currentHits = currentHits.filter(item => item._id !== action.hit._id);

		return {
			...state,
			[action.component]: [action.hit, ...currentHits],
		};
	} else if (action.type === SET_STREAMING) {
		if (!action.status && state[action.component]) {
			const { [action.component]: del, ...obj } = state;
			return obj;
		}
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}

	return state;
}
