import express from 'express';
import { allEvents, cancelReservation, eventSummary, reservation, reservationsByUser } from '../controllers/eventController.js';
import { verifyToken } from '../middleware.js';

const router = express.Router();    

router.get('/all',allEvents);
router.post('/reserve/:event_id',verifyToken,reservation);
router.delete('/cancel/:reservation_id',verifyToken,cancelReservation);
router.get('/reservations-by-user',verifyToken,reservationsByUser);
router.get('/summary/:event_id',eventSummary);

export default router;