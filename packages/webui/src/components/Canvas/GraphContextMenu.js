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
import JSG from '@cedalo/jsg-ui';
import Divider from '@material-ui/core/Divider';
// import {
// 	// ContentCopy as CopyIcon,
// 	ContentPaste as PasteIcon,
// 	// ContentCut as CutIcon,
// } from '@material-ui/icons';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import SvgIcon from '@material-ui/core/SvgIcon/SvgIcon';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';



const styles = {
	menuItem: {
		transition: 'none',
	},
};

class GraphContextComponent extends Component {
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
			JSG.GRAPH_SHOW_CONTEXT_MENU_NOTIFICATION, 'onContextMenu',
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
			JSG.GRAPH_SHOW_CONTEXT_MENU_NOTIFICATION,
		);
	}

	onContextMenu(data) {
		let left = data.object.event.event.offsetX;
		const maxRight = left + 235;
		if (maxRight > window.innerWidth) {
			left = window.innerWidth - 235;
		}
		const popHeight = 500;
		const maxTop = window.innerHeight - popHeight > 0 ? window.innerHeight - popHeight : 0;
		const top = data.object.event.event.offsetY > maxTop ? maxTop : data.object.event.event.offsetY;

		this.setState({
			context: 'true',
			left: `${left}px`,
			top: `${top}px`,
		});
	}


	onChangeOrder = (order) => {
		const viewer = graphManager.getGraphViewer();

		if (viewer === undefined) {
			return;
		}

		const selection = viewer.getSelection();
		const item = selection.length ? selection[0].getModel() : undefined;

		graphManager.synchronizedExecute(new JSG.ChangeItemOrderCommand(item, order, viewer));
	};

	onShowChartProperties = () => {
		// const sheetView = graphManager.getActiveSheetView();
		// eslint-disable-next-line react/prop-types
		this.props.setAppState({ showStreamChartProperties: true });
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
		if (graphManager === undefined || graphManager.getGraphViewer() === undefined) {
			return <div />;
		}
		const selection = graphManager.getGraphViewer().getSelection();
		const item = selection.length ? selection[0].getModel() : undefined;

		return (
			<Paper
				id="sheetmenu"
				ref={(ref) => {
					this.sheetmenu = ref;
				}}
				style={{
					display: 'inline-block',
					position: 'absolute',
					left: [this.state.left],
					top: [this.state.top],
					visibility: [this.state.context ? 'visible' : 'hidden'],
				}}
			>
				{(item instanceof JSG.SheetPlotNode) ?
					<MenuList>
						<MenuItem
							onClick={this.onShowChartProperties}
							dense
						>
							<ListItemIcon>
								<SvgIcon style={styles.menuItem} >
									<path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z" />
								</SvgIcon>
							</ListItemIcon>
							<ListItemText primary={<FormattedMessage id="EditChart" defaultMessage="Edit Chart" />} />
						</MenuItem>
						<Divider/>
					</MenuList> : null}
				<MenuItem
					onClick={() => this.onChangeOrder(JSG.ChangeItemOrderCommand.Action.TOTOP)}
					dense
				>
					<ListItemIcon>
						<SvgIcon style={styles.menuItem} >
							<path d="M2,2H11V6H9V4H4V9H6V11H2V2M22,13V22H13V18H15V20H20V15H18V13H22M8,8H16V16H8V8Z" />
						</SvgIcon>
					</ListItemIcon>
					<ListItemText primary={<FormattedMessage id="MoveToTop" defaultMessage="Move to Top" />} />
				</MenuItem>
				<MenuItem
					onClick={() => this.onChangeOrder(JSG.ChangeItemOrderCommand.Action.UP)}
					dense
				>
					<ListItemIcon>
						<SvgIcon style={styles.menuItem} >
							<path d="M2,2H16V16H2V2M22,8V22H8V18H10V20H20V10H18V8H22Z" />
						</SvgIcon>
					</ListItemIcon>
					<ListItemText primary={<FormattedMessage id="MoveUp" defaultMessage="Move up" />} />
				</MenuItem>
				<MenuItem
					onClick={() => this.onChangeOrder(JSG.ChangeItemOrderCommand.Action.DOWN)}
					dense
				>
					<ListItemIcon>
						<SvgIcon style={styles.menuItem} >
							<path d="M2,2H16V16H2V2M22,8V22H8V18H18V8H22M4,4V14H14V4H4Z" />
						</SvgIcon>
					</ListItemIcon>
					<ListItemText primary={<FormattedMessage id="MoveDown" defaultMessage="Move down" />} />
				</MenuItem>
				<MenuItem
					onClick={() => this.onChangeOrder(JSG.ChangeItemOrderCommand.Action.TOBOTTOM)}
					dense
				>
					<ListItemIcon>
						<SvgIcon style={styles.menuItem} >
							<path d="M2,2H11V11H2V2M9,4H4V9H9V4M22,13V22H13V13H22M15,20H20V15H15V20M16,8V11H13V8H16M11,16H8V13H11V16Z" />
						</SvgIcon>
					</ListItemIcon>
					<ListItemText primary={<FormattedMessage id="MoveToBottom" defaultMessage="Move to Bottom" />} />
				</MenuItem>
			</Paper>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(null, mapDispatchToProps)(GraphContextComponent);
