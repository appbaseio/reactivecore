import { SET_MAP_DATA } from '../constants';
import { executeQuery } from './query';
import { setInternalValue } from './value';
import { getInternalComponentID } from '../utils/transform';

export function updateMapData(componentId, query, persistMapQuery) {
	return {
		type: SET_MAP_DATA,
		componentId,
		query,
		persistMapQuery,
	};
}

export function setMapData(componentId, query, persistMapQuery, forceExecute, meta = {}) {
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
			dispatch(executeQuery(componentId, executeWatchList, mustExecuteMapQuery));
		}
	};
}
