// name: { type: String, required: true },
//     address: { type: String, required: true },
//     openTime: { type: Number, required: true },
//     closeTime: { type: Number, required: true },
//     description: { type: String, required: true },
//     imageUrls: { type: String, required: true },
//     createdAt: { type: Date, required: true, default: Date.now },
class RestaurantDto {
  constructor(Table) {
    this._id = Table._id
    this.name = Table.name
    this.address = Table.address
    this.openTime = Table.openTime
    this.closeTime = Table.closeTime
    this.description = Table.description
    this.imageUrls = Table.imageUrls
    this.slider1 = Table.slider1
    this.slider2 = Table.slider2
    this.slider3 = Table.slider3
    this.slider4 = Table.slider4
    this.public_id_avatar = Table.public_id_avatar
    this.public_id_slider1 = Table.public_id_slider1
    this.public_id_slider2 = Table.public_id_slider2
    this.public_id_slider3 = Table.public_id_slider3
    this.public_id_slider4 = Table.public_id_slider4
  }
}

export default RestaurantDto
