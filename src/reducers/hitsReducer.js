import { UPDATE_HITS, PUSH_TO_STREAM_HITS, REMOVE_COMPONENT } from '../constants';

export default function hitsReducer(state = {}, action) {
	if (action.type === UPDATE_HITS) {
		if (action.append) {
			return {
				...state,
				[action.component]: {
					hits: [...state[action.component].hits, ...action.hits],
					total: action.total,
					time: action.time,
				},
			};
		}
		return {
			...state,
			[action.component]: { hits: action.hits, total: action.total, time: action.time },
		};
	} else if (action.type === PUSH_TO_STREAM_HITS) {
		let { total } = state[action.component];

		if (action.hit._deleted) {
			total -= 1;
		} else if (!action.hit._updated) {
			total += 1;
		}

		return {
			...state,
			[action.component]: {
				...state[action.component],
				total,
			},
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
