const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
    },
    tax: {
        priceWithTax: {
            type: String,
            enum: ['inclusive', 'exclusive'],
            
        },
        calculateTax: {
            type: String,
            enum: ['shopBased', 'anotherOption'],
            
        },
        rounding: {
            type: Boolean,
            default: false
        },
        additionalTaxClass: {
            type: String,
            default: ''
        },
        displayPriceWithTaxShop: {
            type: Boolean,
            default: false
        },
        displayPriceWithTaxCart: {
            type: Boolean,
            default: false
        },
        priceDisplaySuffix: {
            type: String,
            default: ''
        },
        displayTaxTotal: {
            type: String,
            enum: ['option1', 'option2'], 
            default: 'option1'
        },
    },
    payments: {
        digitalPayment: {
            type: Boolean,
            default: false
        },
        enableSSLCommerz: {
            type: Boolean,
            default: false
        },
        storeId: {
            type: String,
            default: ''
        },
        password: {
            type: String,
            default: ''
        },
        sslCommercezSandbox: {
            type: Boolean,
            default: false
        },
        returnPageFail: {
            type: String,
            default: ''
        },
        returnPage: {
            type: String,
            default: ''
        },
        cashOndelivery: {
            type: Boolean,
            default: false
        },
        deliveryCharge:{
            type : Number,
            default:0
        }
    },
    emails: {
        emailStatus: {
            type: String,
            enum: ['newOrder', 'cancelOrder', 'failedOrder', 'orderOnHold', 'processingOrder', 'completedOrder', 'refundedOrder', 'customerInvoice', 'customerNote', 'resetPass', 'newAccount'],
        },
        emailReciepent:[{
            type: String,

        }],
        enable: {
            type: Boolean,
            default: false
        },
        emailSenderOptions: {
            FromName: {
                type: String,
                default: ''
            },
            FromAddress: {
                type: String,
                default: ''
            }
        },
        emailBody: {
            type: String,
            default: ''
        },
        emailHeader:{
            type : String,
        },
        emailTemplate: {
            headerImage: {
                type: String,
                default: ''
            },
            footerText: {
                type: String,
                default: ''
            },
            baseColour: {
                type: String,
                default: ''
            },
            backgroundColor: {
                type: String,
                default: ''
            },
            bodyBackgroundColour: {
                type: String,
                default: ''
            },
            bodyTextColour: {
                type: String,
                default: ''
            }
        }
    }
});

const SettingsModel = mongoose.model('Settings', settingSchema);
module.exports = SettingsModel;
