import express, {json} from "express"
import cors from "cors"
import {MongoClient} from "mongodb"
import dotenv from "dotenv"
import joi from "joi"

dotenv.config()// conection to environmental variables 

const app = express();
app.use(cors());
app.use(json());

//connecting to DB

const url_db = process.env.DATABASE_URL;
const mongoClient = new MongoClient(url_db);
let db;

//connection to DB is an asynchronous event => promise

mongoClient.connect()
.then(()=>{console.log("Successfully connected to DB!")
           db = mongoClient.db();
})
.catch((err) => console.log(err.message))

app.get("/tweets", (req, res) => {
    db.collection("tweets").find().toArray()
    .then(data => res.send(data))
    .catch(error => res.status(500).send(error.message))
})

app.post("/sign-up", async (req, res) => {
    const user = req.body;
    
    //Schema construction 
    const userSchema = joi.object({
        username:joi.string().required(),
        avatar:joi.string().required()
    });
    
    const validation = userSchema.validate(user, {abortEarly:false})

    //identify errors and send them to users
    if(validation.error){
        const messages = validation.error.details.map(detail => detail.message);
        return res.status(422).send(messages);
    }

    try {
        const existingUser = 
        await db.collection("users").findOne({username:user.username});
        
        if(existingUser){
            return res.status(409).send("Usuário já cadastrado!")
        }

        await db.collection("users").insertOne(user);
        res.status(201).send("Usuário cadastrado com sucesso!")
        
    } catch (error) {
        res.status(500).send(error.message)
    }

})

app.post("/tweets", async (req, res) => {
    const tweet = req.body;
     //Schema construction 
     const tweetSchema = joi.object({
        username:joi.string().required(),
        tweet:joi.string().required()
    });

    const validation = tweetSchema.validate(tweet, {abortEarly:false})
  
    try {
        const existingUser = 
        await db.collection("users").findOne({username:tweet.username});
       
        if(!existingUser){
            return res.status(401).send("Usuário não autorizado, por favor, faça o cadastro")
        } else if(validation.error){
            const messages = validation.error.details.map(detail => detail.message);
            return res.status(422).send(messages);
        }

        let finalTweet = {...tweet, avatar:existingUser.avatar} 
    
        await db.collection("tweets").insertOne(finalTweet);
        res.sendStatus(201);
        
    } catch (error) {
        res.status(500).send(error.message);
    }   

})

const port = process.env.PORT;

app.listen(port, ()=> console.log(`Running server on port ${port}`))