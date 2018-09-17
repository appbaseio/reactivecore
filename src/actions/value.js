import { SET_VALUE, CLEAR_VALUES } from '../constants';

export function setValue(component, value, label, showFilter, URLParams, componentType) {
	return {
		type: SET_VALUE,
		component,
		value,
		label,
		showFilter,
		URLParams,
		componentType,
	};
}

export function clearValues() {
	return {
		type: CLEAR_VALUES,
	};
}
