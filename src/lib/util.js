'use strict'

function o2j(v) {
	return JSON.stringify(v)
}

function j2o(v) {
	return JSON.parse(v)
}

function sleep(duration = 1) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve()
		}, Number(duration) * 1000)
	})
}

exports.o2j = o2j
exports.j2o = j2o
exports.sleep = sleep
