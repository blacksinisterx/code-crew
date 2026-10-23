// main.js: the Captain. Starts the home hub.
import { connect } from './lights.js';
import { setTarget } from './thermostat.js';
import { start } from './schedule.js';
import { announce } from './bell.js';
import { snapshot } from './camera.js';

const socket = connect((state) => announce(`lights are now ${state.on ? 'on' : 'off'}`));
setTarget(21);
start(() => announce('hub is alive'));
await snapshot(Buffer.from('frame'));
socket.close();
