/* eslint-disable camelcase */
import axios from 'axios'
import { TableModel } from '../models/tables.model.js'
import { CommonUtils } from '../utils/common.util.js'
import { NotFoundError } from '../errors/notFound.error.js'
import { OrderModel } from '../models/orders.model.js'
import mongoose, { Types } from 'mongoose'
import { BadRequestError } from '../errors/badRequest.error.js'
import { payOS } from '../configs/payos.config.js'
import { PAYMENT_METHOD } from '../constants/payment_method.constant.js'
import { PAYMENT_STATUS } from '../constants/payment_status.constant.js'
import { RestaurantModel } from '../models/restaurants.model.js'
import { MailService } from './mail.service.js'
import { StaffModel } from '../models/staff.model.js'
import PayOS from '@payos/node'
import { momoConfig } from '../configs/momo.config.js'
import crypto from "crypto";

const getAllOrder = async (page = 1, size = 5) => {
  const orders = await OrderModel.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurant_id',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    {
      $unwind: '$restaurant'
    },
    {
      $skip: (page - 1) * size
    },
    {
      $limit: size
    },
    {
      $project: {
        _id: 1,
        user: '$user',
        restaurant: '$restaurant',
        total_people: 1,
        name: 1,
        phone_number: 1,
        payment: 1,
        menu_list: 1,
        status: 1,
        checkin: 1,
        orderCode: 1,
        total: 1,
        checkout: 1,
        email: 1
      }
    }
  ])
  const list = []
  for (const order of orders) {
    list.push(order)
  }
  return {
    data: list,
    info: {
      total: await OrderModel.countDocuments(),
      page,
      size,
      number_of_pages: Math.ceil((await OrderModel.countDocuments()) / size)
    }
  }
}
const getAllOrderByStaffId = async (id, page = 1, size = 5) => {
  const staff = await StaffModel.findOne({ staff_id: id, deleted_at: null }).orFail(() => {
    throw new NotFoundError('Nhân viên không tồn tại')
  });

  const orders = await OrderModel.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true // Cho phép user có thể là null (đối với walk-in)
      }
    },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurant_id',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    {
      $unwind: '$restaurant'
    },
    {
      $match: {
        'restaurant._id': staff.restaurant_id,
        'restaurant.deleted_at': null,
        // Kiểm tra điều kiện cho cả đơn hàng có user_id và không có user_id (walk-in)
        $or: [
          { 'user_id': { $exists: false } }, // Đơn hàng walk-in không có user_id
          { 'user_id': { $ne: null } } // Đơn hàng có user_id
        ]
      }
    },
    {
      $sort: { createdAt: -1 }, // Sắp xếp giảm dần theo created_at (mới nhất trước)
    },
    {
      $skip: (page - 1) * size
    },
    {
      $limit: size
    },
    {
      $project: {
        _id: 1,
        user: '$user',
        restaurant: '$restaurant',
        total_people: 1,
        name: 1,
        phone_number: 1,
        payment: 1,
        menu_list: 1,
        status: 1,
        checkin: 1,
        orderCode: 1,
        total: 1,
        checkout: 1,
        email: 1
      }
    }
  ]);

  const list = [];
  for (const order of orders) {
    list.push(order);
  }

  const total = await OrderModel.countDocuments({
    deleted_at: null,
    restaurant_id: {
      $in: await RestaurantModel.find({ _id: staff.restaurant_id, deleted_at: null }).distinct('_id')
    },
    $or: [
      { 'user_id': { $exists: false } }, // Đơn hàng walk-in không có user_id
      { 'user_id': { $ne: null } } // Đơn hàng có user_id
    ]
  });

  return {
    data: list,
    info: {
      total,
      page,
      size,
      number_of_pages: Math.ceil(total / size)
    }
  };
};

const getAllOrderByUserId = async (id, page = 1, size = 5, status = '') => {
  const matchConditions = {
    'restaurant.user_id': id,
    'restaurant.deleted_at': null,
  };

  // Thêm điều kiện lọc theo `status` nếu có
  if (status) {
    matchConditions.status = status;
  }

  const orders = await OrderModel.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurant_id',
        foreignField: '_id',
        as: 'restaurant',
      },
    },
    {
      $unwind: '$restaurant',
    },
    {
      $match: matchConditions,
    },
    {
      $sort: { createdAt: -1 }, // Sắp xếp giảm dần theo created_at (mới nhất trước)
    },
    {
      $skip: (page - 1) * size,
    },
    {
      $limit: size,
    },
    {
      $project: {
        _id: 1,
        user: '$user',
        restaurant: '$restaurant',
        total_people: 1,
        name: 1,
        phone_number: 1,
        payment: 1,
        status: 1,
        checkin: 1,
        orderCode: 1,
        total: 1,
        checkout: 1,
        email: 1,
        list_menu:1,
      },
    },
  ]);

  const total = await OrderModel.countDocuments({
    deleted_at: null,
    restaurant_id: {
      $in: await RestaurantModel.find({ user_id: id, deleted_at: null }).distinct('_id'),
    },
    ...(status && { status }), // Thêm điều kiện `status` nếu có
  });

  return {
    data: orders,
    info: {
      total,
      page,
      size,
      number_of_pages: Math.ceil(total / size),
    },
  };
};

const getUserOrders = async (userId, page = 1, size = 5) => {
  const orders = await OrderModel.aggregate([
    {
      $match: {
        user_id: userId, 
        deleted_at: null, 
      },
    },
    {
      $lookup: {
        from: "restaurants",
        localField: "restaurant_id",
        foreignField: "_id",
        as: "restaurant",
      },
    },
    {
      $unwind: "$restaurant", // Gỡ mảng "restaurant" thành object
    },
    {
      $sort: {createdAt:-1}, // Bỏ qua các đơn hàng không thuộc trang hiện tại
    },
    {
      $skip: (page - 1) * size, // Bỏ qua các đơn hàng không thuộc trang hiện tại
    },
    {
      $limit: size, // Lấy số lượng đơn hàng theo kích thước trang
    },
    {
      $project: {
        _id: 1,
        restaurant: "$restaurant.name", // Lấy tên nhà hàng
        restaurant_id:1,
        total_people: 1,
        orderCode: 1,
        total: 1,
        status: 1,
        checkin: 1,
        rating: 1,
        created_at: 1,
        list_menu:1,
      },
    },
  ]);

  const total = await OrderModel.countDocuments({
    user_id: userId,
    deleted_at: null, // Loại bỏ các đơn hàng đã bị xóa
  });

  return {
    data: orders,
    info: {
      total, // Tổng số đơn hàng
      page, // Trang hiện tại
      size, // Kích thước trang
      number_of_pages: Math.ceil(total / size), // Tổng số trang
    },
  };
};

const getOrderById = async (id) => {
  const orders = await OrderModel.aggregate([
    {
      $match: {
        _id: Types.ObjectId.createFromHexString(id),
        deleted_at: null
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurant_id',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    {
      $unwind: '$restaurant'
    },
    {
      $project: {
        _id: 1,
        user: '$user',
        restaurant: '$restaurant',
        restaurant_id: 1,
        total_people: 1,
        name: 1,
        phone_number: 1,
        payment: 1,
        menu_list: 1,
        status: 1,
        checkin: 1,
        orderCode: 1,
        total: 1,
        checkout: 1,
        email: 1
      }
    }
  ])
  const list = []
  for (const order of orders) {
    list.push(order)
  }
  return list
}
const payWithMoMo = async ({ orderCode, total }) => {
  console.log('ordercode', orderCode)
  const requestId = `momo_${orderCode}_${Date.now()}`;
  const orderInfo = `Thanh toán đơn hàng ${orderCode}`;
  const returnUrl = "http://localhost:5173/payment-success"; // URL khi thanh toán thành công
  const notifyUrl = "http://localhost:5173/api/payment/momo-notify"; // URL nhận kết quả thanh toán

  const rawData = `accessKey=${momoConfig.accessKey}&amount=${total}&extraData=&ipnUrl=${notifyUrl}&orderId=${orderCode}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=captureWallet`;

  const signature = crypto.createHmac("sha256", momoConfig.secretKey)
                          .update(rawData)
                          .digest("hex");

  const requestBody = {
    partnerCode: momoConfig.partnerCode,
    accessKey: momoConfig.accessKey,
    requestId,
    amount: total,
    orderId: orderCode,
    orderInfo,
    redirectUrl: returnUrl,
    ipnUrl: notifyUrl,
    requestType: "captureWallet",
    extraData: "",
    lang: "vi",
    signature,
  };

  try {
    const response = await axios.post(momoConfig.endpoint, requestBody, {
      headers: { "Content-Type": "application/json" }
    });

    return response.data.payUrl; // Trả về URL thanh toán MoMo
  } catch (error) {
    console.error("Lỗi khi tạo thanh toán MoMo:", error);
    throw error;
  }
};
const createOrder = async (
  id,
  { total_people, email, name, phone_number, payment, menu_list, checkin, restaurant_id, total }
) => {
  const checkinTime = new Date(checkin);

  // Lấy nhà hàng
  const restaurant = await RestaurantModel.findById(restaurant_id);
  const endTime = new Date(checkinTime.getTime() + restaurant.limitTime * 60 * 60 * 1000); // Thời gian kết thúc của đơn mới

  // Lấy tất cả đơn hàng liên quan đến nhà hàng này
  const orders = await OrderModel.find({
    restaurant_id: restaurant_id,
    status: { $in: ["PENDING", "CONFIRMED"] } // Chỉ lấy các đơn chưa hoàn thành
  });

  // Tìm các đơn giao thoa với đơn mới
  const overlappingOrders = orders.filter((order) => {
    const orderEndTime = new Date(order.checkin.getTime() + restaurant.limitTime * 60 * 60 * 1000);
    return (
      !(checkinTime >= orderEndTime || endTime <= order.checkin) // Đơn hàng này trùng thời gian với đơn mới
    );
  });

  // Tính tổng số đơn và số người tại thời điểm
  const totalOrdersAtTime = overlappingOrders.length;
  const totalPeopleAtTime = overlappingOrders.reduce((sum, order) => sum + order.total_people, 0);

  // Kiểm tra giới hạn
  if (totalOrdersAtTime >= restaurant.orderAvailable) {
    throw new Error(
      "Không thể đặt thêm đơn, số lượng đơn tại thời điểm đã đạt giới hạn."
    );
  }
  if (totalPeopleAtTime + total_people > restaurant.peopleAvailable) {
    throw new Error(
      "Không thể đặt thêm đơn, số lượng người tại thời điểm đã đạt giới hạn."
    );
  }

  // Tạo đơn hàng
  const order = await OrderModel.create({
    _id: new mongoose.Types.ObjectId(),
    user_id: id,
    total_people,
    name,
    phone_number,
    payment,
    list_menu: menu_list,
    status: "PENDING",
    checkin: checkinTime,
    orderCode: Number(String(new Date().getTime()).slice(-6)),
    restaurant_id,
    total: Number(total).toFixed(0),
    amount_received: Number(total).toFixed(0),
    email,
  });

  if (payment === "CREDIT_CARD") {
    const paymentLinkRes = await payOrder({ orderCode: order.orderCode, total });
    return { order, paymentLinkRes };
  }
  if (payment === "MOMO_PAY") {
    const paymentLink = await payWithMoMo({ orderCode: order.orderCode, total });
    return { order, paymentLink };
  }
  updateBookingCount(restaurant_id);
  return order;
};

const updateBookingCount = async (restaurantId) => {
  try {
    await RestaurantModel.findByIdAndUpdate(
      restaurantId,
      { $inc: { bookingCount: 1 } }, // Tăng bookingCount lên 1
      { new: true }
    );
  } catch (error) {
    console.error("Lỗi cập nhật bookingCount:", error);
  }
};

const createWalkinOrder = async (user_id,{ menu_list, total }) => {
  // Lấy thông tin nhà hàng từ StaffModel dựa trên user_id
  const staff = await StaffModel.findOne({ staff_id: user_id }); // Lấy thông tin nhân viên từ user_id
  if (!staff) {
    throw new Error("Nhân viên không tồn tại");
  }
  
  const restaurant_id = staff.restaurant_id; // Lấy restaurant_id từ thông tin nhân viên

  // Lấy nhà hàng từ restaurant_id
  const restaurant = await RestaurantModel.findById(restaurant_id);
  if (!restaurant) {
    throw new Error("Nhà hàng không tồn tại");
  }

  // Tạo đơn hàng cho khách walk-in
  const order = await OrderModel.create({
    _id: new mongoose.Types.ObjectId(),
    is_walk_in: true, // Đánh dấu là khách walk-in
    restaurant_id,
    checkin: Date.now(),
    status: "ONHOLD", // Đơn hàng đang chờ phục vụ, khách đã có mặt
    list_menu: menu_list,
    total: Number(total).toFixed(0),
  });

  return order;
};

const updatePaymentStatus = async (orderId, paymentMethod, amount_due) => {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  order.orderCode = Number(String(new Date().getTime()).slice(-6))
  await order.save()
  order.payment = paymentMethod;
  
  if (paymentMethod === "CREDIT_CARD") {
    const paymentLinkRes = await payOrder({ orderCode: Number(order.orderCode), total: amount_due });
    return { order, paymentLinkRes };
  }
  throw new Error('Phương thức thanh toán không hợp lệ');
};

const updateOrderStatusAfterPayment = async (orderId, orderCode) => {
  // Lấy đơn hàng từ cơ sở dữ liệu
  const order = await OrderModel.findById(orderId);

  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }

  // Gọi API của PayOS để lấy trạng thái thanh toán
  const paymentStatusResponse = await PayOS.getPaymentStatus({ orderCode });

  if (!paymentStatusResponse || !paymentStatusResponse.status) {
    throw new Error('Không thể xác nhận trạng thái thanh toán');
  }

  if (paymentStatusResponse.status === 'SUCCESS') {
    order.status = 'COMPLETED';  // Đơn hàng đã thanh toán thành công
    order.amount_received = paymentStatusResponse.totalAmount;
    order.amount_due = 0;  // Đã thanh toán hết
  } else if (paymentStatusResponse.status === 'FAILED') {
    order.amount_received = 0;
    order.amount_due = order.totalAmount;  // Giữ lại số tiền cần thanh toán
  } else {
    throw new Error('Trạng thái thanh toán không hợp lệ');
  }

  await order.save();

  return { order };
};

const createDirectOrder = async (
  id,
  { total_people, email, name, phone_number, payment, menu_list, checkin, restaurant_id, total }
) => {
  const order = await OrderModel.create({
    _id: new mongoose.Types.ObjectId(),
    user_id: id,
    total_people,
    name,
    phone_number,
    payment,
    menu_list,
    status: 'PENDING',
    checkin,
    orderCode: Number(String(new Date().getTime()).slice(-6)),
    restaurant_id,
    total: Number(total).toFixed(0),
    email
  })
  if (payment === 'CREDIT_CARD') {
    const paymentLinkRes = await payDirectOrder({ orderCode: order.orderCode, total })
    return { order, paymentLinkRes }
  }
  return order
}
const updateOrder = async (id, { newListMenu }) => {
  console.log("new list_menu", newListMenu);
  const order = await OrderModel.findById(id).orFail(new NotFoundError('Order not found'));
  const updatedListMenu = [...order.list_menu]; 
  for (const newItem of newListMenu) {
    const existingItemIndex = updatedListMenu.findIndex(item => item.name === newItem.name);
        if (existingItemIndex !== -1) {
      updatedListMenu[existingItemIndex].quantity += newItem.quantity;
    } else {
      const itemWithIdAndUnit = {
        ...newItem,  
        _id: newItem._id , 
        unit: newItem.unit || 'unit',  
      };
      updatedListMenu.push(itemWithIdAndUnit); 
    }
  }

  const updatedTotal = updatedListMenu.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity * (1 - item.discount / 100);
    return sum + itemTotal;
  }, 0);

  return await OrderModel.findByIdAndUpdate(id, {
    list_menu: updatedListMenu,
    total: updatedTotal, 
    updated_at: Date.now(),
  });
};


const confirmOrder = async (id) => {
  const order = await OrderModel.findOne({ orderCode: id })
  if (!order) {
    throw new NotFoundError('Order not found')
  }
  if (order.payment === 'CASH') {
    const result = await OrderModel.aggregate([
      {
        $match: { orderCode: Number(id) }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      {
        $unwind: '$restaurant'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          user: '$user',
          restaurant: '$restaurant',
          total_people: 1,
          name: 1,
          phone_number: 1,
          payment: 1,
          status: 1,
          checkin: 1,
          orderCode: 1,
          total: 1,
          checkout: 1,
          email: 1,
          list_menu: 1
        }
      }
    ])

    const subject = 'Xác nhận đơn hàng'
    const html =
      `<p>Đơn hàng của bạn đã được xác nhận</p>
                  <p>Mã đơn hàng: ${result[0].orderCode}</p>
                  <p>Ngày nhận bàn: ${Date(result[0].checkin).slice(0, 11)}</p>
                  <p>Thời gian nhận bàn: ${Date(result[0].checkin).slice(11, 16)}</p>
                  <p>Địa chỉ nhà hàng: ${result[0].restaurant.address}</p>
                  <p>Địa chỉ email: ${result[0].email}</p>
                  <p>Số điện thoại: ${result[0].phone_number}</p>
                  <p>Người nhận bàn: ${result[0].name}</p>
                  <p>Số người: ${result[0].total_people}</p>
                  <p>Phương thức thanh toán: ${result[0].payment}</p>
                  <p>Menu: 
                  ` +
      result[0].list_menu
        .map((item) => `<p>${item.name} - ${Number(item.price).toFixed(0)} đ - ${item.quantity} - ${item.unit} </p>`)
        .join('') +
      `
                  </p>
                  <p>Tổng tiền: ${Number(result[0].total).toFixed(0).toLocaleString('vi-VN')} đ</p>
                  `
    MailService.sendMail({ to: result[0].email, subject, html })
    return order
  }
  
  const status = await axios.get(`https://api-merchant.payos.vn/v2/payment-requests/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': process.env.PAYOS_CLIENT_ID,
      'x-api-key': process.env.PAYOS_API_KEY
    }
  })
  if (status.data.data.status === 'CANCELLED') {
    return await OrderModel.findOneAndUpdate({ orderCode: order.orderCode }, { status: 'CANCELLED' })
  }
  if (status.data.data.status === 'PAID') {
    const result = await OrderModel.aggregate([
      {
        $match: { orderCode: Number(id) }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      {
        $unwind: '$restaurant'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          user: '$user',
          restaurant: '$restaurant',
          total_people: 1,
          name: 1,
          phone_number: 1,
          payment: 1,
          status: 1,
          checkin: 1,
          orderCode: 1,
          total: 1,
          checkout: 1,
          email: 1,
          list_menu: 1
        }
      }
    ])

    const subject = 'Xác nhận đơn hàng'
    const html =
      `<p>Đơn hàng của bạn đã được xác nhận</p>
                  <p>Mã đơn hàng: ${result[0].orderCode}</p>
                  <p>Ngày nhận bàn: ${Date(result[0].checkin).slice(0, 11)}</p>
                  <p>Thời gian nhận bàn: ${Date(result[0].checkin).slice(11, 16)}</p>
                  <p>Địa chỉ nhà hàng: ${result[0].restaurant.address}</p>
                  <p>Địa chỉ email: ${result[0].email}</p>
                  <p>Số điện thoại: ${result[0].phone_number}</p>
                  <p>Người nhận bàn: ${result[0].name}</p>
                  <p>Số người: ${result[0].total_people}</p>
                  <p>Phương thức thanh toán: ${result[0].payment}</p>
                  <p>Menu: 
                  ` +
      result[0].list_menu
        .map((item) => `<p>${item.name} - ${Number(item.price).toFixed(0)} đ - ${item.quantity} - ${item.unit} </p>`)
        .join('') +
      `
                  </p>
                  <p>Tổng tiền: ${Number(result[0].total).toFixed(0).toLocaleString('vi-VN')} đ</p>
                  `
    MailService.sendMail({ to: result[0].email, subject, html })
    return await OrderModel.findOneAndUpdate({ orderCode: order.orderCode }, { status: 'SUCCESS' })
  }
}
const confirmDirectOrder = async (id) => {
  const order = await OrderModel.findById({orderCode: id}).orFail(new NotFoundError('Order not found'))
  order.status = PAYMENT_STATUS.ONHOLD
  return await OrderModel.findByIdAndUpdate(id, {
    status: 'SUCCESS'
  })
}
const payDirectOrder = async (total) => {
  // https://api.vietqr.io/v2/generate
  const body = {
    accountNo: process.env.BANK_ACCOUNT,
    accountName: 'THÁI NGỌC RẠNG',
    acqId: 970416,
    amount: Math.ceil(Number(total)),
    addInfo: 'Thanh toán đơn hàng',
    format: 'text',
    template: 'print'
  }
  const response = await axios
    .post('https://api.vietqr.io/v2/generate', body, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(() => {
      if (response?.code === '00') {
        return {
          qr_url: response?.qrDataURL
        }
      } else {
        throw new BadRequestError(response.desc)
      }
    })
}
const updateCheckout = async (id) => {
  const order = await OrderModel.find({ _id: id, status: PAYMENT_STATUS.ONHOLD })
  if (order.length === 0) {
    throw new NotFoundError('Order not found')
  }
  return await OrderModel.findByIdAndUpdate(id, {
    status: PAYMENT_STATUS.COMPLETED,
    checkout: new Date()
  })
}
const updateCheckin = async (id) => {
  const order = await OrderModel.find({
    $or: [
      { _id: id, status: PAYMENT_STATUS.SUCCESS },
      { _id: id, status: PAYMENT_STATUS.PENDING, payment: PAYMENT_METHOD.CASH }
    ]
  }).orFail(new NotFoundError('Order not found'))
  return await OrderModel.findByIdAndUpdate(id, {
    status: PAYMENT_STATUS.ONHOLD
  })
}
const payOrder = async ({ orderCode, total }) => {
  const YOUR_DOMAIN = 'http://localhost:5173'
  const body = {
    orderCode,
    amount: Math.ceil(Number(total)),
    description: 'Thanh toán đơn hàng',
    returnUrl: `${YOUR_DOMAIN}/checkout?step=1`,
    cancelUrl: `${YOUR_DOMAIN}/checkout?step=1`
  }
  return await payOS.createPaymentLink(body)
}
const deleteOrder = async (id) => {
  const order = await OrderModel.findById(id).orFail(new NotFoundError('Order not found'))
  return await OrderModel.findByIdAndUpdate(mongoose.Types.ObjectId(id), { deleted_at: Date.now() })
}

const deleteItemFromOrder = async (orderId, itemId) => {
  // Tìm đơn hàng hiện tại
  const order = await OrderModel.findById(orderId).orFail(new NotFoundError('Order not found'));

  // Tìm vị trí của món ăn cần xóa trong danh sách món ăn
  const itemIndex = order.list_menu.findIndex(item => item._id.toString() === itemId);

  if (itemIndex === -1) {
    throw new Error('Item not found in the order');
  }

  // Xóa item khỏi danh sách món ăn
  order.list_menu.splice(itemIndex, 1);

  // Cập nhật lại tổng tiền sau khi xóa món ăn
  const updatedTotal = order.list_menu.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity * (1 - item.discount / 100);
    return sum + itemTotal;
  }, 0);

  // Cập nhật lại đơn hàng với danh sách món ăn mới và tổng tiền mới
  return await OrderModel.findByIdAndUpdate(orderId, {
    list_menu: order.list_menu,
    total: updatedTotal, // Cập nhật tổng tiền mới
    updated_at: Date.now(),
  });
}

const findSuccessfulOrders = async (id, page = 1, size = 5, phone = null) => {
  const staff = await StaffModel.findOne({ staff_id: id, deleted_at: null }).orFail(() => {
    throw new NotFoundError('Nhân viên không tồn tại');
  });

  // Lấy ngày hiện tại (chỉ gồm ngày, không gồm giờ)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0); // Thời điểm bắt đầu ngày hiện tại
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999); // Thời điểm kết thúc ngày hiện tại

  const matchCondition = {
    status: 'ONHOLD',
    deleted_at: null,
    restaurant_id: staff.restaurant_id,
    checkin: { $gte: todayStart, $lte: todayEnd } // Chỉ lấy đơn hàng trong ngày hiện tại
  };

  // Thêm điều kiện tìm kiếm theo `phone` nếu có
  if (phone) {
    matchCondition.phone_number = { $regex: phone, $options: 'i' }; // Tìm kiếm không phân biệt chữ hoa/thường
  }

  const orders = await OrderModel.aggregate([
    {
      $match: matchCondition
    },
    {
      $sort: { createdAt: -1 }, // Sắp xếp giảm dần theo created_at (mới nhất trước)
    },
    {
      $skip: (Number(page) - 1) * Number(size)
    },
    {
      $limit: Number(size)
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true // Giữ đơn hàng không có user (walk-in)
      }
    },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurant_id',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    {
      $unwind: '$restaurant'
    },
    {
      $project: {
        _id: 1,
        table: '$table',
        user: '$user', // Có thể là null nếu là walk-in
        restaurant: '$restaurant',
        total_people: 1,
        name: 1,
        phone_number: 1,
        payment: 1,
        list_menu: 1,
        status: 1,
        checkin: 1,
        orderCode: 1,
        total: 1,
        amount_received:1,
        is_walk_in:1
      }
    }
  ]);

  const total = await OrderModel.countDocuments({
    ...matchCondition // Sử dụng cùng điều kiện match để tính tổng số đơn
  });

  return {
    data: orders,
    info: {
      total,
      page,
      size,
      number_of_pages: Math.ceil(total / size)
    }
  };
};


const findPendingCashOrders = async (id, page = 1, size = 5, phone = null) => {
  const staff = await StaffModel.findOne({ staff_id: id, deleted_at: null }).orFail(() => {
    throw new NotFoundError('Nhân viên không tồn tại');
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0); // Thời điểm bắt đầu ngày hiện tại
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999); // Thời điểm kết thúc ngày hiện tại

  // Xây dựng điều kiện tìm kiếm cho phone_number
  const phoneCondition = phone ? { phone_number: { $regex: phone, $options: 'i' } } : {};

  // Cập nhật query1 và query2 để bao gồm điều kiện phone_number
  const query1 = {
    payment: PAYMENT_METHOD.CASH,
    status: PAYMENT_STATUS.SUCCESS,
    deleted_at: null,
    restaurant_id: staff.restaurant_id,
    checkin: { $gte: todayStart, $lte: todayEnd }, // Đơn hàng trong ngày hiện tại
    ...phoneCondition
  };

  const query2 = {
    payment: PAYMENT_METHOD.CREDIT_CARD,
    status: PAYMENT_STATUS.SUCCESS,
    deleted_at: null,
    restaurant_id: staff.restaurant_id,
    checkin: { $gte: todayStart, $lte: todayEnd }, // Đơn hàng trong ngày hiện tại
    ...phoneCondition
  };

  // Truy vấn dữ liệu từ OrderModel
  const orders = await OrderModel.aggregate([
    {
      $match: { $or: [query1, query2] }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurant_id',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    {
      $unwind: '$restaurant'
    },
    {
      $sort: { createdAt: -1 }, // Sắp xếp giảm dần theo created_at (mới nhất trước)
    },
    {
      $skip: Number(page - 1) * Number(size)
    },
    {
      $limit: Number(size)
    },
    {
      $project: {
        _id: 1,
        table: '$table',
        user: '$user',
        restaurant: '$restaurant',
        total_people: 1,
        name: 1,
        phone_number: 1,
        payment: 1,
        list_menu: 1,
        status: 1,
        checkin: 1,
        orderCode: 1,
        total: 1
      }
    }
  ]);

  // Tính tổng số lượng đơn hàng thỏa mãn điều kiện
  const total = await OrderModel.countDocuments({ $or: [query1, query2] });

  return {
    data: orders,
    info: {
      total,
      page,
      size,
      number_of_pages: Math.ceil(total / size)
    }
  };
};


const totalRevenueOrder = async (userId) => {
  // Lấy tất cả các nhà hàng của người dùng
  const restaurants = await RestaurantModel.find({ user_id: userId, deleted_at: null })
  if (!restaurants || restaurants.length === 0) {
    throw new Error('No restaurants found for this user.')
  }

  // Lấy danh sách các restaurant_id của các nhà hàng thuộc sở hữu của người dùng
  const restaurantIds = restaurants.map((restaurant) => restaurant._id)

  // Truy vấn tổng doanh thu cho các đơn hàng đã hoàn thành (status: 'COMPLETED') của các nhà hàng của người dùng
  const result = await OrderModel.aggregate([
    {
      $match: {
        restaurant_id: { $in: restaurantIds },  // Lọc theo restaurant_id của các nhà hàng của người dùng
        status: 'COMPLETED'  // Chỉ tính các đơn hàng đã hoàn thành
      }
    },
    {
      $group: {
        _id: null,
        totalPrice: { $sum: '$total' }  // Tổng doanh thu của tất cả các đơn hàng
      }
    }
  ])

  // Kiểm tra và trả về tổng doanh thu
  if (result.length > 0) {
    return result[0].totalPrice
  } else {
    return 0
  }
}


const countCompletedOrders = async () => {
  return await OrderModel.countDocuments({ status: 'COMPLETED' })
}
const countOrder = async () => {
  return await OrderModel.countDocuments({ deleted_at: null })
}
const countOrdersByStatus = async () => {
  return await OrderModel.countDocuments({ status: 'ONHOLD' })
}

const getMostFrequentRestaurantName = async () => {
  const result = await OrderModel.aggregate([
    {
      $group: {
        _id: '$restaurant_id',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 1
    }
  ])

  if (result.length > 0) {
    const mostFrequentRestaurant = result[0]

    const restaurant = await RestaurantModel.findById(mostFrequentRestaurant._id).select('name')

    return restaurant ? restaurant.name : null
  } else {
    return null
  }
}


const totalRevenueOrder5Years = async (userId) => {
  const restaurants = await RestaurantModel.find({ user_id: userId, deleted_at: null })
  if (!restaurants || restaurants.length === 0) {
    throw new Error('No restaurants found for this user.')
  }

  const restaurantIds = restaurants.map((restaurant) => restaurant._id)
  console.log(restaurantIds)

  const fiveYearsAgo = new Date()
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)

  const revenueData = await OrderModel.aggregate([
    {
      $match: {
        restaurant_id: { $in: restaurantIds },
        created_at: { $gte: fiveYearsAgo },
        deleted_at: null,
        status: 'COMPLETED'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' }
        },
        totalRevenue: { $sum: '$total' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ])

  const result = {}
  const currentYear = new Date().getFullYear()

  for (let year = fiveYearsAgo.getFullYear(); year <= currentYear; year++) {
    result[year] = new Array(12).fill(0)
  }

  revenueData.forEach(({ _id, totalRevenue }) => {
    const { year, month } = _id
    result[year][month - 1] = totalRevenue
  })

  return result
}
const totalRevenueCurrentYear = async (userId, year) => {
  const restaurants = await RestaurantModel.find({ user_id: userId, deleted_at: null });
  if (!restaurants || restaurants.length === 0) {
    throw new Error('No restaurants found for this user.');
  }

  const restaurantIds = restaurants.map((restaurant) => restaurant._id);

  // Lấy ngày đầu năm và ngày cuối năm của năm được truyền vào
  const startOfYear = new Date(year, 0, 1); // Ngày đầu năm (1 tháng 1 của năm)
  const endOfYear = new Date(year, 11, 31, 23, 59, 59); // Ngày cuối năm (31 tháng 12 của năm)

  const revenueData = await OrderModel.aggregate([
    {
      $match: {
        restaurant_id: { $in: restaurantIds },
        created_at: { $gte: startOfYear, $lte: endOfYear },
        deleted_at: null,
        status: 'COMPLETED',
      },
    },
    {
      $group: {
        _id: { month: { $month: '$created_at' } },
        totalRevenue: { $sum: '$total' },       // Tổng doanh thu cho tháng
        totalOrders: { $sum: 1 },               // Tổng số đơn hàng cho tháng
      },
    },
    {
      $sort: { '_id.month': 1 },
    },
  ]);

  // Khởi tạo kết quả với giá trị mặc định là 0 cho mỗi tháng
  const result = new Array(12).fill({ revenue: 0, orders: 0 });

  let totalRevenueYear = 0;  // Biến để tính tổng doanh thu cả năm
  let totalOrdersYear = 0;   // Biến để tính tổng số đơn hàng cả năm

  revenueData.forEach(({ _id, totalRevenue, totalOrders }) => {
    const { month } = _id;
    result[month - 1] = { revenue: totalRevenue, orders: totalOrders }; // Cập nhật cả doanh thu và số lượng đơn hàng

    totalRevenueYear += totalRevenue;  // Cộng dồn doanh thu
    totalOrdersYear += totalOrders;    // Cộng dồn số đơn hàng
  });

  // Trả về kết quả theo yêu cầu
  return {
    monthlyData: result,           // Dữ liệu cho từng tháng
    totalRevenueYear,              // Tổng doanh thu của năm
    totalOrdersYear,               // Tổng số đơn hàng của năm
  };
};


const updateStatus = async (orderId, newStatus) => {
  // Kiểm tra status có hợp lệ không
  const validStatuses = Object.values(PAYMENT_STATUS);
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Invalid status');
  }

  // Cập nhật status cho đơn hàng
  const updatedOrder = await OrderModel.findByIdAndUpdate(
    orderId,
    { status: newStatus, updated_at: new Date() },
    { new: true } // Trả về document đã cập nhật
  );

  if (!updatedOrder) {
    throw new Error('Order not found');
  }

  return updatedOrder;
};

const updateOrderRating = async (orderId, rating) => {
  if (rating < 0 || rating > 5) {
    throw new Error('Rating must be between 0 and 5.');
  }

  // Cập nhật rating cho đơn hàng
  const updatedOrder = await OrderModel.findByIdAndUpdate(
    orderId,
    { rating, updated_at: new Date() },
    { new: true } // Trả về document sau khi update
  );

  if (!updatedOrder) {
    throw new Error('Order not found.');
  }

  // Tính toán lại rating trung bình cho nhà hàng
  const restaurantId = updatedOrder.restaurant_id; // Lấy ID nhà hàng từ đơn hàng
  const orders = await OrderModel.find({ restaurant_id: restaurantId, rating: { $gt: 0 } });

  const averageRating = orders.reduce((sum, order) => sum + order.rating, 0) / orders.length;

  // Cập nhật rating cho nhà hàng
  const updatedRestaurant = await RestaurantModel.findByIdAndUpdate(
    restaurantId,
    { rating: averageRating, updated_at: new Date() },
    { new: true } // Trả về document sau khi update
  );

  if (!updatedRestaurant) {
    throw new Error('Restaurant not found.');
  }

  return { updatedOrder, updatedRestaurant };
};

const getUpcomingBookings = async () => {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return await OrderModel.find({
    checkin: { $gte: now, $lte: twoHoursLater },
    reminder_sent: { $ne: true } // Chưa gửi nhắc nhở // Lấy đặt bàn trong 2 giờ tới
  }).populate("restaurant_id", "name"); // Lấy tên nhà hàng
};


export const OrderService = {
  getAllOrder,
  getOrderById,
  createOrder,
  createWalkinOrder,
  updateOrder,
  deleteOrder,
  deleteItemFromOrder,
  confirmOrder,
  payOrder,
  createDirectOrder,
  confirmDirectOrder,
  updateCheckin,
  updateCheckout,
  findSuccessfulOrders,
  findPendingCashOrders,
  totalRevenueOrder,
  countCompletedOrders,
  countOrder,
  countOrdersByStatus,
  getMostFrequentRestaurantName,
  totalRevenueOrder5Years,
  totalRevenueCurrentYear,
  getAllOrderByUserId,
  getAllOrderByStaffId,
  updatePaymentStatus,
  getUserOrders,
  updateOrderRating,
  updateStatus,
  getUpcomingBookings
}
