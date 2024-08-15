const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema({
  categoryId: [{
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'category'
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
    type: String
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
    type: String,
    default: new Date().toISOString()
  },
  productDescription: {
    type: String
  },
  
  // Updated to support dynamic key-value pairs
  productSpecification: [{
    key: { type: String },
    value: { type: String }
  }],
  
  seo: {
    productTitle: {
      type: String,
      maxlength: 100
    },
    prodDescription: {
      type: String,
      maxlength: 100
    },
    productTags: [String],
    productNotes: {
      type: String,
      maxlength: 1000
    }
  },
  productShortDescription: {
    type: String,
  },
  
  general: {
    regularPrice: {
      type: Number,
      required: true
    },
    salePrice: Number,
    taxStatus: String,
    taxClass: String
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

// Pre-save hook to ensure date is set
ProductSchema.pre('save', function(next) {
  if (!this.date) {
    this.date = new Date().toISOString();
  }
  next();
},{ timestamps: true });

const ProductModel = mongoose.model('Product', ProductSchema);

module.exports = ProductModel;
