const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  customer: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Customer'
  },
  customerIp: {
    type: String
  },

  orderType: {
    type: String,
    enum: ["Delivery", "Pickup", "Online"],
    required: true
  },

  firstName: {
    type: String,
    max: [232, 'First Name Should be less than 232 characters']
  },
  lastName: {
    type: String,
    max: [232, 'Last Name Should be less than 232 characters']
  },
  orderStatus: {
    type: String,
    enum: [
      'Received',
      'Confirmed',
      'Dispatched',
      'Delivered',
      'On-Hold',
      'Cancelled',
      'Spammed'
    ],
    default: "Received"
  },
  deliveryAddress: {
    type: String,
    required: true
  },

  deliveryCharge: {
    type: Number,
  },

  email:{
    type: String,
  },

  district: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum:[
      "Cash On Delivery",
      "Online Payment"
    ]
  },
  transactionId: String,

  products: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,

    },

    quantity: {
      type: Number,
      required: true
    }
  }],
  coupon: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon"
    }
  },
  discountAmount: Number,

  totalPrice: {
    type: Number,
    required: true
  },

  orderNote: {
    type: String,
    default: "Order Note",
    max: [3000, 'Order Note Should be less than 3000 characters']
  },
  channel:{
    type: String,
    enum:[
      "web",
      "mobile"
    ]
  },

    outlet:{
      type: String,
      default:""
    },

  // vatRate: Number,

  orderLogs: [{
    status: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      required: true
    }
  }]
}, { timestamps: true });

const OrderModel = mongoose.model('Order', OrderSchema);

module.exports = OrderModel;

