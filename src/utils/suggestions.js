import diacritics from './diacritics';

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
	let str = s ? String(s) : '';

	for (let i = 0; i < str.length; i++) {
		const currentChar = str.charAt(i);
		if (diacritics[currentChar]) {
			str = str.replaceAll(currentChar, diacritics[currentChar]);
		}
	}

	return str;
}

function escapeRegExp(string = '') {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const getPredictiveSuggestions = ({ suggestions, currentValue, wordsToShowAfterHighlight }) => {
	const suggestionMap = {};
	if (currentValue) {
		const currentValueTrimmed = currentValue.trim();
		const parsedSuggestion = suggestions.reduce((agg, { label, ...rest }) => {
			// to handle special strings with pattern '<mark>xyz</mark> <a href="test'
			const parsedContent = new DOMParser().parseFromString(label, 'text/html')
				.documentElement.textContent;

			// to match the partial start of word.
			// example if searchTerm is `select` and string contains `selected`
			let regexString = `^(${escapeRegExp(currentValueTrimmed)})\\w+`;
			let regex = new RegExp(regexString, 'i');
			let regexExecution = regex.exec(parsedContent);
			// if execution value is null it means either there is no match or there are chances
			// that exact word is present
			if (!regexExecution) {
				// regex to match exact word
				regexString = `^(${escapeRegExp(currentValueTrimmed)})`;
				regex = new RegExp(regexString, 'i');
				regexExecution = regex.exec(parsedContent);
			}

			if (regexExecution) {
				const matchedString = parsedContent.slice(
					regexExecution.index,
					parsedContent.length,
				);
				const highlightedWord = matchedString
					.slice(currentValueTrimmed.length)
					.split(' ')
					.slice(0, wordsToShowAfterHighlight + 1)
					.join(' ');
				const suggestionPhrase = `${currentValueTrimmed}<mark class="highlight">${highlightedWord}</mark>`;
				const suggestionValue = `${currentValueTrimmed}${highlightedWord}`;
				// to show unique results only
				if (!suggestionMap[suggestionPhrase]) {
					suggestionMap[suggestionPhrase] = 1;
					return [
						...agg,
						{
							...rest,
							label: suggestionPhrase,
							value: suggestionValue,
							isPredictiveSuggestion: true,
						},
					];
				}

				return agg;
			}

			return agg;
		}, []);

		return parsedSuggestion;
	}

	return [];
};

const getSuggestions = ({
	fields,
	suggestions,
	currentValue,
	suggestionProperties = [],
	showDistinctSuggestions = false,
	enablePredictiveSuggestions = false,
	wordsToShowAfterHighlight = 2,
	enableSynonyms,
}) => {
	/*
		fields: DataFields passed on Search Components
		suggestions: Raw Suggestions received from ES
		currentValue: Search Term
		skipWordMatch: Use to skip the word match logic, important for synonym
		showDistinctSuggestions: When set to true will only return 1 suggestion per document
	*/

	let suggestionsList = [];
	let labelsList = [];
	let skipWordMatch = false;

	const populateSuggestionsList = (val, parsedSource, source) => {
		// check if the suggestion includes the current value
		// and not already included in other suggestions
		const isWordMatch
			= skipWordMatch
			|| currentValue
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

			if (showDistinctSuggestions) {
				return true;
			}
		}

		return false;
	};

	const parseField = (parsedSource, field = '', source = parsedSource) => {
		if (typeof parsedSource === 'object') {
			const fieldNodes = field.split('.');
			let label = parsedSource[fieldNodes[0]];
			// To handle field names with dots
			// For example, if source has a top level field name is `user.name`
			// then it would extract the suggestion from parsed source
			if (parsedSource[field]) {
				const topLabel = parsedSource[field];
				const val = extractSuggestion(topLabel);
				if (val) {
					populateSuggestionsList(val, parsedSource, source);
				}
			}
			// if they type of field is array of strings
			// then we need to pick first matching value as the label
			if (Array.isArray(label)) {
				if (label.length > 1) {
					label = label.filter(i =>
						i
							&& i
								.toString()
								.toLowerCase()
								.includes(currentValue.toString().toLowerCase()));
				}
				label = label[0];
			}

			if (label) {
				if (fieldNodes.length > 1) {
					// nested fields of the 'foo.bar.zoo' variety
					const children = field.substring(fieldNodes[0].length + 1);
					parseField(label, children, source);
				} else {
					const val = extractSuggestion(label);
					if (val) {
						return populateSuggestionsList(val, parsedSource, source);
					}
				}
			}
		}
		return false;
	};

	const traverseSuggestions = () => {
		if (showDistinctSuggestions) {
			suggestions.forEach((item) => {
				fields.some(field => parseField(item, field));
			});
		} else {
			suggestions.forEach((item) => {
				fields.forEach((field) => {
					parseField(item, field);
				});
			});
		}
	};

	traverseSuggestions();

	if (suggestionsList.length < suggestions.length && !skipWordMatch && enableSynonyms) {
		/*
			When we have synonym we set skipWordMatch to false as it may discard
			the suggestion if word doesnt match term.
			For eg: iphone, ios are synonyms and on searching iphone isWordMatch
			in  populateSuggestionList may discard ios source which decreases no.
			of items in suggestionsList
		*/
		skipWordMatch = true;
		traverseSuggestions();
	}

	if (enablePredictiveSuggestions) {
		const predictiveSuggestions = getPredictiveSuggestions({
			suggestions: suggestionsList,
			currentValue,
			wordsToShowAfterHighlight,
		});
		suggestionsList = predictiveSuggestions;
	}
	return suggestionsList;
};

export default getSuggestions;
