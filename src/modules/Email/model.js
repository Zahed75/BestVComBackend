const mongoose = require('mongoose');

// Enum for order statuses
const OrderStatus = {
    NEW_ORDER: 'new_order',
    CANCELLED_ORDER: 'cancelled_order',
    FAILED_ORDER: 'failed_order',
    ORDER_ON_HOLD: 'order_on_hold',
    PROCESSING_ORDER: 'processing_order',
    COMPLETED_ORDER: 'completed_order',
    REFUND_ORDER: 'refund_order',
};

// Enum for user roles
const UserRole = {
    BRANCH_ADMIN: 'BA',
    ADMIN: 'AD',
    MANAGER: 'MGR',
};

// Email template schema
const emailTemplateSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: Object.values(OrderStatus),
        required: true,
    },
    enable: {
        type: Boolean,
        default: true, // Enable/Disable email for the order status
    },
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the users assigned to receive this email
        role: {
            type: String,
            enum: Object.values(UserRole),
        }
    }],
    subject: {
        type: String,
        required: true,
    },
    emailHeading: {
        type: String,
        required: true,
    },
    additionalContent: {
        type: String,
    },
    emailType: {
        type: String,
        enum: ['HTML', 'PlainText'], // HTML or PlainText email
        default: 'HTML',
    },
    // Design options
    headerImage: {
        type: String, // URL to the header image
    },
    footerText: {
        type: String,
    },
    baseColor: {
        type: String, // Hex color code for base color
        default: '#FFFFFF',
    },
    backgroundColor: {
        type: String, // Hex color code for background
        default: '#F8F8F8',
    },
    bodyBackgroundColor: {
        type: String, // Body background color
        default: '#FFFFFF',
    },
    bodyTextColor: {
        type: String, // Text color for email body
        default: '#000000',
    },
    // Sender information
    fromName: {
        type: String,
        required: true,
    },
    fromAddress: {
        type: String,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
