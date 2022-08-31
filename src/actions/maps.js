import { SET_MAP_DATA, SET_MAP_RESULTS } from '../constants';
import { executeQuery } from './query';
import { setInternalValue } from './value';
import { getInternalComponentID } from '../utils/transform';
import { componentTypes } from '../utils/constants';

export function updateMapData(componentId, query, persistMapQuery) {
	return {
		type: SET_MAP_DATA,
		componentId,
		query,
		persistMapQuery,
	};
}

export function setMapData(
	componentId,
	query,
	persistMapQuery,
	forceExecute,
	meta = {},
	// A unique identifier for map query to recognize the results for latest requests
	queryId = '',
) {
	return (dispatch) => {
		dispatch(updateMapData(componentId, query, persistMapQuery));
		// Set meta properties for internal component to make geo bounding box work
		dispatch(setInternalValue(
			getInternalComponentID(componentId),
			undefined,
			undefined,
			undefined,
			meta,
		));
		if (forceExecute) {
			const executeWatchList = false;
			// force execute the map query
			const mustExecuteMapQuery = true;
			dispatch(executeQuery(
				componentId,
				executeWatchList,
				mustExecuteMapQuery,
				componentTypes.reactiveMap,
				{},
				queryId,
			));
		}
	};
}

export function setMapResults(componentId, { center, zoom, markers }) {
	return {
		type: SET_MAP_RESULTS,
		componentId,
		payload: {
			center,
			zoom,
			markers,
		},
	};
}
