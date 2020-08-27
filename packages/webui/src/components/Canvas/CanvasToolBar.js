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
/* eslint-disable react/prop-types */
/* eslint-disable no-bitwise */

import JSG from '@cedalo/jsg-ui';
import { NumberFormatter } from '@cedalo/number-format';
import { ToolbarExtensions, ChartExtensions } from '@cedalo/webui-extensions';
import { Button, Divider, GridList, GridListTile, IconButton, Input, MenuItem, MenuList } from '@material-ui/core';
import Popover from '@material-ui/core/Popover';
import Select from '@material-ui/core/Select';
import SvgIcon from '@material-ui/core/SvgIcon';
import AppBar from '@material-ui/core/AppBar';
import Tooltip from '@material-ui/core/Tooltip';
import BorderAllIcon from '@material-ui/icons/BorderAll';
import BorderBottomIcon from '@material-ui/icons/BorderBottom';
import BorderClearIcon from '@material-ui/icons/BorderClear';
import BorderHorizontalIcon from '@material-ui/icons/BorderHorizontal';
import BorderInnerIcon from '@material-ui/icons/BorderInner';
import BorderLeftIcon from '@material-ui/icons/BorderLeft';
import BorderOuterIcon from '@material-ui/icons/BorderOuter';
import BorderRightIcon from '@material-ui/icons/BorderRight';
import BorderTopIcon from '@material-ui/icons/BorderTop';
import BorderVerticalIcon from '@material-ui/icons/BorderVertical';
import ToolRectangleIcon from '@material-ui/icons/Crop32';
import FormatAlignCenter from '@material-ui/icons/FormatAlignCenter';
import FormatAlignJustify from '@material-ui/icons/FormatAlignJustify';
import FormatAlignLeft from '@material-ui/icons/FormatAlignLeft';
import FormatAlignRight from '@material-ui/icons/FormatAlignRight';
import BoldIcon from '@material-ui/icons/FormatBold';
import ItalicIcon from '@material-ui/icons/FormatItalic';
import MessageIcon from '@material-ui/icons/Message';
import ToolEllipseIcon from '@material-ui/icons/PanoramaFishEye';
import RedoIcon from '@material-ui/icons/Redo';
import ToolStar from '@material-ui/icons/StarBorder';
import ToolPolylineIcon from '@material-ui/icons/Timeline';
import ToolArrowIcon from '@material-ui/icons/TrendingFlat';
import UndoIcon from '@material-ui/icons/Undo';
import VerticalAlignBottom from '@material-ui/icons/VerticalAlignBottom';
import VerticalAlignCenter from '@material-ui/icons/VerticalAlignCenter';
import VerticalAlignTop from '@material-ui/icons/VerticalAlignTop';
import EditNamesIcon from '@material-ui/icons/ViewList';
import ZoomIcon from '@material-ui/icons/ZoomIn';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import React, { Component, useEffect, useState } from 'react';
import { SketchPicker } from 'react-color';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import { accessManager } from '../../helper/AccessManager';
import { intl } from '../../helper/IntlGlobalProvider';
import CommandStack from '../../helper/synchronization/CommandStack';
import { numberFormatTemplates } from '../../languages/NumberFormatTemplates';
import CustomTooltip from '../base/customTooltip/CustomTooltip';
import { withStyles } from '@material-ui/core/styles';

const ToolTextIcon = FormatAlignCenter;
const {
	Point,
	Size,
	Strings,
	Dictionary,
	AttributeUtils,
	SetAttributeAtPathCommand,
	BooleanAttribute,
	ItemAttributes,
	CompoundCommand,
	SetSizeCommand,
	MoveItemCommand,
	FormatAttributes,
	TextFormatAttributes,
	SelectionProvider,
	MatrixLayout,
	SheetPlotNode
} = JSG;
const { RESOURCE_TYPES, RESOURCE_ACTIONS } = accessManager;

const marks = {
	50: '50%',
	100: '100%',
	150: '150%',
	200: '200%'
};

const buttonStyle = {
	height: '34px',
	width: '34px',
	padding: '4px 0px 0px 0px'
};

const borderStyle = { borderRadius: '0%', padding: '0px 5px', width: '100px', height: '20px' };

const styles = {
	default: {
		background: 'inherit'
	},
	select: {
		'&:before': {
			// normal
			border: 'none'
		},
		'&:after': {
			// focused
			border: 'none'
		},
		'&:hover:not(.Mui-disabled):not(.Mui-focused):not(.Mui-error):before': {
			// hover
			border: 'none'
		}
	}
};

const WidthHelper = (props) => {
	const [currentWidth, setCurrentWidth] = useState(window.outerWidth);
	useEffect(() => {
		const handleResize = () => {
			setCurrentWidth(window.outerWidth);
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);
	return props.width < currentWidth ? props.children : null;
};

const numberFormats = [
	{ id: 'NumberFormat.General', type: 'general', nf: 'General', local: 'general', value: 1234.56 },
	{ id: '-1' },
	{ id: 'NumberFormat.NumberRounded', type: 'number', nf: '#,##0', local: 'number;0;true', value: 1234.56 },
	{ id: 'NumberFormat.Number', type: 'number', nf: '#,##0.00', local: 'number;2;true', value: 1234.56 },
	{ id: 'NumberFormat.Percent', type: 'percent', nf: '0.00%', local: 'percent;2;false', value: 0.123 },
	{ id: 'NumberFormat.Currency', type: 'currency', nf: '#,##0.00 €', local: 'currency;2;true', value: 1234.56 },
	{ id: 'NumberFormat.Scientific', type: 'science', nf: '0.00E+00', local: 'science;2', value: 1234.56 },
	{ id: '-2' },
	{ id: 'NumberFormat.Date', type: 'date', nf: 'd\\.m\\.yy', local: 'date;de', value: 43500 },
	{ id: 'NumberFormat.Time', type: 'time', nf: 'h:mm:ss', local: 'time;de', value: 0.5 },
	{ id: 'NumberFormat.DateTime', type: 'date', nf: 'd\\.m\\.yyyy h:mm', local: 'date;de', value: 43500.5 },
	{ id: '-3' },
	{ id: 'NumberFormat.Text', type: 'text', nf: '@', local: 'text', value: 1234.56 }
];

// eslint-disable-next-line react/prefer-stateless-function
export class CanvasToolBar extends Component {
	constructor(props) {
		super(props);
		this.state = {
			cellTextFormat: undefined,
			cellFormat: undefined,
			cellAttributes: undefined,
			showHAlign: false,
			showVAlign: false,
			showFillColor: false,
			showFontColor: false,
			showBorderColor: false,
			showBorderStyle: false,
			showNumberFormat: false,
			anchorEl: undefined,
			zoomOpen: false,
			toolsOpen: false,
			chartsOpen: false,
			borderOpen: false,
			graphSelected: false
		};
	}

	componentDidMount() {
		JSG.NotificationCenter.getInstance().register(
			this,
			CommandStack.STACK_CHANGED_NOTIFICATION,
			'onCommandStackChanged'
		);
		JSG.NotificationCenter.getInstance().register(
			this,
			CommandStack.STACK_CHANGED_NOTIFICATION,
			'onCommandStackChanged'
		);
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.WorksheetNode.SELECTION_CHANGED_NOTIFICATION,
			'onSheetSelectionChanged'
		);
		JSG.NotificationCenter.getInstance().register(
			this,
			SelectionProvider.SELECTION_CHANGED_NOTIFICATION,
			'onGraphSelectionChanged'
		);
	}

	componentWillUnmount() {
		JSG.NotificationCenter.getInstance().unregister(this, CommandStack.STACK_CHANGED_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, JSG.WorksheetNode.SELECTION_CHANGED_NOTIFICATION);
		JSG.NotificationCenter.getInstance().unregister(this, SelectionProvider.SELECTION_CHANGED_NOTIFICATION);
	}

	onSheetSelectionChanged(notification) {
		const { item } = notification.object;
		const { updateFinal } = notification.object;

		if (!item || !updateFinal) {
			return;
		}
		const activeCell = item.getOwnSelection().getActiveCell();
		if (!(item instanceof JSG.StreamSheet) || activeCell === undefined) {
			return;
		}

		this.updateState({ graphSelected: false });
	}

	onGraphSelectionChanged() {
		const selection = graphManager.getGraphViewer().getSelection();

		if (!selection.length) {
			return;
		}

		const conts = selection.filter((controller) => controller.getModel() instanceof JSG.StreamSheetContainer);

		if (conts.length === 0) {
			this.updateState({ graphSelected: true });
		}
	}

	onShowZoom = (event) => {
		this.setState({
			zoomOpen: true,
			anchorEl: event.currentTarget
		});
	};

	onShowOutbox = () => {
		const container = graphManager.getGraph().getMachineContainer();
		const attr = container.getMachineContainerAttributes();
		const path = AttributeUtils.createPath(
			JSG.MachineContainerAttributes.NAME,
			JSG.MachineContainerAttributes.OUTBOXVISIBLE
		);
		const cmd = new CompoundCommand();
		cmd.add(new SetAttributeAtPathCommand(container, path, !attr.getOutboxVisible().getValue()));

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.execute(cmd);
		graphManager.getCanvas().focus();
	};

	onShowNumberFormat = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showNumberFormat: true,
			anchorEl: event.currentTarget
		});
	};

	onCloseNumberFormat = () => {
		this.setState({
			showNumberFormat: false
		});
	};

	onShowTools = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			toolsOpen: true,
			anchorEl: event.currentTarget
		});
	};

	onShowCharts = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			chartsOpen: true,
			anchorEl: event.currentTarget
		});
	};

	onShowBorder = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			borderOpen: true,
			anchorEl: event.currentTarget
		});
	};

	onShowFillColor = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showFillColor: true,
			anchorEl: event.currentTarget
		});
	};

	onCloseFillColor = () => {
		this.setState({
			showFillColor: false
		});
	};

	onShowFontColor = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showFontColor: true,
			anchorEl: event.currentTarget
		});
	};

	onCloseFontColor = () => {
		this.setState({
			showFontColor: false
		});
	};

	onShowHAlign = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showHAlign: true,
			anchorEl: event.currentTarget
		});
	};

	onCloseHAlign = () => {
		this.setState({
			showHAlign: false
		});
	};

	onShowVAlign = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showVAlign: true,
			anchorEl: event.currentTarget
		});
	};

	onCloseVAlign = () => {
		this.setState({
			showVAlign: false
		});
	};

	onShowBorderColor = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showBorderColor: true,
			anchorEl: event.currentTarget
		});
	};

	onCloseBorderColor = () => {
		this.setState({
			showBorderColor: false
		});
	};

	onShowBorderStyle = (event) => {
		// This prevents ghost click.
		event.preventDefault();

		this.setState({
			showBorderStyle: true,
			anchorEl: event.currentTarget
		});
	};

	onCloseBorderStyle = () => {
		this.setState({
			showBorderStyle: false
		});
	};

	onToolsClose = () => {
		this.setState({
			toolsOpen: false
		});
	};

	onChartsClose = () => {
		this.setState({
			chartsOpen: false
		});
	};

	onZoomClose = () => {
		this.setState({
			zoomOpen: false
		});
	};

	onBorderClose = () => {
		this.setState({
			borderOpen: false
		});
	};

	onEditNames = () => {
		this.handleState({
			formulaOpen: false,
			showEditNamesDialog: true
		});
	};

	onStreamFunction = () => {
		this.props.showFunctionWizard();
	};

	onPasteFunction = () => {
		// const sheetView = graphManager.getActiveSheetView();
		// if (sheetView) {
		// 	sheetView.deActivateReferenceMode();
		// }
		this.handleState({
			formulaOpen: false,
			showPasteFunctionsDialog: true
		});
	};

	onCreateLine = () => {
		this.setState({
			toolsOpen: false
		});
		const edge = new JSG.Edge(new JSG.LineShape());
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateEdgeInteraction(edge));
	};

	onCreateArrow = () => {
		this.setState({
			toolsOpen: false
		});
		const edge = new JSG.Edge(new JSG.LineShape());
		edge.getFormat().setLineArrowEnd(1);
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateEdgeInteraction(edge));
	};

	onCreateRectangle = () => {
		this.setState({
			toolsOpen: false
		});

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateNodeInteraction(new JSG.RectangleShape()));
	};

	onCreateEllipse = () => {
		this.setState({
			toolsOpen: false
		});

		const node = new JSG.Node(new JSG.EllipseShape());

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateItemInteraction(node));
	};

	onCreateText = () => {
		this.setState({
			toolsOpen: false
		});

		const textnode = new JSG.TextNode('Text');
		const f = textnode.getTextFormat();
		f.setHorizontalAlignment(TextFormatAttributes.TextAlignment.LEFT);
		f.setVerticalAlignment(TextFormatAttributes.VerticalTextAlignment.TOP);
		f.setRichText(false);
		textnode.associate(false);

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateItemInteraction(textnode));
	};

	onCreatePolyline = () => {
		this.setState({
			toolsOpen: false
		});
		const polynode = new JSG.Node(new JSG.PolygonShape());
		polynode.setItemAttribute(ItemAttributes.CLOSED, false);
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreatePolyLineInteraction(polynode));
	};

	onCreateTool = (type) => {
		this.setState({
			toolsOpen: false
		});
		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateItemInteraction(JSG.graphItemFactory.createItemFromString(type)));
	};

	onSelectShapes = () => {
		const viewer = graphManager.getGraphViewer();
		viewer.clearSelection();
		viewer.getInteractionHandler().setActiveInteraction(new JSG.MarqueeInteraction(true));
	};

	onUndo = () => {
		graphManager.undo();
		this.setState({});
		graphManager.getCanvas().focus();
	};

	onRedo = () => {
		graphManager.redo();
		this.setState({});
		graphManager.getCanvas().focus();
	};

	onCreateContainer = (type) => {
		this.setState({
			toolsOpen: false
		});

		const node = new JSG.Node();
		switch (type) {
			case 'top':
				// node.setItemAttribute(ItemAttributes.SCALESHOW, true);
				node.setItemAttribute(ItemAttributes.SCALETYPE, type);
				break;
			case 'bottom':
				node.setItemAttribute(ItemAttributes.SCALETYPE, type);
				break;
			case 'scale':
				node.setItemAttribute(ItemAttributes.SCALETYPE, type);
				break;
			case 'matrix1':
				node.setLayout(MatrixLayout.TYPE);
				node.getLayoutSettings().set(MatrixLayout.COLUMNS, 1);
				break;
			case 'matrix2':
				node.setLayout(MatrixLayout.TYPE);
				node.getLayoutSettings().set(MatrixLayout.COLUMNS, 2);
				break;
			case 'matrix3':
				node.setLayout(MatrixLayout.TYPE);
				node.getLayoutSettings().set(MatrixLayout.COLUMNS, 3);
				break;
			default:
				break;
		}

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateItemInteraction(node));
		graphManager.getCanvas().focus();
	};

	onCreateControl = (type) => {
		let node;

		this.setState({
			toolsOpen: false
		});

		switch (type) {
			case 'button':
				node = new JSG.SheetButtonNode();
				break;
			case 'checkbox':
				node = new JSG.SheetCheckboxNode();
				break;
			case 'slider':
				node = new JSG.SheetSliderNode();
				break;
			case 'knob':
				node = new JSG.SheetKnobNode();
				break;
			default:
				break;
		}

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.setActiveInteraction(new JSG.CreateItemInteraction(node));
		graphManager.getCanvas().focus();
	};

	onCreatePlot = (type) => {
		this.setState({
			chartsOpen: false
		});

		if (this.isChartSelected()) {
			const selection = graphManager.getGraphViewer().getSelection();
			const item = selection[0].getModel();
			const cmd = new JSG.CompoundCommand();
			const cmdAxis = item.prepareCommand('axes');
			const cmdChart = item.prepareCommand('chart');
			const cmdSeries = item.prepareCommand('series');

			type = item.setChartType(type);

			item.series.forEach((serie) => {
				serie.type = type;
			});

			item.setChartTypeForSeries(type);

			item.finishCommand(cmdSeries, 'series');
			item.finishCommand(cmdChart, 'chart');
			item.finishCommand(cmdAxis, 'axes');
			cmd.add(cmdChart);
			cmd.add(cmdAxis);
			cmd.add(cmdSeries);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else {
			const node = new JSG.SheetPlotNode();
			const attr = node.addAttribute(new BooleanAttribute('showwizard', true));
			attr.setTransient(true);
			const sheetView = graphManager.getActiveSheetView();
			if (sheetView) {
				const selection = sheetView.getOwnSelection();
				if (selection) {
					graphManager.chartSelection = selection.copy();
					graphManager.chartType = type;
				}
			}

			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.setActiveInteraction(new JSG.CreateItemInteraction(node));
		}
		graphManager.getCanvas().focus();
	};

	onFormatCells = () => {
		this.handleState({
			formatOpen: false,
			showFormatCellsDialog: true
		});
	};

	onFormatHorizontalAlign = (align) => {
		const attributesMap = new Dictionary();

		attributesMap.put(TextFormatAttributes.HORIZONTALALIGN, align);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = new JSG.TextFormatCellsCommand(sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.setState({
			showHAlign: false
		});
		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatVerticalAlign = (align) => {
		const attributesMap = new Dictionary();

		attributesMap.put(TextFormatAttributes.VERTICALALIGN, align);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = new JSG.TextFormatCellsCommand(sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.setState({
			showVAlign: false
		});
		this.updateState();
	};

	onFormatFontSize = (event) => {
		const attributesMap = new Dictionary();

		attributesMap.put(TextFormatAttributes.FONTSIZE, Number(event.target.value));

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = new JSG.TextFormatCellsCommand(sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatFontName = (event) => {
		const attributesMap = new Dictionary();

		attributesMap.put(TextFormatAttributes.FONTNAME, event.target.value);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = new JSG.TextFormatCellsCommand(sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatPercent = () => {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const attributesMap = new Dictionary();

			attributesMap.put(TextFormatAttributes.NUMBERFORMAT, '0%');
			attributesMap.put(TextFormatAttributes.LOCALCULTURE, 'percent;0');

			if (
				graphManager
					.getGraphEditor()
					.getSelectionProvider()
					.hasSelection()
			) {
				// graphManager.getGraphEditor().getInteractionHandler().applyTextFormatMap(attributesMap);
			} else {
				const cmd = new JSG.TextFormatCellsCommand(sheetView.getOwnSelection().getRanges(), attributesMap);
				graphManager
					.getGraphViewer()
					.getInteractionHandler()
					.execute(cmd);
			}
			this.updateState();
		}
		graphManager.getCanvas().focus();
	};

	onFormatNumberFormat = (format) => {
		const attributesMap = new Dictionary();

		attributesMap.put(TextFormatAttributes.NUMBERFORMAT, format.nf);
		attributesMap.put(TextFormatAttributes.LOCALCULTURE, format.local);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = new JSG.TextFormatCellsCommand(sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}

		this.setState({
			showNumberFormat: false
		});

		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatDecimals = (more, thousandsFlag) => {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const attributesMap = new Dictionary();
			const tf = this.state.cellTextFormat;

			if (!tf) {
				return;
			}

			let decimals = 0;
			let category = 'number';
			let currency = '€';
			let thousands = false;

			let sections = tf.getLocalCulture() ? tf.getLocalCulture().getValue() : '';
			sections = sections.split(';');
			if (sections.length) {
				switch (sections[0]) {
					case 'general':
						category = 'number';
						break;
					case 'currency':
						[, , , currency] = sections;
						currency = currency === 'undefined' ? '€' : currency;
						decimals = Number(sections[1]);
						[category] = sections;
						thousands = sections[2] === 'true';
						break;
					case 'number':
						decimals = Number(sections[1]);
						[category] = sections;
						thousands = sections[2] === 'true';
						break;
					case 'percent':
					case 'science':
						decimals = Number(sections[1]);
						[category] = sections;
						break;
					default:
						category = 'number';
						break;
				}
			}

			if (decimals !== undefined) {
				decimals = Math.max(0, more ? decimals + 1 : decimals - 1);
			}
			if (thousandsFlag !== undefined) {
				thousands = true;
			}

			let template;
			let culture;

			switch (category) {
				default:
				case 'number':
					template = numberFormatTemplates.getNegativeNumberTemplates(
						thousands,
						Number(decimals),
						'red',
						0,
						0,
						undefined,
						0
					);
					culture = `number;${decimals};${thousands}`;
					break;
				case 'currency':
					template = numberFormatTemplates.getNegativeNumberTemplates(
						thousands,
						Number(decimals),
						'red',
						0,
						0,
						currency,
						0
					);
					culture = `currency;${decimals};${thousands};${currency}`;
					break;
				case 'percent':
					template = numberFormatTemplates.getNumberTemplate(Number(decimals), 0, 5, 0);
					culture = `percent;${decimals}`;
					break;
				case 'science':
					template = numberFormatTemplates.getNumberTemplate(Number(decimals), 0, 7, 0);
					culture = `science;${decimals}`;
					break;
			}

			attributesMap.put(TextFormatAttributes.NUMBERFORMAT, template.format);
			attributesMap.put(TextFormatAttributes.LOCALCULTURE, culture);

			if (
				graphManager
					.getGraphEditor()
					.getSelectionProvider()
					.hasSelection()
			) {
				// graphManager.getGraphEditor().getInteractionHandler().applyTextFormatMap(attributesMap);
			} else {
				const cmd = new JSG.TextFormatCellsCommand(sheetView.getOwnSelection().getRanges(), attributesMap);
				graphManager
					.getGraphViewer()
					.getInteractionHandler()
					.execute(cmd);
			}
			this.updateState();
		}
		graphManager.getCanvas().focus();
	};

	onFormatBold = () => {
		const attributesMap = new Dictionary();
		const tf = this.state.cellTextFormat;

		if (!tf) {
			return;
		}

		const style = tf.getFontStyle() ? tf.getFontStyle().getValue() : 0;
		const newStyle =
			style & TextFormatAttributes.FontStyle.BOLD
				? style & ~TextFormatAttributes.FontStyle.BOLD
				: style | TextFormatAttributes.FontStyle.BOLD;

		attributesMap.put(TextFormatAttributes.FONTSTYLE, newStyle);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = new JSG.TextFormatCellsCommand(sheetView.getOwnSelection().getRanges(), attributesMap);

			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatItalic = () => {
		const attributesMap = new Dictionary();
		const tf = this.state.cellTextFormat;

		if (!tf) {
			return;
		}

		const style = tf.getFontStyle() ? tf.getFontStyle().getValue() : 0;
		const newStyle =
			style & TextFormatAttributes.FontStyle.ITALIC
				? style & ~TextFormatAttributes.FontStyle.ITALIC
				: style | TextFormatAttributes.FontStyle.ITALIC;

		attributesMap.put(TextFormatAttributes.FONTSTYLE, newStyle);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = new JSG.TextFormatCellsCommand(sheetView.getOwnSelection().getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}

		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatFillColor = (color) => {
		const attributesMap = new Dictionary();
		if (color.hex === 'transparent') {
			attributesMap.put(FormatAttributes.FILLSTYLE, FormatAttributes.FillStyle.NONE);
		} else if (color.hex.toUpperCase() === '#FFFFFE') {
			attributesMap.put(FormatAttributes.FILLCOLOR, 'auto');
			const f = this.state.cellFormat;
			const style = f && f.getFillStyle() ? f.getFillStyle().getValue() : '';
			if (style === FormatAttributes.FillStyle.NONE) {
				attributesMap.put(FormatAttributes.FILLSTYLE, FormatAttributes.FillStyle.SOLID);
			}
		} else {
			attributesMap.put(FormatAttributes.FILLCOLOR, color.hex);
			attributesMap.put(FormatAttributes.FILLSTYLE, FormatAttributes.FillStyle.SOLID);
		}
		if (this.isChartSelected()) {
			attributesMap.put(FormatAttributes.TRANSPARENCY, color.rgb.a * 100);
		}

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = new JSG.FormatCellsCommand(sheetView.getOwnSelection().getRanges(), attributesMap);

			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyFormatMap(attributesMap);
		}
		this.updateState();
		// graphManager.getCanvas().focus();
	};

	onFormatBorderStyle = (style) => {
		const sheetView = graphManager.getActiveSheetView();
		let cmd;
		const attributesMap = new Dictionary();

		if (sheetView) {
			const selection = sheetView.getOwnSelection();
			attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, style);
			attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, style);
			attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, style);
			attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, style);
			cmd = new JSG.CellAttributesCommand(selection.getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			attributesMap.put(FormatAttributes.LINESTYLE, style);
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyFormatMap(attributesMap);
		}

		this.updateState();
		graphManager.getCanvas().focus();

		this.setState({
			showBorderStyle: false
		});
	};

	onFormatBorderWidth = (width) => {
		const sheetView = graphManager.getActiveSheetView();
		let cmd;
		const attributesMap = new Dictionary();

		if (sheetView) {
			const selection = sheetView.getOwnSelection();
			const cs = JSG.graphics.getCoordinateSystem();
			width = cs.logToDeviceYNoZoom(width);
			attributesMap.put(JSG.CellAttributes.LEFTBORDERWIDTH, width);
			attributesMap.put(JSG.CellAttributes.TOPBORDERWIDTH, width);
			attributesMap.put(JSG.CellAttributes.RIGHTBORDERWIDTH, width);
			attributesMap.put(JSG.CellAttributes.BOTTOMBORDERWIDTH, width);
			cmd = new JSG.CellAttributesCommand(selection.getRanges(), attributesMap);
			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			attributesMap.put(FormatAttributes.LINEWIDTH, width);
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyFormatMap(attributesMap);
		}

		this.updateState();
		graphManager.getCanvas().focus();

		this.setState({
			showBorderStyle: false
		});
	};

	onFormatBorder = (type) => {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const attributesMap = new Dictionary();

			if (
				graphManager
					.getGraphEditor()
					.getSelectionProvider()
					.hasSelection()
			) {
				// graphManager.getGraphEditor().getInteractionHandler().applyFormatMap(attributesMap);
			} else {
				let selection = sheetView.getOwnSelection();
				let cmd;
				let rangeCopy;

				switch (type) {
					case 'all':
						attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						cmd = new JSG.CellAttributesCommand(selection.getRanges(), attributesMap);
						break;
					case 'clear':
						attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.NONE);
						attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.NONE);
						attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.NONE);
						attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.NONE);
						cmd = new CompoundCommand();
						cmd.add(new JSG.CellAttributesCommand(selection.getRanges(), attributesMap));
						selection.getRanges().forEach((range) => {
							if (range._y1) {
								attributesMap.clear();
								attributesMap.put(
									JSG.CellAttributes.BOTTOMBORDERSTYLE,
									FormatAttributes.LineStyle.NONE
								);

								rangeCopy = range.copy();
								rangeCopy._y1 -= 1;
								rangeCopy._y2 = rangeCopy._y1;
								cmd.add(new JSG.CellAttributesCommand([rangeCopy], attributesMap));
							}
							if (range._y2 < range.getSheet().getRowCount()) {
								attributesMap.clear();
								attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.NONE);

								rangeCopy = range.copy();
								rangeCopy._y1 = rangeCopy._y2 + 1;
								rangeCopy._y2 = rangeCopy._y1;
								cmd.add(new JSG.CellAttributesCommand([rangeCopy], attributesMap));
							}
							if (range._x1) {
								attributesMap.clear();
								attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.NONE);

								rangeCopy = range.copy();
								rangeCopy._x1 -= 1;
								rangeCopy._x2 = rangeCopy._x1;
								cmd.add(new JSG.CellAttributesCommand([rangeCopy], attributesMap));
							}
							if (range._x2 < range.getSheet().getColumnCount()) {
								attributesMap.clear();
								attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.NONE);

								rangeCopy = range.copy();
								rangeCopy._x1 = rangeCopy._x2 + 1;
								rangeCopy._x2 = rangeCopy._x1;
								cmd.add(new JSG.CellAttributesCommand([rangeCopy], attributesMap));
							}
						});
						break;
					case 'left':
						attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						selection = sheetView.getOwnSelection().copy();
						selection.getRanges().forEach((range) => {
							range.setWidth(1);
						});
						cmd = new JSG.CellAttributesCommand(selection.getRanges(), attributesMap);
						break;
					case 'top':
						attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						selection = sheetView.getOwnSelection().copy();
						selection.getRanges().forEach((range) => {
							range.setHeight(1);
						});
						cmd = new JSG.CellAttributesCommand(selection.getRanges(), attributesMap);
						break;
					case 'right':
						attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						selection = sheetView.getOwnSelection().copy();
						selection.getRanges().forEach((range) => {
							range._x1 = range._x2;
						});
						cmd = new JSG.CellAttributesCommand(selection.getRanges(), attributesMap);
						break;
					case 'bottom':
						attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						selection = sheetView.getOwnSelection().copy();
						selection.getRanges().forEach((range) => {
							range._y1 = range._y2;
						});
						cmd = new JSG.CellAttributesCommand(selection.getRanges(), attributesMap);
						break;
					case 'inner': {
						let copyRanges;
						cmd = new CompoundCommand();
						selection.getRanges().forEach((range) => {
							if (range.getWidth() > 1) {
								attributesMap.clear();
								attributesMap.put(
									JSG.CellAttributes.RIGHTBORDERSTYLE,
									FormatAttributes.LineStyle.SOLID
								);
								rangeCopy = range.copy();
								rangeCopy.setWidth(1);
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));

								if (range.getWidth() > 2) {
									attributesMap.clear();
									attributesMap.put(
										JSG.CellAttributes.LEFTBORDERSTYLE,
										FormatAttributes.LineStyle.SOLID
									);
									attributesMap.put(
										JSG.CellAttributes.RIGHTBORDERSTYLE,
										FormatAttributes.LineStyle.SOLID
									);

									rangeCopy = range.copy();
									rangeCopy._x1 += 1;
									rangeCopy._x2 -= 1;
									copyRanges = [];
									copyRanges.push(rangeCopy);
									cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));
								}

								attributesMap.clear();
								attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
								rangeCopy = range.copy();
								rangeCopy._x1 = rangeCopy._x2;
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));
							}
						});

						selection.getRanges().forEach((range) => {
							if (range.getHeight() > 1) {
								attributesMap.clear();
								attributesMap.put(
									JSG.CellAttributes.BOTTOMBORDERSTYLE,
									FormatAttributes.LineStyle.SOLID
								);
								rangeCopy = range.copy();
								rangeCopy.setHeight(1);
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));

								if (range.getHeight() > 2) {
									attributesMap.clear();
									attributesMap.put(
										JSG.CellAttributes.TOPBORDERSTYLE,
										FormatAttributes.LineStyle.SOLID
									);
									attributesMap.put(
										JSG.CellAttributes.BOTTOMBORDERSTYLE,
										FormatAttributes.LineStyle.SOLID
									);

									rangeCopy = range.copy();
									rangeCopy._y1 += 1;
									rangeCopy._y2 -= 1;
									copyRanges = [];
									copyRanges.push(rangeCopy);
									cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));
								}

								attributesMap.clear();
								attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
								rangeCopy = range.copy();
								rangeCopy._y1 = rangeCopy._y2;
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));
							}
						});
						if (!cmd.hasCommands()) {
							cmd = undefined;
						}
						break;
					}
					case 'outer':
						cmd = new CompoundCommand();
						attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						selection = sheetView.getOwnSelection().copy();
						selection.getRanges().forEach((range) => {
							range.setWidth(1);
						});
						cmd.add(new JSG.CellAttributesCommand(selection.getRanges(), attributesMap));
						attributesMap.clear();
						attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						selection = sheetView.getOwnSelection().copy();
						selection.getRanges().forEach((range) => {
							range.setHeight(1);
						});
						cmd.add(new JSG.CellAttributesCommand(selection.getRanges(), attributesMap));
						attributesMap.clear();
						attributesMap.put(JSG.CellAttributes.RIGHTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						selection = sheetView.getOwnSelection().copy();
						selection.getRanges().forEach((range) => {
							range._x1 = range._x2;
						});
						cmd.add(new JSG.CellAttributesCommand(selection.getRanges(), attributesMap));
						attributesMap.clear();
						attributesMap.put(JSG.CellAttributes.BOTTOMBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
						selection = sheetView.getOwnSelection().copy();
						selection.getRanges().forEach((range) => {
							range._y1 = range._y2;
						});
						cmd.add(new JSG.CellAttributesCommand(selection.getRanges(), attributesMap));
						break;
					case 'vertical': {
						let copyRanges;
						cmd = new CompoundCommand();
						selection.getRanges().forEach((range) => {
							if (range.getWidth() > 1) {
								attributesMap.clear();
								attributesMap.put(
									JSG.CellAttributes.RIGHTBORDERSTYLE,
									FormatAttributes.LineStyle.SOLID
								);
								rangeCopy = range.copy();
								rangeCopy.setWidth(1);
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));

								if (range.getWidth() > 2) {
									attributesMap.clear();
									attributesMap.put(
										JSG.CellAttributes.LEFTBORDERSTYLE,
										FormatAttributes.LineStyle.SOLID
									);
									attributesMap.put(
										JSG.CellAttributes.RIGHTBORDERSTYLE,
										FormatAttributes.LineStyle.SOLID
									);

									rangeCopy = range.copy();
									rangeCopy._x1 += 1;
									rangeCopy._x2 -= 1;
									copyRanges = [];
									copyRanges.push(rangeCopy);
									cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));
								}

								attributesMap.clear();
								attributesMap.put(JSG.CellAttributes.LEFTBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
								rangeCopy = range.copy();
								rangeCopy._x1 = rangeCopy._x2;
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));
							}
						});
						if (!cmd.hasCommands()) {
							cmd = undefined;
						}
						break;
					}
					case 'horizontal': {
						let copyRanges;
						cmd = new CompoundCommand();
						selection.getRanges().forEach((range) => {
							if (range.getHeight() > 1) {
								attributesMap.clear();
								attributesMap.put(
									JSG.CellAttributes.BOTTOMBORDERSTYLE,
									FormatAttributes.LineStyle.SOLID
								);
								rangeCopy = range.copy();
								rangeCopy.setHeight(1);
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));

								if (range.getHeight() > 2) {
									attributesMap.clear();
									attributesMap.put(
										JSG.CellAttributes.TOPBORDERSTYLE,
										FormatAttributes.LineStyle.SOLID
									);
									attributesMap.put(
										JSG.CellAttributes.BOTTOMBORDERSTYLE,
										FormatAttributes.LineStyle.SOLID
									);

									rangeCopy = range.copy();
									rangeCopy._y1 += 1;
									rangeCopy._y2 -= 1;
									copyRanges = [];
									copyRanges.push(rangeCopy);
									cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));
								}

								attributesMap.clear();
								attributesMap.put(JSG.CellAttributes.TOPBORDERSTYLE, FormatAttributes.LineStyle.SOLID);
								rangeCopy = range.copy();
								rangeCopy._y1 = rangeCopy._y2;
								copyRanges = [];
								copyRanges.push(rangeCopy);
								cmd.add(new JSG.CellAttributesCommand(copyRanges, attributesMap));
							}
						});
						if (!cmd.hasCommands()) {
							cmd = undefined;
						}
						break;
					}
					default:
						return;
				}

				if (cmd) {
					graphManager
						.getGraphViewer()
						.getInteractionHandler()
						.execute(cmd);
				}
			}
			this.updateState();
			graphManager.getCanvas().focus();

			this.setState({
				borderOpen: false
			});
		}
	};

	onFormatFontColor = (color) => {
		const attributesMap = new Dictionary();
		attributesMap.put(TextFormatAttributes.FONTCOLOR, color.hex);

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const cmd = new JSG.TextFormatCellsCommand(sheetView.getOwnSelection().getRanges(), attributesMap);

			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyTextFormatMap(attributesMap);
		}
		this.updateState();
		graphManager.getCanvas().focus();
	};

	onFormatBorderColor = (color) => {
		const attributesMap = new Dictionary();

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			if (color.hex === 'transparent') {
				this.onFormatBorder('clear');
				return;
			}

			attributesMap.put(JSG.CellAttributes.LEFTBORDERCOLOR, color.hex);
			attributesMap.put(JSG.CellAttributes.TOPBORDERCOLOR, color.hex);
			attributesMap.put(JSG.CellAttributes.RIGHTBORDERCOLOR, color.hex);
			attributesMap.put(JSG.CellAttributes.BOTTOMBORDERCOLOR, color.hex);

			const cmd = new JSG.CellAttributesCommand(sheetView.getOwnSelection().getRanges(), attributesMap);

			graphManager
				.getGraphViewer()
				.getInteractionHandler()
				.execute(cmd);
		} else if (
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			if (color.hex === 'transparent') {
				attributesMap.put(FormatAttributes.LINESTYLE, FormatAttributes.LineStyle.NONE);
			} else if (color.hex.toUpperCase() === '#FFFFFE') {
				attributesMap.put(FormatAttributes.LINECOLOR, 'auto');
				const f = this.state.cellFormat;
				const style = f && f.getLineStyle() ? f.getLineStyle().getValue() : '';
				if (style === FormatAttributes.LineStyle.NONE) {
					attributesMap.put(FormatAttributes.LINESTYLE, FormatAttributes.LineStyle.SOLID);
				}
			} else {
				attributesMap.put(FormatAttributes.LINECOLOR, color.hex);
				const f = this.state.cellFormat;
				const style = f && f.getLineStyle() ? f.getLineStyle().getValue() : '';
				if (style === FormatAttributes.LineStyle.NONE) {
					attributesMap.put(FormatAttributes.LINESTYLE, FormatAttributes.LineStyle.SOLID);
				}
			}
			graphManager
				.getGraphEditor()
				.getInteractionHandler()
				.applyFormatMap(attributesMap);
		}

		this.updateState();
		graphManager.getCanvas().focus();
	};

	onCommandStackChanged = (notification) => {
		const { commandStack } = notification.object;
		this.props.setJsgState({
			canUndo: commandStack.canUndo(),
			canRedo: commandStack.canRedo()
		});
	};

	onAlignSheets = () => {
		const container = graphManager.getGraph().getStreamSheetsContainer();
		if (container === undefined) {
			return;
		}

		const cmd = new CompoundCommand();
		const size = container.getSizeAsPoint();
		const getSheetAt = (index) => {
			let current = 0;
			let ret;
			container.enumerateStreamSheetContainers((sheet) => {
				if (index === current) {
					ret = sheet;
				}
				if (
					sheet
						.getItemAttributes()
						.getViewMode()
						.getValue() !== 1
				) {
					current += 1;
				}
			});

			return ret;
		};

		let x = 500;
		let y = 500;
		let count = 0;
		let maximizedSheet;

		container.enumerateStreamSheetContainers((sheet) => {
			if (
				sheet
					.getItemAttributes()
					.getViewMode()
					.getValue() !== 1
			) {
				count += 1;
			}
			if (
				sheet
					.getItemAttributes()
					.getViewMode()
					.getValue() === 2
			) {
				maximizedSheet = sheet;
			}
		});

		if (maximizedSheet) {
			graphManager.getGraph().setViewMode(maximizedSheet, 0);
			maximizedSheet._oldBoundingBox = undefined;
		}

		const horizontal = Math.ceil(Math.sqrt(count));
		const vertical = Math.ceil(count / horizontal);

		const height = (size.y - vertical * 500 - 500) / vertical;
		let width = (size.x - horizontal * 500 - 500) / horizontal;

		for (let i = 0; i < vertical; i += 1) {
			if (i === vertical - 1) {
				const rest = count - i * horizontal;
				width = (size.x - rest * 500 - 500) / rest;
			}
			for (let j = 0; j < horizontal; j += 1) {
				const sheet = getSheetAt(i * horizontal + j);
				if (sheet) {
					cmd.add(new MoveItemCommand(sheet, new Point(x + width / 2, y + height / 2)));
					cmd.add(new SetSizeCommand(sheet, new Size(width, height)));
					x += width + 500;
				}
			}
			y += height + 500;
			x = 500;
		}

		const controller = graphManager
			.getGraphViewer()
			.getGraphController()
			.getControllerByModelId(container.getId());
		if (controller) {
			controller.getView().getViewPort()._vpOffset.x = 0;
			controller.getView().getViewPort()._vpOffset.y = 0;
			controller
				.getView()
				.getScrollView()
				.setScrollPosition(0, 0);
		}

		graphManager
			.getGraphViewer()
			.getInteractionHandler()
			.execute(cmd);
		graphManager.getCanvas().focus();
	};

	getFormatBorderColor() {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const attr = this.state.cellAttributes;
			if (attr) {
				let lcolor = attr.getLeftBorderColor() ? attr.getLeftBorderColor().getValue() : '';
				const tcolor = attr.getTopBorderColor() ? attr.getTopBorderColor().getValue() : '';
				const rcolor = attr.getRightBorderColor() ? attr.getRightBorderColor().getValue() : '';
				const bcolor = attr.getBottomBorderColor() ? attr.getBottomBorderColor().getValue() : '';
				if (lcolor !== rcolor || lcolor !== tcolor || lcolor !== bcolor) {
					lcolor = '';
				}
				return lcolor;
			}
		} else if (
			graphManager.getGraphEditor() &&
			graphManager.getGraphEditor().getGraphViewer() &&
			graphManager
				.getGraphEditor()
				.getSelectionProvider()
				.hasSelection()
		) {
			const f = this.state.cellFormat;
			return f && f.getLineColor() ? f.getLineColor().getValue() : '';
		}

		const canvas = graphManager.getCanvas();
		if (canvas) {
			canvas.focus();
		}

		return '';
	}

	isChartSelected() {
		const selection = graphManager.getGraphViewer().getSelection();
		return selection && selection.length && selection[0].getModel() instanceof SheetPlotNode;
	}

	isChartElementSelected() {
		const selection = graphManager.getGraphViewer().getSelection();
		if (selection && selection.length) {
			const cont = selection[0];
			if (cont.getModel() instanceof SheetPlotNode) {
				return cont.getView().chartSelection !== undefined;
			}
		}
		return false;
	}

	fillColorToRGBAObject(format) {
		let color = format && format.getFillColor() ? format.getFillColor().getValue() : '#FFFFFF';
		if (color.length && color[0] !== '#') {
			return color;
		}

		color = Strings.cut(color, '#');
		// cut off a leading #
		color = parseInt(color, 16);
		const r = color >> 16;
		const g = (color >> 8) & 0xff;
		const b = color & 0xff;
		const a = format ? format.getTransparency().getValue() / 100 : 1;

		return { r, g, b, a };
	}

	updateState(state = {}) {
		const selection = graphManager.getGraphViewer().getSelection();
		if (selection.length) {
			if (selection[0].getModel() instanceof SheetPlotNode) {
				state.cellTextFormat = selection[0].getView().getSelectedTextFormat();
				state.cellFormat = selection[0].getView().getSelectedFormat();
			} else {
				state.cellTextFormat = TextFormatAttributes.retainFromSelection(selection);
				state.cellFormat = FormatAttributes.retainFromSelection(selection);
			}
		} else if (this.props.cellSelected) {
			const sheetView = graphManager.getActiveSheetView();
			if (sheetView) {
				const item = sheetView.getItem();
				const cell = item.getOwnSelection().getActiveCell();
				if (cell !== undefined) {
					state.cellTextFormat = item.getTextFormatAt(cell);
					state.cellFormat = item.getFormatAt(cell);
					state.cellAttributes = item.getCellAttributesAt(cell);
				}
			}
		}

		this.setState(state);
	}

	handleState = (state) => {
		this.props.setAppState(state);
	};

	handleZoom = (factor) => {
		graphManager.getGraphEditor().setZoom(factor / 100);
		this.updateState();
	};

	redo = () => {
		this.props.redoCommand(this.props.machineId);
		graphManager.getCanvas().focus();
	};

	undo = () => {
		this.props.undoCommand(this.props.machineId);
		graphManager.getCanvas().focus();
	};

	isMachinePage() {
		return window.location.href.indexOf('/machines/') > 0;
	}

	handleFocus = () => {
		graphManager.getCanvas().focus();
	};

	getPresetColors() {
		const colors = [
			'#000000',
			'#434343',
			'#666666',
			'#999999',
			'#b7b7b7',
			'#cccccc',
			'#d9d9d9',
			'#efefef',
			'#f3f3f3',
			'#ffffff',
			'#980000',
			'#ff0000',
			'#ff9900',
			'#ffff00',
			'#00ff00',
			'#00ffff',
			'#4a86e8',
			'#0000ff',
			'#9900ff',
			'#ff00ff',
			'#e6b8af',
			'#f4cccc',
			'#fce5cd',
			'#fff2cc',
			'#d9ead3',
			'#d0e0e3',
			'#c9daf8',
			'#cfe2f3',
			'#d9d2e9',
			'#ead1dc',
			'#dd7e6b',
			'#ea9999',
			'#f9cb9c',
			'#ffe599',
			'#b6d7a8',
			'#a2c4c9',
			'#a4c2f4',
			'#9fc5e8',
			'#b4a7d6',
			'#d5a6bd',
			'#cc4125',
			'#e06666',
			'#f6b26b',
			'#ffd966',
			'#93c47d',
			'#76a5af',
			'#6d9eeb',
			'#6fa8dc',
			'#8e7cc3',
			'#c27ba0',
			'#a61c00',
			'#cc0000',
			'#e69138',
			'#f1c232',
			'#6aa84f',
			'#45818e',
			'#3c78d8',
			'#3d85c6',
			'#674ea7',
			'#a64d79',
			'#85200c',
			'#990000',
			'#b45f06',
			'#bf9000',
			'#38761d',
			'#134f5c',
			'#1155cc',
			'#0b5394',
			'#351c75',
			'#741b47',
			'#5b0f00',
			'#660000',
			'#783f04',
			'#7f6000',
			'#274e13',
			'#0c343d',
			'#1c4587',
			'#073763',
			'#20124d',
			'#4c1130'
		];

		colors.push({ title: 'None', color: 'transparent' });
		if (this.isChartElementSelected()) {
			colors.push({ title: 'Automatic', color: '#FFFFFE' });
		}

		return colors;
	}

	render() {
		const canEdit = accessManager.can(RESOURCE_TYPES.MACHINE, RESOURCE_ACTIONS.EDIT);
		const { classes } = this.props;
		if (!this.isMachinePage(this.props) || !canEdit) {
			return null;
		}
		const { viewMode } = this.props;
		if (viewMode.viewMode !== null) {
			return null;
		}
		const tf = this.state.cellTextFormat;
		const f = this.state.cellFormat;
		const gridTitleColor = this.props.theme.overrides.MuiAppBar.colorPrimary.backgroundColor;
		return (
			<AppBar
				elevation={0}
				color="default"
				style={{
					height: '37px',
					minHeight: '37px',
					margin: 0,
					padding: '0px 0px 0px 6px',
					position: 'relative',
					width: '100%',
					borderBottom: '1px solid #AAAAAA',
					borderTop: '1px solid #AAAAAA',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'row'
				}}
			>
				<Tooltip enterDelay={300} title={<FormattedMessage id="Tooltip.Undo" defaultMessage="Undo" />}>
					<div>
						<IconButton style={buttonStyle} onClick={(e) => this.onUndo(e)} disabled={!this.props.canUndo}>
							<UndoIcon />
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip enterDelay={300} title={<FormattedMessage id="Tooltip.Redo" defaultMessage="Redo" />}>
					<div>
						<IconButton style={buttonStyle} onClick={(e) => this.onRedo(e)} disabled={!this.props.canRedo}>
							<RedoIcon />
						</IconButton>
					</div>
				</Tooltip>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA',
						height: '40px',
						margin: '0px 8px'
					}}
				/>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.FormatCells" defaultMessage="Format Cells" />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onFormatCells}
							disabled={!this.props.cellSelected}
						>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M21.7,13.35L20.7,14.35L18.65,12.3L19.65,11.3C19.86,11.08 20.21,11.08 20.42,11.3L21.7,12.58C21.92,12.79 21.92,13.14 21.7,13.35M12,18.94L18.07,12.88L20.12,14.93L14.06,21H12V18.94M4,2H18A2,2 0 0,1 20,4V8.17L16.17,12H12V16.17L10.17,18H4A2,2 0 0,1 2,16V4A2,2 0 0,1 4,2M4,6V10H10V6H4M12,6V10H18V6H12M4,12V16H10V12H4Z"
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA',
						height: '40px',
						margin: '0px 8px'
					}}
				/>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.FormatThousands" defaultMessage="Show Thousand Separators" />}
				>
					<div>
						<IconButton
							onClick={() => this.onFormatDecimals(undefined, true)}
							disabled={!this.props.cellSelected}
							style={buttonStyle}
						>
							<SvgIcon>
								<text x="12" y="12" fontWeight="bold" fontSize="9pt" dy="0.25em" textAnchor="middle">
									000
								</text>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.FormatPercent" defaultMessage="Numberformat Percent" />}
				>
					<div>
						<IconButton
							onClick={this.onFormatPercent}
							disabled={!this.props.cellSelected}
							style={buttonStyle}
						>
							<SvgIcon>
								<text x="12" y="12" fontWeight="bold" fontSize="12pt" dy="0.25em" textAnchor="middle">
									%
								</text>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.FormatDecimalsLess" defaultMessage="Show less deoimals" />}
				>
					<div>
						<IconButton
							onClick={() => this.onFormatDecimals(false)}
							disabled={!this.props.cellSelected}
							style={buttonStyle}
						>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M12,17L15,20V18H21V16H15V14L12,17M9,5A3,3 0 0,1 12,8V11A3,3 0 0,1 9,14A3,3 0 0,1 6,11V8A3,3 0 0,1 9,5M9,7A1,1 0 0,0 8,8V11A1,1 0 0,0 9,12A1,1 0 0,0 10,11V8A1,1 0 0,0 9,7M4,12A1,1 0 0,1 5,13A1,1 0 0,1 4,14A1,1 0 0,1 3,13A1,1 0 0,1 4,12Z"
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.FormatDecimalsMore" defaultMessage="Show more deoimals" />}
				>
					<div>
						<IconButton
							onClick={() => this.onFormatDecimals(true)}
							disabled={!this.props.cellSelected}
							style={buttonStyle}
						>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M22,17L19,20V18H13V16H19V14L22,17M9,5A3,3 0 0,1 12,8V11A3,3 0 0,1 9,14A3,3 0 0,1 6,11V8A3,3 0 0,1 9,5M9,7A1,1 0 0,0 8,8V11A1,1 0 0,0 9,12A1,1 0 0,0 10,11V8A1,1 0 0,0 9,7M16,5A3,3 0 0,1 19,8V11A3,3 0 0,1 16,14A3,3 0 0,1 13,11V8A3,3 0 0,1 16,5M16,7A1,1 0 0,0 15,8V11A1,1 0 0,0 16,12A1,1 0 0,0 17,11V8A1,1 0 0,0 16,7M4,12A1,1 0 0,1 5,13A1,1 0 0,1 4,14A1,1 0 0,1 3,13A1,1 0 0,1 4,12Z"
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.FormatDecimalsSelect" defaultMessage="Choose Numberformat" />}
				>
					<div>
						<IconButton
							onClick={this.onShowNumberFormat}
							disabled={!this.props.cellSelected && !this.state.graphSelected}
							style={{
								height: '34px',
								width: '70px',
								padding: '0px',
								marginTop: '1px'
							}}
						>
							<span
								style={{
									fontWeight: 'bold',
									fontSize: '10pt'
								}}
							>
								123
							</span>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M7,10L12,15L17,10H7Z"
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.showNumberFormat}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onCloseNumberFormat}
					onExited={this.handleFocus}
				>
					<MenuList>
						{numberFormats.map((format) =>
							format.id[0] === '-' ? (
								<Divider key={format.id} />
							) : (
								<MenuItem
									key={format.id}
									onClick={() => this.onFormatNumberFormat(format)}
									style={{
										fontSize: '10pt',
										width: '250px',
										padding: '8px 16px'
									}}
								>
									<div>
										<div
											style={{
												textAlign: 'left',
												display: 'inline-block',
												width: '125px'
											}}
										>
											{intl.formatMessage({ id: format.id }, {})}
										</div>
										<div
											style={{
												textAlign: 'right',
												display: 'inline-block',
												width: '125px'
											}}
										>
											{
												NumberFormatter.formatNumber(format.nf, format.value, format.type)
													.formattedValue
											}
										</div>
									</div>
								</MenuItem>
							)
						)}
					</MenuList>
				</Popover>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA',
						height: '40px',
						margin: '0px 8px 0px 0px'
					}}
				/>
				<Select
					style={{
						width: '120px',
						fontSize: '0.85rem'
					}}
					id="font-name"
					value={tf && tf.getFontName() ? tf.getFontName().getValue() : ''}
					onChange={(event) => this.onFormatFontName(event)}
					input={<Input name="font-name" id="font-name" />}
					className={classes.select}
					inputProps={{
						style: { paddingLeft: '5px', paddingTop: '6px' }
					}}
				>
					{/*<option style={optionStyle} hidden value="" />*/}
					<MenuItem dense value="Arial" key="s1">
						Arial
					</MenuItem>
					<MenuItem dense value="Courier New" key="s2">
						Courier New
					</MenuItem>
					<MenuItem dense value="Georgia" key="s3">
						Georgia
					</MenuItem>
					<MenuItem dense value="Lucida Console" key="s4">
						Lucida Console
					</MenuItem>
					<MenuItem dense value="Lucida Sans" key="s5">
						Lucida Sans
					</MenuItem>
					<MenuItem dense value="Palatino" key="s6">
						Palatino
					</MenuItem>
					<MenuItem dense value="Tahoma" key="s7">
						Tahoma
					</MenuItem>
					<MenuItem dense value="Trebuchet MS" key="s8">
						Trebuchet MS
					</MenuItem>
					<MenuItem dense value="Tahoma" key="s9">
						Tahoma
					</MenuItem>
					<MenuItem dense value="Verdana" key="s10">
						Verdana
					</MenuItem>
					{/* <option value="MetaPlusLF">MetaPlusLF</option> */}
				</Select>
				<Select
					style={{
						width: '50px',
						marginLeft: '10px',
						fontSize: '0.85rem'
					}}
					id="font-size"
					value={tf && tf.getFontSize() ? tf.getFontSize().getValue() : ''}
					onChange={(event) => this.onFormatFontSize(event)}
					input={<Input name="font-size" id="font-size" />}
					className={classes.select}
					inputProps={{
						style: { paddingLeft: '5px', paddingTop: '6px' }
					}}
				>
					<MenuItem dense value="6" key="fs1">
						6
					</MenuItem>
					<MenuItem dense value="7" key="fs2">
						7
					</MenuItem>
					<MenuItem dense value="8" key="fs3">
						8
					</MenuItem>
					<MenuItem dense value="9" key="fs4">
						9
					</MenuItem>
					<MenuItem dense value="10" key="fs5">
						10
					</MenuItem>
					<MenuItem dense value="11" key="fs6">
						11
					</MenuItem>
					<MenuItem dense value="12" key="fs7">
						12
					</MenuItem>
					<MenuItem dense value="14" key="fs8">
						14
					</MenuItem>
					<MenuItem dense value="18" key="fs9">
						18
					</MenuItem>
					<MenuItem dense value="24" key="fs10">
						24
					</MenuItem>
					<MenuItem dense value="36" key="fs11">
						36
					</MenuItem>
				</Select>
				<Tooltip enterDelay={300} title={<FormattedMessage id="Tooltip.FormatBold" defaultMessage="Bold" />}>
					<div>
						<IconButton
							style={{
								marginLeft: '10px',
								fontSize: '16pt',
								width: '34px',
								height: '27px',
								margin: '5px 0px 0px 0px',
								borderRadius: '0%',
								backgroundColor:
									tf &&
									tf.getFontStyle() &&
									tf.getFontStyle().getValue() & TextFormatAttributes.FontStyle.BOLD
										? '#CCCCCC'
										: 'transparent'
							}}
							onClick={this.onFormatBold}
							disabled={!this.props.cellSelected && !this.state.graphSelected}
						>
							<BoldIcon fontSize="inherit" />
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.FormatItalic" defaultMessage="Italic" />}
				>
					<div>
						<IconButton
							style={{
								width: '34px',
								height: '27px',
								margin: '5px 0px 0px 0px',
								fontSize: '16pt',
								borderRadius: '0%',
								backgroundColor:
									tf &&
									tf.getFontStyle() &&
									tf.getFontStyle().getValue() & TextFormatAttributes.FontStyle.ITALIC
										? '#CCCCCC'
										: 'transparent'
							}}
							onClick={this.onFormatItalic}
							disabled={!this.props.cellSelected && !this.state.graphSelected}
						>
							<ItalicIcon fontSize="inherit" />
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.FormatFontColor" defaultMessage="Font Color" />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onShowFontColor}
							disabled={!this.props.cellSelected && !this.state.graphSelected}
						>
							<SvgIcon fontSize="inherit">
								<path
									fill={tf && tf.getFontColor() ? tf.getFontColor().getValue() : ''}
									d="M0 20h24v4H0z"
								/>
								<path d="M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z" />
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.showFontColor}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onCloseFontColor}
					onExited={this.handleFocus}
				>
					<SketchPicker
						style={{
							boxShadow: 'none !important',
							backgroundColor: 'inherit'
						}}
						classes={{ 'sketch-picker': classes.default }}
						width={250}
						disableAlpha
						presetColors={this.getPresetColors()}
						color={tf && tf.getFontColor() ? tf.getFontColor().getValue() : ''}
						onChange={this.onFormatFontColor}
					/>
				</Popover>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA',
						height: '40px',
						margin: '0px 8px'
					}}
				/>
				<CustomTooltip header="Tooltip.FormatHAlignHeader" message="Tooltip.FormatHAlignMessage">
					<div>
						<IconButton
							style={{
								height: '34px',
								width: '50px',
								padding: '0px',
								fontSize: '16pt'
							}}
							onClick={this.onShowHAlign}
							disabled={!this.props.cellSelected && !this.state.graphSelected}
						>
							{tf && tf.getHorizontalAlignment() && tf.getHorizontalAlignment().getValue() === 3 ? (
								<FormatAlignJustify fontSize="inherit" />
							) : null}
							{tf && tf.getHorizontalAlignment() && tf.getHorizontalAlignment().getValue() === 0 ? (
								<FormatAlignLeft fontSize="inherit" />
							) : null}
							{tf && tf.getHorizontalAlignment() && tf.getHorizontalAlignment().getValue() === 1 ? (
								<FormatAlignCenter fontSize="inherit" />
							) : null}
							{tf && tf.getHorizontalAlignment() && tf.getHorizontalAlignment().getValue() === 2 ? (
								<FormatAlignRight fontSize="inherit" />
							) : null}
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M7,10L12,15L17,10H7Z"
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</CustomTooltip>
				<Popover
					open={this.state.showHAlign}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onCloseHAlign}
					onExited={this.handleFocus}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={4}
						cellHeight={36}
						spacing={0}
						style={{
							width: '160px',
							margin: '3px'
						}}
					>
						<GridListTile cols={1}>
							<CustomTooltip
								header="Tooltip.FormatHAlignStandardHeader"
								message="Tooltip.FormatHAlignStandardMessage"
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatHorizontalAlign(3)}>
									<FormatAlignJustify />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<CustomTooltip
								header="Tooltip.FormatHAlignLeftHeader"
								message="Tooltip.FormatHAlignLeftMessage"
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatHorizontalAlign(0)}>
									<FormatAlignLeft />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<CustomTooltip
								header="Tooltip.FormatHAlignCenterHeader"
								message="Tooltip.FormatHAlignCenterMessage"
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatHorizontalAlign(1)}>
									<FormatAlignCenter />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<CustomTooltip
								header="Tooltip.FormatHAlignRightHeader"
								message="Tooltip.FormatHAlignRightMessage"
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatHorizontalAlign(2)}>
									<FormatAlignRight />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
					</GridList>
				</Popover>
				<CustomTooltip header="Tooltip.FormatVAlignHeader" message="Tooltip.FormatVAlignMessage">
					<div>
						<IconButton
							style={{
								height: '34px',
								width: '50px',
								padding: '0px',
								fontSize: '16pt'
							}}
							onClick={this.onShowVAlign}
							disabled={!this.props.cellSelected}
						>
							{tf && tf.getVerticalAlignment() && tf.getVerticalAlignment().getValue() === 0 ? (
								<VerticalAlignTop fontSize="inherit" />
							) : null}
							{tf && tf.getVerticalAlignment() && tf.getVerticalAlignment().getValue() === 1 ? (
								<VerticalAlignCenter fontSize="inherit" />
							) : null}
							{tf && tf.getVerticalAlignment() && tf.getVerticalAlignment().getValue() === 2 ? (
								<VerticalAlignBottom fontSize="inherit" />
							) : null}
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M7,10L12,15L17,10H7Z"
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</CustomTooltip>
				<Popover
					open={this.state.showVAlign}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onCloseVAlign}
					onExited={this.handleFocus}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={3}
						cellHeight={36}
						spacing={2}
						style={{
							width: '120px',
							margin: '3px'
						}}
					>
						<GridListTile cols={1}>
							<CustomTooltip
								header="Tooltip.FormatVAlignTopHeader"
								message="Tooltip.FormatVAlignTopMessage"
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatVerticalAlign(0)}>
									<VerticalAlignTop />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<CustomTooltip
								header="Tooltip.FormatVAlignCenterHeader"
								message="Tooltip.FormatVAlignCenterMessage"
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatVerticalAlign(1)}>
									<VerticalAlignCenter />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<CustomTooltip
								header="Tooltip.FormatVAlignBottomHeader"
								message="Tooltip.FormatVAlignBottomMessage"
							>
								<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatVerticalAlign(2)}>
									<VerticalAlignBottom />
								</IconButton>
							</CustomTooltip>
						</GridListTile>
					</GridList>
				</Popover>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA',
						height: '40px',
						margin: '0px 8px 0px 0px'
					}}
				/>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.FormatFillColor" defaultMessage="Fill Color" />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onShowFillColor}
							disabled={!this.props.cellSelected && !this.state.graphSelected}
						>
							<SvgIcon fontSize="inherit">
								<path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z" />
								<path
									fill={f && f.getFillColor() ? f.getFillColor().getValue() : 'none'}
									d="M0 20h24v4H0z"
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.showFillColor}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onExited={this.handleFocus}
					onClose={this.onCloseFillColor}
				>
					<SketchPicker
						disableAlpha={!this.isChartSelected()}
						width={250}
						color={this.fillColorToRGBAObject(f)}
						presetColors={this.getPresetColors()}
						onChange={this.onFormatFillColor}
					/>
				</Popover>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.FormatLine" defaultMessage="Line Format" />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onShowBorderColor}
							disabled={!this.props.cellSelected && !this.state.graphSelected}
						>
							<SvgIcon fontSize="inherit">
								<path d="M17.75 7L14 3.25l-10 10V17h3.75l10-10zm2.96-2.96c.39-.39.39-1.02 0-1.41L18.37.29a.9959.9959 0 0 0-1.41 0L15 2.25 18.75 6l1.96-1.96z" />
								<path fill={this.getFormatBorderColor()} d="M0 20h24v4H0z" />
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.showBorderColor}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onExited={this.handleFocus}
					onClose={this.onCloseBorderColor}
				>
					<SketchPicker
						disableAlpha
						width={250}
						color={this.getFormatBorderColor()}
						onChange={this.onFormatBorderColor}
						presetColors={this.getPresetColors()}
					/>
				</Popover>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.FormatBorder" defaultMessage="Border Format" />}
				>
					<div>
						<IconButton style={buttonStyle} onClick={this.onShowBorder} disabled={!this.props.cellSelected}>
							<BorderAllIcon fontSize="inherit" />
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.borderOpen}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onBorderClose}
					onExited={this.handleFocus}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={5}
						cellHeight={36}
						spacing={2}
						style={{
							width: '200px',
							margin: '4px'
						}}
					>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('all')}>
								<BorderAllIcon fontSize="inherit" />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('inner')}>
								<BorderInnerIcon fontSize="inherit" />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('horizontal')}>
								<BorderHorizontalIcon fontSize="inherit" />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('vertical')}>
								<BorderVerticalIcon fontSize="inherit" />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('outer')}>
								<BorderOuterIcon fontSize="inherit" />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('left')}>
								<BorderLeftIcon fontSize="inherit" />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('top')}>
								<BorderTopIcon fontSize="inherit" />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('right')}>
								<BorderRightIcon fontSize="inherit" />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('bottom')}>
								<BorderBottomIcon fontSize="inherit" />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onFormatBorder('clear')}>
								<BorderClearIcon fontSize="inherit" />
							</IconButton>
						</GridListTile>
					</GridList>
				</Popover>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.BorderStyle" defaultMessage="Border Style" />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onShowBorderStyle}
							disabled={!this.props.cellSelected && !this.state.graphSelected}
						>
							<SvgIcon>
								<path d="M3,16H8V14H3V16M9.5,16H14.5V14H9.5V16M16,16H21V14H16V16M3,20H5V18H3V20M7,20H9V18H7V20M11,20H13V18H11V20M15,20H17V18H15V20M19,20H21V18H19V20M3,12H11V10H3V12M13,12H21V10H13V12M3,4V8H21V4H3Z" />
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.showBorderStyle}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onExited={this.handleFocus}
					onClose={this.onCloseBorderStyle}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={1}
						cellHeight={22}
						spacing={4}
						style={{
							width: '110px',
							margin: '1px'
						}}
					>
						<GridListTile
							cols={1}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="BorderStyle" defaultMessage="Border Style" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.NONE)}
							>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<text
										x="50"
										y="14"
										fontWeight="normal"
										fontSize="9pt"
										dy="0.25em"
										textAnchor="middle"
									>
										{intl.formatMessage({ id: 'None' }, {})}
									</text>
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.SOLID)}
							>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									stroke="currentColor"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M5,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.DOT)}
							>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									stroke="currentColor"
									strokeDasharray="1,2"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M5,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.DASH)}
							>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									stroke="currentColor"
									strokeDasharray="5,5"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M5,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.DASHDOT)}
							>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									stroke="currentColor"
									strokeDasharray="5,5,1,5"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M5,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={borderStyle}
								onClick={() => this.onFormatBorderStyle(FormatAttributes.LineStyle.DASHDOTDOT)}
							>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									stroke="currentColor"
									strokeDasharray="5,5,1,2,1,5"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M5,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={1}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="BorderWidth" defaultMessage="Border Width" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(-1)}>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<text x="35" y="14" fontWeight="normal" fontSize="8pt" dy="0.25em" textAnchor="end">
										1 px
									</text>
									<path stroke="currentColor" d="M42,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(25)}>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<text x="35" y="14" fontWeight="normal" fontSize="8pt" dy="0.25em" textAnchor="end">
										1/4 mm
									</text>
									<path stroke="currentColor" strokeWidth="0.25mm" d="M42,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(50)}>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<text x="35" y="14" fontWeight="normal" fontSize="8pt" dy="0.25em" textAnchor="end">
										1/2 mm
									</text>
									<path stroke="currentColor" strokeWidth="0.5mm" d="M42,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(75)}>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<text x="35" y="14" fontWeight="normal" fontSize="8pt" dy="0.25em" textAnchor="end">
										3/4 mm
									</text>
									<path stroke="currentColor" strokeWidth="0.75mm" d="M42,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(100)}>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<text x="35" y="14" fontWeight="normal" fontSize="8pt" dy="0.25em" textAnchor="end">
										1 mm
									</text>
									<path stroke="currentColor" strokeWidth="1mm" d="M42,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(200)}>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<text x="35" y="14" fontWeight="normal" fontSize="8pt" dy="0.25em" textAnchor="end">
										2 mm
									</text>
									<path stroke="currentColor" strokeWidth="2mm" d="M42,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(300)}>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<text x="35" y="14" fontWeight="normal" fontSize="8pt" dy="0.25em" textAnchor="end">
										2 mm
									</text>
									<path stroke="currentColor" strokeWidth="2mm" d="M42,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={borderStyle} onClick={() => this.onFormatBorderWidth(400)}>
								<svg
									width="100"
									height="28"
									viewBox="0 0 100 28"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<text x="35" y="14" fontWeight="normal" fontSize="8pt" dy="0.25em" textAnchor="end">
										4 mm
									</text>
									<path stroke="currentColor" strokeWidth="4mm" d="M42,14 L95,14" />
								</svg>
							</IconButton>
						</GridListTile>
					</GridList>
				</Popover>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA',
						height: '40px',
						margin: '0px 8px'
					}}
				/>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.PasteFunction" defaultMessage="PasteFunction" />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={(e) => this.onPasteFunction(e)}
							disabled={!this.props.cellSelected}
						>
							<SvgIcon>
								<text
									x="10"
									y="12"
									fontStyle="italic"
									fontWeight="bold"
									fontSize="12pt"
									dy="0.25em"
									textAnchor="end"
								>
									f
								</text>
								<text x="12" y="12" fontWeight="bold" fontSize="8pt" dy="0.25em" textAnchor="left">
									(x)
								</text>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={
						<FormattedMessage id="Tooltip.InsertStreamFunction" defaultMessage="Insert Stream Function" />
					}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={(e) => this.onStreamFunction(e)}
							disabled={!this.props.cellSelected}
						>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M16.79,23C16.37,22.83 16.07,22.45 16,22C15.95,21.74 16,21.56 16.4,20.84C17.9,18.14 18.67,15.09 18.63,12C18.67,9 17.94,6.07 16.5,3.44C16.29,3 16.1,2.58 15.94,2.13C16,1.75 16.19,1.4 16.5,1.19C16.95,0.95 17.5,1 17.91,1.28C18.19,1.64 18.43,2 18.63,2.42C19.71,4.5 20.44,6.7 20.8,9C21.03,10.81 21.06,12.65 20.89,14.47C20.58,16.81 19.89,19.07 18.83,21.18C18.19,22.46 17.83,23 17.45,23C17.37,23 17.28,23 17.2,23C17.06,23 16.93,23 16.79,23V23M12.43,20.79C11.86,20.63 11.5,20.05 11.62,19.47C11.62,19.35 11.93,18.8 12.21,18.24C13.39,15.97 13.9,13.41 13.67,10.86C13.53,9.03 13,7.25 12.13,5.64C11.5,4.38 11.46,4.18 11.83,3.64C12.27,3.15 13,3.08 13.54,3.5C14.26,4.56 14.83,5.72 15.25,6.94C16.53,10.73 16.33,14.86 14.69,18.5C13.85,20.39 13.26,21 12.43,20.74V20.79M7.93,18.56C7.57,18.4 7.3,18.08 7.2,17.7C7.2,17.5 7.2,17.24 7.65,16.44C9.14,13.74 9.14,10.46 7.65,7.76C7,6.5 7,6.24 7.53,5.76C7.72,5.54 8,5.43 8.3,5.47C8.94,5.47 9.3,5.78 9.84,6.91C10.69,8.47 11.13,10.22 11.12,12C11.16,13.81 10.72,15.61 9.85,17.2C9.31,18.25 9.04,18.5 8.5,18.59C8.31,18.61 8.11,18.59 7.93,18.5V18.56M3.72,16.43C3.39,16.27 3.13,16 3,15.65C2.9,15.3 3,15 3.4,14.36C3.9,13.68 4.14,12.84 4.09,12C4.16,11.15 3.93,10.31 3.44,9.61C3.27,9.36 3.13,9.09 3,8.82C2.89,8.19 3.31,7.59 4,7.47C4.54,7.37 4.92,7.6 5.42,8.36C6.87,10.57 6.87,13.42 5.42,15.63C4.91,16.4 4.33,16.63 3.73,16.43H3.72Z"
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.EditNames" defaultMessage="Edit Names" />}
				>
					<div>
						<IconButton style={buttonStyle} onClick={(e) => this.onEditNames(e)}>
							<EditNamesIcon fontSize="inherit" />
						</IconButton>
					</div>
				</Tooltip>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA',
						height: '40px',
						margin: '0px 8px'
					}}
				/>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.InsertTool" defaultMessage="Insert Tool" />}
				>
					<div>
						<IconButton style={buttonStyle} onClick={this.onShowTools}>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z"
								/>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.toolsOpen}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'right', vertical: 'top' }}
					onExited={this.handleFocus}
					onClose={this.onToolsClose}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={6}
						cellHeight={35}
						spacing={2}
						style={{
							width: '240px',
							margin: '2px'
						}}
					>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="ToolsStandard" defaultMessage="Standard" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreateLine}>
								<SvgIcon>
									<path d="M3.5 22 L22 3.5 L20.5 2 L2 20.5 Z" />
								</SvgIcon>
								{/* <ToolLineIcon /> */}
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreateArrow}>
								<ToolArrowIcon />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreateRectangle}>
								<ToolRectangleIcon />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreateEllipse}>
								<ToolEllipseIcon />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreateText}>
								<ToolTextIcon />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={this.onCreatePolyline}>
								<ToolPolylineIcon />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arc')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 32">
									<path
										fill="none"
										strokeWidth="2.5px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M24,12 C24,5.42 18.58,0 12,0 C5.42,0 0,5.42 0,12 C0,18.58 5.42,24 12,24"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arcclosed')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 32">
									<path
										fill="none"
										strokeWidth="2.5px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M24,12 C24,5.42 18.58,0 12,0 C5.42,0 0,5.42 0,12 C0,18.58 5.42,24 12,24 C12,24 24,12 24,12 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('pie')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 32">
									<path
										fill="none"
										strokeWidth="2.5px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M24,12 C24,5.42 18.58,0 12,0 C5.42,0 0,5.42 0,12 C0,18.58 5.42,24 12,24 C12,24 12,12 12,12 C12,12 24,12 24,12 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="ToolsRectangles" defaultMessage="Rectangles" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('roundRect')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M6.6,0 C8.8,0 13.2,0 21.4,0 C25.03,0 28,2.97 28,6.6 C28,8.8 28,13.2 28,15.4 C28,19.03 25.03,22 21.4,22 C13.2,22 8.8,22 6.6,22 C2.97,22 0,19.03 0,15.4 C0,13.2 0,8.8 0,6.6 C0,2.97 2.97,0 6.6,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('roundRectCornerCut')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M0,0 C4.4,0 13.2,0 17.01,0 C23.06,0 28.01,4.95 28.01,11 C28.01,8.8 28.01,17.6 28.01,22 C17.6,22 4.4,22 0,22 C0,17.6 0,4.4 0,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('roundRectCornerCutSame')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M11,0 C8.8,0 13.2,0 17,0 C23.05,0 28,4.95 28,11 C28,8.8 28,13.2 28,22 C28,22 28,22 28,22 C13.2,22 8.8,22 0,22 C0,22 0,22 0,22 C0,13.2 0,8.8 0,11 C0,4.95 4.95,0 11,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('roundRectCornerCutDiagonal')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M0,0 C8.8,0 13.2,0 17.01,0 C23.06,0 28.01,4.95 28.01,11 C28.01,8.8 28.01,13.2 28.01,22 C28.01,22 28.01,22 28.01,22 C13.2,22 8.8,22 11,22 C4.95,22 0,17.05 0,11 C0,13.2 0,8.8 0,0 C0,0 0,0 0,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('rectCornerCut')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M0,0 L0,22 L28.01,22 L28.01,8.14 L19.87,0 L0,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('rectCornerCutSame')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M8.14,0 L0,8.14 L0,22 L0,22 L28.01,22 L28.01,22 L28.01,8.14 L19.87,0 L8.14,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('rectCornerCutDiagonal')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M8.2,0 L0,8.2 L0,22 L0,22 L19.8,22 L28,13.8 L28,0 L28,0 L8.2,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('trapezoidalTop')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M4.4,0 L23.6,0 L28,22 L0,22 L4.4,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('trapezoidalBottom')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M0,0 L28.01,0 L23.61,22 L4.4,22 L0,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('parallelogrammTopToRight')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M5.6,0 L28.01,0 L22.41,22 L0,22 L5.6,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('parallelogrammLeftToBottom')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M0,4.4 L28.01,0 L28.01,17.6 L0,22 L0,4.4 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="ToolsStars" defaultMessage="Stars" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('star3')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d="M12,9.5L13.2,13.5L16,16.5L12,15.6L7.9,16.5L10.7,13.5L12,9.5M12,2.6L9,12.4L2,19.9L12,17.6L22,20L15,12.5L12,2.6Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('star4')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d="M12,6.7L13.45,10.55L17.3,12L13.45,13.45L12,17.3L10.55,13.45L6.7,12L10.55,10.55L12,6.7M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('star5')}>
								<ToolStar />
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('star6')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 32">
									<path
										fill="none"
										strokeWidth="2px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M12,0 L14.4,7.82 L22.44,6 L16.8,12 L22.44,18 L14.4,16.18 L12,24 L9.6,16.18 L1.56,18 L7.2,12 L1.56,6 L9.6,7.82 L12,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('star8')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 32">
									<path
										fill="none"
										strokeWidth="2px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M12,0 L13.82,7.58 L20.52,3.48 L16.42,10.18 L24,12 L16.42,13.82 L20.52,20.52 L13.82,16.42 L12,24 L10.18,16.42 L3.48,20.52 L7.58,13.82 L0,12 L7.58,10.18 L3.48,3.48 L10.18,7.58 L12,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="ToolsArrows" defaultMessage="Arrows" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowLeft')}>
								<SvgIcon>
									<path d="M13,22L3,12L13,2V8H21V16H13V22M6,12L11,17V14H19V10H11V7L6,12Z" />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowRight')}>
								<SvgIcon>
									<path d="M11,16H3V8H11V2L21,12L11,22V16M13,7V10H5V14H13V17L18,12L13,7Z" />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowUp')}>
								<SvgIcon>
									<path d="M16,13V21H8V13H2L12,3L22,13H16M7,11H10V19H14V11H17L12,6L7,11Z" />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowDown')}>
								<SvgIcon>
									<path d="M22,11L12,21L2,11H8V3H16V11H22M12,18L17,13H14V5H10V13H7L12,18Z" />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowDblHorz')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d="M14,16V22L24,12L14,2V8H10V2L0,12L10,22V16H14M8,14V17L3,12L8,7V10H16V7L21,12L16,17V14H8Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowDblVert')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d="M16,10H22L12,0L2,10H8V14H2L12,24L22,14H16V10M14,16H17L12,21L7,16H10V8H7L12,3L17,8H14V16Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowTopLeft')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 32">
									<path
										fill="none"
										strokeWidth="2px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										d="M16.8,4.8 L14.4,4.8 L19.2,0 L24,4.8 L21.6,4.8 L21.6,21.6 L4.8,21.6 L4.8,24 L0,19.2 L4.8,14.4 L4.8,16.8 L16.8,16.8 L16.8,4.8 Z"
										// eslint-disable-next-line max-len
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('arrowTopRight')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 32">
									<path
										fill="none"
										strokeWidth="2px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M7.2,4.8 L9.6,4.8 L4.8,0 L0,4.8 L2.4,4.8 L2.4,21.6 L19.2,21.6 L19.2,24 L24,19.2 L19.2,14.4 L19.2,16.8 L7.2,16.8 L7.2,4.8 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="ToolsLegends" defaultMessage="Legends" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('callout')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M0,0 L28,0 L28,22 L9.8,22 L2.8,30.8 L4.2,22 L0,22 L0,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('calloutline')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M0,0 L28,0 L28,22 L7,22 L-0.28,34.32 L7,22 L0,22 L0,0 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('calloutroundrect')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M0,4.4 C0,1.98 1.98,0 4.4,0 C4.4,0 23.6,0 23.6,0 C26.02,0 28,1.98 28,4.4 C28,4.4 28,17.6 28,17.6 C28,20.02 26.02,22 23.6,22 C23.6,22 11.2,22 11.2,22 C11.2,22 2.8,30.8 2.8,30.8 C2.8,30.8 5.6,22 5.6,22 C5.6,22 4.4,22 4.4,22 C1.98,22 0,20.02 0,17.6 C0,17.6 0,4.4 0,4.4 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('calloutroundrectline')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M0,4.4 C0,1.98 1.98,0 4.4,0 C4.4,0 23.6,0 23.6,0 C26.02,0 28,1.98 28,4.4 C28,4.4 28,17.6 28,17.6 C28,20.02 26.02,22 23.6,22 C23.6,22 8.4,22 8.4,22 C8.4,22 2.8,30.8 2.8,30.8 C2.8,30.8 8.4,22 8.4,22 C8.4,22 4.4,22 4.4,22 C1.98,22 0,20.02 0,17.6 C0,17.6 0,4.4 0,4.4 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateTool('calloutround')}>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M11.08,21.76 C18.08,22.93 25.15,19.71 27.33,14.36 C29.52,9.01 26.14,3.15 19.58,0.91 C13.02,-1.33 5.28,0.72 1.78,5.63 C-1.71,10.53 0.11,16.79 5.98,20.01 C5.98,20.01 3.36,30.36 3.36,30.36 C3.36,30.36 11.08,21.76 11.08,21.76 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton
								style={{ padding: '5px' }}
								onClick={() => this.onCreateTool('calloutroundline')}
							>
								<SvgIcon style={{ stroke: 'currentColor' }} viewBox="-5 -5 32 38">
									<path
										fill="none"
										strokeWidth="3px"
										strokeLinejoin="miter"
										strokeMiterlimit="5"
										// eslint-disable-next-line max-len
										d="M8.31,21.05 C15.33,23.5 23.67,20.98 26.79,15.47 C29.91,9.95 26.7,3.4 19.69,0.95 C12.67,-1.5 4.33,1.02 1.21,6.53 C-1.91,12.05 1.29,18.6 8.31,21.05 C8.31,21.05 2.8,30.8 2.8,30.8 C2.8,30.8 8.31,21.05 8.31,21.05 Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="ToolsContainer" defaultMessage="Container" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateContainer('scale')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d="M13,11H18L16.5,9.5L17.92,8.08L21.84,12L17.92,15.92L16.5,14.5L18,13H13V18L14.5,16.5L15.92,17.92L12,21.84L8.08,17.92L9.5,16.5L11,18V13H6L7.5,14.5L6.08,15.92L2.16,12L6.08,8.08L7.5,9.5L6,11H11V6L9.5,7.5L8.08,6.08L12,2.16L15.92,6.08L14.5,7.5L13,6V11Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateContainer('top')}>
								<SvgIcon>
									<path d="M5,6.41L6.41,5L17,15.59V9H19V19H9V17H15.59L5,6.41Z" />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateContainer('bottom')}>
								<SvgIcon>
									<path d="M5,17.59L15.59,7H9V5H19V15H17V8.41L6.41,19L5,17.59Z" />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateContainer('matrix2')}>
								<SvgIcon>
									<path d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3" />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '23px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="ToolsControls" defaultMessage="Controls" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateControl('button')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,16.5L16,12L10,7.5V16.5Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateControl('checkbox')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d="M19,19H5V5H15V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V11H19M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateControl('slider')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d="M2,11 V13 H22 V11 Z"
									/>
									<circle cx="12" cy="12" r={4} />
								</SvgIcon>
							</IconButton>
						</GridListTile>
						<GridListTile cols={1}>
							<IconButton style={{ padding: '5px' }} onClick={() => this.onCreateControl('knob')}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d="M12,16A3,3 0 0,1 9,13C9,11.88 9.61,10.9 10.5,10.39L20.21,4.77L14.68,14.35C14.18,15.33 13.17,16 12,16M12,3C13.81,3 15.5,3.5 16.97,4.32L14.87,5.53C14,5.19 13,5 12,5A8,8 0 0,0 4,13C4,15.21 4.89,17.21 6.34,18.65H6.35C6.74,19.04 6.74,19.67 6.35,20.06C5.96,20.45 5.32,20.45 4.93,20.07V20.07C3.12,18.26 2,15.76 2,13A10,10 0 0,1 12,3M22,13C22,15.76 20.88,18.26 19.07,20.07V20.07C18.68,20.45 18.05,20.45 17.66,20.06C17.27,19.67 17.27,19.04 17.66,18.65V18.65C19.11,17.2 20,15.21 20,13C20,12 19.81,11 19.46,10.1L20.67,8C21.5,9.5 22,11.18 22,13Z"
									/>
								</SvgIcon>
							</IconButton>
						</GridListTile>
					</GridList>
				</Popover>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.InsertChart" defaultMessage="Show Chart Types" />}
				>
					<div>
						<IconButton
							style={buttonStyle}
							onClick={this.onShowCharts}
							disabled={!this.props.cellSelected && !this.isChartSelected()}
						>
							<SvgIcon>
								<path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z" />
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<Popover
					open={this.state.chartsOpen}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'right', vertical: 'top' }}
					onExited={this.handleFocus}
					onClose={this.onChartsClose}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={6}
						cellHeight={40}
						spacing={4}
						style={{
							width: '270px',
							margin: '1px'
						}}
					>
						<GridListTile
							cols={6}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="StreamChart.TypesColumn" defaultMessage="Bar and Column Charts" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.Column" defaultMessage="Column" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('column')}
								>
									<img alt="" src="images/charts/column.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={
									<FormattedMessage id="StreamChart.ColumnStacked" defaultMessage="Column Stacked" />
								}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('columnstacked')}
								>
									<img alt="" src="images/charts/columnstacked.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={
									<FormattedMessage
										id="StreamChart.ColumnStacked100"
										defaultMessage="Column Stacked 100"
									/>
								}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('columnstacked100')}
								>
									<img alt="" src="images/charts/columnstacked100.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.Bar" defaultMessage="Bar" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('bar')}
								>
									<img alt="" src="images/charts/bar.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.BarStacked" defaultMessage="Bar Stacked" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('barstacked')}
								>
									<img alt="" src="images/charts/barstacked.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={
									<FormattedMessage id="StreamChart.BarStacked100" defaultMessage="Bar Stacked 100" />
								}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('barstacked100')}
								>
									<img alt="" src="images/charts/barstacked100.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="StreamChart.TypesLine" defaultMessage="Line Charts" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.Line" defaultMessage="Line" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('line')}
								>
									<img alt="" src="images/charts/line.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.LineStacked" defaultMessage="Line Stacked" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('linestacked')}
								>
									<img alt="" src="images/charts/linestacked.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={
									<FormattedMessage
										id="StreamChart.LineStacked100"
										defaultMessage="Line Stacked 100"
									/>
								}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('linestacked100')}
								>
									<img alt="" src="images/charts/linestacked100.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.Step" defaultMessage="Line Step" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('linestep')}
								>
									<img alt="" src="images/charts/linestep.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.Profile" defaultMessage="Profile" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('profile')}
								>
									<img alt="" src="images/charts/profile.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="StreamChart.TypesArea" defaultMessage="Area Charts" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.Area" defaultMessage="Area" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('area')}
								>
									<img alt="" src="images/charts/area.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.AreaStacked" defaultMessage="Area Stacked" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('areastacked')}
								>
									<img alt="" src="images/charts/areastacked.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={
									<FormattedMessage
										id="StreamChart.AreaStacked100"
										defaultMessage="Area Stacked 100"
									/>
								}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('areastacked100')}
								>
									<img alt="" src="images/charts/areastacked100.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="StreamChart.TypesXY" defaultMessage="XY Charts" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.Scatter" defaultMessage="Scatter" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('scattermarker')}
								>
									<img alt="" src="images/charts/scattermarker.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={
									<FormattedMessage
										id="StreamChart.ScatterLineMarker"
										defaultMessage="Scatter with Line and Markers"
									/>
								}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('scatterlinemarker')}
								>
									<img alt="" src="images/charts/scatterlinemarker.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={
									<FormattedMessage id="StreamChart.ScatterLine" defaultMessage="Scatter with Line" />
								}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('scatterline')}
								>
									<img alt="" src="images/charts/scatterline.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.Bubble" defaultMessage="Bubble" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('bubble')}
								>
									<img alt="" src="images/charts/bubble.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.Heatmap" defaultMessage="Heatmap" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('heatmap')}
								>
									<img alt="" src="images/charts/heatmap.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '24px'
							}}
						>
							<div
								style={{
									backgroundColor: gridTitleColor,
									color: 'white',
									fontSize: '9pt',
									padding: '3px'
								}}
							>
								<FormattedMessage id="StreamChart.TypesPie" defaultMessage="Pie and Doughnut Charts" />
							</div>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.Pie" defaultMessage="Pie" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('pie')}
								>
									<img alt="" src="images/charts/pie.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.HalfPie" defaultMessage="Half Pie" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('piehalf')}
								>
									<img alt="" src="images/charts/halfpie.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.3dPie" defaultMessage="3D Pie" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('pie3d')}
								>
									<img alt="" src="images/charts/pie3d.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<GridListTile cols={1}>
							<Tooltip
								enterDelay={300}
								title={<FormattedMessage id="StreamChart.Doughnut" defaultMessage="Doughnut" />}
							>
								<IconButton
									style={{ borderRadius: '0%', padding: '0px', width: '40px', height: '40px' }}
									onClick={() => this.onCreatePlot('doughnut')}
								>
									<img alt="" src="images/charts/doughnut.png" />
								</IconButton>
							</Tooltip>
						</GridListTile>
						<ChartExtensions titleColor={gridTitleColor} onCreatePlot={this.onCreatePlot} />
					</GridList>
				</Popover>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.SelectShapes" defaultMessage="Select Shapes" />}
				>
					<div>
						<IconButton onClick={this.onSelectShapes} style={buttonStyle}>
							<SvgIcon>
								<g>
									<path d="M11,17V19H9V17H11M7,17V19H5V17H7M19,9V11H17V9H19M19,5V7H17V5H19M15,5V7H13V5H15M11,5V7H9V5H11M7,5V7H5V5H7M7,13V15H5V13H7M7,9V11H5V9H7Z" />
									<path
										transform="translate(10 10) scale(0.6 0.6)"
										d="M10.07,14.27C10.57,14.03 11.16,14.25 11.4,14.75L13.7,19.74L15.5,18.89L13.19,13.91C12.95,13.41 13.17,12.81 13.67,12.58L13.95,12.5L16.25,12.05L8,5.12V15.9L9.82,14.43L10.07,14.27M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.47,2.09 7.64,2.23L7.65,2.22L19.14,11.86C19.57,12.22 19.62,12.85 19.27,13.27C19.12,13.45 18.91,13.57 18.7,13.61L15.54,14.23L17.74,18.96C18,19.46 17.76,20.05 17.26,20.28L13.64,21.97Z"
									/>
								</g>
							</SvgIcon>
						</IconButton>
					</div>
				</Tooltip>
				<div
					style={{
						borderLeft: '1px solid #AAAAAA',
						height: '40px',
						margin: '0px 8px'
					}}
				/>
				<WidthHelper width={1200}>
					<div
						style={{
							right: '10px',
							position: 'absolute'
						}}
					>
						<CustomTooltip header="Tooltip.ZoomHeader" message="Tooltip.ZoomMessage">
							<IconButton style={buttonStyle} aria-label="Zoom" onClick={this.onShowZoom}>
								<ZoomIcon fontSize="inherit" />
							</IconButton>
						</CustomTooltip>
						<Tooltip
							enterDelay={300}
							title={<FormattedMessage id="Tooltip.OutboxShow" defaultMessage="Show Outbox" />}
						>
							<IconButton style={buttonStyle} aria-label="Zoom" onClick={this.onShowOutbox}>
								<MessageIcon fontSize="inherit" />
							</IconButton>
						</Tooltip>
						<Tooltip
							enterDelay={300}
							title={
								<FormattedMessage id="Tooltip.ArrangeSheets" defaultMessage="Arrange StreamSheets" />
							}
						>
							<IconButton style={buttonStyle} aria-label="Zoom" onClick={this.onAlignSheets}>
								<SvgIcon>
									<path
										// eslint-disable-next-line max-len
										d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3"
									/>
								</SvgIcon>
							</IconButton>
						</Tooltip>
						<ToolbarExtensions />
					</div>
				</WidthHelper>
				<Popover
					open={this.state.zoomOpen}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'right', vertical: 'top' }}
					onClose={this.onZoomClose}
					onExited={this.handleFocus}
					style={{
						overflow: 'hidden'
					}}
				>
					<GridList
						cols={6}
						cellHeight={40}
						spacing={2}
						style={{
							width: '360px',
							margin: '0px'
						}}
					>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(50)}
								variant="outlined"
								style={{
									minWidth: '50px',
									padding: '0px',
									margin: '4px'
								}}
							>
								50%
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(75)}
								variant="outlined"
								style={{
									minWidth: '50px',
									padding: '0px',
									margin: '4px'
								}}
							>
								75%
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(100)}
								variant="outlined"
								style={{
									minWidth: '50px',
									padding: '0px',
									margin: '4px'
								}}
							>
								100%
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(125)}
								variant="outlined"
								style={{
									minWidth: '50px',
									padding: '0px',
									margin: '4px'
								}}
							>
								125%
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(150)}
								variant="outlined"
								style={{
									minWidth: '50px',
									padding: '0px',
									margin: '4px'
								}}
							>
								150%
							</Button>
						</GridListTile>
						<GridListTile cols={1}>
							<Button
								onClick={() => this.handleZoom(200)}
								variant="outlined"
								style={{
									minWidth: '50px',
									padding: '0px',
									margin: '4px'
								}}
							>
								200%
							</Button>
						</GridListTile>
						<GridListTile
							cols={6}
							style={{
								height: '60px'
							}}
						>
							<Slider
								step={5}
								value={graphManager.getZoom() * 100}
								min={50}
								max={200}
								onChange={this.handleZoom}
								marks={marks}
								style={{
									margin: '14px 0px 0px 20px',
									width: '90%'
								}}
							/>
						</GridListTile>
					</GridList>
				</Popover>
			</AppBar>
		);
	}
}

function mapStateToProps(state) {
	return {
		cellSelected: state.jsgState.cellSelected,
		showDeleteCellContentDialog: state.appState.showDeleteCellContentDialog,
		showInsertCellContentDialog: state.appState.showInsertCellContentDialog,
		showFormatCellsDialog: state.appState.showFormatCellsDialog,
		showPasteFunctionsDialog: state.appState.showPasteFunctionsDialog,
		showEditNamesDialog: state.appState.showEditNamesDialog,
		experimental: state.appState.experimental,
		viewMode: state.appState.viewMode,
		canUndo: state.jsgState.canUndo,
		canRedo: state.jsgState.canRedo,
		machineId: state.monitor.machine.id
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default withStyles(styles, { withTheme: true })(connect(mapStateToProps, mapDispatchToProps)(CanvasToolBar));
