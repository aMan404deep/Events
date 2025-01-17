const express = require('express');
const upload = require('../middleware/multer');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById); 

router.post('/create', upload.array('images', 10), protect, createEvent);
router.put('/:id', upload.array('images', 10), protect, updateEvent); 
router.delete('/:id', protect, deleteEvent); 

module.exports = router;
