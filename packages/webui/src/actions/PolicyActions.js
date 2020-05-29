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
import { push } from 'react-router-redux';
import { accessManager } from '../helper/AccessManager';
import * as ActionTypes from '../constants/ActionTypes';
import gatewayClient from '../helper/GatewayClient';
import SecurityHelper from '../helper/SecurityHelper';
import store from '../store';

export function loadPermissions() {
	return (dispatch) => {
		try {
			const state = store.getState();
			const { user } = state.user;
			const props = {
				roles: state.adminSecurity.roles,
				policies: state.adminSecurity.policies,
			};
			accessManager.init(props, user);
			dispatch({ type: ActionTypes.PERMISSIONS_SET, permissions: accessManager.permissions });
			return true;
		} catch (e) {
			return false;
		}
	};
}


export function getAllPolicies() {
	return async (dispatch) => {
		const query = {};
		try {
			const res = await gatewayClient.authEntityGet({
				type: 'policy',
				query,
			});
			dispatch({ type: ActionTypes.POLICIES_FETCHED, policies: res.response });
			return res.response;
		} catch (error) {
			dispatch({ type: ActionTypes.ERROR, error });
			return error;
		}
	};
}

export function savePolicy(policy) {
	return async (dispatch) => {
		try {
			policy.lastModified = new Date().toISOString();
			const res = await gatewayClient.authEntityUpdate({
				type: 'policy',
				policy,
			});
			dispatch({ type: ActionTypes.POLICY_SAVED, policy, result: res.response.ok });
			return res.response;
		} catch (error) {
			dispatch({ type: ActionTypes.ERROR, error });
			return error;
		}
	};
}

export function getPolicyById(id) {
	return async (dispatch) => {
		try {
			const res = await gatewayClient.authEntityGet({
				type: 'policy',
				query: { id },
				projection: {},
			});
			return res.response;
		} catch (error) {
			dispatch({ type: ActionTypes.ERROR, error });
			return error;
		}
	};
}

export function removePolicy(policyId) {
	return async (dispatch) => {
		try {
			const res = await gatewayClient.authEntityDelete({
				type: 'policy',
				query: { id: policyId },
			});
			dispatch({ type: ActionTypes.POLICY_REMOVED, policyId, result: res.response });
			return res.response;
		} catch (error) {
			dispatch({ type: ActionTypes.ERROR, error });
			return error;
		}
	};
}

export function createNewPolicy() {
	return async (dispatch) => {
		const policy = SecurityHelper.createNewPolicy();
		policy.lastModified = new Date().toISOString();
		try {
			const res = await gatewayClient.authEntityUpdate({
				type: 'policy',
				policy,
			});
			dispatch({ type: ActionTypes.POLICY_SAVED, policy, result: res.response.ok });
			dispatch(push(`/administration/policy/${policy.id}`));
			return res.response;
		} catch (error) {
			dispatch({ type: ActionTypes.ERROR, error });
			return error;
		}
	};
}
