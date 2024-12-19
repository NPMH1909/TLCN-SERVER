const UserDto = {
  constructor(User) {
    this.username = User.username
    this.phone = User.phone
    this.email = User.email
    this.name = User.name
  }
}
export { UserDto }
