/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const CompoundRequestCommand = require('./CompoundRequestCommand');
const DeleteCellsCommand = require('./DeleteCellsCommand');
const PasteCellsCommand = require('./PasteCellsCommand');
const SetCellsCommand = require('./SetCellsCommand');
const SetCellLevelsCommand = require('./SetCellLevelsCommand');
const SetCellsPropertiesCommand = require('./SetCellsPropertiesCommand');

const { getCellRangesFromSelection, toCellsColsRows } = require('../utils');

const getSheet = (ranges) => (ranges[0] ? ranges[0].getSheet() : undefined);

const mapProperitesCommand = (type) => (ranges, map) => {
	const sheet = getSheet(ranges);
	const cellsColsRows = toCellsColsRows(ranges, sheet);
	const properties = { [type]: map };
	return new SetCellsPropertiesCommand(sheet, cellsColsRows, properties);
};
const mapDeleteCellContentCommand = (sheet, selref, action) => {
	// action: 'all', 'formats', 'values' (, 'formulas'??)
	if (action === 'values') {
		return new DeleteCellsCommand(sheet, selref);
	}
	const ranges = getCellRangesFromSelection(selref, sheet);
	const cellsColsRows = toCellsColsRows(ranges, sheet);
	const propsCmd = new SetCellsPropertiesCommand(sheet, cellsColsRows);
	if (action === 'all') {
		return new CompoundRequestCommand(sheet).add(new DeleteCellsCommand(sheet, selref)).add(propsCmd);
	}
	return action === 'formats' ? propsCmd : undefined;
};
const mapSetCellsCommand = (sheet, cellrefs /* , execute */) => new SetCellsCommand(sheet, cellrefs);
const mapSetCellLevelsCommand = (sheet, ranges, down) => new SetCellLevelsCommand(sheet, ranges, down);
const mapSetCellDataCommand = (sheet, cellref, expression /* , execute */) => {
	const descr = { reference: cellref };
	if (expression) {
		descr.value = expression.getValue();
		descr.formula = expression.hasFormula() ? expression.getFormula() : undefined;
	}
	return new SetCellsCommand(sheet, [descr]);
};

const MapCommands = {
	'command.CellAttributesCommand': mapProperitesCommand('attributes'),
	'command.DeleteCellContentCommand': mapDeleteCellContentCommand,
	'command.DeleteCellsCommand': mapDeleteCellContentCommand,
	'command.FormatCellsCommand': mapProperitesCommand('formats'),
	'command.SetCellsCommand': mapSetCellsCommand,
	'command.SetCellDataCommand': mapSetCellDataCommand,
	'command.SetCellLevelsCommand': mapSetCellLevelsCommand,
	'command.TextFormatCellsCommand': mapProperitesCommand('textFormats')
};
const Registry = {
	'command.server.DeleteCellsCommand': DeleteCellsCommand,
	'command.server.PasteCellsCommand': PasteCellsCommand,
	'command.server.SetCellsCommand': SetCellsCommand,
	'command.server.SetCellLevelsCommand': SetCellLevelsCommand,
	'command.server.SetCellsPropertiesCommand': SetCellsPropertiesCommand
};

const createCommand = (name, args) => {
	const Cmd = Registry[name];
	if (Cmd) return new Cmd(...args);
	const mapper = MapCommands[name];
	return mapper ? mapper(...args) : undefined;
};

const ServerCommandFactory = (basefactory) =>
	class extends basefactory {
		static createCommand(graph, data, viewer) {
			const cmd = data ? Registry[data.name] : undefined;
			return cmd
				? cmd.createFromObject(data, { graph, viewer, factory: this })
				: super.createCommand(graph, data, viewer);
		}
		static create(cmdname, ...args) {
			return createCommand(cmdname, args) || super.create(cmdname, ...args);
		}
	};

module.exports = ServerCommandFactory;
