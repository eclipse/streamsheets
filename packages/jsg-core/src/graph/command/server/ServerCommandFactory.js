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

const Registry = {
	'command.server.DeleteCellsCommand': DeleteCellsCommand,
	'command.server.PasteCellsCommand': PasteCellsCommand,
	'command.server.SetCellsCommand': SetCellsCommand,
	'command.server.SetCellLevelsCommand': SetCellLevelsCommand,
	'command.server.SetCellsPropertiesCommand': SetCellsPropertiesCommand
};

const ServerCommandFactory = (basefactory) =>
	class extends basefactory {
		static createCommand(graph, data, viewer) {
			const cmd = data ? Registry[data.name] : undefined;
			return cmd
				? cmd.createFromObject(data, { graph, viewer, factory: this })
				: super.createCommand(graph, data, viewer);
		}

		static createPropertiesCommand(ranges, propsmap, propstype) {
			propstype = propstype === 'border' ? 'formats' : propstype;
			const sheet = ranges[0] ? ranges[0].getSheet() : undefined;
			const cellsColsRows = toCellsColsRows(ranges, sheet);
			const properties = propstype ? { [propstype]: propsmap } : propsmap;
			return new SetCellsPropertiesCommand(sheet, cellsColsRows, properties);
		}

		static createSetCellLevelsCommand(sheet, ranges, down) {
			return new SetCellLevelsCommand(sheet, ranges, down);
		}

		static createDeleteCellsCommand(type, sheet, selref, action) {
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
		}

		static createSetCellsCommand(sheet, cellrefs /* , execute */) {
			return new SetCellsCommand(sheet, cellrefs);
		}
		static createSetCellDataCommand(sheet, cellref, expression /* , execute */) {
			const descr = { reference: cellref };
			if (expression) {
				descr.value = expression.getValue();
				descr.formula = expression.hasFormula() ? expression.getFormula() : undefined;
			}
			return new SetCellsCommand(sheet, [descr]);
		}
	};

	module.exports = ServerCommandFactory;