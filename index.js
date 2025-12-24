const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

const app = express();

/* =====================
   MIDDLEWARE
===================== */
app.use(cors());
app.use(express.json());

/* =====================
   MONGODB CONNECTION
===================== */
const uri = process.env.MONGODB_URI;

let cachedClient = null;
let cachedDb = null;

async function connectDB() {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  const db = client.db("pet-shop");

  cachedClient = client;
  cachedDb = db;

  console.log("✅ MongoDB Connected");
  return db;
}

/* =====================
   ROOT
===================== */
app.get("/", (req, res) => {
  res.send("🐾 Pet Shop API is running on Vercel");
});

/* =====================
   PET ROUTES
===================== */

// ADD PET
app.post("/pets", async (req, res) => {
  try {
    const db = await connectDB();
    const pet = req.body;

    if (!pet.name || !pet.category) {
      return res.status(400).send({ error: "name & category required" });
    }

    pet.date = new Date();
    const result = await db.collection("pets").insertOne(pet);
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET ALL PETS
app.get("/pets", async (req, res) => {
  try {
    const db = await connectDB();
    const { email, category } = req.query;

    const query = {};
    if (email) query.owner_email = email;
    if (category) query.category = category;

    const pets = await db.collection("pets").find(query).toArray();
    res.send(pets);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET RECENT 6 PETS
app.get("/pets/recent", async (req, res) => {
  try {
    const db = await connectDB();
    const pets = await db
      .collection("pets")
      .find()
      .sort({ date: -1 })
      .limit(6)
      .toArray();

    res.send(pets);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET SINGLE PET
app.get("/pets/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const pet = await db
      .collection("pets")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!pet) return res.status(404).send({ error: "Pet not found" });
    res.send(pet);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// UPDATE PET
app.patch("/pets/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection("pets").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE PET
app.delete("/pets/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection("pets").deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* =====================
   ORDER ROUTES
===================== */

// CREATE ORDER
app.post("/orders", async (req, res) => {
  try {
    const db = await connectDB();
    const order = req.body;

    if (!order.productId || !order.buyerName) {
      return res
        .status(400)
        .send({ error: "productId & buyerName required" });
    }

    const product = await db.collection("pets").findOne({
      _id: new ObjectId(order.productId),
    });

    if (!product) {
      return res.status(400).send({ error: "Invalid productId" });
    }

    order.productName = product.name;
    order.price = product.price || 0;
    order.quantity = order.quantity || 1;
    order.date = new Date();

    const result = await db.collection("orders").insertOne(order);
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET ORDERS
app.get("/orders", async (req, res) => {
  try {
    const db = await connectDB();
    const { email } = req.query;

    const query = {};
    if (email) query.email = email;

    const orders = await db.collection("orders").find(query).toArray();
    res.send(orders);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET SINGLE ORDER
app.get("/orders/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const order = await db
      .collection("orders")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!order) return res.status(404).send({ error: "Order not found" });
    res.send(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// UPDATE ORDER
app.patch("/orders/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE ORDER
app.delete("/orders/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection("orders").deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* =====================
   EXPORT FOR VERCEL
===================== */
module.exports = app;
