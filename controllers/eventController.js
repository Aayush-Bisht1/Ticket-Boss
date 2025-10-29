import { cancelReservationById, getAllEvents, getReservationsByUser, makeReservationById, getEventById } from "../models/eventModel.js";

export const allEvents = async(req, res) => {
    try {
        const events = await getAllEvents();
        res.status(201).json({ events });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const reservation = async (req, res) => {
  try {
    const { partner_id, seats } = req.body;
    const { event_id } = req.params;
    const user_id = req.user?.id;    

    if (!partner_id || !seats || !event_id){
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const reserve = await makeReservationById(event_id, user_id, partner_id, seats);
      res.status(201).json({ reserve, status: "confirmed" });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const cancelReservation = async(req, res) => {
    try {
        const {reservation_id} = req.params;
        if(!reservation_id){
            return res.status(404).json({ error: "Missing reservation ID" });
        }
        const cancel = await cancelReservationById(reservation_id);
        res.status(200).json({ cancel });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const reservationsByUser = async(req, res) => {
    try {
        const user_id = req.user.id;
        const reservations = await getReservationsByUser(user_id);
        res.status(201).json({ reservations });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const eventSummary = async(req, res) => {
    try {
        const {event_id} = req.params;
        if(!event_id){
            return res.status(400).json({ error: "Missing event ID" });
        }
        const event = await getEventById(event_id);
        res.status(200).json({ event });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};