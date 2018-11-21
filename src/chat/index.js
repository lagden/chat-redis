'use strict'

const debug = require('../lib/debug')
const msg = require('./msg')
const client = require('./client')

const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x)
const createClient = ws => pipe(
	msg,
	client(ws)
)({})

function chat(ws, req) {
	const {_data, _id: id} = req
	const _id = _data.id

	// Set os dados do websocket
	ws._id = _id
	ws._data = _data
	ws._isAlive = true

	const user = createClient(ws).createRedis()

	// escrever o user nos canais
	// fazer tratamento no onMessage

	const handleMessage = (ch, data) => {
		try {
			user.ws().send(data)
		} catch (error) {
			debug.error(error)
		}
	}
	user.pub().on('message', handleMessage)

	const off = () => {
		user.ws()
			.removeAllListeners('message', onMessage)
			.removeAllListeners('close', onClose)
			.removeAllListeners('error', onError)
			.removeAllListeners('pong', onPong)
	}

	const onMessage = m => {
		user.pub().publish(m)
	}

	const onClose = (code, message = false) => {
		debug.ws(`onClose | Disconnection: ${code}${message ? `, ${message}` : ''}`)
	}

	const onError = error => {
		debug.error('onError | Connection error', error)
	}

	const onPong = () => {
		user.ws()._isAlive = true
	}

	// Escuta os eventos
	user.ws()
		.on('message', onMessage)
		.on('close', onClose)
		.on('error', onError)
		.on('pong', onPong)

	// Liga o heartbeat
	user.heartbeat(5000)
}

module.exports = chat
