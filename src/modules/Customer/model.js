const mongoose=require('mongoose');
const bcrypt=require("bcryptjs");
const { max } = require('moment/moment');

const CustomerSchema=new mongoose.Schema({
    email:{
        type:String,
        unique:true,
        required:[true,'Email must be provided'],
    },
    firstName:{
        type:String,
        max:[15,"FirstName Should be at least 15 characters"],
    },
    lastName:{
        type:String,
        max:[12,"LastName Should be at least 12 characters"]
    },
    phoneNumber:{
        type:String,
        max:[13,"Phone Number Should be at least 13 characters"],
        required:[true,"Please Enter a valid phone number"],
        unique:true
    },
    changedPhoneNumber:{
        type:String,
        max:[14,"Phone Number Should be at least 14 characters"],
    },
    isValid:{
        type:Boolean,
        default:false
    },
    otp:{
        type:Number
    },
    password:{
        type:String,
    },
    address:{
        type:String,
        max:[120,"Address Should be at least 120 characters"],

    },
    isActive:{
        type:Boolean
    },
    isVerified:{type:Boolean},
    refreshToken:[String],
    wishList:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product'
    }],
    district:{
        type:String,
        max:[45,"District Should be at least 45 characters"],
    },
    zipCode:{
        type:String,
        max:[12 , 'Zip Code Should be at least 12 characters']
    }
    


})

// Password Hash Function  using Bcryptjs

CustomerSchema.pre('save',async function hashPassword(next){
    if(this.isModified('password')){
        const salt =await bcrypt.genSalt(10);
        this.password=await bcrypt.hash(this.password,salt);
    }
    next();
});

CustomerSchema.methods={
    async authenticate(password){
        return await bcrypt.compare(password,this.password);
    },

};

  //Validations
  CustomerSchema.path('phoneNumber').validate(function (value) {
    const regex = /^\d{13}$/; // regular expression to match 11 digits
    return regex.test(value);
  },"Please enter a valid Phone Number")

const CustomerModel=mongoose.model('customer',CustomerSchema);

module.exports=CustomerModel;