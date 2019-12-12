import * as express from "express";

export const errorHandler: express.ErrorRequestHandler = (
    error,
    req,
    res,
    next
) => {
    res.status(error.status || 500).send({
        error: error.message || error,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
};
