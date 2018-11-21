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

function _onConnection(ws, req) {
	debug.ws(`_onConnection | online: ${wss.clients.size}`)
	chat(ws, req)
}

function _onError(err) {
	debug.error('Cannot start server', err)
}

function _onListening() {
	debug.ws(`_onListening | port: ${port}`)
}

wss
	.on('connection', _onConnection)
	.on('listening', _onListening)
	.on('error', _onError)
