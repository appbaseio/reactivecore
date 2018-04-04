import { SET_MAP_DATA } from '../constants';
import { executeQuery } from './query';

export function updateMapData(componentId, query, mustExecute) {
	return {
		type: SET_MAP_DATA,
		componentId,
		query,
		mustExecute,
	};
}

export function setMapData(componentId, query, mustExecute) {
	return (dispatch) => {
		dispatch(updateMapData(componentId, query, mustExecute));
		dispatch(executeQuery(componentId));
	};
}
