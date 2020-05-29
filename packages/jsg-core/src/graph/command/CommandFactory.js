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
const CompoundCommand = require('./CompoundCommand');
const MoveItemCommand = require('./MoveItemCommand');
const MoveNodeCommand = require('./MoveNodeCommand');
const MoveEdgeCommand = require('./MoveEdgeCommand');
const InternalMoveItemCommand = require('./InternalMoveItemCommand');
const AddItemCommand = require('./AddItemCommand');
const AddImageCommand = require('./AddImageCommand');
const AddLabelCommand = require('./AddLabelCommand');
const AddPortCommand = require('./AddPortCommand');
const AlignItemsCommand = require('./AlignItemsCommand');
const SizeItemsCommand = require('./SizeItemsCommand');
const SetTextCommand = require('./SetTextCommand');
const SetLinkCommand = require('./SetLinkCommand');
const SetPinCommand = require('./SetPinCommand');
const SetSizeCommand = require('./SetSizeCommand');
const SetNameCommand = require('./SetNameCommand');
const SetShapeCommand = require('./SetShapeCommand');
const SetShapePointsCommand = require('./SetShapePointsCommand');
const SetBezierLineShapePointCommand = require('./SetBezierLineShapePointCommand');
const SetBezierShapePointsCommand = require('./SetBezierShapePointsCommand');
const FormatItemCommand = require('./FormatItemCommand');
const TextFormatItemCommand = require('./TextFormatItemCommand');
const SetSelectionCommand = require('./SetSelectionCommand');
const RemoveSelectionCommand = require('./RemoveSelectionCommand');
const SetAttributesMapCommand = require('./SetAttributesMapCommand');
const SetAttributeAtPathCommand = require('./SetAttributeAtPathCommand');
const ChangeParentCommand = require('./ChangeParentCommand');
const ChangeItemOrderCommand = require('./ChangeItemOrderCommand');
const SetLayoutSettingCommand = require('./SetLayoutSettingCommand');
const ResizeItemCommand = require('./ResizeItemCommand');
const InternalResizeItemCommand = require('./InternalResizeItemCommand');
const ResizeNodeCommand = require('./ResizeNodeCommand');
const ResizeEdgeCommand = require('./ResizeEdgeCommand');
const ReshapeItemCommand = require('./ReshapeItemCommand');
const SetLineShapePointsCommand = require('./SetLineShapePointsCommand');
const SetLinePointAtCommand = require('./SetLinePointAtCommand');
const RotateItemCommand = require('./RotateItemCommand');
const RotateEdgeCommand = require('./RotateEdgeCommand');
const RotateNodeCommand = require('./RotateNodeCommand');
const InternalRotateItemCommand = require('./InternalRotateItemCommand');
const DeleteItemCommand = require('./DeleteItemCommand');
const DeleteEdgeCommand = require('./DeleteEdgeCommand');
const DeleteNodeCommand = require('./DeleteNodeCommand');
const DeletePortCommand = require('./DeletePortCommand');
const InternalDeleteItemCommand = require('./InternalDeleteItemCommand');
const AttachCommand = require('./AttachCommand');
const DetachCommand = require('./DetachCommand');
const InternalDetachCommand = require('./InternalDetachCommand');
const GroupCreator = require('./GroupCreator');
const PasteItemsCommand = require('./PasteItemsCommand');
const TranslateItemsCommand = require('./TranslateItemsCommand');
const ChangeAttributeCommand = require('./ChangeAttributeCommand');
const RemoveAttributeCommand = require('./RemoveAttributeCommand');
const GroupItemsCommand = require('./GroupItemsCommand');
const UnGroupItemsCommand = require('./UnGroupItemsCommand');
const SetTextSizeModeCommand = require('./SetTextSizeModeCommand');

const Registry = {
	'command.CompoundCommand': CompoundCommand,
	'command.MoveItemCommand': MoveItemCommand,
	'command.MoveNodeCommand': MoveNodeCommand,
	'command.MoveEdgeCommand': MoveEdgeCommand,
	'command.InternalMoveItemCommand': InternalMoveItemCommand,
	'command.AddItemCommand': AddItemCommand,
	'command.AddImageCommand': AddImageCommand,
	'command.AddLabelCommand': AddLabelCommand,
	'command.AddPortCommand': AddPortCommand,
	'command.AlignItemsCommand': AlignItemsCommand,
	'command.SizeItemsCommand': SizeItemsCommand,
	'command.SetTextCommand': SetTextCommand,
	'command.SetLinkCommand': SetLinkCommand,
	'command.SetPinCommand': SetPinCommand,
	'command.SetSizeCommand': SetSizeCommand,
	'command.SetNameCommand': SetNameCommand,
	'command.SetShapeCommand': SetShapeCommand,
	'command.SetShapePointsCommand': SetShapePointsCommand,
	'command.SetBezierLineShapePointCommand': SetBezierLineShapePointCommand,
	'command.SetBezierShapePointsCommand': SetBezierShapePointsCommand,
	'command.FormatItemCommand': FormatItemCommand,
	'command.TextFormatItemCommand': TextFormatItemCommand,
	'command.SetSelectionCommand': SetSelectionCommand,
	'command.RemoveSelectionCommand': RemoveSelectionCommand,
	'command.SetAttributesMapCommand': SetAttributesMapCommand,
	'command.SetAttributeAtPathCommand': SetAttributeAtPathCommand,
	'command.ChangeParentCommand': ChangeParentCommand,
	'command.ChangeItemOrderCommand': ChangeItemOrderCommand,
	'command.SetLayoutSettingCommand': SetLayoutSettingCommand,
	'command.ResizeItemCommand': ResizeItemCommand,
	'command.InternalResizeItemCommand': InternalResizeItemCommand,
	'command.ResizeNodeCommand': ResizeNodeCommand,
	'command.ResizeEdgeCommand': ResizeEdgeCommand,
	'command.ReshapeItemCommand': ReshapeItemCommand,
	'command.SetLineShapePointsCommand': SetLineShapePointsCommand,
	'command.SetLinePointAtCommand': SetLinePointAtCommand,
	'command.RotateItemCommand': RotateItemCommand,
	'command.RotateEdgeCommand': RotateEdgeCommand,
	'command.RotateNodeCommand': RotateNodeCommand,
	'command.InternalRotateItemCommand': InternalRotateItemCommand,
	'command.DeleteItemCommand': DeleteItemCommand,
	'command.DeleteEdgeCommand': DeleteEdgeCommand,
	'command.DeleteNodeCommand': DeleteNodeCommand,
	'command.DeletePortCommand': DeletePortCommand,
	'command.InternalDeleteItemCommand': InternalDeleteItemCommand,
	'command.AttachCommand': AttachCommand,
	'command.DetachCommand': DetachCommand,
	'command.InternalDetachCommand': InternalDetachCommand,
	'command.GroupCreator': GroupCreator,
	'command.PasteItemsCommand': PasteItemsCommand,
	'command.TranslateItemsCommand': TranslateItemsCommand,
	'command.ChangeAttributeCommand': ChangeAttributeCommand,
	'command.RemoveAttributeCommand': RemoveAttributeCommand,
	'command.GroupItemsCommand': GroupItemsCommand,
	'command.UnGroupItemsCommand': UnGroupItemsCommand,
	'command.SetTextSizeModeCommand': SetTextSizeModeCommand
};

class CommandFactory {
	// viewer optional
	static createCommand(graph, data, viewer) {
		const cmd = data ? Registry[data.name] : undefined;
		return cmd
			? cmd.createFromObject(data, { graph, viewer, factory: this })
			: undefined;
	}
}

module.exports = CommandFactory;
