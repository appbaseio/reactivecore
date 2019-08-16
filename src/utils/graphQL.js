import fetch from 'cross-fetch';

const fetchGraphQL = (graphQLUrl, url, credentials, app, query) => {
	const fetchUrl = credentials ? url.replace('//', `//${credentials}@`) : url;
	return fetch(graphQLUrl, {
		method: 'POST',
		body: `
			query{
				elastic50(host: "${fetchUrl}"){
					msearch(
						index: "${app}"
						body: ${JSON.stringify(query.map(item => JSON.stringify(item)))}
					)
				}
			}
		`,
		headers: {
			'Content-Type': 'application/graphql',
		},
	})
		.then(res => res.json())
		.then(jsonRes => jsonRes.data.elastic50.msearch)
		.catch((error) => {
			console.error(error);
		});
};

export default fetchGraphQL;
