const httpError = require('http-errors');
const { promisify } = require('util');
const fs = require('fs');
const { ObjectId } = require('mongodb');

const readFile = promisify(fs.readFile);

const readBackupFile = async (files) => {
	if (files && files.restoreData) {
		const {
			restoreData: { path }
		} = files;
		const fileContent = await readFile(path, 'utf8');
		return JSON.parse(fileContent);
	}
	return null;
};

const isValidRestoreJson = (json) =>
	json &&
	json.graphs &&
	json.streams &&
	json.auth_user &&
	json.auth_role &&
	json.auth_policy;

module.exports = class BackupRestoreRoutes {
	static async backup(request, response, next) {
		switch (request.method) {
			case 'GET':
				try {
					// Fix me
					const {
						db
					} = request.app.locals.RepositoryManager.machineRepository;
					const collections = await db.listCollections().toArray();
					const pendingEntries = collections
						.map((c) => c.name)
						.map(async (collection) => {
							const data = await db
								.collection(collection)
								.find()
								.toArray();
							return [collection, data];
						});

					const entries = await Promise.all(pendingEntries);

					const result = entries.reduce(
						(obj, [collection, data]) => ({
							...obj,
							[collection]: data
						}),
						{}
					);

					response.status(200).json(result);
				} catch (error) {
					next(error);
				}
				break;
			default:
				response.set('allow', 'GET');
				next(new httpError.MethodNotAllowed());
				break;
		}
	}

	static async restore(request, response, next) {
		switch (request.method) {
			case 'POST':
				try {
					// Fix me
					const {
						db
					} = request.app.locals.RepositoryManager.machineRepository;
					const restoreJson = await readBackupFile(request.files);
					if (!isValidRestoreJson(restoreJson)) {
						response.status(400).json({
							restored: false,
							message: 'Invalid restore data found in request.'
						});
						return;
					}
					const collections = await db.listCollections().toArray();

					const pendingCollectionDrop = collections
						.map((c) => c.name)
						.map((name) => db.collection(name).drop());

					await Promise.all(pendingCollectionDrop);

					// auth_ collections use ObjectId as _id
					const fixedAuthData = Object.entries(restoreJson)
						.filter(([collection]) =>
							collection.startsWith('auth_')
						)
						.map(([collection, docs]) => [
							collection,
							docs.map((d) => ({
								...d,
								_id: ObjectId(d._id)
							}))
						]);

					const fixedRestoreJson = fixedAuthData.reduce(
						(acc, [collection, docs]) => ({
							...acc,
							[collection]: docs
						}),
						restoreJson
					);

					const pendingInserts = Object.entries(fixedRestoreJson)
						.filter(
							([, documents]) =>
								Array.isArray(documents) && documents.length > 0
						)
						.map(([collection, documents]) =>
							db.collection(collection).insertMany(documents)
						);
					await Promise.all(pendingInserts);
					response.status(201).json({
						restored: true
					});
				} catch (error) {
					next(error);
				}
				break;
			default:
				response.set('allow', 'POST');
				next(new httpError.MethodNotAllowed());
				break;
		}
	}
};
