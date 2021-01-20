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
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import SvgIcon from '@material-ui/core/SvgIcon/SvgIcon';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../../actions/actions';
import { graphManager } from '../../GraphManager';
import {Divider} from "@material-ui/core";
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import DoneIcon from '@material-ui/icons/Done';

class EditPointsContextComponent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			context: false,
			top: '0px',
			left: '0px',
		};
	}

	componentDidMount() {
		document.addEventListener('click', this.handleClick);
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.EDITPOINTS_SHOW_CONTEXT_MENU_NOTIFICATION, 'onContextMenu',
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
			JSG.EDITPOINTS_SHOW_CONTEXT_MENU_NOTIFICATION,
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

		this.event = data.object.event;

		this.setState({
			context: 'true',
			left: `${left}px`,
			top: `${top}px`,
		});
	}

	deletePoint = () => {
		const viewer = graphManager.getGraphViewer();
		if (viewer === undefined) {
			return;
		}

		const interaction = viewer.getInteractionHandler().getActiveInteraction();
		const marker = interaction.getCurrentMarker();
		if (marker) {
			interaction.deleteMarker(marker);
		}
	};

	finishEditing = () => {
		const viewer = graphManager.getGraphViewer();
		if (viewer === undefined) {
			return;
		}
		const interaction = viewer.getInteractionHandler().getActiveInteraction();
		interaction.didFinish(event, viewer);
		graphManager.redraw();
	};

	toggleOpenClose = () => {
		const viewer = graphManager.getGraphViewer();
		if (viewer === undefined) {
			return;
		}
		const interaction = viewer.getInteractionHandler().getActiveInteraction();
		const item = interaction._item;
		const close = !item.isClosed();
		const path = JSG.AttributeUtils.createPath(JSG.ItemAttributes.NAME, JSG.ItemAttributes.CLOSED);

		interaction.close(close);
		graphManager.synchronizedExecute(new JSG.ChangeAttributeCommand(item, path, close));
	};

	isClosed() {
		const viewer = graphManager.getGraphViewer();
		if (this.state.context === false || viewer === undefined) {
			return false;
		}
		const interaction = viewer.getInteractionHandler().getActiveInteraction();

		return interaction._item.isClosed();
	}

	isMarker() {
		const viewer = graphManager.getGraphViewer();
		if (this.state.context === false || viewer === undefined) {
			return false;
		}
		const interaction = viewer.getInteractionHandler().getActiveInteraction();

		return interaction.getCurrentMarker();
	}

	handleClick = (event) => {
		const { context } = this.state;
		const wasOutside = !(event.target.contains === this.editpointsmenu);

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

		return (
			<Paper
				id="editpointsmenu"
				ref={(ref) => {
					this.editpointsmenu = ref;
				}}
				style={{
					display: 'inline-block',
					position: 'absolute',
					left: [this.state.left],
					top: [this.state.top],
					visibility: [this.state.context ? 'visible' : 'hidden'],
				}}
			>
				<MenuItem
					onClick={() => this.deletePoint()}
					disabled={!this.isMarker()}
					dense
				>
					<ListItemIcon>
						<DeleteForeverIcon/>
					</ListItemIcon>
					<ListItemText primary={<FormattedMessage id="DeletePoint" defaultMessage="Delete Point" />} />
				</MenuItem>
				<MenuItem
					onClick={() => this.toggleOpenClose()}
					dense
				>
					<ListItemIcon>
						<SvgIcon>
							{this.isClosed() ? (
								<path
									d="M2 3V9H4.95L6.95 15H6V21H12V16.41L17.41 11H22V5H16V9.57L10.59 15H9.06L7.06 9H8V3M4 5H6V7H4M18 7H20V9H18M8 17H10V19H8Z"
								/>
							) : (
								<path
									d="M2 3V9H4.95L6.95 15H6V21H12V16.41L17.41 11H22V5H16V9.57L10.59 15H9.06L7.06 9H8V3H6M8 8V6L16 7V9 M4 5H6V7H4M18 7H20V9H18M8 17H10V19H8Z"
								/>
							)}
						</SvgIcon>
					</ListItemIcon>
					{this.isClosed() ? (
							<ListItemText primary={<FormattedMessage id="OpenShape" defaultMessage="Open Shape" />} />
						) : (
							<ListItemText primary={<FormattedMessage id="CloseShape" defaultMessage="Close Shape" />} />
						)}
				</MenuItem>
				<Divider />
				<MenuItem
					onClick={() => this.finishEditing()}
					dense
				>
					<ListItemIcon>
						<DoneIcon/>
					</ListItemIcon>
					<ListItemText primary={<FormattedMessage id="FinishEditing" defaultMessage="Finish Editing" />} />
				</MenuItem>
			</Paper>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(null, mapDispatchToProps)(EditPointsContextComponent);
