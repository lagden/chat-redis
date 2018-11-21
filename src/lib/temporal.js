'use strict'

// Script from: https://github.com/rwaldron/temporal

const process = require('process')
const Emitter = require('events')

const tick = setImmediate || process.nextTick

// Default resolution is 1ms
const DEFAULT_RESOLUTION = 1e6
let resolutionDivisor = DEFAULT_RESOLUTION

// All APIs will be added to `exportable`, which is lastly
// assigned as the value of module.exports
const exportable = new Emitter()

// Map containing callback queues, keys are time in MS
const queues = new Map()

// Actively processing queue
let isProcessing = false

const hrTime = () => {
	const _hrtime = process.hrtime()
	return Math.floor((_hrtime[0] * 1e9 + _hrtime[1]) / resolutionDivisor)
}

// Store the last event time
let gLast = hrTime()

/**
 * Task create a temporal task item
 * @param {Object} entry Options for entry {time, task}
 */
class Task extends Emitter {
	/**
	 * Task.deriveOp (reduction)
	 * (static)
	 */
	static deriveOp(p, v) {
		return v !== 'task' ? v : p
	}

	constructor(entry) {
		super()

		if (!(this instanceof Task)) {
			return new Task(entry)
		}

		this.called = 0
		this.now = this.calledAt = hrTime()

		if (resolutionDivisor !== DEFAULT_RESOLUTION) {
			entry.time = ~~(entry.time * (DEFAULT_RESOLUTION / resolutionDivisor))
		}

		// Side table property definitions
		this.isRunnable = true
		this.later = this.now + entry.time
		this.task = entry.task
		this.type = entry.type
		this.time = entry.time

		if (this.later > gLast) {
			gLast = this.later
		}

		if (!queues.has(this.later)) {
			queues.set(this.later, [])
		}

		// console.log(entry.later, this)
		queues.get(this.later).push(this)
	}

	/**
	 * stop Stop the current behaviour
	 */
	stop() {
		this.isRunnable = false
		this.emit('stop')
	}
}

class Queue extends Emitter {
	constructor(tasks) {
		super()
		this.refs = []
		this.add(tasks)
	}

	stop() {
		this.refs.forEach(ref => {
			ref.stop()
		})
		this.emit('stop')
	}

	add(tasks) {
		this.cumulative = this.cumulative || 0

		while (tasks.length) {
			let item = tasks.shift()
			let op = Object.keys(item).reduce(Task.deriveOp, '')
			let ref

			this.cumulative += item[op]

			// For the last task, ensure that an 'end' event is
			// emitted after the final callback is called.
			if (tasks.length === 0) {
				let task = item.task
				item.task = temporald => {
					task.call(this, temporald)

					// Emit the end event _from_ within the _last_ task
					// defined in the Queue tasks. Use the |tasks| array
					// object as the access key.
					this.emit('end', temporald)

					// Reset on last one in the queue
					this.cumulative = 0
				}
			}

			if (op === 'loop' && tasks.length === 0) {
				// When transitioning from a 'delay' to a 'loop', allow
				// the loop to iterate the amount of time given,
				// but still start at the correct offset.
				ref = exportable.delay(this.cumulative - item[op], () => {
					ref = exportable.loop(item[op], item.task)
					this.refs.push(ref)
				})
			} else {
				ref = exportable[op](this.cumulative, item.task)
			}

			this.refs.push(ref)
		}
	}
}

let previousTime = hrTime()

function processQueue() {
	if (!isProcessing) {
		isProcessing = true
		exportable.emit('busy')
	}

	let now = hrTime()
	let entries = []
	let callProcessQueue = true

	// Nothing scheduled, don't call processQueue again
	if (gLast <= now) {
		callProcessQueue = false
	}

	for (let i = previousTime; i <= now; i++) {
		// Accumlate entries
		if (queues.has(i) && queues.get(i).length) {
			entries.push(...queues.get(i))
		}
	}

	if (entries.length) {
		// console.log(now, entries)
		// console.log(entries)
		while (entries.length) {
			// Shift the entry out of the current list
			let entry = entries.shift()

			// Execute the entry's callback, with
			// 'entry' as first arg
			if (entry.isRunnable) {
				entry.called++
				entry.calledAt = now
				entry.task.call(entry, entry)
			}

			// Additional 'loop' handling
			if (entry.type === 'loop' && entry.isRunnable) {
				// There is an active loop, so keep the
				// processQueue active.
				callProcessQueue = true

				// Calculate the next execution time
				entry.later = now + entry.time

				// With sub-millisecond wait times, it's conceivable that the clock
				// may have passed our next task time so make sure it runs
				if (entry.later > gLast) {
					gLast = entry.later
				}

				// Create a queue entry if none exists
				if (!queues.has(entry.later)) {
					queues.set(entry.later, [])
				}

				if (entry.isRunnable) {
					// Push the entry into the queue
					queues.get(entry.later).push(entry)
				}
			}
		}

		// Cleanup
		for (let i = previousTime; i <= now; i++) {
			queues.delete(i)
		}

		entries.length = 0
	}

	previousTime = now

	if (callProcessQueue) {
		tick(processQueue)
	} else {
		isProcessing = false
		exportable.emit('idle')
	}
}

exportable.queue = tasks => {
	const queue = new Queue(tasks)
	processQueue()
	return queue
}

['loop', 'delay'].forEach(type => {
	exportable[type] = (time, operation) => {
		if (typeof time === 'function') {
			operation = time
			time = 10
		}
		const task = new Task({
			time: time,
			type: type,
			task: operation
		})

		if (!isProcessing) {
			processQueue()
		}

		return task
	}
})

exportable.clear = () => {
	isProcessing = false
	exportable.removeAllListeners()
	queues.clear()
}

exportable.resolution = value => {
	if (value === 0.1 || value === 0.01) {
		resolutionDivisor = 1e6 * value
	} else {
		resolutionDivisor = 1e6
	}
	previousTime = hrTime()
}

module.exports = exportable
