const mongoose = require('mongoose');
const OutletSchema= new mongoose.Schema({


    outletName:{
        type:String,
        max:[30,'Must Be Outlet Name in 30 characters'],
        required:true
    },
    outletLocation:{
        type:String,
        max:[100,'Must Be Outlet City in 100 characters'],
        required:true
    },
    outletImage :{
        type : String,
        default:""
    },

    outletManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },

    cityName:{
        type:String,
        max:[100,'Must Be City Name in 100 characters']
    },
    areaName:{
        type:String,
        max:[1000,'Must Be City Area Name in 100 characters'],
    },

    outletManagerEmail:{
        type:String,
        required:true
    },
    outletManagerPhone:{
        type:String,
        required:true,
        max:[12,'Please Input valid Number'],

    },
    }


,{versionKey:false});

const OutletModel=mongoose.model('outlet',OutletSchema);

module.exports=OutletModel;

