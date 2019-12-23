import { Router } from "express";

const routes = new Router();

import UserController from "./app/controllers/UserController";

routes.post("/users", UserController.store);

routes.get("/", (req, res) => {
  return res.json({
    message: "Hello World"
  });
});

export default routes;
