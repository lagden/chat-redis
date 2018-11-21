'use strict'

const base = require('koa-app-base')
const serve = require('koa-static')
const {join} = require('path')
// const routes = require('../routes')
const debug = require('../lib/debug')

const _public = join(process.cwd(), 'public')
const {
	PORT: port = 3000,
} = process.env

const app = base({error: true})
	// .use(routes)
	.use(serve(_public))
	.on('error', debug.error)

app.proxy = true

const server = app.listen(port)

process.on('SIGINT', () => {
	server.close(() => {
		process.exit()
	})
})

module.exports = server
