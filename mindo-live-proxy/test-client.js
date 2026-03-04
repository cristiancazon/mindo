const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('Test client connected. Sending setup...');
    ws.send(JSON.stringify({
        type: 'setup',
        age: 8,
        name: 'Niño',
        persona: 'Mindo (Niño)',
        language: 'espanol_latino'
    }));
});

ws.on('close', () => {
    console.log('Connection closed');
});

ws.on('error', (err) => {
    console.error('Test client error:', err);
});
