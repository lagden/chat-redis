'use strict'

const debug = require('../lib/debug')
const temporal = require('../lib/temporal')
// tmp
const uuidv4 = require('uuid/v4')
//

temporal.on('idle', () => {
	debug.log('Temporal is idle')
})

const client = ws => o => {
	return {...o, ...{
		ws: () => ws,
		wsHeartbeat(time = 30000) {
			const task = temporal.loop(time, () => {
				if (ws._isAlive === false) {
					debug.log('heartbeat stop')
					ws.terminate()
					task.stop()
				} else {
					ws._isAlive = false
					ws.ping(() => {})
				}
			})
		},
		wsOff() {
			debug.log('wsOff | removeAllListeners')
			ws
				.removeAllListeners('close')
				.removeAllListeners('error')
				.removeAllListeners('message')
				.removeAllListeners('open')
				.removeAllListeners('ping')
				.removeAllListeners('pong')
				.removeAllListeners('unexpected-response')
				.removeAllListeners('upgrade')
			return this
		},
		wsOn(event, fn) {
			ws.on(event, fn)
			return this
		},
		wsOnMessage(user) {
			return m => {
				try {
					const data = JSON.parse(m)
					const {to: [id]} = data
					debug.log('wsOnMessage', id)
					const ch = `c:${user.ws()._data.empresa}:i:${id}`
					// ver com o Thin onde enviar as msgs e talvez alterar o nome do canal (ch)
					// grava no banco e publica
					// manipulacao de dados
					data.date = Date.now()
					data.from = user.ws()._data.id
					data.type = 'message'
					data.id = uuidv4()
					//
					user.publish(ch, JSON.stringify(data))
				} catch (error) {
					debug.error('wsOnMessage', error)
				}
			}
		},
		wsOnClose(user) {
			return (code, message = false) => {
				debug.ws(`wsOnClose | Disconnection: ${code}${message ? `, ${message}` : ''}`)
				user.wsOff().destroyRedis()
			}
		},
		wsOnPong(user) {
			return () => {
				user.ws()._isAlive = true
			}
		},
		wsOnError(error) {
			debug.error('wsOnError', error)
		}
	}}
}

module.exports = client
