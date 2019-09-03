import { SET_MAP_ON_TOP_MARKER } from '../constants';

export default function mapOnTopMarkerReducer(state = null, action) {
	switch (action.type) {
		case SET_MAP_ON_TOP_MARKER:
			return action.markerId;
		default:
			return state;
	}
}
