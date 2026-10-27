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
const id = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();
const safe = ({ password, ...user }) => user;
const userById = (userId) => db.users.find((u) => u.id === userId);
const withOwner = (resource) => ({
  ...resource,
  owner: userById(resource.ownerId)?.name || "Campus member",
  ownerDepartment: userById(resource.ownerId)?.department || "—",
});
const normalResource = (r) => ({
  ...r,
  status: r.status === "exchanged" ? "on-loan" : r.status || "available",
  category: r.category || "Books",
  courseCode: r.courseCode || "GENERAL",
  semester: r.semester || "Sem 1",
  condition: r.condition || "Good",
  exchangeType: r.exchangeType || "Temporary Borrow",
  maxDuration: r.maxDuration || "14 Days",
  location: r.location || "Central Library",
});
db.users.forEach((u) =>
  Object.assign(u, {
    rollNumber: u.rollNumber || "—",
    department: u.department || "BCA",
    semester: u.semester || "Sem 1",
    pickupPreference: u.pickupPreference || "Central Library",
    photoUrl: u.photoUrl || "",
    bio: u.bio || "",
  }),
);
// Stable credentials for the in-product evaluator switcher.
db.users
  .filter((u) => ["seed_user_001", "seed_user_002"].includes(u.id))
  .forEach((u) => {
    u.password = bcrypt.hashSync("demo123", 8);
  });
db.resources = db.resources.map(normalResource);
const coverByTitle = {
  "Operating System Concepts — Galvin (10th Ed)": "9781119800361",
  "Principles of Economics — Mankiw (8th Ed)": "9780357722718",
  "University Physics — Young & Freedman (14th Ed)": "9780135159552",
  "Database System Concepts — Korth (7th Ed)": "9781260571292",
  "Organic Chemistry — Morrison & Boyd": "9781111427192",
  "The Lean Startup — Eric Ries": "9780307887894",
  "Artificial Intelligence: A Modern Approach — Russell & Norvig":
    "9780134610993",
  "Signals and Systems — Oppenheim & Willsky": "9780138147570",
  "Atomic Habits — James Clear": "9780735211292",
  "Design Patterns — Gang of Four": "9780201633610",
};
const verifiedCoverUrls = {
  "Operating System Concepts — Galvin (10th Ed)":
    "https://covers.openlibrary.org/b/olid/OL37795633M-L.jpg?default=false",
  "Database System Concepts — Korth (7th Ed)":
    "https://covers.openlibrary.org/b/olid/OL29316583M-L.jpg?default=false",
};
db.resources.forEach((resource) => {
  if (verifiedCoverUrls[resource.title]) {
    resource.imageUrl = verifiedCoverUrls[resource.title];
    return;
  }
  if (!resource.imageUrl && coverByTitle[resource.title]) {
    resource.imageUrl = `https://covers.openlibrary.org/b/isbn/${coverByTitle[resource.title]}-L.jpg`;
  }
  if (
    resource.imageUrl?.includes("covers.openlibrary.org") &&
    !resource.imageUrl.includes("default=false")
  ) {
    resource.imageUrl += resource.imageUrl.includes("?")
      ? "&default=false"
      : "?default=false";
  }
});
const catalogBooks = [
  [
    "book_019",
    "The C Programming Language",
    "Brian Kernighan & Dennis Ritchie",
    "9780131103627",
    "BCA-201",
    2,
  ],
  [
    "book_020",
    "Effective Java — 3rd Edition",
    "Joshua Bloch",
    "9780134685991",
    "BCA-502",
    5,
  ],
  [
    "book_021",
    "Java: The Complete Reference",
    "Herbert Schildt",
    "9781260440232",
    "BCA-302",
    3,
  ],
  [
    "book_022",
    "Python Crash Course — 3rd Edition",
    "Eric Matthes",
    "9781718502703",
    "BCA-202",
    2,
  ],
  [
    "book_023",
    "Eloquent JavaScript — 3rd Edition",
    "Marijn Haverbeke",
    "9781593279509",
    "BCA-303",
    3,
  ],
  [
    "book_024",
    "You Don't Know JS Yet",
    "Kyle Simpson",
    "9781098124045",
    "BCA-403",
    4,
  ],
  [
    "book_025",
    "Grokking Algorithms",
    "Aditya Bhargava",
    "9781617292231",
    "BCA-401",
    4,
  ],
  [
    "book_026",
    "The Algorithm Design Manual",
    "Steven S. Skiena",
    "9783030542551",
    "BCA-501",
    5,
  ],
  [
    "book_027",
    "Discrete Mathematics and Its Applications",
    "Kenneth H. Rosen",
    "9781260091991",
    "BCA-203",
    2,
  ],
  [
    "book_028",
    "Linear Algebra and Its Applications",
    "David C. Lay",
    "9780135851258",
    "BCA-204",
    2,
  ],
  [
    "book_029",
    "Computer Organization and Design",
    "David A. Patterson & John L. Hennessy",
    "9780128201091",
    "BCA-404",
    4,
  ],
  [
    "book_030",
    "Modern Operating Systems",
    "Andrew S. Tanenbaum",
    "9780133591620",
    "BCA-503",
    5,
  ],
  [
    "book_031",
    "Database Systems: The Complete Book",
    "Hector Garcia-Molina",
    "9780131873254",
    "BCA-504",
    5,
  ],
  [
    "book_032",
    "Web Development with Node and Express",
    "Ethan Brown",
    "9781492053514",
    "BCA-603",
    6,
  ],
  [
    "book_033",
    "Learning React",
    "Alex Banks & Eve Porcello",
    "9781098118134",
    "BCA-602",
    6,
  ],
  [
    "book_034",
    "The Linux Command Line",
    "William Shotts",
    "9781593279523",
    "BCA-402",
    4,
  ],
  [
    "book_035",
    "Cybersecurity Essentials",
    "Charles J. Brooks",
    "9781119369028",
    "BCA-604",
    6,
  ],
  [
    "book_036",
    "Computer Graphics with OpenGL",
    "Donald Hearn",
    "9780136053583",
    "BCA-505",
    5,
  ],
  [
    "book_037",
    "Deep Learning",
    "Ian Goodfellow, Yoshua Bengio & Aaron Courville",
    "9780262035613",
    "BCA-605",
    6,
  ],
  [
    "book_038",
    "Hands-On Machine Learning",
    "Aurélien Géron",
    "9781098125974",
    "BCA-606",
    6,
  ],
  [
    "book_039",
    "Introduction to the Theory of Computation",
    "Michael Sipser",
    "9781133187790",
    "BCA-506",
    5,
  ],
  [
    "book_040",
    "Software Engineering",
    "Ian Sommerville",
    "9780137035151",
    "BCA-601",
    6,
  ],
  [
    "book_041",
    "Refactoring — 2nd Edition",
    "Martin Fowler",
    "9780134757599",
    "BCA-603",
    6,
  ],
  [
    "book_042",
    "Code Complete — 2nd Edition",
    "Steve McConnell",
    "9780735619678",
    "BCA-502",
    5,
  ],
];
catalogBooks.forEach(
  ([id, title, author, isbn, courseCode, semester], index) => {
    if (db.resources.some((resource) => resource.id === id)) return;
    db.resources.push({
      id,
      title,
      author,
      courseCode,
      semester: `Sem ${semester}`,
      category: "Books",
      description: `A verified campus-library copy of ${title}. Suitable for coursework, revision and reference reading.`,
      condition:
        index % 3 === 0 ? "Like New" : index % 3 === 1 ? "Good" : "Fair",
      exchangeType: index % 4 === 0 ? "Item-for-Item Swap" : "Temporary Borrow",
      maxDuration: index % 2 === 0 ? "14 Days" : "2 Weeks",
      location: [
        "Central Library",
        "CS Block Lab 2",
        "Innovation Hub",
        "Student Activity Centre",
      ][index % 4],
      imageUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      status: "available",
      ownerId: [
        "seed_user_001",
        "seed_user_002",
        "seed_user_003",
        "seed_user_004",
      ][index % 4],
    });
  },
);
db.requests.forEach((r) =>
  Object.assign(r, {
    duration: r.duration || "1 week",
    handover: r.handover || "Central Library",
    note: r.note ?? r.message ?? "",
    createdAt: r.createdAt || now(),
  }),
);
save();

const app = express();
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
const auth = (req, res, next) => {
  try {
    req.user = jwt.verify(
      (req.headers.authorization || "").replace("Bearer ", ""),
      SECRET,
    );
    next();
  } catch {
    res.status(401).json({ error: "Sign in to continue" });
  }
};
const sign = (u) => ({
  token: jwt.sign({ id: u.id }, SECRET, { expiresIn: "7d" }),
  user: safe(u),
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res
      .status(400)
      .json({ error: "Name, email and password are required" });
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ error: "Email already used" });
  const user = {
    id: id(),
    name,
    email,
    password: await bcrypt.hash(password, 8),
    bio: "",
    department: "BCA",
    semester: "Sem 1",
    rollNumber: "",
    pickupPreference: "Central Library",
    photoUrl: "",
  };
  db.users.push(user);
  save();
  res.json(sign(user));
});
app.post("/api/login", async (req, res) => {
  const user = db.users.find(
    (u) => u.email.toLowerCase() === (req.body.email || "").toLowerCase(),
  );
  if (!user || !(await bcrypt.compare(req.body.password || "", user.password)))
    return res.status(401).json({ error: "Incorrect email or password" });
  res.json(sign(user));
});

app.get("/api/resources", (req, res) => {
  const {
    q = "",
    category = "",
    semester = "",
    condition = "",
    exchangeType = "",
    availableOnly = "",
    sort = "newest",
  } = req.query;
  const term = q.toLowerCase();
  let out = db.resources
    .map(normalResource)
    .filter((r) =>
      [r.title, r.description, r.author, r.courseCode, r.location].some((x) =>
        String(x || "")
          .toLowerCase()
          .includes(term),
      ),
    )
    .filter((r) => !category || r.category === category)
    .filter((r) => !semester || r.semester === semester)
    .filter((r) => !condition || r.condition === condition)
    .filter((r) => !exchangeType || r.exchangeType === exchangeType)
    .filter((r) => availableOnly !== "true" || r.status === "available");
  if (sort === "available")
    out.sort(
      (a, b) =>
        Number(b.status === "available") - Number(a.status === "available"),
    );
  if (sort === "course")
    out.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  res.json(out.map(withOwner));
});
app.post("/api/resources", auth, (req, res) => {
  const {
    title,
    category,
    courseCode,
    semester,
    condition,
    exchangeType,
    maxDuration,
    location,
    description,
    imageUrl,
  } = req.body;
  if (
    !title ||
    !category ||
    !courseCode ||
    !semester ||
    !condition ||
    !exchangeType ||
    !location
  )
    return res
      .status(400)
      .json({ error: "Complete all required listing fields" });
  const resource = normalResource({
    id: id(),
    title,
    category,
    courseCode,
    semester,
    condition,
    exchangeType,
    maxDuration: maxDuration || "14 Days",
    location,
    description: description || "",
    imageUrl: imageUrl || "",
    status: "available",
    ownerId: req.user.id,
    createdAt: now(),
  });
  db.resources.unshift(resource);
  save();
  res.status(201).json(withOwner(resource));
});
const ownResource = (req, res, next) => {
  const resource = db.resources.find((r) => r.id === req.params.id);
  if (!resource) return res.status(404).json({ error: "Resource not found" });
  if (resource.ownerId !== req.user.id)
    return res
      .status(403)
      .json({ error: "Only the owner can change this listing" });
  req.resource = resource;
  next();
};
app.put("/api/resources/:id", auth, ownResource, (req, res) => {
  Object.assign(req.resource, {
    ...req.body,
    id: req.resource.id,
    ownerId: req.resource.ownerId,
  });
  save();
  res.json(withOwner(req.resource));
});
app.delete("/api/resources/:id", auth, ownResource, (req, res) => {
  if (
    db.requests.some(
      (r) =>
        r.resourceId === req.params.id &&
        ["pending", "approved", "on-loan"].includes(r.status),
    )
  )
    return res
      .status(409)
      .json({ error: "Resolve active requests before deleting this listing" });
  db.resources = db.resources.filter((r) => r.id !== req.params.id);
  save();
  res.json({ ok: true });
});

const fullRequest = (r) => ({
  ...r,
  resource: withOwner(
    db.resources.find((x) => x.id === r.resourceId) || {
      title: "Deleted listing",
    },
  ),
  requester: safe(userById(r.requesterId) || {}),
  owner: safe(userById(r.ownerId) || {}),
  offeredResource: r.offeredResourceId
    ? withOwner(
        db.resources.find((x) => x.id === r.offeredResourceId) || {
          title: "Unavailable",
        },
      )
    : null,
});
app.post("/api/requests", auth, (req, res) => {
  const resource = db.resources.find((r) => r.id === req.body.resourceId);
  if (!resource) return res.status(404).json({ error: "Resource not found" });
  if (resource.ownerId === req.user.id)
    return res
      .status(400)
      .json({ error: "You cannot request your own resource" });
  if (resource.status !== "available")
    return res
      .status(400)
      .json({ error: "This resource is not currently available" });
  if (
    db.requests.some(
      (r) =>
        r.resourceId === resource.id &&
        r.requesterId === req.user.id &&
        r.status === "pending",
    )
  )
    return res
      .status(409)
      .json({ error: "You already have a pending request for this resource" });
  const request = {
    id: id(),
    resourceId: resource.id,
    requesterId: req.user.id,
    ownerId: resource.ownerId,
    offeredResourceId: req.body.offeredResourceId || null,
    customOffer: req.body.customOffer || "",
    duration: req.body.duration || "1 week",
    handover: req.body.handover || "Central Library",
    note: req.body.note || "",
    status: "pending",
    createdAt: now(),
    updatedAt: now(),
  };
  db.requests.unshift(request);
  save();
  res.status(201).json(fullRequest(request));
});
app.get("/api/requests", auth, (req, res) =>
  res.json({
    incoming: db.requests
      .filter((r) => r.ownerId === req.user.id)
      .map(fullRequest),
    outgoing: db.requests
      .filter((r) => r.requesterId === req.user.id)
      .map(fullRequest),
  }),
);
app.patch("/api/requests/:id", auth, (req, res) => {
  const request = db.requests.find((r) => r.id === req.params.id);
  const status = req.body.status;
  if (!request) return res.status(404).json({ error: "Request not found" });
  const ownerTransitions = {
    pending: ["approved", "declined"],
    approved: ["on-loan"],
    "on-loan": ["returned"],
  };
  const ownerOk =
    request.ownerId === req.user.id &&
    ownerTransitions[request.status]?.includes(status);
  const requesterOk =
    request.requesterId === req.user.id &&
    request.status === "pending" &&
    status === "cancelled";
  if (!ownerOk && !requesterOk)
    return res.status(403).json({ error: "This status change is not allowed" });
  request.status = status;
  request.updatedAt = now();
  const resource = db.resources.find((r) => r.id === request.resourceId);
  if (resource && ["approved", "on-loan"].includes(status)) {
    resource.status = status === "approved" ? "reserved" : "on-loan";
    db.requests.forEach((r) => {
      if (
        r.id !== request.id &&
        r.resourceId === resource.id &&
        r.status === "pending"
      )
        r.status = "declined";
    });
  }
  if (resource && status === "returned") resource.status = "available";
  save();
  res.json(fullRequest(request));
});

app.get("/api/profile", auth, (req, res) => {
  const user = userById(req.user.id);
  const resources = db.resources
    .filter((r) => r.ownerId === user.id)
    .map(withOwner);
  const requests = db.requests.filter(
    (r) => r.ownerId === user.id || r.requesterId === user.id,
  );
  res.json({
    user: safe(user),
    resources,
    requests: requests.map(fullRequest),
  });
});
app.put("/api/profile", auth, (req, res) => {
  const user = userById(req.user.id);
  [
    "name",
    "bio",
    "rollNumber",
    "department",
    "semester",
    "pickupPreference",
    "photoUrl",
  ].forEach((key) => {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  });
  save();
  res.json(safe(user));
});
app.listen(5000, () => console.log("CampusSwap API on http://localhost:5000"));
