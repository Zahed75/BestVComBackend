const { required, types } = require('joi');
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  categoryId: [{
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'category' // Assuming  category model is named 'Category'
  }],
  productName: {
    type: String,
    maxlength: 300,
    required: true
  },
  productSlug: {
    type: String,
    required: true,
    unique: true
  },
  productBrand: {
    type: String,
    required: true
  },
  productCode: {
    type: String,

  },

  productImage: {
    type: String
  },
  productGallery: [String],
  productVideos: [String],


  productStatus: {

    type: String,
    enum: ['Published', 'Draft'],
    required: true
  },


  date: {
    type: String// Automatically set the date when the product is added
  },

  productDescription: {
    type: String,

  },

  seo: {
    productTitle: {
      type: String,
      maxlength: 100
    },

    prodDescription: {
      type: String,
      maxlength: 100
    },

    productTags: [
    ],
    productNotes: {
      type: String,
      maxlength: 1000
    }
  },
  productShortDescription: {
    type: String,
    maxlength: 2000
  },
  general: {
    regularPrice: {
      type: Number,
      required: true
    },

    salePrice: Number,
    taxStatus: String,
    taxClass: String,

  },



  inventory: {
    sku: String,
    stockManagement: Boolean,

    stockStatus: {
      type: String,
      enum: ['In Stock', 'Out of Stock', 'On Backorder']
    },

    soldIndividually: Boolean,


    inventoryStatus: {
      type: String,
      enum: ['Only Online', 'Only Offline', 'Online & Offline']
    }

  },

  shipping: {
    productDimensions: {
      height: Number,
      width: Number,
      length: Number
    },
    weight: Number
  }
});


const ProductModel = mongoose.model('Product', ProductSchema);

module.exports = ProductModel;
