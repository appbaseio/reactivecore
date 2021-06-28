import XDate from 'xdate';
import { componentTypes } from '../../lib/utils/constants';
import { isEqual } from '../../lib/utils/helper';
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
	return {
		type: SET_VALUE,
		component,
		value,
		label,
		showFilter,
		URLParams,
		componentType,
		category,
		meta,
	};
}

export function resetValuesToDefault() {
	return (dispatch, getState) => {
		const { selectedValues, props: componentProps } = getState();
		let defaultValues = {
			// componentName: defaultValue,
		};

		let valueToSet;
		Object.keys(selectedValues).forEach((component) => {
			if (
				!componentProps[component]
				|| !componentProps[component].defaultValue
				|| !componentProps[component].componentType
			) {
				return true;
			}
			if (
				[componentTypes.rangeSlider, componentTypes.ratingsFilter]
					.includes(componentProps[component].componentType)
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
			} else if (
				[componentTypes.dateRange].includes(componentProps[component].componentType)
			) {
				const formatInputDate = (date) => {
					const xdate = new XDate(date);
					return xdate.valid() ? xdate.toString('yyyy-MM-dd') : '';
				};
				valueToSet = [
					formatInputDate(componentProps[component].defaultValue.start),
					formatInputDate(componentProps[component].defaultValue.end),
				];
			}
			if (!isEqual(selectedValues[component].value, valueToSet)) {
				defaultValues = {
					...defaultValues,
					[component]: { ...selectedValues[component], value: valueToSet },
				};
			}
			return true;
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
export function clearValues() {
	return {
		type: CLEAR_VALUES,
	};
}
