const fetchGraphQL = async (graphQLUrl, url, credentials, app, query) => {
	try {
		const fetchUrl = credentials ? url.replace('//', `//${credentials}@`) : url;
		const response = await fetch(graphQLUrl, {
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
		}).then(res => res.json());

		return response.data.elastic50.msearch;
	} catch (err) {
		throw err;
	}
};

export default fetchGraphQL;
