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
import { StreamSheetLogin } from '@cedalo/streamsheet-connection';

/**
 * A simple modal panel based on an example at https://www.w3schools.com
 */

const TAG = 'login-panel';

const template = document.createElement('template');
template.innerHTML = `
<style>
	/* modal (background) */
	.modal {
		display: none; 
		position: fixed; 
		z-index: 1; 
		padding-top: 100px; 
		left: 0;
		top: 0;
		width: 100%; 
		height: 100%; 
		overflow: auto; 
		background-color: rgba(0,0,0,0.4); 
	}
	/* modal content with animation.... */
	.modal-content {
		position: relative;
		background-color: #fefefe;
		margin: 15% auto;
		padding: 0;
		border: 1px solid #888;
		width: 300px;
		box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
		animation-name: animatetop;
		animation-duration: 0.4s
	}
	/* animation */
	@keyframes animatetop {
		from {top:-300px; opacity:0}
		to {top:0; opacity:1}
	}
	/* close button */
	.close {
		color: #aaa;
		float: right;
		font-size: 28px;
		font-weight: bold;
	}
	.close:hover,
	.close:focus {
		color: black;
		text-decoration: none;
		cursor: pointer;
	}

	/* modal header & body */
	.modal-header {
		padding: 2px 16px;
		background-color: cornflowerblue;
		color: white;
	}
	.modal-body {
		padding: 2px 16px; margin: 20px 2px
	}
</style>

<div class="modal">
	<div class="modal-content">
		<div class="modal-header">
			<span class="close">&times;</span>
			<h2>StreamSheet Login</h2>
		</div>
		<div class="modal-body">
			<div>
			<label for="user">User: </label>
			<input type="text" id="user"></input>
			<br><br>
			<label for="password">Password: </label>
			<input type="password" id="password"></input>
			<br><br>
			<button class="login">Login</button>
			<br><br>
			</div>
		</div>
	</div>
</div>
`;

const resolvePendingPromises = (promises) => {
	promises.forEach((promise) => promise.resolve());
	return [];
};


const createCredentials = (dom) => ({
	username: dom.getElementById('user').value,
	password: dom.getElementById('password').value
});


class LoginPanel extends StreamSheetLogin {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(template.content.cloneNode(true));
		this._panel = this.shadowRoot.querySelector('.modal');
		this._onClose = this._onClose.bind(this);
		this._onLogin = this._onLogin.bind(this);
		this._isReady = false;
		this._pendingPromises = [];
		this._pendingLogin = undefined;
	}

	static get TAG() {
		return TAG;
	}

	set visible(value) {
		const dplstyle = value ? 'block' : 'none';
		this._panel.style.display = dplstyle;
	}

	connectedCallback() {
		super.connectedCallback();
		this.shadowRoot.querySelector('.close').addEventListener('click', this._onClose);
		this.shadowRoot.querySelector('.login').addEventListener('click', this._onLogin);
		this.login();
	}

	disconnectedCallback() {
		this.shadowRoot.querySelector('.close').removeEventListener('click', this._onClose);
		this.shadowRoot.querySelector('.login').removeEventListener('click', this._onLogin);
	}

	_onClose() {
		this._hide();
	}

	_onLogin() {
		this._hide(createCredentials(this.shadowRoot));
	}

	_hide(credentials) {
		const error = credentials == null ? new Error('Login canceled!') : undefined;
		this.visible = false;
		if (error) this._pendingLogin.reject(error);
		else this._pendingLogin.resolve(credentials);
	}

	whenReady() {
		return this._isReady
			? Promise.resolve()
			: new Promise((resolve, reject) => { this._pendingPromises.push({ resolve, reject }); });
	}
	

// =================================
//  ABSTRACT METHODS IMPLEMENTATION
// =================================
	onLoginSuccess(/* pass additional information? */) {
		console.log('*** LOGIN SUCCESS ');
		this._isReady = true;
		// notify all pending promises...
		this._pendingPromises = resolvePendingPromises(this._pendingPromises);
	}
	onLoginFailed(err/* pass additional information? */) {
		console.log('*** LOGIN FAILED: ', err);
		alert('Login Failed!\nUnknown user or password!\nPlease try again.');
	}
	getCredentials(/* pass additional information? */) {
		return new Promise((resolve, reject) => {
			this.visible = true;
			this._pendingLogin = { resolve, reject };
		});
	}
}

if (!customElements.get(TAG)) customElements.define(TAG, LoginPanel);

export default LoginPanel;
