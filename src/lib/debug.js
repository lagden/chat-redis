'use strict'

const debug = require('debug')

const ws = debug('websocket_chat:ws')
const redis = debug('websocket_chat:redis')
const log = debug('websocket_chat:log')
const error = debug('websocket_chat:error')

ws.color = debug.colors[1]
redis.color = debug.colors[4]
log.color = debug.colors[3]
error.color = debug.colors[5]

module.exports = {
	ws,
	redis,
	error,
	log
}
