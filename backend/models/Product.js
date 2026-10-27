const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  category: {
    type: String,
    enum: ['coffee', 'drinks', 'desserts', 'burgers', 'dishes', 'snacks', 'beverages'],
    required: true
  },
  image: {
    type: String,
    default: 'images/menu-1.jpg'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  customizations: {
    sizes: [{
      name: { type: String }, // e.g. 'Regular', 'Large'
      priceExtra: { type: Number, default: 0 }
    }],
    milkOptions: [{ type: String }], // e.g. ['Whole Milk', 'Oat Milk', 'Almond Milk', 'Skim Milk']
    sugarOptions: [{ type: String }] // e.g. ['No Sugar', 'Less Sugar', 'Normal Sugar', 'Extra Sugar']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);
