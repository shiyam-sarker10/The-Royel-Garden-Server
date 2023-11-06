const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;




// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());





const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.obcasl9.mongodb.net/?retryWrites=true&w=majority`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});




const logger = (req, res, next) => {
  console.log("we are at", req.host, req.originalUrl);
  next();
};



const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.this.status(401).send({ message: "tomar to token e nai miya " });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.this.status(401).send({ message: "token e gorbor ase vai" });
    }
    req.user = decoded;
    next();
  });
};




async function run() {
  try {




    // Connect the client to the server	(optional starting in v4.7)

    await client.connect();

    const roomCollection = client.db("assignment11DB").collection("rooms");
    const sitCollection = client.db("assignment11DB").collection("roomSit");
    const BookedCollection = client.db("assignment11DB").collection("booked");


    // auth related api




    app.post("/jwt", logger, (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1hr",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // main api 



    app.get("/rooms", async (req, res) => {
      const rooms = await roomCollection.find({}).toArray();
      res.send(rooms);
    })



    app.get("/roomSit", async (req, res) => {
      const roomSit = await sitCollection.find({}).toArray();
      res.send(roomSit);
    })



    app.get("/roomSit/:id", async (req, res) => {
      const commonId = req.params.id;
      const rooms = await sitCollection.find({ commonId: commonId }).toArray();
      res.send(rooms);
    })
    app.put("/roomIdSit/:id", async (req, res) => {
      const Id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(Id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          available: data.available,
        },
      };
      const result = await sitCollection.updateOne(query, updateDoc, options);

      res.send(result);
    });
    app.get("/roomIdSit/:id", async (req, res) => {
      const Id = req.params.id;
      const query = { _id: new ObjectId(Id) };
      const result = await sitCollection.findOne(query);
      res.send(result);
    });



    app.get("/rooms/:id", async (req, res) => {
      const Id = req.params.id;
      const query = { roomId: Id };
      const result = await roomCollection.findOne(query);
      res.send(result);
    });


    



    app.post('/myBooking', async (req,res) => {
      const booking = req.body;
      console.log(booking);
      const result = await BookedCollection.insertOne(booking);
      res.send(result);
    })


    app.get("/myBooking/:email", async (req, res) => {
      const newEmail = req.params.email
      const roomSit = await BookedCollection.find({
        email: newEmail,
      }).toArray();
      res.send(roomSit);
    });


    app.get("/myBooked/:id", async (req, res) => {
      const Id = req.params.id;
      const query = { _id: new ObjectId(Id) };
      const result = await BookedCollection.findOne(query);
      res.send(result);
    });

    
    





    
    

   

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("the project is working");
});
app.listen(port, () => {
  console.log(`This is server is running on port : ${port}`);
});
