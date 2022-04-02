import { componentTypes } from '../utils/constants';
import { isEqual } from '../utils/helper';
import {
	SET_VALUE,
	CLEAR_VALUES,
	PATCH_VALUE,
	SET_INTERNAL_VALUE,
	RESET_TO_DEFAULT,
} from '../constants';

export function setValue(
	component,
	value,
	label,
	showFilter,
	URLParams,
	componentType,
	category,
	meta,
) {
	return (dispatch, getState) => {
		const { urlValues } = getState();
		// set the value reference
		let reference;
		if (isEqual(urlValues[component], value)) {
			reference = 'URL';
		}
		dispatch({
			type: SET_VALUE,
			component,
			reference,
			value,
			label,
			showFilter,
			URLParams,
			componentType,
			category,
			meta,
		});
	};
}

export function resetValuesToDefault(clearAllBlacklistComponents) {
	return (dispatch, getState) => {
		const { selectedValues, props: componentProps } = getState();
		let defaultValues = {
			// componentName: defaultValue,
		};

		let valueToSet;
		Object.keys(selectedValues).forEach((component) => {
			if (
				!(
					Array.isArray(clearAllBlacklistComponents)
					&& clearAllBlacklistComponents.includes(component)
				)
			) {
				if (
					!componentProps[component]
					|| !componentProps[component].componentType
					|| !componentProps[component].defaultValue
				) {
					valueToSet = null;
				} else if (
					[
						componentTypes.rangeSlider,
						componentTypes.rangeInput,
						componentTypes.ratingsFilter,
						componentTypes.dateRange,
					].includes(componentProps[component].componentType)
				) {
					valueToSet
						= typeof componentProps[component].defaultValue === 'object'
							? [
								componentProps[component].defaultValue.start,
								componentProps[component].defaultValue.end,
							  ]
							: null;
				} else if (
					[
						componentTypes.multiDropdownList,
						componentTypes.multiDataList,
						componentTypes.multiList,
						componentTypes.singleDataList,
						componentTypes.singleDropdownList,
						componentTypes.singleList,
						componentTypes.tagCloud,
						componentTypes.toggleButton,
						componentTypes.multiDropdownRange,
						componentTypes.multiRange,
						componentTypes.singleDropdownRange,
						componentTypes.singleRange,
						componentTypes.dataSearch,
						componentTypes.datePicker,
					].includes(componentProps[component].componentType)
				) {
					valueToSet = componentProps[component].defaultValue;
				} else if (
					[componentTypes.categorySearch].includes(componentProps[component].componentType)
				) {
					valueToSet = componentProps[component].defaultValue
						? componentProps[component].defaultValue.term
						: '';
				}
				if (!isEqual(selectedValues[component].value, valueToSet)) {
					defaultValues = {
						...defaultValues,
						[component]: { ...selectedValues[component], value: valueToSet },
					};
				}
			}
		});
		dispatch({
			type: RESET_TO_DEFAULT,
			defaultValues,
		});
	};
}
export function setInternalValue(component, value, componentType, category, meta) {
	return {
		type: SET_INTERNAL_VALUE,
		component,
		value,
		componentType,
		category,
		meta,
	};
}
/**
 * Patches the properties of the component
 * @param {String} component
 * @param {Object} payload
 */
export function patchValue(component, payload) {
	return {
		type: PATCH_VALUE,
		component,
		payload,
	};
}
export function clearValues(resetValues = {}, clearAllBlacklistComponents = []) {
	return {
		type: CLEAR_VALUES,
		resetValues,
		clearAllBlacklistComponents,
	};
}
