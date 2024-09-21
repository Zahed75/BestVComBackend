const mongoose = require('mongoose');

const GridSchema = new mongoose.Schema({
  gridName: {
    type: String,
  },
  gridDescription: {
    type: String,
  },
  productRow: {
    type: Number,
  },
  productColumn: {
    type: Number,
  },
  filterCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category'
  }],
  selectProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  ordersBy: {
    type: Number,
    index: true
  },
  url: {  // New field added
    type: String,
  }
});

const GridModel = mongoose.model('Grid', GridSchema);

module.exports = GridModel;
