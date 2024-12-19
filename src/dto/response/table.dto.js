const TableDto = {
  constructor(Table) {
    this._id = Table._id
    this.tableNumber = Table.tableNumber
    this.status = Table.status
    this.restaurantID = Table.restaurantID
  }
}
