export class Response {
  constructor(status, message, data, info) {
    this.status = status
    this.message = message
    this.data = data
    this.info = info
  }

  resposeHandler = (res) => {
    return res.status(this.status).json({
      status: this.status,
      message: this.message,
      data: this.data,
      info: this.info
    })
  }
}
