const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const basicInfoRoutes = require("./routes/basicInfoRoutes");
const eventRoutes = require("./routes/eventRoutes");
const contactRoutes = require("./routes/contactRoutes");


const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Connect to Mongo
connectDB();

// API Routes
app.use("/", basicInfoRoutes);
app.use("/", eventRoutes);
app.use("/", contactRoutes);


app.listen(5000, () => {
  console.log("Server running on port 5000");
});
