import { Router } from "express";

const routes = new Router();

import User from "./app/models/User";

routes.get("/users", async (req, res) => {
  const user = await User.create({
    nome: "Lucas Sônego",
    email: "lucassonego@ufpr.br",
    password_hash: "LjLJHvbjkhvHVkkjhv"
  });
  return res.json(user);
});

routes.get("/", (req, res) => {
  return res.json({
    message: "Hello World"
  });
});

export default routes;
