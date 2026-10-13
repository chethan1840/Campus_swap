import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";

const SECRET = process.env.JWT_SECRET || "campusswap-dev-secret";
const FILE = "./db.json";
const db = fs.existsSync(FILE)
  ? JSON.parse(fs.readFileSync(FILE))
  : { users: [], resources: [], requests: [] };
const save = () => fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // CORS
app.use(express.json());                            // JSON

// ---- Authentication middleware ----
const auth = (req, res, next) => {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Please log in" });
  }
};
const safe = ({ password, ...u }) => u;
const sign = (u) => ({ token: jwt.sign({ id: u.id }, SECRET, { expiresIn: "7d" }), user: safe(u) });

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
  if (db.users.some((u) => u.email === email)) return res.status(409).json({ error: "Email already used" });
  const user = { id: id(), name, email, bio: "", password: await bcrypt.hash(password, 8) };
  db.users.push(user); save();
  res.json(sign(user));
});

app.post("/api/login", async (req, res) => {
  const user = db.users.find((u) => u.email === req.body.email);
  if (!user || !(await bcrypt.compare(req.body.password || "", user.password)))
    return res.status(401).json({ error: "Wrong email or password" });
  res.json(sign(user));
});

// ---- Resource posts (CRUD) + search/filter ----
const withOwner = (r) => ({ ...r, owner: db.users.find((u) => u.id === r.ownerId)?.name });

app.get("/api/resources", (req, res) => {
  const { q = "", category = "", status = "" } = req.query;
  res.json(
    db.resources
      .filter((r) => r.title.toLowerCase().includes(q.toLowerCase()) || r.description.toLowerCase().includes(q.toLowerCase()))
      .filter((r) => !category || r.category === category)
      .filter((r) => !status || r.status === status)
      .map(withOwner)
  );
});

app.post("/api/resources", auth, (req, res) => {
  const { title, description = "", category = "Books" } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const r = { id: id(), title, description, category, status: "available", ownerId: req.user.id };
  db.resources.push(r); save();
  res.json(withOwner(r));
});

const ownResource = (req, res, next) => {
  const r = db.resources.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  if (r.ownerId !== req.user.id) return res.status(403).json({ error: "Not your resource" });
  req.resource = r; next();
};

app.put("/api/resources/:id", auth, ownResource, (req, res) => {
  const { title, description, category } = req.body;
  Object.assign(req.resource, { ...(title && { title }), ...(description !== undefined && { description }), ...(category && { category }) });
  save(); res.json(withOwner(req.resource));
});

app.delete("/api/resources/:id", auth, ownResource, (req, res) => {
  db.resources = db.resources.filter((r) => r.id !== req.params.id);
  db.requests = db.requests.filter((r) => r.resourceId !== req.params.id);
  save(); res.json({ ok: true });
});

// ---- Exchange requests + status ----
app.post("/api/requests", auth, (req, res) => {
  const r = db.resources.find((x) => x.id === req.body.resourceId);
  if (!r) return res.status(404).json({ error: "Resource not found" });
  if (r.ownerId === req.user.id) return res.status(400).json({ error: "Can't request your own resource" });
  if (r.status !== "available") return res.status(400).json({ error: "Resource not available" });
  if (db.requests.some((x) => x.resourceId === r.id && x.requesterId === req.user.id && x.status === "pending"))
    return res.status(409).json({ error: "Already requested" });
  const reqObj = { id: id(), resourceId: r.id, requesterId: req.user.id, ownerId: r.ownerId, message: req.body.message || "", status: "pending" };
  db.requests.push(reqObj); save();
  res.json(reqObj);
});

app.get("/api/requests", auth, (req, res) => {
  const full = (x) => ({
    ...x,
    resource: db.resources.find((r) => r.id === x.resourceId)?.title,
    requester: db.users.find((u) => u.id === x.requesterId)?.name,
    owner: db.users.find((u) => u.id === x.ownerId)?.name,
  });
  res.json({
    incoming: db.requests.filter((x) => x.ownerId === req.user.id).map(full),
    outgoing: db.requests.filter((x) => x.requesterId === req.user.id).map(full),
  });
});

// owner: accepted | rejected    requester: cancelled
app.patch("/api/requests/:id", auth, (req, res) => {
  const r = db.requests.find((x) => x.id === req.params.id);
  const { status } = req.body;
  if (!r) return res.status(404).json({ error: "Not found" });
  if (r.status !== "pending") return res.status(400).json({ error: "Already " + r.status });
  const ownerOk = r.ownerId === req.user.id && ["accepted", "rejected"].includes(status);
  const requesterOk = r.requesterId === req.user.id && status === "cancelled";
  if (!ownerOk && !requesterOk) return res.status(403).json({ error: "Not allowed" });
  r.status = status;
  if (status === "accepted") {
    const res1 = db.resources.find((x) => x.id === r.resourceId);
    if (res1) res1.status = "exchanged";
    db.requests.forEach((x) => x.resourceId === r.resourceId && x.id !== r.id && x.status === "pending" && (x.status = "rejected"));
  }
  save(); res.json(r);
});

// ---- User profile ----
app.get("/api/profile", auth, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  res.json({ user: safe(user), resources: db.resources.filter((r) => r.ownerId === user.id).map(withOwner) });
});

app.put("/api/profile", auth, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (req.body.name) user.name = req.body.name;
  if (req.body.bio !== undefined) user.bio = req.body.bio;
  save(); res.json(safe(user));
});

app.listen(5000, () => console.log("API on http://localhost:5000"));
