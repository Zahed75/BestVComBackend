const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        // required: true
    },
    general: {
        couponName: {
            type: String,
            required: true,
            unique: true,
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: true
        },
        couponAmount: {
            type: Number,
        },
        allowFreeShipping: {
            type: Boolean,
            default: false
        },
        couponExpiry: {
            type: Date,
            required: true
        },
    },
    usageRestriction: {
        minimumSpend: Number,
        maximumSpend: Number,
        individualUseOnly: {
            type: Boolean,
            default: false
        },
        excludeSaleItems: {
            type: Boolean,
            default: false
        },
        products: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }],
        excludeProducts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }],
        categories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'category'
        }],
        excludeCategories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'category'
        }],
        blockedAccounts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }]
    },
    usageLimit: {
        usageLimitPerCoupon: Number,
        limitUsageToXItems: Number,
        usageLimitPerUser: Number
    }
}, { timestamps: true });

const CouponModel = mongoose.model('coupon', CouponSchema);
module.exports = CouponModel;
