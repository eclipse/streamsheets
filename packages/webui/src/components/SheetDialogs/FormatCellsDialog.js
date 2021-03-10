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
/* eslint-disable react/forbid-prop-types */
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import FormLabel from '@material-ui/core/FormLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import {
	Dictionary,
	FormatAttributes,
	TextFormatAttributes,
	CompoundCommand,
	FormatCellsCommand,
	CellAttributes,
	CellAttributesCommand,
	TextFormatCellsCommand
} from '@cedalo/jsg-core';

import { graphManager } from '../../GraphManager';
import ColorComponent from './ColorComponent';
import NumberFormatSettings from './NumberFormatSettings';
import {intl} from "../../helper/IntlGlobalProvider";
import {withStyles} from "@material-ui/core/styles";

const styles = () => ({
	selectMenu: {
		padding: '9px',
	},
});

function TabContainer(props) {
	return <Typography component="div">{props.children}</Typography>;
}

TabContainer.propTypes = {
	children: PropTypes.node.isRequired,
};
/**
 * A modal dialog can only be clo sed by selecting one of the actions.
 */
export class FormatCellsDialog extends React.Component {
	static propTypes = {
		open: PropTypes.bool.isRequired,
		stateHandler: PropTypes.func.isRequired,
	};

	constructor(props) {
		super(props);
		this.state = {
			tabSelected: 0,
			protected: false,
			visible: false,
			numberFormat: '',
			localCulture: '',
			fillStyle: '0',
			fillColor: '#FFFFFF',
			fontColor: '#000000',
			leftBorderColor: '#000000',
			leftBorderStyle: 0,
			leftBorderWidth: 1,
			rightBorderColor: '#000000',
			rightBorderStyle: 0,
			rightBorderWidth: 1,
			topBorderColor: '#000000',
			topBorderStyle: 0,
			topBorderWidth: 1,
			bottomBorderColor: '#000000',
			bottomBorderStyle: 0,
			bottomBorderWidth: 1,
			fontSize: 10,
			bold: false,
			italic: false,
			underline: false,
			fontName: 'Arial',
			verticalAlignment: TextFormatAttributes.VerticalTextPosition.TOP,
			horizontalAlignment: TextFormatAttributes.HorizontalTextPosition.CUSTOM,
			initialized: false,
			formatMap: new Dictionary(),
			textFormatMap: new Dictionary(),
			attributesMap: new Dictionary(),
		};
	}

	// componentWillReceiveProps(nextProps) {
	// 	// You don't have to do this check first, but it can help prevent an unneeded render
	// 	if (this.props.open === false && nextProps.open === true) {
	// 		this.updateData();
	// 	}
	// }
	//
	static getDerivedStateFromProps(props, state) {
		if (props.open) {
			if (!state.initialized) {
				const sheetView = graphManager.getActiveSheetView();
				if (!sheetView) {
					return null;
				}

				const newState = {...state};

				const selection = sheetView.getItem().getOwnSelection();
				const textFormat = selection.retainTextFormat();
				const format = selection.retainFormat();
				const attributes = selection.retainAttributes();

				if (attributes !== undefined) {
					newState.visible = attributes.getVisible() ? attributes.getVisible().getValue() : '';
					newState.protected = attributes.getProtected() ? attributes.getProtected().getValue() : '';
					newState.leftBorderColor = attributes.getLeftBorderColor() ? attributes.getLeftBorderColor().getValue() : '';
					newState.leftBorderStyle = attributes.getLeftBorderStyle() ? attributes.getLeftBorderStyle().getValue() : '';
					newState.leftBorderWidth = attributes.getLeftBorderWidth() ? attributes.getLeftBorderWidth().getValue() : '';
					newState.topBorderColor = attributes.getTopBorderColor() ? attributes.getTopBorderColor().getValue() : '';
					newState.topBorderStyle = attributes.getTopBorderStyle() ? attributes.getTopBorderStyle().getValue() : '';
					newState.topBorderWidth = attributes.getTopBorderWidth() ? attributes.getTopBorderWidth().getValue() : '';
					newState.rightBorderColor = attributes.getRightBorderColor() ? attributes.getRightBorderColor().getValue() : '';
					newState.rightBorderStyle = attributes.getRightBorderStyle() ? attributes.getRightBorderStyle().getValue() : '';
					newState.rightBorderWidth = attributes.getRightBorderWidth() ? attributes.getRightBorderWidth().getValue() : '';
					newState.bottomBorderColor = attributes.getBottomBorderColor()
							? attributes.getBottomBorderColor().getValue()
							: '';
					newState.bottomBorderStyle = attributes.getBottomBorderStyle()
							? attributes.getBottomBorderStyle().getValue()
							: '';
					newState.bottomBorderWidth = attributes.getBottomBorderWidth()
							? attributes.getBottomBorderWidth().getValue()
							: '';
				}

				if (format !== undefined) {
					newState.fillColor = format.getFillColor() ? format.getFillColor().getValue() : '';
					newState.fillStyle = format.getFillStyle() ? String(format.getFillStyle().getValue()) : '';
				}

				if (textFormat !== undefined) {
					/* eslint-disable no-bitwise */
					newState.numberFormat = textFormat.getNumberFormat() ? textFormat.getNumberFormat().getValue() : '';
					newState.localCulture = textFormat.getLocalCulture() ? textFormat.getLocalCulture().getValue() : '';
					newState.fontSize = textFormat.getFontSize() ? String(textFormat.getFontSize().getValue()) : '';
					newState.fontName = textFormat.getFontName() ? textFormat.getFontName().getValue() : '';
					newState.fontColor = textFormat.getFontColor() ? textFormat.getFontColor().getValue() : '';
					newState.bold = textFormat.getFontStyle()
							? (textFormat.getFontStyle().getValue() & TextFormatAttributes.FontStyle.BOLD) === 1
							: '';
					newState.italic = textFormat.getFontStyle()
							? (textFormat.getFontStyle().getValue() & TextFormatAttributes.FontStyle.ITALIC) === 2
							: '';
					newState.underline = textFormat.getFontStyle()
							? (textFormat.getFontStyle().getValue() & TextFormatAttributes.FontStyle.UNDERLINE) === 4
							: '';
					newState.verticalAlignment = textFormat.getVerticalAlignment()
							? textFormat.getVerticalAlignment().getValue()
							: '';
					newState.horizontalAlignment = textFormat.getHorizontalAlignment()
							? textFormat.getHorizontalAlignment().getValue()
							: '';
				}

				newState.attributesMap.clear();
				newState.formatMap.clear();
				newState.textFormatMap.clear();
				newState.initialized = true;
				return newState;
			}

			return null;
		}
		return {...state, initialized: false};

	}

	handleVerticalAlignmentChange = (event) => {
		this.setState({ verticalAlignment: event.target.value });
		this.state.textFormatMap.put(TextFormatAttributes.VERTICALALIGN, event.target.value);
	};

	handleHorizontalAlignmentChange = (event) => {
		this.setState({ horizontalAlignment: event.target.value });
		this.state.textFormatMap.put(TextFormatAttributes.HORIZONTALALIGN, event.target.value);
	};

	handleFontNameChange = (event) => {
		this.setState({ fontName: event.target.value });
		this.state.textFormatMap.put(TextFormatAttributes.FONTNAME, event.target.value);
	};

	handleFontSizeChange = (event) => {
		this.setState({ fontSize: String(event.target.value) });
		this.state.textFormatMap.put(TextFormatAttributes.FONTSIZE, Number(event.target.value));
	};

	handleFontColorChange = (color) => {
		this.setState({ fontColor: color });
		this.state.textFormatMap.put(TextFormatAttributes.FONTCOLOR, color);
	};

	handleFontBoldChange = () => (event, state) => {
		this.setState({ bold: state });

		let style = this.state.italic ? TextFormatAttributes.FontStyle.ITALIC : TextFormatAttributes.FontStyle.NORMAL;
		style += this.state.underline
			? TextFormatAttributes.FontStyle.UNDERLINE
			: TextFormatAttributes.FontStyle.NORMAL;
		style += state ? TextFormatAttributes.FontStyle.BOLD : TextFormatAttributes.FontStyle.NORMAL;

		this.state.textFormatMap.put(TextFormatAttributes.FONTSTYLE, style);
	};

	handleFontItalicChange = (event, state) => {
		this.setState({ italic: state });

		let style = this.state.bold ? TextFormatAttributes.FontStyle.BOLD : TextFormatAttributes.FontStyle.NORMAL;
		style += this.state.underline
			? TextFormatAttributes.FontStyle.UNDERLINE
			: TextFormatAttributes.FontStyle.NORMAL;
		style += state ? TextFormatAttributes.FontStyle.ITALIC : TextFormatAttributes.FontStyle.NORMAL;

		this.state.textFormatMap.put(TextFormatAttributes.FONTSTYLE, style);
	};

	handleFontUnderlineChange = (event, state) => {
		this.setState({ underline: state });

		let style = this.state.bold ? TextFormatAttributes.FontStyle.BOLD : TextFormatAttributes.FontStyle.NORMAL;
		style += this.state.italic ? TextFormatAttributes.FontStyle.ITALIC : TextFormatAttributes.FontStyle.NORMAL;
		style += state ? TextFormatAttributes.FontStyle.UNDERLINE : TextFormatAttributes.FontStyle.NORMAL;

		this.state.textFormatMap.put(TextFormatAttributes.FONTSTYLE, style);
	};

	handleFillStyleChange = (event, value) => {
		this.setState({ fillStyle: value });

		this.state.formatMap.put(FormatAttributes.FILLSTYLE, Number(value));
	};

	handleFillColorChange = (color) => {
		this.setState({ fillColor: color });
		this.setState({ fillStyle: '1' });

		this.state.formatMap.put(FormatAttributes.FILLSTYLE, 1);
		this.state.formatMap.put(FormatAttributes.FILLCOLOR, color);
	};

	handleLeftBorderStyleChange = (event) => {
		this.setState({ leftBorderStyle: Number(event.target.value) });
		this.state.attributesMap.put(CellAttributes.LEFTBORDERSTYLE, Number(event.target.value));
	};

	handleLeftBorderWidthChange = (event) => {
		this.setState({ leftBorderWidth: event.target.value });
		this.state.attributesMap.put(CellAttributes.LEFTBORDERWIDTH, Number(event.target.value));
	};

	handleLeftBorderColorChange = (color) => {
		this.setState({ leftBorderColor: color });
		this.state.attributesMap.put(CellAttributes.LEFTBORDERCOLOR, color);
	};

	handleRightBorderStyleChange = (event) => {
		this.setState({ rightBorderStyle: Number(event.target.value) });
		this.state.attributesMap.put(CellAttributes.RIGHTBORDERSTYLE, Number(event.target.value));
	};

	handleRightBorderWidthChange = (event) => {
		this.setState({ rightBorderWidth: event.target.value });
		this.state.attributesMap.put(CellAttributes.RIGHTBORDERWIDTH, Number(event.target.value));
	};

	handleRightBorderColorChange = (color) => {
		this.setState({ rightBorderColor: color });
		this.state.attributesMap.put(CellAttributes.RIGHTBORDERCOLOR, color);
	};

	handleTopBorderStyleChange = (event) => {
		this.setState({ topBorderStyle: Number(event.target.value) });
		this.state.attributesMap.put(CellAttributes.TOPBORDERSTYLE, Number(event.target.value));
	};

	handleTopBorderWidthChange = (event) => {
		this.setState({ topBorderWidth: event.target.value });
		this.state.attributesMap.put(CellAttributes.TOPBORDERWIDTH, Number(event.target.value));
	};

	handleTopBorderColorChange = (color) => {
		this.setState({ topBorderColor: color });
		this.state.attributesMap.put(CellAttributes.TOPBORDERCOLOR, color);
	};

	handleBottomBorderStyleChange = (event) => {
		this.setState({ bottomBorderStyle: Number(event.target.value) });
		this.state.attributesMap.put(CellAttributes.BOTTOMBORDERSTYLE, Number(event.target.value));
	};

	handleBottomBorderWidthChange = (event) => {
		this.setState({ bottomBorderWidth: event.target.value });
		this.state.attributesMap.put(CellAttributes.BOTTOMBORDERWIDTH, Number(event.target.value));
	};

	handleBottomBorderColorChange = (color) => {
		this.setState({ bottomBorderColor: color });
		this.state.attributesMap.put(CellAttributes.BOTTOMBORDERCOLOR, color);
	};

	handleProtectedChange = (event, state) => {
		this.setState({ protected: state });

		this.state.attributesMap.put(CellAttributes.PROTECTED, state);
	};

	handleVisibleChange = (event, state) => {
		this.setState({ visible: state });

		this.state.attributesMap.put(CellAttributes.VISIBLE, state);
	};

	handleNumberFormat = (numberFormat, localCulture) => {
		this.setState({ numberFormat });
		this.setState({ localCulture });

		this.state.textFormatMap.put(TextFormatAttributes.NUMBERFORMAT, numberFormat);
		this.state.textFormatMap.put(TextFormatAttributes.LOCALCULTURE, localCulture);
	};

	handleClose = () => {
		this.props.stateHandler({ showFormatCellsDialog: false });

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView === undefined) {
			return;
		}

		const cmds = new CompoundCommand();

		if (this.state.attributesMap.size()) {
			cmds.add(
				new CellAttributesCommand(
					sheetView
						.getItem()
						.getOwnSelection()
						.getRanges(),
					this.state.attributesMap,
				),
			);
		}

		if (this.state.formatMap.size()) {
			cmds.add(
				new FormatCellsCommand(
					sheetView
						.getItem()
						.getOwnSelection()
						.getRanges(),
					this.state.formatMap,
				),
			);
		}

		if (this.state.textFormatMap.size()) {
			cmds.add(
				new TextFormatCellsCommand(
					sheetView
						.getItem()
						.getOwnSelection()
						.getRanges(),
					this.state.textFormatMap,
				),
			);
		}

		if (cmds.hasCommands()) {
			graphManager.synchronizedExecute(cmds);
		}
		sheetView.notify();
	};

	handleCancel = () => {
		this.props.stateHandler({ showFormatCellsDialog: false });
	};

	handleChange = (event, value) => {
		this.setState({ tabSelected: value });
	};

	render() {
		if (!this.props.open) {
			return <div/>;
		}
		const { tabSelected } = this.state;
		return (
			<Dialog open={this.props.open} onClose={this.handleCancel} maxWidth={false}>
				<DialogTitle>
					<FormattedMessage id="FormatCellsDialog.title" defaultMessage="Format Cells" />
				</DialogTitle>
				<DialogContent
					style={{
						height: '437px',
						width: '800px',
					}}
				>
					<Tabs textColor="primary" value={tabSelected} onChange={this.handleChange}>
						<Tab label={<FormattedMessage id="FormatCellsDialog.numberFormat" defaultMessage="Number" />} />
						<Tab label={<FormattedMessage id="FormatCellsDialog.font" defaultMessage="Font" />} />
						<Tab label={<FormattedMessage id="FormatCellsDialog.cellFormat" defaultMessage="Cell Format" />} />
						<Tab label={<FormattedMessage id="FormatCellsDialog.protection" defaultMessage="Protect" />} />
					</Tabs>
					{tabSelected === 0 && (
						<TabContainer>
							<div
								style={{
									margin: '10px',
								}}
							>
								<NumberFormatSettings
									numberFormat={this.state.numberFormat}
									localCulture={this.state.localCulture}
									handler={(f, s) => this.handleNumberFormat(f, s)}
								/>
							</div>
						</TabContainer>
					)}
					{tabSelected === 1 && (
						<TabContainer>
							<div
								style={{
									margin: '20px',
								}}
							>
								<div
									style={{
										display: 'flex',
									}}
								>
									<FormControl style={{ width: '200px', marginRight: '20px' }}>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											select
											label={<FormattedMessage
												id="FormatCellsDialog.fontName"
												defaultMessage="Font Name"
											/>}
											value={this.state.fontName}
											onChange={this.handleFontNameChange}
										>
											<MenuItem value="Arial" key={1}>
												Arial
											</MenuItem>
											<MenuItem value="Courier New" key={2}>
												Courier New
											</MenuItem>
											<MenuItem value="Georgia" key={3}>
												Georgia
											</MenuItem>
											<MenuItem value="Lucida Console" key={4}>
												Lucida Console
											</MenuItem>
											<MenuItem value="Lucida Sans" key={5}>
												Lucida Sans
											</MenuItem>
											<MenuItem value="Palatino" key={6}>
												Palatino
											</MenuItem>
											<MenuItem value="Tahoma" key={7}>
												Tahoma
											</MenuItem>
											<MenuItem value="Trebuchet MS" key={8}>
												Trebuchet MS
											</MenuItem>
											<MenuItem value="Verdana" key={9}>
												Verdana
											</MenuItem>
										</TextField>
									</FormControl>
									<FormControl style={{ width: '120px', marginRight: '20px' }}>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											select
											label={<FormattedMessage
												id="FormatCellsDialog.fontSize"
												defaultMessage="Font Size"
											/>}
											value={this.state.fontSize}
											onChange={this.handleFontSizeChange}
										>
											<MenuItem value="8" key={0}>
												8
											</MenuItem>
											<MenuItem value="9" key={1}>
												9
											</MenuItem>
											<MenuItem value="10" key={2}>
												10
											</MenuItem>
											<MenuItem value="12" key={3}>
												12
											</MenuItem>
											<MenuItem value="14" key={4}>
												14
											</MenuItem>
											<MenuItem value="18" key={5}>
												18
											</MenuItem>
											<MenuItem value="24" key={6}>
												24
											</MenuItem>
											<MenuItem value="30" key={7}>
												30
											</MenuItem>
											<MenuItem value="36" key={8}>
												36
											</MenuItem>
											<MenuItem value="48" key={9}>
												48
											</MenuItem>
											<MenuItem value="60" key={10}>
												60
											</MenuItem>
											<MenuItem value="72" key={11}>
												72
											</MenuItem>
											<MenuItem value="96" key={12}>
												96
											</MenuItem>
											<MenuItem value="120" key={13}>
												120
											</MenuItem>
											<MenuItem value="144" key={14}>
												144
											</MenuItem>
										</TextField>
									</FormControl>
									<FormControl size="small" variant="outlined" margin="normal" style={{width: '120px'}}>
										<ColorComponent
											label={
												<FormattedMessage
													id="FormatCellsDialog.fontColor"
													defaultMessage="Font Color"
												/>
											}
											color={this.state.fontColor}
											onChange={this.handleFontColorChange}
										/>
									</FormControl>
								</div>
								<div
									style={{
										marginTop: '20px',
										display: 'flex',
									}}
								>
									<FormControlLabel
										control={
											<Checkbox
												checked={this.state.bold}
												indeterminate={this.state.bold === ''}
												onChange={this.handleFontBoldChange()}
											/>
										}
										label={
											<FormattedMessage id="FormatCellsDialog.fontBold" defaultMessage="Bold" />
										}
									/>
									<FormControlLabel
										style={styles.FormControl}
										control={
											<Checkbox
												checked={this.state.italic}
												indeterminate={this.state.italic === ''}
												onChange={this.handleFontItalicChange}
											/>
										}
										label={
											<FormattedMessage
												id="FormatCellsDialog.fontItalic"
												defaultMessage="Italic"
											/>
										}
									/>
									<FormControlLabel
										style={styles.FormControl}
										control={
											<Checkbox
												checked={this.state.underline}
												indeterminate={this.state.underline === ''}
												onChange={this.handleFontUnderlineChange}
											/>
										}
										label={
											<FormattedMessage
												id="FormatCellsDialog.fontUnderline"
												defaultMessage="Underline"
											/>
										}
									/>
								</div>
								<div
									style={{
										marginTop: '20px',
										display: 'flex',
									}}
								>
									<FormControl style={{ width: '200px', marginRight: '20px', marginTop: '20px' }}>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											select
											label={<FormattedMessage
												id="FormatCellsDialog.horizontalAlignment"
												defaultMessage="Horizontal Alignment"
											/>}
											value={this.state.horizontalAlignment}
											onChange={this.handleHorizontalAlignmentChange}
										>
											<MenuItem value={3} key={3}>
												<FormattedMessage
													id="FormatCellsDialog.horizontalDefault"
													defaultMessage="Default"
												/>
											</MenuItem>
											<MenuItem value={0} key={0}>
												<FormattedMessage
													id="FormatCellsDialog.horizontalLeft"
													defaultMessage="Left"
												/>
											</MenuItem>
											<MenuItem value={1} key={1}>
												<FormattedMessage
													id="FormatCellsDialog.horizontalCenter"
													defaultMessage="Center"
												/>
											</MenuItem>
											<MenuItem value={2} key={2}>
												<FormattedMessage
													id="FormatCellsDialog.horizontalRight"
													defaultMessage="Right"
												/>
											</MenuItem>
										</TextField>
									</FormControl>
									<FormControl style={{ width: '200px', marginRight: '20px', marginTop: '20px' }}>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											select
											label={
										<FormattedMessage
											id="FormatCellsDialog.verticalAlignment"
											defaultMessage="Vertical Alignment"
										/>}
											value={this.state.verticalAlignment}
											onChange={this.handleVerticalAlignmentChange}
										>
											<MenuItem value={0} key={0}>
												<FormattedMessage
													id="FormatCellsDialog.verticalTop"
													defaultMessage="Top"
												/>
											</MenuItem>
											<MenuItem value={1} key={1}>
												<FormattedMessage
													id="FormatCellsDialog.verticalCenter"
													defaultMessage="Middle"
												/>
											</MenuItem>
											<MenuItem value={2} key={2}>
												<FormattedMessage
													id="FormatCellsDialog.verticalBottom"
													defaultMessage="Bottom"
												/>
											</MenuItem>
										</TextField>
									</FormControl>
								</div>
							</div>
						</TabContainer>
					)}
					{tabSelected === 2 && (
						<TabContainer>
							<div
								style={{
									margin: '20px',
								}}
							>
								<div
									style={{
										display: 'inline-block',
										verticalAlign: 'top',
										width: '300px',
									}}
								>
									<FormLabel
										style={{
											marginTop: '15px',
											display: 'block',
										}}
									>
										<FormattedMessage id="FormatCellsDialog.fill" defaultMessage="Fill" />
									</FormLabel>
									<div
										style={{
											margin: '10px',
										}}
									>
										<RadioGroup
											name="fillstyle"
											value={this.state.fillStyle}
											onChange={this.handleFillStyleChange}
										>
											<FormControlLabel
												value="0"
												control={<Radio />}
												label={<FormattedMessage id="None" defaultMessage="None" />}
											/>
											<FormControlLabel
												value="1"
												control={<Radio />}
												label={
													<FormattedMessage
														id="FormatCellsDialog.solid"
														defaultMessage="Solid"
													/>
												}
											/>
										</RadioGroup>
									</div>
									<FormControl size="small" variant="outlined" margin="normal" style={{width: '120px', marginLeft: '44px', marginTop: '0px' }}>
										<ColorComponent
											label={
												<FormattedMessage
													id="FormatCellsDialog.fillColor"
													defaultMessage="Fill Color"
												/>
											}
											color={this.state.fillColor}
											onChange={this.handleFillColorChange}
										/>
									</FormControl>
								</div>
								<div
									style={{
										display: 'inline-block',
										verticalAlign: 'top',
									}}
								>
									<FormLabel
										style={{
											marginTop: '15px',
											display: 'block',
										}}
									>
										<FormattedMessage id="FormatCellsDialog.border" defaultMessage="Border" />
									</FormLabel>
									<FormGroup
										style={{
											marginLeft: '10px',
											flexDirection: 'row',
										}}
									>
										<FormLabel
											style={{
												marginTop: '28px',
												width: '60px',
												fontSize: '0.85rem',
											}}
										>
											<FormattedMessage id="FormatCellsDialog.left" defaultMessage="Left" />
										</FormLabel>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											label={
												<FormattedMessage id="FormatCellsDialog.width" defaultMessage="Width" />
											}
											inputProps={{
												min: 0,
												max: 10,
												step: 1,
											}}
											value={this.state.leftBorderWidth}
											onChange={(event) => this.handleLeftBorderWidthChange(event)}
											type="number"
											style={{
												marginRight: '20px',
											}}
										/>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											select
											style={{ width: '120px', marginRight: '20px' }}
											SelectProps={{
												classes: {selectMenu: this.props.classes.selectMenu}
											}}
											label={
												<FormattedMessage id="FormatCellsDialog.style"
																  defaultMessage="Style"/>
											}
											value={this.state.leftBorderStyle}
											onChange={this.handleLeftBorderStyleChange}
										>
											<MenuItem
												value={0}
												key="ls1"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 100 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<text x="50" y="11" fontWeight="normal" fontSize="12pt" dy="0.25em" textAnchor="middle">
														{intl.formatMessage({ id: "None" }, {})}
													</text>
												</svg>
											</MenuItem>
											<MenuItem
												value={1}
												key="ls2"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={2}
												key="ls3"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="1,2" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={3}
												key="ls4"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={4}
												key="ls5"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5,1,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={5}
												key="ls6"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5,1,2,1,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
										</TextField>
										<FormControl size="small" variant="outlined" margin="normal" style={{width: '120px' }}>
											<ColorComponent
												label={
													<FormattedMessage
														id="FormatCellsDialog.borderColor"
														defaultMessage="Border Color"
													/>
												}
												color={this.state.leftBorderColor}
												onChange={this.handleLeftBorderColorChange}
											/>
										</FormControl>
									</FormGroup>
									<FormGroup
										style={{
											marginLeft: '10px',
											flexDirection: 'row',
										}}
									>
										<FormLabel
											style={{
												marginTop: '28px',
												width: '60px',
												fontSize: '0.85rem',
											}}
										>
											<FormattedMessage id="FormatCellsDialog.top" defaultMessage="Top" />
										</FormLabel>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											label={
												<FormattedMessage id="FormatCellsDialog.width" defaultMessage="Width" />
											}
											inputProps={{
												min: 0,
												max: 10,
												step: 1,
											}}
											value={this.state.topBorderWidth}
											onChange={(event) => this.handleTopBorderWidthChange(event)}
											type="number"
											style={{
												marginRight: '20px',
											}}
										/>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											select
											style={{ width: '120px', marginRight: '20px' }}
											SelectProps={{
												classes: {selectMenu: this.props.classes.selectMenu}
											}}
											label={
												<FormattedMessage id="FormatCellsDialog.style"
																  defaultMessage="Style"/>
											}
											value={this.state.topBorderStyle}
											onChange={this.handleTopBorderStyleChange}
										>
											<MenuItem
												value={0}
												key="ls1"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 100 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<text x="50" y="11" fontWeight="normal" fontSize="12pt" dy="0.25em" textAnchor="middle">
														{intl.formatMessage({ id: "None" }, {})}
													</text>
												</svg>
											</MenuItem>
											<MenuItem
												value={1}
												key="ls2"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={2}
												key="ls3"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="1,2" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={3}
												key="ls4"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={4}
												key="ls5"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5,1,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={5}
												key="ls6"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5,1,2,1,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
										</TextField>
										<FormControl size="small" variant="outlined" margin="normal" style={{width: '120px' }}>
											<ColorComponent
												label={
													<FormattedMessage
														id="FormatCellsDialog.borderColor"
														defaultMessage="Border Color"
													/>
												}
												color={this.state.topBorderColor}
												onChange={this.handleTopBorderColorChange}
											/>
										</FormControl>
									</FormGroup>
									<FormGroup
										style={{
											marginLeft: '10px',
											flexDirection: 'row',
										}}
									>
										<FormLabel
											style={{
												marginTop: '28px',
												width: '60px',
												fontSize: '0.85rem',
											}}
										>
											<FormattedMessage id="FormatCellsDialog.right" defaultMessage="Top" />
										</FormLabel>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											label={
												<FormattedMessage id="FormatCellsDialog.width" defaultMessage="Width" />
											}
											inputProps={{
												min: 0,
												max: 10,
												step: 1,
											}}
											value={this.state.rightBorderWidth}
											onChange={(event) => this.handleRightBorderWidthChange(event)}
											type="number"
											style={{
												marginRight: '20px',
											}}
										/>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											select
											style={{ width: '120px', marginRight: '20px' }}
											SelectProps={{
												classes: {selectMenu: this.props.classes.selectMenu}
											}}
											label={
												<FormattedMessage id="FormatCellsDialog.style"
																  defaultMessage="Style"/>
											}
											value={this.state.rightBorderStyle}
											onChange={this.handleRightBorderStyleChange}
										>
											<MenuItem
												value={0}
												key="ls1"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 100 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<text x="50" y="11" fontWeight="normal" fontSize="12pt" dy="0.25em" textAnchor="middle">
														{intl.formatMessage({ id: "None" }, {})}
													</text>
												</svg>
											</MenuItem>
											<MenuItem
												value={1}
												key="ls2"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={2}
												key="ls3"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="1,2" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={3}
												key="ls4"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={4}
												key="ls5"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5,1,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={5}
												key="ls6"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5,1,2,1,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
										</TextField>
										<FormControl size="small" variant="outlined" margin="normal" style={{width: '120px' }}>
											<ColorComponent
												label={
													<FormattedMessage
														id="FormatCellsDialog.borderColor"
														defaultMessage="Border Color"
													/>
												}
												color={this.state.rightBorderColor}
												onChange={this.handleRightBorderColorChange}
											/>
										</FormControl>
									</FormGroup>
									<FormGroup
										style={{
											marginLeft: '10px',
											flexDirection: 'row',
										}}
									>
										<FormLabel
											style={{
												marginTop: '28px',
												width: '60px',
												fontSize: '0.85rem',
											}}
										>
											<FormattedMessage id="FormatCellsDialog.bottom" defaultMessage="Bottom" />
										</FormLabel>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											label={
												<FormattedMessage id="FormatCellsDialog.width" defaultMessage="Width" />
											}
											inputProps={{
												min: 0,
												max: 10,
												step: 1,
											}}
											value={this.state.bottomBorderWidth}
											onChange={(event) => this.handleBottomBorderWidthChange(event)}
											type="number"
											style={{
												marginRight: '20px',
											}}
										/>
										<TextField
											variant="outlined"
											size="small"
											margin="normal"
											select
											style={{ width: '120px', marginRight: '20px' }}
											SelectProps={{
												classes: {selectMenu: this.props.classes.selectMenu}
											}}
											label={
												<FormattedMessage id="FormatCellsDialog.style"
																  defaultMessage="Style"/>
											}
											value={this.state.bottomBorderStyle}
											onChange={this.handleBottomBorderStyleChange}
										>
											<MenuItem
												value={0}
												key="ls1"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 100 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<text x="50" y="11" fontWeight="normal" fontSize="12pt" dy="0.25em" textAnchor="middle">
														{intl.formatMessage({ id: "None" }, {})}
													</text>
												</svg>
											</MenuItem>
											<MenuItem
												value={1}
												key="ls2"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={2}
												key="ls3"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="1,2" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={3}
												key="ls4"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={4}
												key="ls5"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5,1,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
											<MenuItem
												value={5}
												key="ls6"
												style={{
													padding: '3px 16px',
												}}
											>
												<svg width="78" height="16" viewBox="0 0 80 16" stroke="currentColor" strokeDasharray="5,5,1,2,1,5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M5,9 L75,9" />
												</svg>
											</MenuItem>
										</TextField>
										<FormControl size="small" variant="outlined" margin="normal" style={{width: '120px' }}>
											<ColorComponent
												label={
													<FormattedMessage
														id="FormatCellsDialog.borderColor"
														defaultMessage="Border Color"
													/>
												}
												color={this.state.bottomBorderColor}
												onChange={this.handleBottomBorderColorChange}
											/>
										</FormControl>
									</FormGroup>
								</div>
							</div>
						</TabContainer>
					)}
					{tabSelected === 3 && (
						<TabContainer>
							<div
								style={{
									margin: '20px',
								}}
							>
								<FormGroup>
									<FormControlLabel
										control={
											<Checkbox
												checked={this.state.protected}
												indeterminate={this.state.protected === ''}
												onChange={this.handleProtectedChange}
											/>
										}
										label={
											<FormattedMessage id="FormatCellsDialog.locked" defaultMessage="Locked" />
										}
									/>
									<FormControlLabel
										control={
											<Checkbox
												checked={this.state.visible}
												indeterminate={this.state.visible === ''}
												onChange={this.handleVisibleChange}
											/>
										}
										label={
											<FormattedMessage id="FormatCellsDialog.visible" defaultMessage="Visible" />
										}
									/>
								</FormGroup>
							</div>
						</TabContainer>
					)}
				</DialogContent>
				<DialogActions>
					<Button color="primary" onClick={this.handleCancel}>
						<FormattedMessage id="Cancel" defaultMessage="Cancel" />
					</Button>
					<Button autoFocus color="primary" onClick={this.handleClose}>
						<FormattedMessage id="Apply" defaultMessage="Apply" />
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

export default withStyles(styles)(FormatCellsDialog);
