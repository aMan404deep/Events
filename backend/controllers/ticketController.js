const sendEmail = require('../utils/sendEmail');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const QRCode = require('qrcode');

const bookTicket = async (req, res) => {
  try {
    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.ticketsAvailable - event.ticketsSold <= 0) {
      return res.status(400).json({ message: 'Tickets sold out' });
    }
    
    const qrCodeData = `Event: ${event.title}, User: ${req.user.email}, Date: ${event.date}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    const ticket = await Ticket.create({
      event: eventId,
      user: req.user._id,
      qrCode, 
    });
    
    event.ticketsSold += 1;
    await event.save();

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #007BFF;">Hello ${req.user.name},</h2>
        <p>Thank you for booking a ticket for the event "<strong>${event.title}</strong>".</p>
        <h3>Event Details:</h3>
        <ul>
          <li><strong>Event:</strong> ${event.title}</li>
          <li><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</li>
          <li><strong>Location:</strong> ${event.location}</li>
        </ul>
        <p>Below is your QR Code for the event:</p>
        <img src="${qrCode}" alt="QR Code" style="max-width: 300px; border: 1px solid #ddd;" />
        <p>Please present this QR code at the event entry.</p>
        <br/>
        <p>Regards,<br/>Event Ticketing System</p>
      </div>
    `;
    
    await sendEmail({
      to: req.user.email,
      subject: `Ticket Confirmation for ${event.title}`,
      html: emailHTML,
    });

    res.status(201).json({
      message: 'Ticket booked successfully!',
      ticket,
    });
  } catch (error) {
    console.error('Error booking ticket:', error);
    res.status(500).json({ message: 'Server error, please try again.' });
  }
};

module.exports = { bookTicket };
