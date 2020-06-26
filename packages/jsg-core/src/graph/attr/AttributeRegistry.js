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
const Attribute = require('./Attribute');
const AttributeList = require('./AttributeList');
const BooleanAttribute = require('./BooleanAttribute');
const CellAttributes = require('./CellAttributes');
const CellFormatAttributes = require('./CellFormatAttributes');
const CellTextFormatAttributes = require('./CellTextFormatAttributes');
const EdgeAttributes = require('./EdgeAttributes');
const FormatAttributes = require('./FormatAttributes');
const HeaderAttributes = require('./HeaderAttributes');
const ItemAttributes = require('./ItemAttributes');
const LayoutAttributes = require('./LayoutAttributes');
const MachineContainerAttributes = require('./MachineContainerAttributes');
const NumberAttribute = require('./NumberAttribute');
const ObjectAttribute = require('./ObjectAttribute');
const StreamSheetContainerAttributes = require('./StreamSheetContainerAttributes');
const StringAttribute = require('./StringAttribute');
const TextFormatAttributes = require('./TextFormatAttributes');
const TextNodeAttributes = require('./TextNodeAttributes');
const TreeItemAttributes = require('./TreeItemAttributes');
const WorksheetAttributes = require('./WorksheetAttributes');

const Registry = {
	Attribute,
	AttributeList,
	BooleanAttribute,
	CellAttributes,
	CellFormatAttributes,
	CellTextFormatAttributes,
	EdgeAttributes,
	FormatAttributes,
	HeaderAttributes,
	ItemAttributes,
	LayoutAttributes,
	MachineContainerAttributes,
	NumberAttribute,
	ObjectAttribute,
	StreamSheetContainerAttributes,
	StringAttribute,
	TextFormatAttributes,
	TextNodeAttributes,
	TreeItemAttributes,
	WorksheetAttributes,

	'ProcessSheetContainerAttributes': StreamSheetContainerAttributes,

	// store same under different path...
	'JSG.Attribute': Attribute,
	'JSG.AttributeList': AttributeList,
	'JSG.BooleanAttribute': BooleanAttribute,
	'JSG.CellAttributes': CellAttributes,
	'JSG.CellFormatAttributes': CellFormatAttributes,
	'JSG.CellTextFormatAttributes': CellTextFormatAttributes,
	'JSG.EdgeAttributes': EdgeAttributes,
	'JSG.FormatAttributes': FormatAttributes,
	'JSG.HeaderAttributes': HeaderAttributes,
	'JSG.ItemAttributes': ItemAttributes,
	'JSG.LayoutAttributes': LayoutAttributes,
	'JSG.MachineContainerAttributes': MachineContainerAttributes,
	'JSG.NumberAttribute': NumberAttribute,
	'JSG.ObjectAttribute': ObjectAttribute,
	'JSG.StreamSheetContainerAttributes': StreamSheetContainerAttributes,
	'JSG.ProcessSheetContainerAttributes': StreamSheetContainerAttributes,
	'JSG.StringAttribute': StringAttribute,
	'JSG.TextFormatAttributes': TextFormatAttributes,
	'JSG.TextNodeAttributes': TextNodeAttributes,
	'JSG.TreeItemAttributes': TreeItemAttributes,
	'JSG.WorksheetAttributes': WorksheetAttributes,

	// and to support legacy models...
	'JSG.graph.attr.Attribute': Attribute,
	'JSG.graph.attr.AttributeList': AttributeList,
	'JSG.graph.attr.BooleanAttribute': BooleanAttribute,
	'JSG.graph.attr.CellAttributes': CellAttributes,
	'JSG.graph.attr.CellFormatAttributes': CellFormatAttributes,
	'JSG.graph.attr.CellTextFormatAttributes': CellTextFormatAttributes,
	'JSG.graph.attr.EdgeAttributes': EdgeAttributes,
	'JSG.graph.attr.FormatAttributes': FormatAttributes,
	'JSG.graph.attr.HeaderAttributes': HeaderAttributes,
	'JSG.graph.attr.ItemAttributes': ItemAttributes,
	'JSG.graph.attr.LayoutAttributes': LayoutAttributes,
	'JSG.graph.attr.MachineContainerAttributes': MachineContainerAttributes,
	'JSG.graph.attr.NumberAttribute': NumberAttribute,
	'JSG.graph.attr.ObjectAttribute': ObjectAttribute,
	'JSG.graph.attr.ProcessSheetContainerAttributes': StreamSheetContainerAttributes,
	'JSG.graph.attr.StringAttribute': StringAttribute,
	'JSG.graph.attr.TextFormatAttributes': TextFormatAttributes,
	'JSG.graph.attr.TextNodeAttributes': TextNodeAttributes,
	'JSG.graph.attr.TreeItemAttributes': TreeItemAttributes,
	'JSG.graph.attr.WorksheetAttributes': WorksheetAttributes
};

module.exports = {
	get(name) {
		return Registry[name];
	}
};
