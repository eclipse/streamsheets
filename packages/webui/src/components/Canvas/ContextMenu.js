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
/* eslint-disable react/no-unused-state */
/* eslint-disable react/forbid-prop-types */
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import MenuList from '@material-ui/core/MenuList';
import SvgIcon from '@material-ui/core/SvgIcon';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import DeleteIcon from '@material-ui/icons/Delete';
import InsertCells from '@material-ui/icons/FormatIndentIncrease';
import DeleteCells from '@material-ui/icons/FormatIndentDecrease';
import HideIcon from '@material-ui/icons/VerticalAlignCenter';
import ShowIcon from '@material-ui/icons/FormatLineSpacing';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import JSG from '@cedalo/jsg-ui';

import {
	IconCopy,
	IconPaste,
	IconCut,
} from '../icons';
import { graphManager } from '../../GraphManager';
import * as Actions from '../../actions/actions';

const styles = {
	menuItem: {
		transition: 'none',
	},
};

class ContextComponent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			context: 'false',
			top: '0px',
			left: '0px',
		};
	}

	componentDidMount() {
		document.addEventListener('click', this.handleClick);
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.SheetInteraction.SHEET_SHOW_CONTEXT_MENU_NOTIFICATION, 'onContextMenu',
		);

		/* eslint-disable react/no-did-mount-set-state */
		this.setState({
			context: false,
		});

		/* eslint-enable react/no-did-mount-set-state */
	}

	componentWillUnmount() {
		document.removeEventListener('click', this.handleClick);
		JSG.NotificationCenter.getInstance().unregister(
			this,
			JSG.SheetInteraction.SHEET_SHOW_CONTEXT_MENU_NOTIFICATION,
		);
	}

	onContextMenu(data) {
		let left = data.object.event.event.offsetX;
		const maxRight = left + 235;
		if (maxRight > window.innerWidth) {
			left = window.innerWidth - 235;
		}
		const popHeight = 580;
		const maxTop = window.innerHeight - popHeight > 0 ? window.innerHeight - popHeight : 0;
		const top = data.object.event.event.offsetY > maxTop ? maxTop : data.object.event.event.offsetY;
		let payloadDisabled = true;
		let showHeaderMenus = false;

		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			const selection = sheetView.getOwnSelection();
			if (selection.getSize() === 1) {
				const range = selection.getAt(0);
				if (range.getWidth() === 2 && !range.isColumnRange()) {
					payloadDisabled = false;
				}
			}
			if (!(selection.areRowsSelected() && selection.areColumnsSelected())) {
				showHeaderMenus = selection.areRowsSelected() || selection.areColumnsSelected();
			}
		}

		this.setState({
			showHeaderMenus,
			payloadDisabled,
			context: 'true',
			left: `${left}px`,
			top: `${top}px`,
		});
	}

	onCopy = () => {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			sheetView.copyCells(false);
			graphManager.getGraphEditor().invalidate();
		}
	};

	onCopyText = () => {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			sheetView.copyText();
		}
	};

	onCut = () => {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			sheetView.copyCells(true);
		}
	};

	onPaste = () => {
		const sheetView = graphManager.getActiveSheetView();
		if (sheetView) {
			sheetView.notifyMessage(
				{
					id: "SheetMessage.paste"
				});
		}

		// 	const selection = sheetView.getOwnSelection();
		// 	if (selection.hasSelection()) {
		// 		sheetView.pasteFromClipboard(
		// 			graphManager.getGraphEditor().getGraphViewer(),
		// 			selection.getAt(0).copy(),
		// 			JSG.clipSheet.data, 'all',
		// 		);
		// 	}
		// }
	};

	onDelete = () => {
		// eslint-disable-next-line react/prop-types
		this.props.setAppState({ showDeleteCellContentDialog: true });
	};

	onInsertCells = () => {
		const sheetView = graphManager.getActiveSheetView();

		if (sheetView) {
			sheetView.insertCells(graphManager.getGraphEditor().getGraphViewer());
		}
	};

	onHideHeader = () => {
		const sheetView = graphManager.getActiveSheetView();

		if (sheetView) {
			const viewer = graphManager.getGraphEditor().getGraphViewer();
			const selection = sheetView.getOwnSelection();
			if (selection.areRowsSelected()) {
				viewer.getInteractionHandler().execute(new JSG.SetHeaderSectionSizeCommand(
					sheetView.getItem().getRows(),
					-1,
					selection.getRanges(),
					0,
					false,
				));
			} else if (selection.areColumnsSelected()) {
				viewer.getInteractionHandler().execute(new JSG.SetHeaderSectionSizeCommand(
					sheetView.getItem().getColumns(),
					-1,
					selection.getRanges(),
					0,
					false,
				));
			}
		}
	};

	onShowHeader = () => {
		const sheetView = graphManager.getActiveSheetView();

		if (sheetView) {
			const viewer = graphManager.getGraphEditor().getGraphViewer();
			const selection = sheetView.getOwnSelection();
			if (selection.areRowsSelected()) {
				viewer.getInteractionHandler().execute(new JSG.SetHeaderSectionSizeCommand(
					sheetView.getItem().getRows(),
					-1,
					selection.getRanges(),
					-1,
					true,
				));
			} else if (selection.areColumnsSelected()) {
				viewer.getInteractionHandler().execute(new JSG.SetHeaderSectionSizeCommand(
					sheetView.getItem().getColumns(),
					-1,
					selection.getRanges(),
					-1,
					true,
				));
			}
		}
	};

	onPasteContent = () => {
		// eslint-disable-next-line react/prop-types
		this.props.setAppState({ showInsertCellContentDialog: true });
	};

	onDeleteCells = () => {
		const sheetView = graphManager.getActiveSheetView();

		if (sheetView) {
			sheetView.deleteCells(graphManager.getGraphEditor().getGraphViewer());
		}
	};

	onSetPayloadRange = () => {
		const sheetView = graphManager.getActiveSheetView();

		if (sheetView) {
			sheetView.setPayloadRange(graphManager.getGraphEditor().getGraphViewer(), true);
			const selection = sheetView.getItem().getOwnSelection();
			const range = selection.getRanges()[selection.getActiveRangeIndex()];
			const rangeCopy = range.copy();
			rangeCopy.shiftToSheet();
			this.props.setAppState({ lastDefinedJSONRange: rangeCopy.toString() });
		}
	};

	onRemovePayloadRange = () => {
		const sheetView = graphManager.getActiveSheetView();

		if (sheetView) {
			sheetView.setPayloadRange(graphManager.getGraphEditor().getGraphViewer(), false);
		}
	};

	onFormatCells = () => {
		// eslint-disable-next-line react/prop-types
		this.props.setAppState({ showFormatCellsDialog: true });
	};

	handleClick = (event) => {
		const { context } = this.state;
		const wasOutside = !(event.target.contains === this.sheetmenu);

		if (wasOutside && context) {
			this.setState({
				context: false,
			});
		}
	};

	render() {
		return (
			<Paper
				id="sheetmenu"
				ref={(ref) => {
					this.sheetmenu = ref;
				}}
				style={{
					display: 'inline-block',
					position: 'absolute',
					zIndex: '1500',
					left: [this.state.left],
					top: [this.state.top],
					visibility: [this.state.context ? 'visible' : 'hidden'],
				}}
			>
				<MenuList>
					<MenuItem
						onClick={this.onCut}
						dense
					>
						<ListItemIcon>
							<IconCut style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="Cut" defaultMessage="Cut" />} />
					</MenuItem>
					<MenuItem
						onClick={this.onCopy}
						dense
					>
						<ListItemIcon>
							<IconCopy style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="Copy" defaultMessage="Copy" />} />

					</MenuItem>
					<MenuItem
						onClick={this.onCopyText}
						dense
					>
						<ListItemIcon>
							<IconCopy style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="CopyText" defaultMessage="Copy as Text" />} />

					</MenuItem>
					<MenuItem
						onClick={this.onPaste}
						dense
						disabled={JSG.clipSheet === undefined}
					>
						<ListItemIcon>
							<IconPaste style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="Paste" defaultMessage="Paste" />} />
					</MenuItem>
					<MenuItem
						onClick={this.onPasteContent}
						disabled={JSG.clipSheet === undefined}
						dense
					>
						<ListItemIcon>
							<IconPaste style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="PasteContent" defaultMessage="Paste" />} />
					</MenuItem>
					<MenuItem
						onClick={this.onDelete}
						dense
					>
						<ListItemIcon>
							<DeleteIcon style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="DeleteContext" defaultMessage="Delete" />} />
					</MenuItem>
					<Divider />
					<MenuItem
						onClick={this.onInsertCells}
						dense
					>
						<ListItemIcon>
							<InsertCells style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="InsertCells" defaultMessage="Insert" />} />
					</MenuItem>
					<MenuItem
						onClick={this.onDeleteCells}
						dense
					>
						<ListItemIcon>
							<DeleteCells style={styles.menuItem} />
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="DeleteCells" defaultMessage="Delete Cells" />} />
					</MenuItem>
					<Divider />
					<MenuItem
						onClick={this.onFormatCells}
						dense
					>
						<ListItemIcon>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M21.7,13.35L20.7,14.35L18.65,12.3L19.65,11.3C19.86,11.08 20.21,11.08 20.42,11.3L21.7,12.58C21.92,12.79 21.92,13.14 21.7,13.35M12,18.94L18.07,12.88L20.12,14.93L14.06,21H12V18.94M4,2H18A2,2 0 0,1 20,4V8.17L16.17,12H12V16.17L10.17,18H4A2,2 0 0,1 2,16V4A2,2 0 0,1 4,2M4,6V10H10V6H4M12,6V10H18V6H12M4,12V16H10V12H4Z"
								/>
							</SvgIcon>
						</ListItemIcon>
						<ListItemText primary={<FormattedMessage id="FormatCells" defaultMessage="Format Cells" />} />
					</MenuItem>
					{this.state.showHeaderMenus ?
						<MenuItem
							onClick={this.onShowHeader}
							dense
						>
							<ListItemIcon>
								<ShowIcon style={styles.menuItem} />
							</ListItemIcon>
							<ListItemText primary={<FormattedMessage id="ShowHeader" defaultMessage="Show" />} />
						</MenuItem> : null};
					{this.state.showHeaderMenus ?
						<MenuItem
							onClick={this.onHideHeader}
							dense
						>
							<ListItemIcon>
								<HideIcon style={styles.menuItem} />
							</ListItemIcon>
							<ListItemText primary={<FormattedMessage id="HideHeader" defaultMessage="Hide" />} />
						</MenuItem> : null};
					<Divider />
					<MenuItem
						onClick={this.onSetPayloadRange}
						disabled={this.state.payloadDisabled}
						dense
					>
						<ListItemIcon>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M11,2A2,2 0 0,1 13,4V20A2,2 0 0,1 11,22H2V2H11M4,10V14H11V10H4M4,16V20H11V16H4M4,4V8H11V4H4M15,11H18V8H20V11H23V13H20V16H18V13H15V11Z"
								/>
							</SvgIcon>
							{/* <PayloadRange style={styles.menuItem} /> */}
						</ListItemIcon>
						<ListItemText
							primary={
								<FormattedMessage id="SetPayloadRange" defaultMessage="Define Payload Range" />
							}
						/>
					</MenuItem>
					<MenuItem
						onClick={this.onRemovePayloadRange}
						dense
					>
						<ListItemIcon>
							<SvgIcon>
								<path
									// eslint-disable-next-line max-len
									d="M4,2H11A2,2 0 0,1 13,4V20A2,2 0 0,1 11,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M4,10V14H11V10H4M4,16V20H11V16H4M4,4V8H11V4H4M17.59,12L15,9.41L16.41,8L19,10.59L21.59,8L23,9.41L20.41,12L23,14.59L21.59,16L19,13.41L16.41,16L15,14.59L17.59,12Z"
								/>
							</SvgIcon>
						</ListItemIcon>
						<ListItemText
							primary={
								<FormattedMessage id="RemovePayloadRange" defaultMessage="Remove Payload Range" />
							}
						/>
					</MenuItem>
				</MenuList>
			</Paper>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(null, mapDispatchToProps)(ContextComponent);

