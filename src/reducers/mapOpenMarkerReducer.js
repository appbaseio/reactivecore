import { SET_MAP_OPEN_MARKERS } from '../constants';

export default function mapOpenMarkerReducer(state = {}, action) {
	switch (action.type) {
		case SET_MAP_OPEN_MARKERS:
			return action.openMarkers;
		default:
			return state;
	}
}
