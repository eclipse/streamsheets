/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const httpError = require('http-errors');
const { promisify } = require('util');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const Migration = require('../../utils/Migration');

const readFile = promisify(fs.readFile);

const readBackupFile = async (file) => {
	if (file && file.fieldname === 'restoreData') {
		const fileContent = await readFile(file.path, 'utf8');
		return JSON.parse(fileContent);
	}
	return null;
};

const isValidRestoreJson = (json) => json && json.graphs && json.streams && json.machines;
const isValid13RestoreJson = (json) =>
	json && json.graphs && json.machines && json.auth_user && json.datasources && !json.streams;

module.exports = class BackupRestoreRoutes {
	static async backup(request, response, next) {
		switch (request.method) {
			case 'GET':
				try {
					// Fix me
					const { db } = request.app.locals.RepositoryManager.machineRepository;
					const collections = await db.listCollections().toArray();
					const pendingEntries = collections
						.map((c) => c.name)
						.filter(name => !name.startsWith('system.'))
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
					const { db } = request.app.locals.RepositoryManager.machineRepository;
					const restoreJson = await readBackupFile(request.file);
					if (!isValidRestoreJson(restoreJson) && !isValid13RestoreJson(restoreJson)) {
						response.status(400).json({
							restored: false,
							message: 'Invalid restore data found in request.'
						});
						return;
					}

					const collections = await db.listCollections().toArray();

					const pendingCollectionDrop = collections
						.map((c) => c.name)
						.filter(name => !name.startsWith('system.'))
						.map((name) => db.collection(name).drop());

					await Promise.all(pendingCollectionDrop);

					// auth_ collections use ObjectId as _id
					const fixedAuthData = Object.entries(restoreJson)
						.filter(([collection]) => collection.startsWith('auth_'))
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
						.filter(([, documents]) => Array.isArray(documents) && documents.length > 0)
						.map(([collection, documents]) => db.collection(collection).insertMany(documents));
					await Promise.all(pendingInserts);

					if (isValid13RestoreJson(restoreJson)) {
						const migration = new Migration(db);
						await migration.migrateCollections();
					}

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
