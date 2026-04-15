import express from "express";
import morgan from "morgan";
import cors from "cors";
import routes from "./routes/index";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(routes);

app.get("/", (req, res) => {
  res.send("Olá Galerinha que assiste meu Canal");
});

export default app;
