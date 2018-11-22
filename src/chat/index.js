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

	ws._id = _id
	ws._data = _data
	ws._isAlive = true

	const user = createClient(ws)
	const userChannel = `c:${user.ws()._data.empresa}:i:${user.ws()._data.id}`

	user.createRedis()
			.subscribe(userChannel)
			.redisOn('message', user.redisOnMessage(user))
			.wsOn('message', user.wsOnMessage(user))
			.wsOn('close', user.wsOnClose(user))
			.wsOn('pong', user.wsOnPong(user))
			.wsOn('error', user.wsOnError)
			.wsHeartbeat()
}

module.exports = chat
