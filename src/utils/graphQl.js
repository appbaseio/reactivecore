const fetchGraphQl = async (graphQlUrl, url, credentials, app, query) => {
	try {
		const response = await fetch(graphQlUrl, {
			method: 'POST',
			body: `
				query{
					elastic50(host: "${url.replace('//', `//${credentials}@`)}"){
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

export default fetchGraphQl;
