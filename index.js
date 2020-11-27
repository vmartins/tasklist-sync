const childProcess = require('child_process')
const parse = require('csv-parse/lib/sync')
const sec = require('sec')

module.exports = (options = {}) => {
	if (process.platform !== 'win32') {
		throw new Error('Windows only')
	}

	const args = ['/nh', '/fo', 'csv']

	if (options.verbose) {
		args.push('/v')
	}

	if (options.system && options.username && options.password) {
		args.push(
			'/s', options.system,
			'/u', options.username,
			'/p', options.password
		)
	}

	if (Array.isArray(options.filter)) {
		for (const filter of options.filter) {
			args.push('/fi', filter)
		}
	}

	const defaultHeaders = [
		'imageName',
		'pid',
		'sessionName',
		'sessionNumber',
		'memUsage'
	]

	const verboseHeaders = defaultHeaders.concat([
		'status',
		'username',
		'cpuTime',
		'windowTitle'
	])

	const headers = options.verbose ? verboseHeaders : defaultHeaders
	const stdout = childProcess.execFileSync('tasklist', args, {windowsHide: true}).toString()
	const data = stdout.startsWith('"') ? parse(stdout, {columns: headers}) : []

	return data.map(task => {
		task.pid = Number(task.pid)
		task.sessionNumber = Number(task.sessionNumber)
		task.memUsage = Number(task.memUsage.replace(/[^\d]/g, '')) * 1024

		if (options.verbose) {
			task.cpuTime = sec(task.cpuTime)
		}

		return task
	})
}
