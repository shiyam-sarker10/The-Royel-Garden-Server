const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;




// middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://the-royel-garden.netlify.app",
      "https://assigment-11-28aa2.web.app",
      "http://localhost:5173",
      "https://ass-11-server-eight.vercel.app",
    ],
    credentials: true,
  })
);
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






const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};


async function run() {
  try {

      


    // Connect the client to the server	(optional starting in v4.7)


    const roomCollection = client.db("assignment11DB").collection("rooms");
    const sitCollection = client.db("assignment11DB").collection("roomSit");
    const BookedCollection = client.db("assignment11DB").collection("booked");
    const reviewCollection = client.db("assignment11DB").collection("review");


    // auth related api




    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1hr",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", async(req,res) =>{
      res
      .clearCookie("token",)
      .send({ success: true });
    });
    

    // main api 


    //rooms 

    app.get("/rooms", async (req, res) => {
      const rooms = await roomCollection.find({}).toArray();
      res.send(rooms);
    })


    //roomSit

    app.get("/roomSit", async (req, res) => {
      const roomSit = await sitCollection.find({}).toArray();
      res.send(roomSit);
    })



    app.get("/roomSit/:id", async (req, res) => {
      const commonId = req.params.id;
      const rooms = await sitCollection.find({ commonId: commonId }).toArray();
      res.send(rooms);
    })
    app.get("/singleRoomSit/:id", async (req, res) => {
      const name = req.params.id;
      const rooms = await sitCollection.find({ sitName: name }).toArray();
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
    app.put("/bookingSit/:id", async (req, res) => {
      const sitName = req.params.id;
      const data = req.body;
      const query = { sitName: sitName };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          available: data.available,
        },
      };
      const result = await sitCollection.updateOne(query, updateDoc, options);

      res.send(result);
    });


    app.get("/rooms/:id", async (req, res) => {
      const Id = req.params.id;
      const query = { roomId: Id };
      const result = await roomCollection.findOne(query);
      res.send(result);
    });


    



    app.post('/myBooking',async (req,res) => {
      const booking = req.body;
      console.log(booking);
      const result = await BookedCollection.insertOne(booking);
      res.send(result);
    })





app.get("/myBooking/:email",verifyToken, async (req, res) => {
  try{
    const paramUser = req.params.email;
    const reqUsr = req.user.email;
    if(req.user?.email !== req.params?.email){
      res.status(401).send({ message: "unauthorized access" });
    }
     let query = {};
     if (req.params?.email) {
       query = { email: req.params?.email };
     }
  const roomSit = await BookedCollection.find(query).toArray();
  res.send(roomSit,paramUser,reqUsr);
  }catch{
    console.log(req.params?.email);
    console.log("token owner info",req.user?.email) ;
    res.status(401).send({ message: "unauthorized access" });
  }
});






    // app.get("/myBooking/:email", async (req, res) => {
    //   console.log("user email", req.user)
    //   const newEmail = req.params.email
    //   const query = { email: newEmail }
    //   const roomSit = await BookedCollection.find(query).toArray();
    //   res.send(roomSit);
    // });




    app.get("/myBooking", async (req, res) => {
      const roomSit = await BookedCollection.find().toArray();
      res.send(roomSit);
    });


    app.get("/myBooked/:id", async (req, res) => {
      const Id = req.params.id;
      const query = { _id: new ObjectId(Id) };
      const result = await BookedCollection.findOne(query);
      res.send(result);
    });

    app.put("/Booked/:id", async (req, res) => {
      const Id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(Id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          bookedDate: data.bookedDate,
        },
      };
      const result = await BookedCollection.updateOne(query, updateDoc, options);
      res.send(result);
    })
    app.delete("/Booked/:id", async (req, res) => {
      const Id = req.params.id;
      const query = { _id: new ObjectId(Id) };
      const result = await BookedCollection.deleteOne(query);
      res.send(result);
    })

//  reviews 
   app.post("/review", async (req, res) => {
     const review = req.body;
     const result = await reviewCollection.insertOne(review);
     res.send(result);
   });

   app.get("/review", async (req, res) => {
     const review = await reviewCollection.find().toArray();
     res.send(review);
   });
  

  app.get("/review/:id", async (req, res) => {
    const roomId = req.params.id;
    const roomSit = await reviewCollection
      .find({
        commonId: roomId,
      })
      .toArray();
    res.send(roomSit);
  });

  //review booking checking 
  app.get("/reviewBooking/:email", async (req, res) => {
     
     const newEmail = req.params.email
     const query = { email: newEmail }
    const roomSit = await BookedCollection.find(query).toArray();
    res.send(roomSit);
  });




  } finally {

  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("the project is working");
});
app.listen(port, () => {
  console.log(`This is server is running on port : ${port}`);
});
