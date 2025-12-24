
require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB credentials
const uri =
  "mongodb+srv://pet-shop:LbRSBjiaXGuyu0x2@wizard.fyfkszn.mongodb.net/?appName=Wizard";

// MongoDB client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("pet-shop");
    const petCollection = db.collection("pets");
    const ordersCollection = db.collection("orders");

    // ADD NEW PET 
    app.post("/pets", async (req, res) => {
      try {
        const newPet = req.body;

        if (!newPet.name || !newPet.category) {
          return res.status(400).send({
            error: "Missing required fields: name, category",
          });
        }

        newPet.date = new Date();

        const result = await petCollection.insertOne(newPet);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // GET ALL PETS
    app.get("/pets", async (req, res) => {
      try {
        const { email, category } = req.query;
        const query = {};

        if (email) query.owner_email = email;
        if (category) query.category = category;

        const result = await petCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // GET RECENT 6 PETS 
    app.get("/pets/recent", async (req, res) => {
      try {
        const recentPets = await petCollection
          .find()
          .sort({ date: -1 })
          .limit(6)
          .toArray();
        res.send(recentPets);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // GET SINGLE PET BY ID 
    app.get("/pets/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await petCollection.findOne({ _id: new ObjectId(id) });

        if (!result) return res.status(404).send({ error: "Pet not found" });

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });
    // UPDATE PET 
    app.patch("/pets/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatePet = req.body;

        const result = await petCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatePet }
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // DELETE PET 
    app.delete("/pets/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await petCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // ORDERS ROUTES

    // CREATE ORDER 
    app.post("/orders", async (req, res) => {
      try {
        const newOrder = req.body;

        if (!newOrder.productId || !newOrder.buyerName) {
          return res.status(400).send({
            error: "productId & buyerName are required",
          });
        }

        // check product exists
        const product = await petCollection.findOne({
          _id: new ObjectId(newOrder.productId),
        });

        if (!product) {
          return res.status(400).send({ error: "Invalid productId" });
        }

        newOrder.productName = product.name;
        newOrder.quantity = newOrder.quantity || 1;
        newOrder.price = newOrder.price || product.price || 0;
        newOrder.address = newOrder.address || "";
        newOrder.phone = newOrder.phone || "";
        newOrder.date = new Date();
        newOrder.additionalNotes = newOrder.additionalNotes || "";

        const result = await ordersCollection.insertOne(newOrder);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // GET ORDERS
    app.get("/orders", async (req, res) => {
      try {
        const email = req.query.email;
        const query = {};

        if (email) query.email = email;

        const result = await ordersCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // GET SINGLE ORDER
    app.get("/orders/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await ordersCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result)
          return res.status(404).send({ error: "Order not found" });

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // UPDATE ORDER
    app.patch("/orders/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await ordersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: req.body }
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // DELETE ORDER
    app.delete("/orders/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await ordersCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB successfully!");
  } finally {
  }
}

run().catch(console.dir);

// Root route
app.get("/", (req, res) => {
  res.send("Pet-shop server is live");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
