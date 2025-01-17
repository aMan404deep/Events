const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const upload = require('../middleware/multer');

const createEvent = asyncHandler(async (req, res) => {
  const { title, description, date, location, ticketsAvailable, parentEvent } = req.body;

  const images = req.files ? req.files.map((file) => file.path) : [];

  if (parentEvent) {
    if (!title || !description || !date) {
      res.status(400);
      throw new Error('Please provide title, description, and date for the sub-event');
    }

    const parent = await Event.findById(parentEvent);
    if (!parent) {
      res.status(404);
      throw new Error('Parent event not found');
    }
  } else {
    if (!title || !description || !date || !location || !ticketsAvailable) {
      res.status(400);
      throw new Error('Please provide all required fields for the parent event');
    }
  }

  const event = new Event({
    title,
    description,
    date,
    location: location || null, 
    ticketsAvailable: ticketsAvailable || 0, 
    images,
    parentEvent: parentEvent || null,
    organizer: req.user._id,
  });

  const createdEvent = await event.save();

  if (parentEvent) {
    const parent = await Event.findById(parentEvent);
    parent.subEvents.push(createdEvent._id);
    await parent.save();
  }

  res.status(201).json(createdEvent);
});

const getEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ parentEvent: null }).populate('subEvents');
  res.status(200).json(events);
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('subEvents');

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  res.status(200).json(event);
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  if (event.organizer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to update this event');
  }

  const newImages = req.files ? req.files.map((file) => file.path) : [];
  const updatedImages = [...event.images, ...newImages];

  event.title = req.body.title || event.title;
  event.description = req.body.description || event.description;
  event.date = req.body.date || event.date;
  event.location = req.body.location || event.location;
  event.ticketsAvailable = req.body.ticketsAvailable || event.ticketsAvailable;
  event.images = updatedImages;

  const updatedEvent = await event.save();
  res.status(200).json(updatedEvent);
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  if (event.organizer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to delete this event');
  }

  if (event.subEvents.length > 0) {
    await Event.deleteMany({ _id: { $in: event.subEvents } });
  }

  await event.remove();
  res.status(200).json({ message: 'Event and its sub-events removed successfully' });
});

module.exports = {
  createEvent: [
    upload.array('images', 10), 
    createEvent,
  ],
  getEvents,
  getEventById,
  updateEvent: [
    upload.array('images', 10), 
    updateEvent,
  ],
  deleteEvent,
};
