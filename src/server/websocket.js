/**
 * Módulo de Web Socket Server
 * @module src/server/websocket
 */
'use strict'

// const {parse: parseQs} = require('querystring')
// const {verify, parse: parseJWT} = require('@tadashi/jwt')
const {Server} = require('ws')
const uuidv4 = require('uuid/v4')
const server = require('./http')
const debug = require('../lib/debug')

const {
	TADASHI_SECRET_KEY_JWT: secret = '32ee8b3612baf7912ff05d906a51313a',
	NODE_ENV = 'production'
} = process.env

/** Cria o servidor web socket */
const wsS = new Server({
	server,
	maxPayload: 1000000,
	perMessageDeflate: true,
	clientTracking: true,
	verifyClient(info, cb) {
		let valid = false
		let code = 401
		let message = 'Unauthorized'
		// try {
		// 	const {origin} = info
		// 	const {jwt} = parseQs(info.req.url.split('?')[1])
		// 	const claims = Object.create(null)
		// 	if (origin && NODE_ENV === 'production') {
		// 		claims.aud = origin
		// 	}
		// 	valid = verify(jwt, claims, secret)
		// 	if (valid) {
		// 		const {payload: {data}} = parseJWT(jwt)
		// 		info.req._data = data
		// 	}
		// } catch (error) {
		// 	code = 500
		// 	message = 'Internal Server Error'
		// 	debug.error(error)
		// }

		// tmp
		const users= ['Sabrina', 'Lucas']
		const userId = Math.floor(Math.random() * 10) % 2
		valid = true
		code = 100
		message = 'Continue'
		info.req._id = uuidv4()
		info.req._data = {
			empresa: 8,
			unidade: 1,
			id: userId,
			name: users[userId]
		}
		// tmp end
		cb(valid, code, message)
	}
})

module.exports = wsS
