import { setAppState } from '@cedalo/webui/src/actions/actions';
import { Overlay } from '@cedalo/webui/src/components/HelperComponent/Overlay';
import gatewayClient from '@cedalo/webui/src/helper/GatewayClient';
import { useGraphQL } from '@cedalo/webui/src/helper/Hooks';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CheckIcon from '@material-ui/icons/Check';
import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

// const GATEWAY_CONFIG = ConfigManager.config.gatewayClientConfig;

const WEBHOOK_SERVER_SETTINGS_QUERY = `
	query WebhookSererSettings($machineId: ID!) {
		scopedByMachine(machineId: $machineId) {
			machine(id: $machineId) {
				webhookServer {
					enabled
					streamsheetId
					path
				}
				streamsheets {
					id
					name
				}
			}
		}
	}
`;

const WEBHOOK_SERVER_SETTINGS_MUTATION = `
	mutation UpdateWebhookServerSettings($machineId: ID!, $webhookServer: WebhookServerInput!) {
		scopedByMachine(machineId: $machineId) {
			updateMachineWebhookServer(machineId: $machineId, webhookServer: $webhookServer) {
				success
				code
				webhookServer {
					enabled
					streamsheetId
					path
				}
			}
		}
	}
`;

const getHostOrigin = () => {
	if (!window.location) throw new Error('Failed to determine host origin!');
	return window.location.origin;
};

const doUpdateWebhookServer = async (machineId, webhookServerUpdate) => {
	try {
		const data = await gatewayClient.graphql(WEBHOOK_SERVER_SETTINGS_MUTATION, {
			machineId,
			webhookServer: webhookServerUpdate
		});
		const { success, code, webhookServer } = data.scopedByMachine.updateMachineWebhookServer;
		if (!success) {
			throw code;
		}
		return { success, webhookServer };
	} catch (error) {
		console.error(`Failed to update Webhook server settings: ${webhookServerUpdate}`, error);
		return { success: false };
	}
};

const Overlayed = (props) => {
	const { requestState } = props;
	const [reallyDone, setReallyDone] = useState(false);

	useEffect(() => {
		if (requestState === 'fetching') {
			setReallyDone(false);
		} else if (requestState === 'fetched') {
			setTimeout(() => setReallyDone(true), 500);
		}
	}, [requestState]);

	useEffect(() => {
		if (reallyDone) {
			props.doneCb();
		}
	}, [reallyDone]);

	if (requestState === 'fetching') {
		return (
			<Overlay>
				<CircularProgress style={{ width: '24px', height: '24px' }} />
			</Overlay>
		);
	}
	if (requestState === 'fetched') {
		return (
			<Overlay>
				<CheckIcon color="primary" />
			</Overlay>
		);
	}
	return null;
};

export const WebhookServerSettingsDialog = connect(({ machine }) => ({ machineId: machine.id }), {
	setOpen: (open) => setAppState({ showWebhookServerSettingsDialog: open })
})((props) => {
	const { machineId, open } = props;
	const [webhookServer, setWebhookServer] = useState(null);
	const [streamsheets, setStreamsheets] = useState(null);
	const [requireAuth, setRequireAuth] = useState(false);
	const [auth, setAuth] = useState({});
	const [requestState, setRequestState] = useState('not-fetched');
	// const { data, loading, errors } = useGraphQL(
	const { data } = useGraphQL(WEBHOOK_SERVER_SETTINGS_QUERY, { machineId }, [machineId, props.open], () => {
		return props.open;
	});

	const onClose = () => props.setOpen(false);

	const setEnabled = async (enabled) => {
		if (!webhookServer.id) {
			const result = await doUpdateWebhookServer(machineId, { enabled });
			if (result.webhookServer) {
				setWebhookServer({ ...result.webhookServer });
			}
		} else {
			setWebhookServer({ ...webhookServer, enabled });
		}
	};

	const onSave = async () => {
		setRequestState('fetching');
		const { path, ...webhookServerUpdate } = webhookServer;
		await doUpdateWebhookServer(machineId, { ...webhookServerUpdate, auth: requireAuth ? auth : null });
		setRequestState('fetched');
	};

	useEffect(() => {
		const machine = data && data.scopedByMachine.machine;
		if (machine) {
			setWebhookServer(machine.webhookServer);
			setStreamsheets(machine.streamsheets);
			setAuth(machine.webhookServer.auth || auth);
			setRequireAuth(!!machine.webhookServer.auth);
		} else {
			setRequestState('not-fetched');
			setWebhookServer(null);
			setAuth(null);
			setRequireAuth(false);
		}
	}, [data]);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				<FormattedMessage id="Extensions.WebhookServer.Dialog.Title" defaultMessage="Webhook Server Settings" />
			</DialogTitle>
			<DialogContent style={{ paddingTop: '0px', marginTop: '15px' }}>
				<Overlayed requestState={requestState} doneCb={onClose} />
				{webhookServer ? (
					<React.Fragment>
						<FormControl margin="dense">
							<FormControlLabel
								control={
									<Checkbox
										color="primary"
										checked={webhookServer.enabled}
										onChange={(ev, checked) => setEnabled(checked)}
									/>
								}
								label={
									<FormattedMessage
										id="Extensions.WebhookServer.Dialog.Enabled"
										defaultMessage="Enable Webhook Server"
									/>
								}
							/>
						</FormControl>
						{webhookServer.enabled ? (
							<React.Fragment>
								<TextField
									variant="outlined"
									margin="dense"
									size="small"
									fullWidth
									label={
										<FormattedMessage
											id="Extensions.WebhookServer.Dialog.Streamsheet"
											defaultMessage="Streamsheet"
										/>
									}
									select
									helperText={
										<FormattedMessage
											id="Extensions.WebhookServer.Dialog.Streamsheet.Help"
											defaultMessage="Streamsheet which receives the messages in the inbox"
										/>
									}
									value={webhookServer.streamsheetId}
									onChange={(event) =>
										setWebhookServer({ ...webhookServer, streamsheetId: event.target.value })
									}
								>
									{streamsheets.map((streamsheet) => (
										<MenuItem value={streamsheet.id} key={streamsheet.id}>
											{streamsheet.name}
										</MenuItem>
									))}
								</TextField>
								{webhookServer.path ? (
									<React.Fragment>
										<Typography
											color="textSecondary"
											display="block"
											variant="caption"
											style={{ fontSize: '0.65rem' }}
										>
											<FormattedMessage
												id="Extensions.WebhookServer.Dialog.Url"
												defaultMessage="URL"
											/>
										</Typography>
										<TextField
											type="text"
											fullWidth
											value={`${getHostOrigin()}${webhookServer.path}`}
											InputLabelProps={{ shrink: true }}
											InputProps={{ readOnly: true }}
											helperText={
												<FormattedMessage
													id="Extensions.WebhookServer.Dialog.Url.Help"
													defaultMessage="Use this URL to send messages to the configured Streamsheet via HTTP."
												/>
											}
										/>
									</React.Fragment>
								) : null}
							</React.Fragment>
						) : null}
					</React.Fragment>
				) : null}
			</DialogContent>
			<DialogActions
			// style={{ justifyContent: 'space-between' }}
			>
				<Button onClick={onClose} variant="contained">
					<FormattedMessage id="Close" defaultMessage="Close" />
				</Button>
				<Button onClick={onSave} variant="contained" color="primary">
					<FormattedMessage id="SaveButton" defaultMessage="Save" />
				</Button>
			</DialogActions>
		</Dialog>
	);
});
