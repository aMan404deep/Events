const mongoose = require('mongoose');

const eventSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, 
      required: function () {
      return !this.parentEvent;
    }, },
    ticketsAvailable: { type: Number, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    images: [{ type: String }], 
    parentEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }, // Reference to the parent event
    subEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }], // Array of sub-events (if this is a parent event)
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', eventSchema);
