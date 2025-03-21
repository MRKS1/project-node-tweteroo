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
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message));

app.listen(port, () => {
    console.log("Funcionou");
});



app.post("/sign-up", async (req, res) => {
    const item = req.body;

    try {

        await db.collection("users").insertOne({
            username: item.username,
            avatar: item.avatar
        })
        return res.sendStatus(201)


    } catch (err) {
        return res.status(500).send(err.message);

    }
})

app.post("/tweets", async (req, res) => {
    const item = req.body;

    try {
        
        await db.collection("tweets").insertOne({
            username: item.username,
            tweet: item.tweet
        })
        return res.sendStatus(201)


    } catch (err) {
        return res.status(500).send(err.message);

    }
})


app.get("/tweets", async (req, res) => {

    try {
        const tweets = await db.collection("tweets").find().sort({ _id: -1 }).toArray();
        const tweetWithAvatar = await Promise.all(
            tweets.map(async (tweet) => {
            const userAvatar = await db.collection("users").findOne({ username: tweet.username }); 
            return {
                _id: tweet._id,
                username: tweet.username,
                avatar: userAvatar.avatar,
                tweet: tweet.tweet
            }
        })
    );
        return res.send(tweetWithAvatar);
    } catch (err) {
        return res.status(500).send(err.message);
    }
})

