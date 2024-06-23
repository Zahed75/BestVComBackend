const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    outletId:
    {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'outlet'
    },
    quantity: {
        type: Number,
        required: true
    },
    products: [{
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }]

}, { versionKey: false });


const InventoryModel = mongoose.model('inventory', InventorySchema);
module.exports = InventoryModel;