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
const CommandFactory = require('./CommandFactory');
const SetCellDataCommand = require('./SetCellDataCommand');
const SetPlotDataCommand = require('./SetPlotDataCommand');
const SetChartFormulaCommand = require('./SetChartFormulaCommand');
const SetSheetCellsCommand = require('./SetSheetCellsCommand');
const SetCellsCommand = require('./SetCellsCommand');
const SetMachineCommand = require('./SetMachineCommand');
const LoadMachineCommand = require('./LoadMachineCommand');
const SetTreeDataCommand = require('./SetTreeDataCommand');
const SetTreeItemDataCommand = require('./SetTreeItemDataCommand');
const SetTreeItemDepthCommand = require('./SetTreeItemDepthCommand');
const SetTreeItemDisabledCommand = require('./SetTreeItemDisabledCommand');
const SetTreeShowDepthCommand = require('./SetTreeShowDepthCommand');
const SetTreeItemShowDepthCommand = require('./SetTreeItemShowDepthCommand');
const SetTreeItemExpandFlagCommand = require('./SetTreeItemExpandFlagCommand');
const SetTreeItemCheckedFlagCommand = require('./SetTreeItemCheckedFlagCommand');
const AddTreeItemCommand = require('./AddTreeItemCommand');
const DeleteTreeItemCommand = require('./DeleteTreeItemCommand');
const PasteTreeItemCommand = require('./PasteTreeItemCommand');
const SetHeaderSectionSizeCommand = require('./SetHeaderSectionSizeCommand');
const SetHeaderSectionLevelCommand = require('./SetHeaderSectionLevelCommand');
const CreateHeaderLevelsFromRangeCommand = require('./CreateHeaderLevelsFromRangeCommand');
const SetHeaderSectionOutlineFlagCommand = require('./SetHeaderSectionOutlineFlagCommand');
const PasteCellsFromClipboardCommand = require('./PasteCellsFromClipboardCommand');
const DeleteCellContentCommand = require('./DeleteCellContentCommand');
const InsertCellsCommand = require('./InsertCellsCommand');
const DeleteCellsCommand = require('./DeleteCellsCommand');
const CellRange = require('../model/CellRange');
const SheetName = require('../model/SheetName');
const AddSheetNameCommand = require('./AddSheetNameCommand');
const SetSheetNameCommand = require('./SetSheetNameCommand');
const DeleteSheetNameCommand = require('./DeleteSheetNameCommand');
const AddGraphCellCommand = require('./AddGraphCellCommand');
const SetGraphCellCommand = require('./SetGraphCellCommand');
const DeleteGraphCellCommand = require('./DeleteGraphCellCommand');
const CellAttributesCommand = require('./CellAttributesCommand');
const FormatCellsCommand = require('./FormatCellsCommand');
const FormatCellsCommandWC = require('./FormatCellsCommandWC');
const SetCellLevelsCommand = require('./SetCellLevelsCommand');
const TextFormatCellsCommand = require('./TextFormatCellsCommand');
const MarkCellValuesCommand = require('./MarkCellValuesCommand');
const ZoomChartCommand = require('./ZoomChartCommand');
const {
	UpdateSheetNamesCommand,
	UpdateGraphCellsCommand,
	SetGraphCellsCommand,
	SetGraphItemsCommand
} = require('./UpdateNamesCommands');

const Registry = {
	'command.UpdateSheetNamesCommand': UpdateSheetNamesCommand,
	'command.UpdateGraphCellsCommand': UpdateGraphCellsCommand,
	'command.SetGraphCellsCommand': SetGraphCellsCommand,
	'command.SetGraphItemsCommand': SetGraphItemsCommand,
	'command.SetCellDataCommand': SetCellDataCommand,
	'command.SetPlotDataCommand': SetPlotDataCommand,
	'command.SetChartFormulaCommand': SetChartFormulaCommand,
	'command.SetSheetCellsCommand': SetSheetCellsCommand,
	'command.SetCellsCommand': SetCellsCommand,
	'command.SetMachineCommand': SetMachineCommand,
	'command.LoadMachineCommand': LoadMachineCommand,
	'command.SetTreeDataCommand': SetTreeDataCommand,
	'command.SetTreeItemDataCommand': SetTreeItemDataCommand,
	'command.SetTreeItemDepthCommand': SetTreeItemDepthCommand,
	'command.SetTreeItemDisabledCommand': SetTreeItemDisabledCommand,
	'command.SetTreeShowDepthCommand': SetTreeShowDepthCommand,
	'command.SetTreeItemShowDepthCommand': SetTreeItemShowDepthCommand,
	'command.SetTreeItemExpandFlagCommand': SetTreeItemExpandFlagCommand,
	'command.SetTreeItemCheckedFlagCommand': SetTreeItemCheckedFlagCommand,
	'command.AddTreeItemCommand': AddTreeItemCommand,
	'command.DeleteTreeItemCommand': DeleteTreeItemCommand,
	'command.PasteTreeItemCommand': PasteTreeItemCommand,
	'command.SetHeaderSectionSizeCommand': SetHeaderSectionSizeCommand,
	'command.SetHeaderSectionLevelCommand': SetHeaderSectionLevelCommand,
	'command.CreateHeaderLevelsFromRangeCommand': CreateHeaderLevelsFromRangeCommand,
	'command.SetHeaderSectionOutlineFlagCommand': SetHeaderSectionOutlineFlagCommand,
	'command.PasteCellsFromClipboardCommand': PasteCellsFromClipboardCommand,
	'command.DeleteCellContentCommand': DeleteCellContentCommand,
	'command.InsertCellsCommand': InsertCellsCommand,
	'command.DeleteCellsCommand': DeleteCellsCommand,
	'command.CellRange': CellRange,
	'command.SheetName': SheetName,
	'command.AddSheetNameCommand': AddSheetNameCommand,
	'command.SetSheetNameCommand': SetSheetNameCommand,
	'command.DeleteSheetNameCommand': DeleteSheetNameCommand,
	'command.AddGraphCellCommand': AddGraphCellCommand,
	'command.SetGraphCellCommand': SetGraphCellCommand,
	'command.DeleteGraphCellCommand': DeleteGraphCellCommand,
	'command.CellAttributesCommand': CellAttributesCommand,
	'command.FormatCellsCommand': FormatCellsCommand,
	'command.FormatCellsCommandWC': FormatCellsCommandWC,
	'command.SetCellLevelsCommand': SetCellLevelsCommand,
	'command.TextFormatCellsCommand': TextFormatCellsCommand,
	'command.MarkCellValuesCommand': MarkCellValuesCommand,
	'command.ZoomChartCommand': ZoomChartCommand
};
module.exports = class SheetCommandFactory {
	// extends CommandFactory {
	// viewer optional
	static createCommand(graph, data, viewer) {
		const cmd = data ? Registry[data.name] : undefined;
		return cmd
			? cmd.createFromObject(data, { graph, viewer, factory: this })
			: CommandFactory.createCommand.bind(SheetCommandFactory)(
					graph,
					data,
					viewer
			  );
	}
};
