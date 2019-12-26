import express from "express";
import routes from "./routes";
import { resolve } from "path";

import "./databases";

class App {
  constructor() {
    this.server = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use(express.json());
    this.server.use(
      "/files",
      express.static(resolve(__dirname, "..", "temp", "uploads"))
    );
  }

  routes() {
    this.server.use(routes);
  }
}

module.exports = new App().server;
