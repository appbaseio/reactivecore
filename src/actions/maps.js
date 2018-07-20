import { SET_MAP_DATA } from '../constants';
import { executeQuery } from './query';

export function updateMapData(componentId, query, persistMapQuery) {
	return {
		type: SET_MAP_DATA,
		componentId,
		query,
		persistMapQuery,
	};
}

export function setMapData(componentId, query, persistMapQuery, forceExecute) {
	return (dispatch) => {
		dispatch(updateMapData(componentId, query, persistMapQuery));

		if (forceExecute) {
			const executeWatchList = false;
			// force execute the map query
			const mustExecuteMapQuery = true;
			dispatch(executeQuery(componentId, executeWatchList, mustExecuteMapQuery));
		}
	};
}
