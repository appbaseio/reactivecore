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

const getSuggestions = (fields, suggestions, suggestionProperties = []) => {
	let suggestionsList = [];
	let labelsList = [];

	const populateSuggestionsList = (val, parsedSource, source) => {
		// check if the suggestion includes the current value
		// and not already included in other suggestions
		if (!labelsList.includes(val)) {
			const defaultOption = {
				label: val,
				value: val,
				source,
			};
			let additionalKeys = {};
			if (Array.isArray(suggestionProperties) && suggestionProperties.length > 0) {
				suggestionProperties.forEach((prop) => {
					if (Object.prototype.hasOwnProperty.call(parsedSource, prop)) {
						additionalKeys = {
							...additionalKeys,
							[prop]: parsedSource[prop],
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

	const parseField = (parsedSource, field, source = parsedSource) => {
		if (typeof parsedSource === 'object') {
			const fieldNodes = field.split('.');
			const label = parsedSource[fieldNodes[0]];
			if (label) {
				if (fieldNodes.length > 1) {
					// nested fields of the 'foo.bar.zoo' variety
					const children = field.substring(fieldNodes[0].length + 1);
					if (Array.isArray(label)) {
						label.forEach((arrayItem) => {
							parseField(arrayItem, children, source);
						});
					} else {
						parseField(label, children, source);
					}
				} else {
					const val = extractSuggestion(label);
					if (val) {
						if (Array.isArray(val)) {
							val.forEach(suggestion =>
								populateSuggestionsList(suggestion, parsedSource, source));
						} else {
							populateSuggestionsList(val, parsedSource, source);
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

		const source = {
			...item._source,
			_id,
			_index,
			_score,
			_type,
		};
		fields.forEach((field) => {
			parseField(source, field);
		});
	});

	return suggestionsList;
};

export default getSuggestions;
