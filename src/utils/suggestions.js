// flattens a nested array
const flatten = arr =>
	arr.reduce(
		(flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten),
		[],
	);

const extractSuggestion = (val) => {
	switch (typeof val) {
		case 'string':
			return val;
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

	const getSourceValue = (id) => {
		const selectedItem = suggestions.find(item => item._id === id);
		return selectedItem._source;
	};

	const populateSuggestionsList = (val, source, id) => {
		// check if the suggestion includes the current value
		// and not already included in other suggestions
		const isWordMatch = currentValue
			.trim()
			.split(' ')
			.some(term =>
				String(val)
					.toLowerCase()
					.includes(term));
		if (isWordMatch && !labelsList.includes(val)) {
			const defaultOption = {
				label: val,
				value: val,
				source: getSourceValue(id),
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

	const parseField = (source, field, id) => {
		if (typeof source === 'object') {
			const fieldNodes = field.split('.');
			const label = source[fieldNodes[0]];
			if (label) {
				if (fieldNodes.length > 1) {
					// nested fields of the 'foo.bar.zoo' variety
					const children = field.substring(fieldNodes[0].length + 1);
					if (Array.isArray(label)) {
						label.forEach((arrayItem) => {
							parseField(arrayItem, children, id);
						});
					} else {
						parseField(label, children, id);
					}
				} else {
					const val = extractSuggestion(label);
					if (val) {
						if (Array.isArray(val)) {
							val.forEach(suggestion =>
								populateSuggestionsList(suggestion, source, id));
						} else {
							populateSuggestionsList(val, source, id);
						}
					}
				}
			}
		}
	};

	suggestions.forEach((item) => {
		const {
			_score, _index, _type, _id,
		} = item;
		fields.forEach((field) => {
			parseField(
				{
					...getSourceValue(_id),
					_id,
					_index,
					_score,
					_type,
				},
				field,
				_id,
			);
		});
	});

	return suggestionsList;
};

export default getSuggestions;
