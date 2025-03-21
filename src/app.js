import express, { json } from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors"
import joi from "joi";

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
    const { username, avatar } = req.body;

    const userSchema = joi.object({
        username: joi.string().required(),
        avatar: joi.string().required()
    })

    const validation = userSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const message = validation.error.details.map(detail => detail.message)
        return res.status(422).send(message);
    }

    try {
        await db.collection("users").insertOne({ username, avatar });
        return res.sendStatus(201);
    }

    catch (err) {
        return res.status(500).send(err.message);
    }
});

app.post("/tweets", async (req, res) => {
    const { username, tweet } = req.body;
    const validUser = await db.collection("users").findOne({ username: username });

    const tweetSchema = joi.object({
        username: joi.string().required(),
        tweet: joi.string().required()
    });

    const validation = tweetSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const message = validation.error.details.map(detail => detail.message);
        return res.status(400).send(message);
    }

    if (!validUser) {
        return res.sendStatus(401);
    }

    try {
        await db.collection("tweets").insertOne({ username, tweet });
        return res.sendStatus(201);
    }

    catch (err) {
        return res.status(500).send(err.message);
    }
});

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
    }

    catch (err) {
        return res.status(500).send(err.message);
    }
});

app.put("/tweets/:id", async (req, res) => {
    const { id } = req.params;
    const { tweet } = req.body;
    const validId = await db.collection("tweets").findOne({ _id: new ObjectId(id) });


    const tweetSchema = joi.object({
        username: joi.string().required(),
        tweet: joi.string().required()
    });

    const validation = tweetSchema.validate(req.body, { abortEarly: false });

    if (!validId) {
        return res.sendStatus(404);
    }

    if (validation.error) {
        const message = validation.error.details.map(detail => detail.message);
        return res.status(400).send(message);
    }

    try {
        await db.collection("tweets").updateOne({
            _id: new ObjectId(id)
        }, {
            $set: { tweet }
        });

        return res.sendStatus(204);
    }

    catch (err) {
        return res.status(500).send(err.message);
    }
});

app.delete("/tweets/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.collection("tweets").deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.sendStatus(404);
        };

        return res.sendStatus(204);
    }

    catch (err) {
        return res.status(500).send(err.message);
    }
});