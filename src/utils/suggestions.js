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

const getSuggestions = (fields, suggestions, currentValue) => {
	let suggestionsList = [];
	let labelsList = [];

	const populateSuggestionsList = (val) => {
		// check if the suggestion includes the current value
		// and not already included in other suggestions
		const isWordMatch = currentValue.trim().split(' ').some(term => val.includes(term));
		if (isWordMatch && !labelsList.includes(val)) {
			const option = {
				label: val,
				value: val,
			};
			labelsList = [...labelsList, val];
			suggestionsList = [...suggestionsList, option];
		}
	};

	const parseField = (source, field) => {
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
						val.forEach(suggestion => populateSuggestionsList(suggestion));
					} else {
						populateSuggestionsList(val);
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
