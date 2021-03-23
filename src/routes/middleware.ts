import { NextFunction, Request, Response } from "express";

export function accountName(
  req: Request,
  res: Response,
  next: NextFunction
): Response<unknown> | void {
  if (!req.body) {
    return res.status(400).send("JSON body was not passed");
  }

  if (!req.body.accountName || typeof req.body.accountName !== "string") {
    return res.status(400).send("JSON body is invalid");
  }

  next();
}

export function authenticated(
  req: Request,
  res: Response,
  next: NextFunction
): Response<unknown> | void {
  if (!req.session.loggedIn) {
    return res.status(401);
  }
  next();
}

export function admin(req: Request, res: Response, next: NextFunction): Response<unknown> | void {
  if (!req.session.admin) {
    return res.status(403);
  }
  next();
}
