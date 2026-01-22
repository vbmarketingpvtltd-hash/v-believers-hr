const express = require("express");
const serverless = require("serverless-http");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const router = express.Router();

// Middleware
app.use(express.json({ limit: '50mb' })); 
app.use(cors());

// 1. DATABASE CONNECTION (Optimized for Netlify)
const mongoURI = "mongodb+srv://mahesh_21:teI4gVKu0Vnzqy2y@cluster0.gnikcjh.mongodb.net/vbelievers?retryWrites=true&w=majority&appName=Cluster0";

let cachedDb = null;

const connectToDatabase = async () => {
    // If a connection exists, reuse it
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    
    // Otherwise, create a new connection with a timeout
    return await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000
    });
};

// 2. SCHEMAS
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
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

const logSchema = new mongoose.Schema({
    action: String, details: String, timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.models.Log || mongoose.model("Log", logSchema);

// 3. EMAIL SETUP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", port: 465, secure: true,
  auth: { user: "pallemaheshreddy200@gmail.com", pass: "ybdt bvjm ykpg ocai" },
  tls: { rejectUnauthorized: false }
});

// 4. ROUTES
router.post("/auth/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const newUser = new User({ username, password });
        await newUser.save();
        res.json({ message: "Account created!" });
    } catch (err) { res.status(400).json({ error: "User already exists" }); }
});

router.post("/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) res.json({ success: true });
    else res.status(401).json({ error: "Invalid login" });
});

router.get("/check-duplicate/:regNo", async (req, res) => {
    const app = await Application.findOne({ regNo: req.params.regNo, isDeleted: false });
    res.json({ exists: !!app, name: app ? app.name : null });
});

router.get("/applications", async (req, res) => {
    const isBin = req.query.bin === 'true';
    const apps = await Application.find({ isDeleted: isBin }).sort({ regNo: 1 });
    res.json(apps);
});

router.post("/applications", async (req, res) => {
    const { id, ...data } = req.body;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
        await Application.findByIdAndUpdate(id, data);
        res.json({ message: "Updated" });
    } else {
        const newApp = new Application(data);
        await newApp.save();
        res.json({ message: "Saved" });
    }
});

router.delete("/applications/:id", async (req, res) => {
    await Application.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: "Deleted" });
});

router.post("/applications/restore/:id", async (req, res) => {
    try {
        await Application.findByIdAndUpdate(req.params.id, { isDeleted: false });
        res.json({ message: "Restored successfully" });
    } catch (err) {
        res.status(500).json({ error: "Restore failed" });
    }
});

router.post("/send-mail", async (req, res) => {
  const { email, name, pdfData } = req.body;

  if (!email || !name || !pdfData) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await transporter.sendMail({
      from: '"V Believers HR" <pallemaheshreddy200@gmail.com>',
      to: email,
      subject: `Selection Letter - ${name}`,
      text: `Dear ${name},\n\nPlease find your Selection Letter attached.`,
      attachments: [{
  filename: `${name}_Letter.pdf`,
  content: pdfData.split("base64,")[1],
  encoding: "base64"
}]


    await new Log({
      action: "EMAIL_SENT",
      details: `Sent to ${email}`
    }).save();

    return res.status(200).json({ message: "Email sent successfully" });

  } catch (err) {
    console.error("MAIL ERROR:", err);
    return res.status(400).json({ error: "Mail sending failed" });
  }
});


// 5. NETLIFY HANDLER EXPORT
app.use("/api", router);
const handler = serverless(app);

module.exports.handler = async (event, context) => {
    await connectToDatabase(); // Ensure DB is connected before handling the request
    return await handler(event, context);
};
