// lights.js: the Lamplighter. Switches the lamps through the lamp hub on the home network.
export function connect(onChange) {
  const socket = new WebSocket('ws://192.168.0.20:8080/lights');
  socket.onmessage = (message) => onChange(JSON.parse(message.data));
  return socket;
}
