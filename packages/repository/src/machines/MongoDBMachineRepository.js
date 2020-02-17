'use strict';

const { mix } = require('mixwith');
const { Errors, CODES } = require('@cedalo/error-codes');

const AbstractMachineRepository = require('./AbstractMachineRepository');
const MongoDBMixin = require('../mongoDB/MongoDBMixin');

const COLLECTION = 'machines';

const MACHINE = {
	id: 'base_machine',
	name: 'Base Machine',
	isTemplate: true,
	streamsheets: []
};

const reduceCells = (cells) =>
	cells.reduce((acc, descr) => {
		const { reference } = descr;
		if (reference) acc[reference] = descr;
		return acc;
	}, {});


const deleteProps = (...props) => (obj) => props.forEach((prop) => delete obj[prop]);

const deleteCellProps = deleteProps('reference', 'info');
const deleteMachineProps = deleteProps('outbox', 'functionDefinitions', 'functionsHelp', 'stats');
const deleteStreamSheetProps = deleteProps('stats');
const deleteInboxProps = deleteProps('messages', 'currentMessage');
const deleteLoopProps = deleteProps('currentPath', 'index');


const deletePropsFromCells = (cells) => {
	Object.values(cells).forEach((cell) => deleteCellProps(cell));
	return cells;
};

const checkStreamSheetCells = (streamsheet) => {
	let cells = streamsheet.sheet && streamsheet.sheet.cells;
	cells = (cells && Array.isArray(cells)) ? reduceCells(streamsheet.sheet.cells) : cells;
	streamsheet.sheet.cells = deletePropsFromCells(cells);
};
const isValid = (machine) => !!(machine && machine.id);
const checkAndTransformMachine = (machine) => {
	if (isValid(machine)) {
		deleteMachineProps(machine);
		machine.streamsheets.forEach(streamsheet => {
			checkStreamSheetCells(streamsheet);
			deleteStreamSheetProps(streamsheet);
			deleteInboxProps(streamsheet.inbox);
			deleteLoopProps(streamsheet.loop);
		});
		return machine;
	}
	return undefined;
};

const isEmptyCell = (celldescr) =>
	celldescr.formula == null && celldescr.value == null;

/**
 * An machine repository which stores the machines in a MongoDB.
 *
 * @class MongoDBMachineRepository
 * @extends AbstractMachineRepository
 * @public
 */
module.exports = class MongoDBMachineRepository extends mix(
	AbstractMachineRepository
).with(MongoDBMixin) {
	constructor(config = {}) {
		super(config);
		this.collection = this.config.collection || COLLECTION;
	}

	setMongoId(obj) {
		super.setMongoId(obj);
		return obj;
	}

	count() {
		return super.count(this.collection);
	}

	saveMachine(machine) {
		machine = checkAndTransformMachine(machine);
		if (machine) {
			this.setMongoId(machine);
			return this.insertDocument(this.collection, machine);
		}
		return Promise.reject(new Error('Wrong machine definition!'));
	}

	saveMachines(machines = []) {
		const toSave = machines
			.filter((machine) => checkAndTransformMachine(machine))
			.map((machine) => this.setMongoId(machine));
		return this.insertDocuments(this.collection, toSave);
	}

	findMachine(id, filter, projection) {
		// TODO refactor template handling!!!
		const template = id === MACHINE.id ? MACHINE : undefined;
		return template
			? Promise.resolve(template)
			: this.getDocument(this.collection, id, filter, projection)
					// mongo-db might return null if it could not find requested machine...
					.then((res) =>
						res
							? Promise.resolve(res)
							: Promise.reject(
									Errors.createInternal(
										CODES.MACHINE_NOT_FOUND
									)
							  )
					)
					.catch(() =>
						Promise.reject(
							Errors.createInternal(CODES.MACHINE_NOT_FOUND)
						)
					);
	}

	findMachineByName(name, projection) {
		return this.getDocuments(this.collection, { name }, projection).then(
			(r) => {
				const machine = r && r.length > 0 ? r[0] : null;
				return Promise.resolve(machine);
			}
		);
	}

	async machineWithNameExists(name) {
		const machine = await this.findMachineByName(name);
		return machine != null;
	}

	// returns an array of machine definitions...
	getMachines() {
		return this.getDocuments(
			this.collection,
			{},
			{},
			{
				name: 1
			}
		);
	}

	findMachines(criteria = {}) {
		return this.getDocuments(this.collection, criteria);
	}

	findMachinesByName(name) {
		return this.getDocuments(this.collection, { name });
	}

	updateMachine(id, machineDefinition) {
		// return this.updateDocument(this.collection, id, machine);
		machineDefinition = checkAndTransformMachine(machineDefinition);
		if (machineDefinition) {
			return this.replaceDocument(this.collection, id, machineDefinition);
		}
		return Promise.reject(new Error('Wrong machine definition!'));
	}

	// updateMachineSettings(id, settings) {
	// 	const { cycletime, isOPCUA, locale, name } = settings;
	// 	return this.updateDocument(this.collection, id, { cycletime, isOPCUA, locale, name });
	// }

	saveOrUpdateMachine(id, machineDefinition) {
		machineDefinition = checkAndTransformMachine(machineDefinition);
		if (machineDefinition) {
			return this.upsertDocument(
				this.collection,
				{ _id: id },
				machineDefinition
			);
		}
		return Promise.reject(new Error('Wrong machine definition!'));
	}

	updateMachineName(id, name) {
		return this.updateDocument(this.collection, id, { name });
	}

	updateMachineLocale(id, locale) {
		return this.updateDocument(this.collection, id, { 'settings.locale': locale });
	}

	updateMachineCycleTime(id, cycletime) {
		return this.updateDocument(this.collection, id, { 'settings.cycletime': cycletime });
	}
	updateMachineOPCUA(id, isOPCUA) {
		return this.updateDocument(this.collection, id, { 'settings.isOPCUA': isOPCUA });
	}

	updateMachinePreviewImage(id, previewImage) {
		return this.updateDocument(this.collection, id, { previewImage });
	}

	updateMachineTitleImage(id, titleImage) {
		return this.updateDocument(this.collection, id, { titleImage });
	}

	addStreamSheet(machineId, streamsheet) {
		const selector = { _id: machineId };
		checkStreamSheetCells(streamsheet);
		return this.db
			.collection(this.collection)
			.updateOne(selector, { $push: { streamsheets: streamsheet } })
			.then((resp) => resp.result && resp.result.ok);
	}

	deleteStreamSheet(machineId, streamsheetId) {
		const selector = { _id: machineId };
		const pull = {};
		pull.streamsheets = { id: streamsheetId };
		return this.db
			.collection(this.collection)
			.updateOne(selector, { $pull: pull })
			.then((resp) => resp.result && resp.result.ok);
	}

	// seems to be deprecated...
	updateStreamSheetStreams(machineId, streamsheetId, stream) {
		const selector = { _id: machineId, 'streamsheets.id': streamsheetId };
		const update = {};
		update.$set = {};
		update.$set['streamsheets.$.inbox.stream'] = stream;
		return this.db
			.collection(this.collection)
			.updateOne(selector, update)
			.then((resp) => resp.result && resp.result.ok);
	}

	updateStreamSheetSettings(streamsheetId, machine) {
		// save complete machine, because changing streamsheet settings might changed cells formula!
		machine = checkAndTransformMachine(machine);
		if (machine) {
			return this.replaceDocument(this.collection, machine.id, machine);
		}
		return Promise.reject(new Error('Wrong machine definition!'));
	}

	updateMachineState(id, state) {
		return this.updateDocument(this.collection, id, { state });
	}

	updateMachineLastModified(id, timestamp, user) {
		const set = {
			'metadata.lastModified': timestamp,
			'metadata.lastModifiedBy': user,
		}
		return this.updateDocument(this.collection, id, set);
	}

	updateMachineNamedCells(id, namedCells = {}) {
		return this.updateDocument(this.collection, id, { namedCells });
	}

	updateCell(machineId, streamsheetId, cellDescriptor) {
		const { reference, formula, value, type } = cellDescriptor;
		if (!reference || (!formula && !type && !value)) {
			return Promise.reject(
				new Error('Failed to update cell: wrong cell descriptor!')
			);
		}
		const delIt = isEmptyCell(cellDescriptor);
		const selector = { _id: machineId, 'streamsheets.id': streamsheetId };
		const update = {};
		if (delIt) {
			update.$unset = {};
			update.$unset[`streamsheets.$.sheet.cells.${reference}`] = '';
		} else {
			deleteCellProps(cellDescriptor);
			update.$set = {};
			update.$set[
				`streamsheets.$.sheet.cells.${reference}`
			] = cellDescriptor;
		}
		return this.db
			.collection(this.collection)
			.updateOne(selector, update)
			.then((resp) => resp.result && resp.result.ok);
	}

	partiallyUpdateCells(machineId, streamsheetId, cells) {
		const selector = { _id: machineId, 'streamsheets.id': streamsheetId };
		deletePropsFromCells(cells);
		const update = {
			$set: Object.entries(cells).reduce(
				(obj, [reference, descr]) => ({
					...obj,
					[`streamsheets.$.sheet.cells.${reference}`]: descr
				}),
				{}
			)
		};
		return this.db
			.collection(this.collection)
			.updateOne(selector, update)
			.then((resp) => resp.result && resp.result.ok);
	}

	updateCells(machineId, streamsheetId, cells) {
		const selector = { _id: machineId, 'streamsheets.id': streamsheetId };
		const update = {};
		update.$set = {};
		update.$set['streamsheets.$.sheet.cells'] = deletePropsFromCells(cells);
		return this.db
			.collection(this.collection)
			.updateOne(selector, update)
			.then((resp) => resp.result && resp.result.ok);
	}

	updateStreamSheet(
		machineId,
		streamsheetId,
		{ cells = {}, namedCells = {}, graphCells = {} } = {}
	) {
		const selector = { _id: machineId, 'streamsheets.id': streamsheetId };
		const update = {};
		update.$set = {};
		update.$set['streamsheets.$.sheet.cells'] = deletePropsFromCells(cells);
		update.$set['streamsheets.$.sheet.namedCells'] = namedCells;
		update.$set['streamsheets.$.sheet.graphCells'] = graphCells;
		return this.db
			.collection(this.collection)
			.updateOne(selector, update)
			.then((resp) => resp.result && resp.result.ok);
	}
	updateSheet(machineId, streamsheetId, sheetdef = {}) {
		const { cells, namedCells, graphCells, properties } = sheetdef;
		const selector = { _id: machineId, 'streamsheets.id': streamsheetId };
		const update = {};
		update.$set = {};
		if (cells) update.$set['streamsheets.$.sheet.cells'] = deletePropsFromCells(cells);
		if (properties) update.$set['streamsheets.$.sheet.properties'] = properties;
		if (namedCells)	update.$set['streamsheets.$.sheet.namedCells'] = namedCells;
		if (graphCells)	update.$set['streamsheets.$.sheet.graphCells'] = graphCells;
		return this.db
			.collection(this.collection)
			.updateOne(selector, update)
			.then((resp) => resp.result && resp.result.ok);
	}

	deleteCells(machineId, streamsheetId, cellDescriptors = []) {
		const cells = 'streamsheets.$.sheet.cells.';
		const selector = { _id: machineId, 'streamsheets.id': streamsheetId };
		const unset = {};
		cellDescriptors.forEach((descr) => {
			unset[`${cells}${descr.reference}`] = '';
		});
		return this.db
			.collection(this.collection)
			.updateOne(selector, { $unset: unset })
			.then((resp) => resp.result && resp.result.ok);
	}

	updateSheetNamedCells(machineId, streamsheetId, namedCells = {}) {
		const update = { $set: {} };
		const selector = { _id: machineId, 'streamsheets.id': streamsheetId };
		update.$set['streamsheets.$.sheet.namedCells'] = namedCells;
		return this.db
			.collection(this.collection)
			.updateOne(selector, update)
			.then((resp) => resp.result && resp.result.ok);
	}

	updateGraphNamedCells(machineId, streamsheetId, graphCells = {}) {
		const update = { $set: {} };
		const selector = { _id: machineId, 'streamsheets.id': streamsheetId };
		update.$set['streamsheets.$.sheet.graphCells'] = graphCells;
		return this.db
			.collection(this.collection)
			.updateOne(selector, update)
			.then((resp) => resp.result && resp.result.ok);
	}

	// resolves with true if machines was deleted...
	deleteMachine(id) {
		return this.deleteDocument(this.collection, id);
	}

	// resolves with true if all machines were deleted...
	deleteAllMachines() {
		return this.deleteAllDocuments(this.collection);
	}

	existsMachine(id) {
		return this.exists(this.collection, id).catch((error) => {
			if (error.isSemantic) {
				Object.assign(
					error,
					Errors.createInternal(CODES.MACHINE_NOT_FOUND)
				);
			}
			return Promise.reject(error);
		});
	}

	async ensureScope(scope) {
		return this.db.collection(this.collection).updateMany({ scope: { $exists: false } }, { $set: { scope } });
	}

	async updateStreams(stream) {
		const selector = { 'streamsheets.inbox.stream.id': stream.id };
		const update = {};
		update.$set = {};
		update.$set['streamsheets.$.inbox.stream.name'] = stream.name;
		update.$set['streamsheets.$.inbox.stream.id'] = stream.id;
		return this.db
			.collection(this.collection)
			.updateOne(selector, update)
			.then((resp) => resp.result && resp.result.ok);
	}
};
