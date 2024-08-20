const mongoose = require('mongoose');

const GridSchema = new mongoose.Schema({
    eventCatId:{
        type:String,
    },
    title: {
        type: String,
        max: 10000,
  
    },
    description: {
        type: String,
        max: 10000,
        
    },
    url: {
        type: String,
        max: 10000,
      
    },
    categoriesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
    },


});

const GridModel = mongoose.model('Event', GridSchema);

module.exports = GridModel;
