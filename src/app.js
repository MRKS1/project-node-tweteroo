import express, { json } from "express";
import { MongoClient } from "mongodb";
import cors from "cors"
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(json());

const databaseURL = process.env.DATABASE_URL;
const port = process.env.PORT;
const mongoClient = new MongoClient(databaseURL);
let db;

mongoClient.connect()
 .then(() => db = mongoClient.db()) // se a conexão funcionar
 .catch((err) => console.log(err.message)); // se a conexão der erro

app.listen(port, () => {
    console.log("Funcionou");
});
