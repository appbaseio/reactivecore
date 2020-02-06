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

function replaceDiacritics(s) {
	let str = s ? String(s) : s;

	const diacritics = [
		/[\300-\306]/g, /[\340-\346]/g, // A, a
		/[\310-\313]/g, /[\350-\353]/g, // E, e
		/[\314-\317]/g, /[\354-\357]/g, // I, i
		/[\322-\330]/g, /[\362-\370]/g, // O, o
		/[\331-\334]/g, /[\371-\374]/g, // U, u
		/[\321]/g, /[\361]/g, // N, n
		/[\307]/g, /[\347]/g, // C, c
	];

	const chars = ['A', 'a', 'E', 'e', 'I', 'i', 'O', 'o', 'U', 'u', 'N', 'n', 'C', 'c'];

	for (let i = 0; i < diacritics.length; i += 1) {
		str = str.replace(diacritics[i], chars[i]);
	}

	return str;
}

const getSuggestions = (
	fields,
	suggestions,
	currentValue,
	suggestionProperties = [],
	skipWordMatch = false,
) => {
	let suggestionsList = [];
	let labelsList = [];

	const populateSuggestionsList = (val, parsedSource, source) => {
		// check if the suggestion includes the current value
		// and not already included in other suggestions
		const isWordMatch = skipWordMatch || currentValue
			.trim()
			.split(' ')
			.some(term =>
				replaceDiacritics(val)
					.toLowerCase()
					.includes(replaceDiacritics(term)));
		// promoted results should always include in suggestions even there is no match
		if ((isWordMatch && !labelsList.includes(val)) || source._promoted) {
			const defaultOption = {
				label: val,
				value: val,
				source,
			};
			let additionalKeys = {};
			if (Array.isArray(suggestionProperties) && suggestionProperties.length > 0) {
				suggestionProperties.forEach((prop) => {
					if (parsedSource.hasOwnProperty(prop)) {
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
		fields.forEach((field) => {
			parseField(item, field);
		});
	});

	if (suggestionsList.length < suggestions.length) {
		/*
			When we have synonym we set skipWordMatch to false as it may discard
			the suggestion if word doesnt match term.
			For eg: iphone, ios are synonyms and on searching iphone isWordMatch
			in  populateSuggestionList may discard ios source which decreases no.
			of items in suggestionsList
		*/
		return getSuggestions(
			fields,
			suggestions,
			currentValue,
			suggestionProperties,
			true,
		);
	}

	return suggestionsList;
};

export default getSuggestions;
