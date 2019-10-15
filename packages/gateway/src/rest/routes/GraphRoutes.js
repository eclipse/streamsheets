module.exports = class GraphRoutes {
	static graphs(request, response, next) {
		// const { user } = request;
		const { graphRepository } = request.app.locals.RepositoryManager;
		// eslint-disable-next-line
		switch (request.method) {
		case 'GET':
			graphRepository.getGraphs()
				.then(graphs => graphs.map(graph => ({
					id: graph.id,
					href: `${request.baseUrl}/graphs/${graph.id}`,
					machineId: graph.machineId
				})))
				.then(graphs => response.status(200).json(graphs))
				.catch(next);
			break;
		case 'POST':
			graphRepository
				.saveGraph(request.body)
				.then(newGraph => response.status(201).json(newGraph))
				.catch(next);
			break;
		}
	}

	static graph(request, response, next) {
		// const { user } = request;
		const graphId = request.params.graphId;
		const { graphRepository } = request.app.locals.RepositoryManager;
		// eslint-disable-next-line
		switch (request.method) {
		case 'GET':
			graphRepository.findGraph(graphId)
				.then(graph => response.status(200).json(graph))
				.catch(next);
			break;
		// eslint-disable-next-line
		case 'PUT':
			const updatedGraph = request.body;
			graphRepository.updateGraph(graphId, updatedGraph)
				.then(() => graphRepository.findGraph(graphId))
				.then(graph => response.status(200).json(graph))
				.catch(next);
			break;
		case 'DELETE':
			graphRepository.deleteGraph(graphId)
				.then(() => response.status(204).json())
				.catch(next);
			break;
		}
	}
};
