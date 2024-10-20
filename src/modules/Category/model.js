const mongoose = require('mongoose');
const CategorySchema = new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'user'
    },
    categoryName:{
        type:String,
        max:[30,"category name must be under 30"],
        required : true
    },
    parentCategory:{
        type : String,
        max:[30,"category name must be under 30"],

    },
    categoryDescription:{
        type:String,
        max:[100,"product descriptiopn should be under 100 characters"]
    },
    fetaureImage:{
        type:[String]
    },
    slug:{
        type:String,
        unique:true
    },
    title:{
        type:String,
        max:[5000,"product descriptiopn should be under 100 characters"]
    },
    metaDescription:{
        type:String,
        max:[5000,"product descriptiopn should be under 100 characters"]
    },
    subCategories: [{ // Add this line
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    }]

});

const categoryModel=mongoose.model('category',CategorySchema);

module.exports=categoryModel;
