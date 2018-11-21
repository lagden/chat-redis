'use strict'

const debug = require('../lib/debug')
const temporal = require('../lib/temporal')

temporal.on('idle', () => {
	debug.log('Temporal is idle')
})

const client = ws => o => {
	return {...o, ...{
		ws: () => ws,
		heartbeat(time = 30000) {
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
		}
	}}
}

module.exports = client
