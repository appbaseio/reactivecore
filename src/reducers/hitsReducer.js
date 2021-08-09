import { UPDATE_HITS, REMOVE_COMPONENT } from '../constants';

export default function hitsReducer(state = {}, action) {
	if (action.type === UPDATE_HITS) {
		if (action.append) {
			return {
				...state,
				[action.component]: {
					hits: [...state[action.component].hits, ...action.hits],
					total: action.total,
					time: action.time,
					hidden: action.hidden || 0,
				},
			};
		}
		return {
			...state,
			[action.component]: {
				hits: action.hits,
				total: action.total,
				time: action.time,
				hidden: action.hidden || 0,
			},
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
