import axios from 'axios'
import { NotFoundError } from '../errors/notFound.error.js'
import { RestaurantModel } from '../models/restaurants.model.js'
import mongoose, { Types } from 'mongoose'
import { GOOGLE_CONFIG } from '../configs/google.config.js'
import { TableModel } from '../models/tables.model.js'
import MenuItem from '../models/menus.model.js'
import { ConflictError } from '../errors/conflict.error.js'
import { UserModel } from '../models/users.model.js'

const getAllRestaurant = async (
  page = 1, 
  size = 5, 
  field, 
  sort, 
  searchTerm = '', 
  priceRange = 'all', 
  provinceCode = '', 
  districtCode = '', 
  detail = '',
  type = '', // Thêm tham số type để lọc theo loại nhà hàng
  isReputable
) => {
  const regex = new RegExp(searchTerm, 'i');
  
  // Tạo điều kiện lọc cơ bản
  const matchConditions = { 
    deleted_at: null, 
    $or: [
      { name: regex },
      { 'address.detail': regex }
    ]
  };
  
  // Lọc theo priceRange
  if (priceRange === 'under_200k') {
    matchConditions.price_per_table = { $lt: 200000 };
  } else if (priceRange === '200k_500k') {
    matchConditions.price_per_table = { $gte: 200000, $lte: 500000 };
  } else if (priceRange === '500k_1m') {
    matchConditions.price_per_table = { $gte: 500000, $lte: 1000000 };
  } else if (priceRange === 'above_1m') {
    matchConditions.price_per_table = { $gt: 1000000 };
  }

  // Thêm lọc theo địa chỉ bằng provinceCode, districtCode
  if (provinceCode) {
    matchConditions['address.provinceCode'] = provinceCode;
  }

  if (districtCode) {
    matchConditions['address.districtCode'] = districtCode;
  }

  if (detail) {
    matchConditions['address.detail'] = new RegExp(detail, 'i');
  }

  // Thêm điều kiện lọc theo type nếu có
  if (type) {
    matchConditions.type = type;
  }
  if (isReputable) {
    matchConditions.rating = { $gte: 4.0 };
  }
  
  const restaurants = await RestaurantModel.aggregate([
    { $match: matchConditions },
    {
      $lookup: {
        from: 'promotions',
        localField: 'promotions',
        foreignField: 'code',
        as: 'promotionDetails',
      }
    },
    {
      $unwind: {
        path: '$promotionDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        name: 1,
        address: 1,
        openTime: 1,
        closeTime: 1,
        description: 1,
        rating: 1,
        image_url: 1,
        price_per_table: 1,
        type: 1, // Đảm bảo type xuất hiện trong kết quả trả về
        createdAt: 1,
        promotionDetails: {
          $cond: {
            if: { $eq: ['$promotionDetails.status', 'active'] },
            then: {
              name: '$promotionDetails.name',
              description: '$promotionDetails.description',
              discountValue: '$promotionDetails.discountValue',
              startDate: '$promotionDetails.startDate',
              endDate: '$promotionDetails.endDate'
            },
            else: null
          }
        }
      }
    },
    { $sort: { [field]: Number(sort) } },
    { $skip: (page - 1) * size },
    { $limit: size },
  ]);

  const total = await RestaurantModel.countDocuments(matchConditions);

  return { 
    data: restaurants, 
    info: { 
      total, 
      page, 
      size, 
      number_of_pages: Math.ceil(total / size) 
    } 
  };
};




const getAllRestaurantByUserId = async (id, page = 1, size = 5) => {
  const restaurants = await RestaurantModel.aggregate([
    { $match: { deleted_at: null, user_id: id } },
    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * size },
    { $limit: size },
    {
      $project: {
        created_at: 0,
        updated_at: 0,
        deleted_at: 0
      }
    }
  ])
  const total = await RestaurantModel.countDocuments({ deleted_at: null, user_id: id })
  return { data: restaurants, info: { total, page, size, number_of_pages: Math.ceil(total / size) } }
}

const getAllRestaurantWithPromotions = async (page = 1, size = 5) => {
  const restaurantsWithPromotions = await RestaurantModel.aggregate([
    { $match: { deleted_at: null } },
    {
      $lookup: {
        from: 'promotions', 
        localField: 'promotions', 
        foreignField: 'code', 
        as: 'promotionDetails'
      }
    },
    {
      $unwind: {
        path: '$promotionDetails',
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $match: {
        'promotionDetails.status': 'active' 
      }
    },
    {
      $project: {
        name: 1,
        address: 1,
        openTime: 1,
        closeTime: 1,
        description: 1,
        rating:1,
        image_url: 1,
        price_per_table: 1,
        promotionDetails: {
          name: '$promotionDetails.name',
          description: '$promotionDetails.description',
          discountValue: '$promotionDetails.discountValue',
          startDate: '$promotionDetails.startDate',
          endDate: '$promotionDetails.endDate',
          code: '$promotionDetails.code'
        }
      }
    },
    { $sort: { 'promotionDetails.discountValue': -1 } },
    { $skip: (page - 1) * size },
    { $limit: size },
  ]);
  const total = await RestaurantModel.aggregate([
    { $match: { deleted_at: null } },
    {
      $lookup: {
        from: 'promotions',
        localField: 'promotions',
        foreignField: 'code',
        as: 'promotionDetails'
      }
    },
    { $unwind: { path: '$promotionDetails', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        'promotionDetails.status': 'active'
      }
    },
    { $count: 'total' } 
  ]);

  const totalCount = total.length > 0 ? total[0].total : 0; 

  return { data: restaurantsWithPromotions, info: { total: totalCount, page, size, number_of_pages: Math.ceil(totalCount / size) } };
};

const getRestaurantById = async (id, userId) => {
  const restaurant = await RestaurantModel.aggregate([
    { $match: { _id: Types.ObjectId.createFromHexString(id), deleted_at: null } },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $lookup: {
        from: 'promotions', 
        localField: 'promotions', 
        foreignField: 'code',
        as: 'promotionDetails'
      }
    },
    {
      $unwind: {
        path: '$promotionDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        user: { $arrayElemAt: ['$user._id', 0] },
        name: 1,
        address: 1,
        openTime: 1,
        closeTime: 1,
        description: 1,
        image_url: 1,
        slider1: 1,
        slider2: 1,
        slider3: 1,
        slider4: 1,
        public_id_avatar: 1,
        public_id_slider1: 1,
        public_id_slider2: 1,
        public_id_slider3: 1,
        public_id_slider4: 1,
        price_per_table: 1,
        images:1,
        promotionDetails: {
          $cond: {
            if: { $eq: ['$promotionDetails.status', 'active'] },
            then: {
              name: '$promotionDetails.name',
              description: '$promotionDetails.description',
              discountValue: '$promotionDetails.discountValue',
              startDate: '$promotionDetails.startDate',
              endDate: '$promotionDetails.endDate'
            },
            else: {}
          }
        }
      }
    }
  ]).exec();

  const tables = await TableModel.aggregate([
    { $match: { restaurant_id: Types.ObjectId.createFromHexString(id), deleted_at: null } },
    {
      $project: {
        number_of_tables: 1,
        people_per_table: 1
      }
    }
  ]).exec();

  const totalPeople = tables.reduce((total, table) => total + table.people_per_table * table.number_of_tables, 0);

  const menus = await MenuItem.find({ restaurant_id: id, deleted_at: null }).exec();

  if(userId){
    updateUserViewHistory(userId,id)
  }
  return restaurant.length > 0
    ? {
        restaurant: restaurant[0],
        totalPeople,
        menus
      }
    : null;
};

const getRestaurantIdAndNameByUserId = (id) => {
  return RestaurantModel.find({ user_id: id, deleted_at: null }).select('_id name').exec()
}
const getRestaurantByUserId = async (page = 1, size = 5, field, sort) => {
  const restaurants = await RestaurantModel.aggregate([
    { $match: { deleted_at: null } },
    { $skip: (page - 1) * size },
    { $limit: size },
    { $sort: { [field]: Number(sort) } },
    {
      $project: {
        created_at: 0,
        updated_at: 0,
        deleted_at: 0
      }
    }
  ])
  const total = await RestaurantModel.countDocuments({ deleted_at: null })
  return { data: restaurants, info: { total, page, size, number_of_pages: Math.ceil(total / size) } }
}
const createRestaurant = async (
  id,
  {
    name,
    address,
    openTime,
    closeTime,
    description,
    image_url,
    slider1,
    slider2,
    slider3,
    slider4,
    public_id_avatar,
    public_id_slider1,
    public_id_slider2,
    public_id_slider3,
    public_id_slider4,
    price_per_table,
    images,
  }
) => {
console.log('address',address)
  const existingRestaurant = await RestaurantModel.findOne({
    name,
    address,
    deleted_at: null
  });

  if (existingRestaurant) {
    throw new ConflictError('Nhà hàng đã tồn tại');
  }

  // Lấy tọa độ từ địa chỉ
  const coordinates = await getCoordinates(address);
  if (!coordinates) {
    throw new Error("Không thể lấy tọa độ từ địa chỉ");
  }

  const newRestaurant = new RestaurantModel({
    _id: new mongoose.Types.ObjectId(),
    name,
    address,
    openTime,
    closeTime,
    description,
    image_url,
    slider1,
    slider2,
    slider3,
    slider4,
    public_id_avatar,
    public_id_slider1,
    public_id_slider2,
    public_id_slider3,
    public_id_slider4,
    price_per_table,
    user_id: id,
    images,
    location: { type: "Point", coordinates: [coordinates.lng, coordinates.lat] }
  });

  return await newRestaurant.save();
};


const updateRestaurant = async (
  id,
  {
    name,
    address,
    openTime,
    closeTime,
    description,
    image_url,
    limitTime,
    orderAvailable,
    peopleAvailable,
    slider1,
    slider2,
    slider3,
    slider4,
    public_id_avatar,
    public_id_slider1,
    public_id_slider2,
    public_id_slider3,
    public_id_slider4,
    price_per_table,
    promotions
  }
) => {
  const existingRestaurant = await RestaurantModel.findOne({ name, address }).exec()
  if (existingRestaurant && existingRestaurant._id.toString() !== id) {
    throw new ConflictError('Nhà hàng đã tồn tại')
  }
  const restaurant = await getRestaurantById(id)

  // if (!restaurant || restaurant.deleted_at) {
  //   throw new NotFoundError('Nhà hàng không tìm thấy')
  // }
  const coordinates = await getCoordinates(address);
  if (!coordinates) {
    throw new Error("Không thể lấy tọa độ từ địa chỉ");
  }
  const result = await RestaurantModel.updateOne(
    { _id: Types.ObjectId.createFromHexString(id) },
    {
      name,
      address,
      openTime,
      closeTime,
      description,
      orderAvailable,
      peopleAvailable,
      limitTime,
      image_url,
      slider1,
      slider2,
      slider3,
      slider4,
      public_id_avatar,
      public_id_slider1,
      public_id_slider2,
      public_id_slider3,
      public_id_slider4,
      price_per_table,
      promotions,
      updated_at: Date.now(),
      location: { type: "Point", coordinates: [coordinates.lng, coordinates.lat] }

    }
  )
  if (result.modifiedCount === 0) {
    throw new NotFoundError('Nhà hàng không được cập nhật')
  }
  return await RestaurantModel.findById(id)
}

const deleteRestaurant = async (id) => {
  const restaurant = await RestaurantModel.findOne({ _id: id, deleted_at: null }).orFail(
    new NotFoundError('Nhà hàng không tìm thấy')
  )
  return await RestaurantModel.updateOne({ _id: id, deleted_at: null }, { deleted_at: new Date() })
}

const calculateDistance = async (origin, destination) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: origin,
        destinations: destination,
        units: 'metric',
        key: GOOGLE_CONFIG.GOOGLE_API_KEY
      }
    })

    const distance = response.data.rows[0].elements[0].distance.text
    return distance
  } catch (error) {
    console.error('Error calculating distance:', error)
    throw error
  }
}
const getFourNearestRestaurant = async (latitude, longitude) => {
  const restaurants = await RestaurantModel.find({ deleted_at: null })
  const restaurantWithDistance = []
  for (const restaurant of restaurants) {
    const distance = await this.calculateDistance(
      `${latitude},${longitude}`,
      `${restaurant.latitude},${restaurant.longitude}`
    )
    restaurantWithDistance.push({ ...restaurant._doc, distance })
  }
  return restaurantWithDistance
}

const getDistanceFromRestaurant = async (restaurantId, latitude, longitude) => {
  const restaurant = await RestaurantModel.findById(restaurantId)
  return await this.calculateDistance(`${latitude},${longitude}`, `${restaurant.latitude},${restaurant.longitude}`)
}
const findRestaurantsByAnyField = async (searchTerm, page = 1, size = 5) => {
  const restaurants = await RestaurantModel.aggregate([
    {
      $match: {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { address: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ],
        deleted_at: null
      }
    },
    { $skip: (page - 1) * size },
    { $limit: size },
    {
      $project: {
        created_at: 0,
        updated_at: 0,
        deleted_at: 0
      }
    }
  ])
  const total = await RestaurantModel.countDocuments({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { address: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ],
    deleted_at: null
  })
  return { data: restaurants, info: { total, page, size, number_of_pages: Math.ceil(total / size) } }
}
const countRestaurant = async () => {
  return await RestaurantModel.countDocuments()
}

const getLatLngFromAddress = async (address) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: GOOGLE_CONFIG.GOOGLE_API_KEY
      }
    })

    if (response.data.status === 'OK') {
      const location = response.data.results[0].geometry.location
      return {
        latitude: location.lat,
        longitude: location.lng
      }
    } else if (response.data.status === 'REQUEST_DENIED') {
      throw new Error('Geocoding API request denied. Please check your API key and permissions.')
    } else {
      throw new Error(`Geocoding API error: ${response.data.status}`)
    }
  } catch (error) {
    console.error('Error fetching geocode:', error.message)
    throw error
  }
}

const getAllRestaurantByFilterAndSort = async (upper, lower, sort, page = 1) => {
  let restaurants, total
  if (sort === 'new') {
    restaurants = await RestaurantModel.aggregate([
      {
        $match: {
          deleted_at: null,
          price_per_table: { $gte: Number(lower), $lte: Number(upper) }
        }
      },
      {
        $sort: { created_at: -1 }
      },
      {
        $skip: (page - 1) * 8
      },
      {
        $limit: 8
      },
      {
        $project: {
          created_at: 0,
          updated_at: 0,
          deleted_at: 0
        }
      }
    ]).exec()
    total = await RestaurantModel.countDocuments({
      deleted_at: null,
      price_per_table: { $gte: Number(lower), $lte: Number(upper) }
    }).exec()
  } else if (sort === 'old') {
    restaurants = await RestaurantModel.aggregate([
      {
        $match: {
          deleted_at: null,
          price_per_table: { $gte: Number(lower), $lte: Number(upper) }
        }
      },
      {
        $sort: { create_aAt: 1 }
      },
      {
        $skip: (page - 1) * 8
      },
      {
        $limit: 8
      },
      {
        $project: {
          created_at: 0,
          updated_at: 0,
          deleted_at: 0
        }
      }
    ]).exec()
    total = await RestaurantModel.countDocuments({
      deleted_at: null,
      price_per_table: { $gte: Number(lower), $lte: Number(upper) }
    }).exec()
  } else if (sort === 'A->Z') {
    restaurants = await RestaurantModel.aggregate([
      {
        $match: {
          deleted_at: null,
          price_per_table: { $gte: Number(lower), $lte: Number(upper) }
        }
      },
      {
        $sort: { name: 1 }
      },
      {
        $skip: (page - 1) * 8
      },
      {
        $limit: 8
      },
      {
        $project: {
          created_at: 0,
          updated_at: 0,
          deleted_at: 0
        }
      }
    ]).exec()
    total = await RestaurantModel.countDocuments({
      deleted_at: null,
      price_per_table: { $gte: Number(lower), $lte: Number(upper) }
    }).exec()
  } else if (sort === 'Z->A') {
    restaurants = await RestaurantModel.aggregate([
      {
        $match: {
          deleted_at: null,
          price_per_table: { $gte: Number(lower), $lte: Number(upper) }
        }
      },
      {
        $sort: { name: -1 }
      },
      {
        $skip: (page - 1) * 8
      },
      {
        $limit: 8
      },
      {
        $project: {
          created_at: 0,
          updated_at: 0,
          deleted_at: 0
        }
      }
    ]).exec()
    total = await RestaurantModel.countDocuments({
      deleted_at: null,
      price_per_table: { $gte: Number(lower), $lte: Number(upper) }
    }).exec()
  } else if (sort === 'price-asc') {
    restaurants = await RestaurantModel.aggregate([
      {
        $match: {
          deleted_at: null,
          price_per_table: { $gte: Number(lower), $lte: Number(upper) }
        }
      },
      {
        $sort: { price_per_table: 1 }
      },
      {
        $skip: (page - 1) * 8
      },
      {
        $limit: 8
      },
      {
        $project: {
          created_at: 0,
          updated_at: 0,
          deleted_at: 0
        }
      }
    ]).exec()
    total = await RestaurantModel.countDocuments({
      deleted_at: null,
      price_per_table: { $gte: Number(lower), $lte: Number(upper) }
    }).exec()
  } else if (sort === 'price-desc') {
    restaurants = await RestaurantModel.aggregate([
      {
        $match: {
          deleted_at: null,
          price_per_table: { $gte: Number(lower), $lte: Number(upper) }
        }
      },
      {
        $sort: { price_per_table: -1 }
      },
      {
        $skip: (page - 1) * 8
      },
      {
        $limit: 8
      },
      {
        $project: {
          created_at: 0,
          updated_at: 0,
          deleted_at: 0
        }
      }
    ]).exec()
    total = await RestaurantModel.countDocuments({
      deleted_at: null,
      price_per_table: { $gte: Number(lower), $lte: Number(upper) }
    }).exec()
  }
  return { data: restaurants, info: { total, page, size: 8, number_of_pages: Math.ceil(total / 8) } }
}
const getProvinces = async () => {
  const provinces = await RestaurantModel.aggregate([
    { $group: { _id: { province: "$address.province", provinceCode: "$address.provinceCode" } } },
    { $project: { _id: 0, name: "$_id.province", code: "$_id.provinceCode" } },
    { $sort: { name: 1 } },
  ]);
  return provinces;
};

const getDistrictsByProvince = async (provinceCode) => {
  const districts = await RestaurantModel.aggregate([
    { $match: { "address.provinceCode": provinceCode } },
    { $group: { _id: { district: "$address.district", districtCode: "$address.districtCode" } } },
    { $project: { _id: 0, name: "$_id.district", code: "$_id.districtCode" } },
    { $sort: { name: 1 } },
  ]);
  return districts;
};

const updateUserViewHistory = async (userId, restaurantId) => {
  try {
    const now = new Date();

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      console.log("restaurantId không hợp lệ");
      return;
    }

    // Bước 1: Xoá restaurant cũ nếu đã tồn tại
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $pull: { viewedRestaurants: { restaurant: restaurantId } }
      }
    );

    // Bước 2: Thêm mới vào đầu danh sách
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          viewedRestaurants: {
            $each: [{ restaurant: restaurantId, lastViewed: now }],
            $position: 0 // thêm vào đầu mảng
          }
        }
      },
      { new: true }
    );

    console.log("Cập nhật lịch sử thành công");

  } catch (error) {
    console.error("Lỗi khi cập nhật lịch sử truy cập:", error);
  }
};


const suggestRestaurantsForUser = async (userId) => {
  try {
    // Lấy thông tin user và kiểm tra tồn tại
    const user = await UserModel.findById(userId).populate("viewedRestaurants");
    if (!user) return [];

    // Lấy danh sách ID nhà hàng đã xem gần đây
    const viewedRestaurantIds = user.viewedRestaurants?.map((r) => r._id) || [];

    // Số lượng nhà hàng đã xem gần nhất, tối đa 4
    const numViewed = Math.min(viewedRestaurantIds.length, 4);
    const numPopular = 8 - numViewed; // Số nhà hàng phổ biến cần lấy để đủ 8

    // Lấy danh sách nhà hàng đã xem gần đây (nếu có)
    const viewedRestaurants = await RestaurantModel.find({
      _id: { $in: viewedRestaurantIds },
    })
      .sort({ lastViewed: -1 }) // Lấy theo thời gian xem gần nhất
      .limit(numViewed);

    // Lấy danh sách nhà hàng phổ biến (không trùng với danh sách đã xem)
    const popularRestaurants = await RestaurantModel.find({
      _id: { $nin: viewedRestaurantIds }, // Loại trừ nhà hàng đã xem
    })
      .sort({ rating: -1,  bookingCount: -1 }) // Ưu tiên nhà hàng phổ biến
      .limit(numPopular);

    // Kết hợp hai danh sách
    return [...viewedRestaurants, ...popularRestaurants];

  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhà hàng gợi ý:", error);
    return [];
  }
};

const getRecentlyViewedRestaurants = async (userId, limit = 20) => {
  try {
    const user = await UserModel.findById(userId)
      .populate("viewedRestaurants.restaurant")
      .lean();

    // Kiểm tra xem user.viewedRestaurants có tồn tại và có dữ liệu hay không
    console.log("User viewedRestaurants:", user.viewedRestaurants);

    if (!user || !user.viewedRestaurants || user.viewedRestaurants.length === 0) {
      console.log("Không có nhà hàng đã xem.");
      return [];
    }

    const sorted = user.viewedRestaurants
      .sort((a, b) => new Date(b.lastViewed) - new Date(a.lastViewed))
      .slice(0, limit)
      .map((entry) => entry.restaurant);

    console.log("Sorted restaurants:", sorted);

    return sorted.filter(Boolean);
  } catch (error) {
    console.error("Lỗi khi lấy nhà hàng đã xem gần đây:", error);
    return [];
  }
};




const findNearbyRestaurants = async (lat, lng, maxDistance = 10000) => {
  try {
    const restaurants = await RestaurantModel.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: maxDistance, // Giới hạn trong bán kính 5km
        },
      },
    }).limit(10);
    return restaurants;
  } catch (error) {
    throw new Error("Lỗi khi tìm nhà hàng gần nhất: " + error.message);
  }
};
const getCoordinates = async (address) => {
  const fullAddress = `${address.detail}, ${address.district}, ${address.province}, Việt Nam`;
  console.log('first', fullAddress)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
      return { lat: data[0].lat, lng: data[0].lon };
    } else {
      console.error("Không tìm thấy tọa độ.");
      return null;
    }
  } catch (error) {
    console.error("Lỗi khi gọi API OSM:", error);
    return null;
  }
};
 const getTopRatedRestaurants = async () => {
  return await RestaurantModel.find()
    .sort({ rating: -1 }) // Sắp xếp giảm dần theo rating
    .limit(5) // Lấy 5 nhà hàng hàng đầu
    .select("name address rating image_url"); // Chỉ lấy các trường cần thiết
};

export const RestaurantService = {
  updateUserViewHistory,
  getProvinces,
  getDistrictsByProvince,
  getAllRestaurant,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  calculateDistance,
  getFourNearestRestaurant,
  getDistanceFromRestaurant,
  findRestaurantsByAnyField,
  countRestaurant,
  getLatLngFromAddress,
  getAllRestaurantByFilterAndSort,
  getRestaurantIdAndNameByUserId,
  getAllRestaurantByUserId,
  getAllRestaurantWithPromotions,
  suggestRestaurantsForUser,
  findNearbyRestaurants,
  getCoordinates,
  getTopRatedRestaurants,
  getRecentlyViewedRestaurants
}
