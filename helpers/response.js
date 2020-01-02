class Response {
  constructor (success, code, message, result) {
    this.code = code || 0
    this.message = message || 'No message to send',
    this.result = result || undefined
    this.success = success || undefined
  }
}

module.exports = Response
