// Express 4 does not catch errors thrown inside async route handlers.
// Wrap a handler with this and any error goes to the error middleware in app.js.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
