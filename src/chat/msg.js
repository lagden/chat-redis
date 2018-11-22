'use strict'

const debug = require('../lib/debug')
const redis = require('../lib/redis')

const msg = o => {
	let pub
	let sub
	let channels
	return {...o, ...{
		pub: () => pub,
		sub: () => sub,
		channels: () => channels,
		createRedis() {
			pub = redis.duplicate()
			sub = redis.duplicate()
			channels = []
			return this
		},
		destroyRedis() {
			this.punsubscribe()
			pub.disconnect()
			sub.disconnect()
		},
		publish(ch, data) {
			debug.redis(`publish: ${ch} ${data}`)
			pub.publish(ch, data)
			return this
		},
		subscribe(ch) {
			debug.redis(`subscribe: ${ch}`)
			if (channels.includes(ch)) {
				return this
			}
			sub.subscribe(ch, (error, count) => {
				if (error) {
					throw error
				}
				channels.push(ch)
				debug.redis(`Subscribed to ${ch} channel: ${count}`)
			})
			return this
		},
		unsubscribe(ch) {
			if (!channels.includes(ch)) {
				return this
			}
			sub.unsubscribe(ch, (error, count) => {
				if (error) {
					throw error
				}
				const idx = channels.indexOf(ch)
				if (idx > -1) {
					channels.splice(idx, 1)
				}
				debug.redis(`Unsubscribed to ${ch} channel: ${count}`)
			})
			return this
		},
		punsubscribe() {
			sub.punsubscribe('*', (error, count) => {
				if (error) {
					throw error
				}
				channels = []
				sub.removeAllListeners('message')
				debug.redis(`Unsubscribe to all channels: ${count}`)
			})
			return this
		},
		redisOn(event, fn) {
			sub.on(event, fn)
			return this
		},
		redisOnMessage(user) {
			return (ch, data) => {
				debug.log('redisOnMessage', ch, data)
				try {
					user.ws().send(data)
				} catch (error) {
					debug.error('redisOnMessage', error)
				}
			}
		}
	}}
}

module.exports = msg
