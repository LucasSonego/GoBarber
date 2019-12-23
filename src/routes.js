import { Router } from "express";

const routes = new Router();

import UserController from "./app/controllers/UserController";
import SessionController from "./app/controllers/SessionController";

import authMiddleware from "./app/middlewares/auth";

routes.post("/users", UserController.store);
routes.post("/sessions", SessionController.store);

routes.use(authMiddleware);

routes.put("/teste", (req, res) => {
  console.log(req.userId);

  return res.json();
});

export default routes;
