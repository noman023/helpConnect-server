const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://assignment11-c9a59.web.app",
      "https://assignment11-c9a59.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

// mongodb atlas connection uri
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASS}@cluster0.faeme9d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("HelpConnect");
    const allPost = database.collection("needVolunteer");
    const reviews = database.collection("reviews");
    const volunteerRequests = database.collection("volunteerRequests");

    // post related apis below
    app.get("/posts", async (req, res) => {
      const allVolunteerPost = allPost.find().sort({ deadline: 1 });
      const result = await allVolunteerPost.toArray();

      res.send(result);
    });

    app.get("/post/:id", async (req, res) => {
      const id = req.params.id;
      //   match id with _id of data
      const query = { _id: new ObjectId(id) };

      const result = await allPost.findOne(query);
      res.send(result);
    });

    app.get("/myPosts", async (req, res) => {
      const email = req.query.email;

      let query;
      // if email is in the query use this for query in database
      if (req.query?.email) {
        query = { "organizer.email": email };
      }

      const userPosts = await allPost.find(query).toArray();
      res.send(userPosts);
    });

    // add and update post apis below
    app.post("/addPost", async (req, res) => {
      const data = req.body;

      const post = {
        ...data,
      };

      const result = await allPost.insertOne(post);
      res.send(result);
    });

    app.put("/updatePost/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;

      // filter existing data
      const filter = { _id: new ObjectId(id) };

      // if no existing data found then add new one
      const options = { upsert: true };

      // update post
      const updatePost = {
        $set: {
          ...data,
        },
      };

      const result = await allPost.updateOne(filter, updatePost, options);
      res.send(result);
    });

    app.delete("/post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await allPost.deleteOne(query);
      res.send(result);
    });

    // be volunteer related apis below
    app.post("/beVolunteer", async (req, res) => {
      const data = req.body;

      const beVolunteerPost = {
        ...data,
      };

      const result = await volunteerRequests.insertOne(beVolunteerPost);
      res.send(result);
    });

    app.patch("/beVolunteer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      await allPost.findOneAndUpdate(
        query,
        { $inc: { volunteersNeeded: -1 } }, // Decrement volunteersNeeded by 1
        { returnOriginal: false } // Return the updated document
      );

      res.send({ title: "success" });
    });

    app.get("/myRequests", async (req, res) => {
      const email = req.query.email;
      let query;

      // if email is in the query use this for query in database
      if (req.query?.email) {
        query = { volunteerEmail: email };
      }

      const volunteerRequestPosts = await volunteerRequests
        .find(query)
        .toArray();

      res.send(volunteerRequestPosts);
    });

    app.delete("/myRequests/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await volunteerRequests.deleteOne(query);

      res.send(result);
    });

    // reviews related api below
    app.get("/reviews", async (req, res) => {
      const allReviews = reviews.find();
      const result = await allReviews.toArray();

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

app.listen(port, () => {
  console.log(`Server Running on port ${port}`);
});
