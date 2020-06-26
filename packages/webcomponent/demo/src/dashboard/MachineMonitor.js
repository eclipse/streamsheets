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

const TAG = 'machine-monitor';

/** 
 * 
 * FOR DEMO PURPOSE ONLY!!
 * 
 */

const template = document.createElement('template');
template.innerHTML = `
<style>
	.grid { 
		display: grid; 
		color: white;
		padding-left: 5px;
		font-family: "Roboto", sans-serif;
		font-size: 12pt;
		grid-gap: 5px 5px;
		grid-template-rows:	repeat(3, 25px);
		grid-template-columns: repeat(11, 40px) minmax(max-content, 1fr);
		align-items: center;
	}
	.caption-machine {
		grid-row:1; 
		grid-column: 1 / 3;
		font-weight: bold;
	}
	.name {
		grid-row:1; 
		grid-column: 3 / 9;
	}
	.caption-state {
		grid-row:2; 
		grid-column: 1 / 3;
		font-weight: bold;
	}
	.state {
		grid-row:2; 
		grid-column: 3 / 12;
	}
	.caption-stats {
		grid-row:3;
		grid-column: 1 / 3;
		font-weight: bold;
	}
	.stats {
		grid-row:3;
		grid-column: 3 / 12;
	}
</style>
<div class="grid">
	<div class="caption-machine">Machine:</div>
	<div id="name" class="name">-</div>
	<button>start</button>
	<button>stop</button>
	<button>step</button>
	<div class="caption-state">State:</div>
	<div id="state" class="state">-</div>
	<div class="caption-stats">Stats:</div>
	<div id="stats" class="stats">-</div>
</div>
`;

const setInnerText = (dom) => (id, value) => {
	const el = dom.getElementById(id);
	if (el) el.innerText = value;
};

class MachineMonitor extends HTMLElement {

	static get TAG() {
		return TAG;
	}

	constructor() {
		super();
		this._gwclient = undefined;
		this._machineId = undefined;
		this.onError = this.onError.bind(this);
		this.onDisconnected = this.onDisconnected.bind(this);
		this.onMachineStep = this.onMachineStep.bind(this);
		this.onMachineState = this.onMachineState.bind(this);

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(template.content.cloneNode(true));
		this.setText = setInnerText(this.shadowRoot);
		
		// connect buttons:
		const buttons = this.shadowRoot.querySelectorAll('button');
		buttons[0].addEventListener('click', () => this.start());
		buttons[1].addEventListener('click', () => this.stop());
		buttons[2].addEventListener('click', () => this.step());
	}

	get machineId() {
		return this._machineId;
	}

	get name() {
		return this.getAttribute('name');
	}

	start() {
		if (this._gwclient) this._gwclient.startMachine(this.machineId);
	}
	stop() {
		if (this._gwclient) this._gwclient.stopMachine(this.machineId);
	}
	step() {
		if (this._gwclient) this._gwclient.stepMachine(this.machineId);
	}

	setButtonState(machineState) {
		const buttons = this.shadowRoot.querySelectorAll('button');
		buttons[0].disabled = machineState === 'running';
		buttons[1].disabled = machineState === 'stopped';
		buttons[2].disabled = machineState === 'running';
	}

	setMachine(definition) {
		this._machineId = definition.id;
		this.setButtonState(definition.state);
		this.setText('name', definition.name);
		this.setText('state', definition.state);
		this.setText('stats', definition.stats || '-');
	}

	subscribedCallback(element, error) {
		if (!error) {
			this._gwclient = element.gatewayClient;
			element.on('error', this.machineId, this.onError);
			element.on('gateway_disconnected', this.machineId, this.onDisconnected);
			element.on('machine_state', this.machineId, this.onMachineState);
			element.on('machine_step', this.machineId, this.onMachineStep);
		} else {
			this.setText('state', error.message);
		}
	}

	unsubscribedCallback(element) {
		this._gwclient = undefined;
		element.off('error', this.machineId, this.onError);
		element.off('gateway_disconnected', this.machineId, this.onDisconnected);
		element.off('machine_state', this.machineId, this.onMachineState);
		element.off('machine_step', this.machineId, this.onMachineStep);
	}

	onError(ev) {
		this.setText('state', `ERROR: ${ev.message}`);
	}
	onDisconnected() {
		this.setText('state', 'ERROR: gateway disconnected!!');
	}

	onMachineState(ev) {
		this.setButtonState(ev.state);
		this.setText('state', ev.state);
	}

	onMachineStep(ev) {
		const { stats } = ev.data;
		const statsmsg = stats
			? `machine steps: ${stats.steps}  |  cycles/second: ${stats.cyclesPerSecond}`
			: '-';
		this.setText('stats', statsmsg);
	}
}

if (!customElements.get(TAG)) customElements.define(TAG, MachineMonitor);

export default MachineMonitor;