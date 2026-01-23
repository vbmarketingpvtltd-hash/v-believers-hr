const express = require("express");
const serverless = require("serverless-http");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const router = express.Router();

app.use(express.json({ limit: "50mb" }));
app.use(cors());

const mongoURI = "mongodb+srv://mahesh_21:teI4gVKu0Vnzqy2y@cluster0.gnikcjh.mongodb.net/vbelievers?retryWrites=true&w=majority&appName=Cluster0";

const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
};

// ===== Schemas =====
const appSchema = new mongoose.Schema({
  regNo: String, name: String, fatherName: String, dob: String,
  qualification: String, circleDate: String, gender: String,
  branch: String, email: String, district: String, phone: String,
  bridge: String, status: String,
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Application = mongoose.models.Application || mongoose.model("Application", appSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

const logSchema = new mongoose.Schema({
  action: String, details: String, timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.models.Log || mongoose.model("Log", logSchema);

// ===== Mail =====
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: "pallemaheshreddy200@gmail.com", pass: "ybdt bvjm ykpg ocai" }
});

// ===== AUTH =====
router.post("/auth/register", async (req, res) => {
  try {
    await User.create(req.body);
    res.json({ message: "Account created" });
  } catch {
    res.status(400).json({ error: "User already exists" });
  }
});

router.post("/auth/login", async (req, res) => {
  const user = await User.findOne(req.body);
  user ? res.json({ success: true }) : res.status(401).json({ error: "Invalid login" });
});

// ===== APPLICATIONS =====
router.get("/applications", async (req, res) => {
  const apps = await Application.find({ isDeleted: false }).sort({ regNo: 1 });
  res.json(apps);
});

router.post("/applications", async (req, res) => {
  const { id, ...data } = req.body;
  if (id) await Application.findByIdAndUpdate(id, data);
  else await Application.create(data);
  res.json({ message: "Saved" });
});

router.delete("/applications/:id", async (req, res) => {
  await Application.findByIdAndUpdate(req.params.id, { isDeleted: true });
  res.json({ message: "Deleted" });
});

router.post("/applications/restore/:id", async (req, res) => {
  await Application.findByIdAndUpdate(req.params.id, { isDeleted: false });
  res.json({ message: "Restored" });
});

// ===== EMAIL =====
router.post("/send-mail", async (req, res) => {
  try {
    const { email, name, pdfData } = req.body;
    await transporter.sendMail({
      from: '"V Believers HR" <pallemaheshreddy200@gmail.com>',
      to: email,
      subject: `Selection Letter - ${name}`,
      text: `Dear ${name},\n\nAttached is your selection letter.`,
      attachments: [{
        filename: `${name}_Selection_Letter.pdf`,
        content: pdfData.split("base64,")[1],
        encoding: "base64"
      }]
    });

    await Log.create({ action: "EMAIL_SENT", details: email });
    res.json({ message: "Email sent" });

  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Mail failed" });
  }
});

app.use("/api", router);

module.exports.handler = async (event, context) => {
  await connectToDatabase();
  return serverless(app)(event, context);
};
