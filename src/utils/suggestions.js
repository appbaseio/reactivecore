// flattens a nested array
const flatten = arr => (
	arr.reduce((flat, toFlatten) =>
		flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten), [])
);

const extractSuggestion = (val) => {
	switch (typeof val) {
		case 'string':
			return val.toLowerCase();
		case 'object':
			if (Array.isArray(val)) {
				return flatten(val);
			}
			return null;

		default:
			return val;
	}
};

const getSuggestions = (fields, suggestions, currentValue, suggestionProperties = []) => {
	let suggestionsList = [];
	let labelsList = [];

	const populateSuggestionsList = (val, source) => {
		// check if the suggestion includes the current value
		// and not already included in other suggestions
		const isWordMatch = currentValue.trim().split(' ').some(term => String(val).includes(term));
		if (isWordMatch && !labelsList.includes(val)) {
			const defaultOption = {
				label: val,
				value: val,
				source,
			};

			let additionalKeys = {};
			if (Array.isArray(suggestionProperties) && suggestionProperties.length > 0) {
				suggestionProperties.forEach((prop) => {
					if (source.hasOwnProperty(prop)) {
						additionalKeys = {
							...additionalKeys,
							[prop]: source[prop],
						};
					}
				});
			}

			const option = {
				...defaultOption,
				...additionalKeys,
			};
			labelsList = [...labelsList, val];
			suggestionsList = [...suggestionsList, option];
		}
	};

	const parseField = (source, field) => {
		if (typeof source === 'object') {
			const fieldNodes = field.split('.');
			const label = source[fieldNodes[0]];
			if (label) {
				if (fieldNodes.length > 1) {
					// nested fields of the 'foo.bar.zoo' variety
					const children = field.substring(fieldNodes[0].length + 1);
					if (Array.isArray(label)) {
						label.forEach((arrayItem) => { parseField(arrayItem, children); });
					} else {
						parseField(label, children);
					}
				} else {
					const val = extractSuggestion(label);
					if (val) {
						if (Array.isArray(val)) {
							val.forEach(suggestion => populateSuggestionsList(suggestion, source));
						} else {
							populateSuggestionsList(val, source);
						}
					}
				}
			}
		}
	};

	suggestions.forEach((item) => {
		fields.forEach((field) => { parseField(item._source, field); });
	});

	return suggestionsList;
};

export default getSuggestions;
