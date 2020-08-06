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
import { ArrayUtil } from '@cedalo/util';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import VersionUpgrade from '@material-ui/icons/Warning';
import React from 'react';
import { FormattedMessage } from 'react-intl';

export const ConfirmImportDialog = (props) => {
	const { machines, streams } = props;
	return (
		<Dialog fullWidth open maxWidth="sm">
			<DialogTitle>
				<FormattedMessage id="Import.Dialog.Title" defaultMessage="Import" />
			</DialogTitle>
			<DialogContent
				style={{
					margin: '16px'
				}}
			>
				<Grid container direction="column">
					<Grid item alignItems="center" container direction="row" spacing={8}>
						<Grid item>
							<VersionUpgrade color="error" />
						</Grid>
						<Grid item>
							<Typography variant="subtitle1" color="textPrimary">
								<FormattedMessage
									id="Import.Confirmation.Message"
									defaultMessage="Following machines and streams will be overwritten."
								/>
							</Typography>
						</Grid>
					</Grid>
					{machines.length > 0 ? (
						<Paper
							style={{
								margin: '16px 0px 8px',
								padding: '8px 24px 16px'
							}}
						>
							<Grid item>
								<Typography style={{ padding: '16px 0px' }} variant="h6" color="textPrimary">
									<FormattedMessage id="Import.List.Machines.Title" defaultMessage="Machines" />
								</Typography>
							</Grid>
							<Grid item container spacing={8} alignItems="center">
								{ArrayUtil.intersperse(
									machines.map(({ newName, id }) => (
										<Grid item sm={12} key={id}>
											<Typography variant="subtitle1">{newName}</Typography>
										</Grid>
									)),
									(index) => (
										<Grid item key={`sep-${index}`} sm={12}>
											<Divider />
										</Grid>
									)
								)}
							</Grid>
						</Paper>
					) : null}
					{streams.length > 0 ? (
						<Paper
							style={{
								margin: '8px 0px',
								padding: '8px 24px 16px'
							}}
						>
							<Grid item>
								<Typography style={{ padding: '16px 0px' }} variant="h6" color="textPrimary">
									<FormattedMessage id="Import.List.Streams.Title" defaultMessage="Streams" />
								</Typography>
							</Grid>
							<Grid item container spacing={8} alignItems="center">
								{ArrayUtil.intersperse(
									streams.map(({ newName, id }) => (
										<Grid item sm={12} key={id}>
											<Typography variant="subtitle1">{newName}</Typography>
										</Grid>
									)),
									(index) => (
										<Grid item key={`sep-${index}`} sm={12}>
											<Divider />
										</Grid>
									)
								)}
							</Grid>
						</Paper>
					) : null}
				</Grid>
			</DialogContent>
			{props.children}
			<DialogActions>
				<Button color="primary" onClick={props.onCancel}>
					<FormattedMessage id="Cancel" defaultMessage="Cancel" />
				</Button>
				<Button color="primary" onClick={props.onConfirm}>
					<FormattedMessage id="Import.Button.Import" defaultMessage="Import" />
				</Button>
			</DialogActions>
		</Dialog>
	);
};
