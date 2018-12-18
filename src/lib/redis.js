'use strict'

const Redis = require('ioredis')
const debug = require('./debug')

const {
	REDIS: ADDR = '127.0.0.1:32768'
} = process.env


function splitCommaDelimitedAddresses(addresses) {
	return addresses.split(',').map(address => ({
		host: address.split(':')[0],
		port: address.split(':')[1]
	}))
}

const addresses = splitCommaDelimitedAddresses(ADDR)
debug.log('Redis ADDR', ADDR)

let redis

if (addresses.length > 1) {
	redis = new Redis.Cluster(addresses)
} else if (addresses.length === 1) {
	redis = new Redis(addresses[0])
} else {
	throw new Error('REDIS required.')
}

module.exports = redis
