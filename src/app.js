import express, {json} from "express"
import cors from "cors"
import {MongoClient, ObjectId} from "mongodb"
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

app.get("/tweets", async(req, res) => {
    try {
        const data = await db.collection("tweets").find().toArray();
        const tweets =[]
        
        for(let i=0; i< data.length; i++){
            let user = await db.collection("users").findOne({username:data[i].username})
                let newElement = {...data[i], avatar:user.avatar}
                tweets.push(newElement)
        }
        tweets.sort().reverse()

        res.send(tweets)

    } catch (error) {
        res.status(500).send(error.message)
    }

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
    
        await db.collection("tweets").insertOne(tweet);
        res.sendStatus(201);
        
    } catch (error) {
        res.status(500).send(error.message);
    }   

})

app.put("/tweets/:id", async(req, res) => {
    const {id} = req.params;
    const tweet = req.body;

    const tweetSchema = joi.object({
        username:joi.string().required(),
        tweet:joi.string().required()
    });

    const validation = tweetSchema.validate(tweet, {abortEarly:false});
    if(validation.error){
        const messages = validation.error.details.map(detail => detail.message);
        return res.status(422).send(messages);
    }

    try {
        const existingUser = 
        await db.collection("users").findOne({username:tweet.username});
       
        if(!existingUser){
            return res.status(401).send("Usuário não autorizado, por favor, faça o cadastro")
        } else if(validation.error){
            const messages = validation.error.details.map(detail => detail.message);
            return res.status(422).send(messages);
        }

        //tweet update
        const updated = await db.collection("tweets").updateOne({
            _id:new ObjectId(id)
        }, {
            $set:{
                username:tweet.username,
                tweet:tweet.tweet
            }
        });

        if(updated.matchedCount === 0){
            return res.statusStatus(404);
        }

        res.sendStatus(204);    
      
    } catch (error) {
        res.status(500).send(error.message);      
    }


})


app.delete("/tweets/:id", async(req, res) =>{
   const {id} = req.params
   
   try {
        const tweetToDelete = await db.collection("tweets").deleteOne({ _id: new ObjectId(id)})
        
        if(tweetToDelete.deletedCount === 0){
            return res.status(404).send("tweet não encontrado")
        }

        return res.status(204).send("tweet deletado com sucesso!")
   } catch (error) {
        return res.status(500).send(error.message)
   }

})

const port = process.env.PORT;

app.listen(port, ()=> console.log(`Running server on port ${port}`))