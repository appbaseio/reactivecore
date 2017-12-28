import { UPDATE_HITS, SHIFT_HITS, REMOVE_COMPONENT } from '../constants';

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
	} else if (action.type === SHIFT_HITS) {
		let hits = (state[action.component] && state[action.component].hits) || [];

		if (action.updated) {
			hits = hits.filter(item => item._id !== action.hit._id);
			// appending {stream: true} to the hit - allowing user
			// to selectively react to streaming changes
			hits = [{ ...action.hit, stream: true }, ...hits];

			return {
				...state,
				[action.component]: {
					...state[action.component],
					hits,
				},
			};
		} else if (action.deleted) {
			hits = hits.filter(item => item._id !== action.hit._id);

			return {
				...state,
				[action.component]: {
					hits,
					total: state[action.component].total - 1,
					time: state[action.component].time,
				},
			};
		}

		return {
			...state,
			[action.component]: {
				hits: [{ ...action.hit, stream: true }, ...hits],
				total: state[action.component].total + 1,
				time: state[action.component].time,
			},
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
