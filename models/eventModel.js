import pool from "../db.js";

export const getAllEvents = async () => {
    const result = await pool.query('SELECT * FROM events');
    return result.rows;
};

export const getEventById = async (event_id) => {
    const result = await pool.query('SELECT * FROM events WHERE event_id = $1', [event_id]);
    return result.rows[0];
}

export const makeReservationById = async (event_id, user_id, partner_id, seats) => {
    const eventRes = await pool.query("SELECT * FROM events WHERE event_id = $1", [event_id]);
    const event = eventRes.rows[0];

    if (!event) throw new Error("Event not found");
    if (seats <= 0 || seats > 10) throw new Error("Invalid seat count");
    if (event.available_seats < seats) throw new Error("Not enough seats left");

    const updateEvent = await pool.query(
        `UPDATE events
       SET available_seats = available_seats - $1,
           version = version + 1
       WHERE event_id = $2 AND version = $3 AND available_seats >= $1
       RETURNING *`,
        [seats, event_id, event.version]
    );

    if (updateEvent.rowCount === 0) {
        throw new Error("Event already updated by another user");
    }

    const reservationRes = await pool.query(
        `INSERT INTO reservations (event_id, user_id, partner_id, seats)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
        [event_id, user_id, partner_id, seats]
    );
    return reservationRes.rows[0];
};

export const cancelReservationById = async (reservation_id) => {
    const reservationRes = await pool.query(
        "SELECT * FROM reservations WHERE reservation_id = $1",
        [reservation_id]
    );
    const reservation = reservationRes.rows[0];
    if (!reservation) throw new Error("Reservation not found");

    const eventRes = await pool.query(
        "SELECT * FROM events WHERE event_id = $1",
        [reservation.event_id]
    );
    const event = eventRes.rows[0];
    if (!event) throw new Error("Event not found");

    const updateRes = await pool.query(
        `UPDATE events
       SET available_seats = available_seats + $1,
           version = version + 1
       WHERE event_id = $2 AND version = $3
       RETURNING *`,
        [reservation.seats, reservation.event_id, event.version]
    );
    if (updateRes.rowCount === 0) {
      throw new Error("Conflict: Event updated concurrently");
    }
    
    await pool.query("DELETE FROM reservations WHERE reservation_id = $1", [reservation_id]);
    return reservation;
};

export const getReservationsByUser = async (user_id) => {
    const result = await pool.query('SELECT * FROM reservations WHERE user_id = $1', [user_id]);
    return result.rows;
}