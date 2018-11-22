'use strict'

const process = require('process')
// process.env.CIPHER_KEY = 'NimbleRulezz'

const debug = require('./src/lib/debug')
const wss = require('./src/server/websocket')
const chat = require('./src/chat/.')

const {
	PORT: port = 3000
} = process.env

process.title = `websocket_chat_${port}`

function onConnection(ws, req) {
	debug.ws(`onConnection | online: ${wss.clients.size}`)
	chat(ws, req)
}

function onError(err) {
	debug.error('Cannot start server', err)
}

function onListening() {
	debug.ws(`onListening | port: ${port}`)
}

wss
	.on('connection', onConnection)
	.on('listening', onListening)
	.on('error', onError)
