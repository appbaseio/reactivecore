import fetch from 'cross-fetch';

const fetchGraphQL = (requestOptions) => {
	const {
		graphQLUrl, url, credentials, app, query, headers,
	} = requestOptions;
	const fetchUrl = credentials ? url.replace('//', `//${credentials}@`) : url;
	return fetch(graphQLUrl, {
		method: 'POST',
		body: `
			query{
				elastic77(host: "${fetchUrl}"){
					msearch(
						index: "${app}"
						body: ${JSON.stringify(query.map(item => JSON.stringify(item)))}
					)
				}
			}
		`,
		headers: {
			...headers,
			'Content-Type': 'application/graphql',
		},
	})
		.then(res => res.json())
		.then(jsonRes => jsonRes.data.elastic77.msearch)
		.catch((error) => {
			console.error(error);
		});
};

export default fetchGraphQL;
