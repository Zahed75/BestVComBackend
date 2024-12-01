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
  transferredToOutlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'outlet', // Optional: only if orders can be transferred
    default: null
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
      'Order Placed',
      'Order Confirmed',
      'Order Processing',
      'Ready for Delivery',
      'Order Dispatched',
      'Cancelled',
      'Order Delivered'
    ],
    default: 'Received'
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

  city: {
    type: String,
    required: true
  },
  area: {
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

