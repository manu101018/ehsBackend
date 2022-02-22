const mongoose = require("mongoose");

const Counters = mongoose.model(
  "Counters",
  new mongoose.Schema({
    sequence_value: { type: Number, default: 1 }
  }, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
);

module.exports = Counters;
