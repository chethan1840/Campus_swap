import { useState, useEffect } from "react";
import { api } from "./api.js";

const CATS = ["Books", "Lab accessories", "Study materials", "Other"];
const GENRES = ["All", "Computer Science", "Mathematics", "Physics", "Chemistry", "Economics", "Business", "Electronics", "Self Help"];

// Maps genre names to CSS class suffixes and emoji icons
const GENRE_META = {
  "Computer Science": { cls: "CS",     icon: "💻" },
  "Mathematics":      { cls: "Math",   icon: "📐" },
  "Physics":          { cls: "Physics",icon: "⚛️" },
  "Chemistry":        { cls: "Chem",   icon: "🧪" },
  "Economics":        { cls: "Econ",   icon: "📊" },
  "Business":         { cls: "Biz",    icon: "💼" },
  "Electronics":      { cls: "Elec",   icon: "🔌" },
  "Self Help":        { cls: "Self",   icon: "🌱" },
};

// Deterministic spine colour based on book id
const SPINE_COLORS = [
  ["#1e3a8a","#3b82f6"],["#4c1d95","#a78bfa"],["#064e3b","#34d399"],
  ["#7c2d12","#fb923c"],["#0c4a6e","#38bdf8"],["#831843","#f472b6"],
  ["#1c1917","#a78bfa"],["#14532d","#4ade80"],["#713f12","#fbbf24"],
  ["#1e1b4b","#818cf8"],["#052e16","#86efac"],["#450a0a","#fca5a5"],
];
const spineColor = (id) => {
  const idx = id ? id.charCodeAt(id.length - 1) % SPINE_COLORS.length : 0;
  return SPINE_COLORS[idx];
};

const Stars = ({ n }) => "★".repeat(n) + "☆".repeat(5 - n);
const Tag = ({ s }) => <span className={`tag ${s}`}>{s}</span>;

const GenreBadge = ({ genre }) => {
  if (!genre) return null;
  const m = GENRE_META[genre] || { cls: "Other", icon: "📖" };
  return <span className={`genre-badge genre-${m.cls}`}>{m.icon} {genre}</span>;
};

const ConditionBadge = ({ c }) => {
  if (!c) return null;
  const colors = { "Like New": "#dcfce7", "Good": "#dbeafe", "Fair": "#fef9c3" };
  return <span className="condition-badge" style={{ background: colors[c] || "#f1f5f9" }}>{c}</span>;
};

// Book card with coloured spine and rich metadata
function BookCard({ r, user, onRequest }) {
  const [spineFrom, spineTo] = spineColor(r.id);
  const m = GENRE_META[r.genre] || { icon: "📖" };
  return (
    <div className="card">
      <div className="book-card">
        <div
          className="book-spine"
          style={{ background: `linear-gradient(160deg, ${spineFrom} 0%, ${spineTo} 100%)` }}
          title={r.title}
        >
          {m.icon}
        </div>
        <div className="book-body">
          <h4>
            {r.title}
            <Tag s={r.status} />
          </h4>
          {r.author && <div className="book-author">by {r.author}</div>}
          <div className="book-meta">
            <GenreBadge genre={r.genre} />
            <ConditionBadge c={r.condition} />
            {r.rating && (
              <span className="stars" title={`${r.rating}/5`}>
                <Stars n={r.rating} />
              </span>
            )}
          </div>
          <p className="muted" style={{ marginBottom: 8 }}>{r.description}</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: 13 }}>Offered by <b>{r.owner}</b></span>
            {user && r.ownerId !== user.id && r.status === "available" && (
              <button style={{ padding: "5px 12px", fontSize: 13 }} onClick={() => onRequest(r)}>
                Request exchange
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generic resource card (non-book)
function ResourceCard({ r, user, onRequest }) {
  return (
    <div className="card">
      <h4>{r.title} <Tag s={r.status} /></h4>
      <div className="muted">{r.category} · by {r.owner}</div>
      <p style={{ marginTop: 6, marginBottom: 8 }}>{r.description}</p>
      {user && r.ownerId !== user.id && r.status === "available" && (
        <button onClick={() => onRequest(r)}>Request exchange</button>
      )}
    </div>
  );
}

// ---------- Auth ----------
function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { token, user } = await api("/" + mode, "POST", f);
      localStorage.setItem("token", token);
      onAuth(user);
    } catch (e) { setErr(e.message); }
  };

  return (
    <form className="col" onSubmit={submit}>
      <h2>CampusSwap</h2>
      <p className="subtitle">Trade campus resources with fellow students</p>
      {mode === "register" && <input placeholder="Name" value={f.name} onChange={set("name")} required />}
      <input placeholder="Email" type="email" value={f.email} onChange={set("email")} required />
      <input placeholder="Password" type="password" value={f.password} onChange={set("password")} required />
      <button>{mode === "login" ? "Log in" : "Create account"}</button>
      <button type="button" className="grey" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
        {mode === "login" ? "New here? Register" : "Have an account? Log in"}
      </button>
      {err && <div className="err">{err}</div>}
    </form>
  );
}

// ---------- Browse ----------
function Browse({ user }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [genre, setGenre] = useState("All");
  const [msg, setMsg] = useState("");

  const load = () =>
    api(`/resources?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`).then(setItems);
  useEffect(() => { load(); }, [q, category]);

  const request = async (r) => {
    const message = prompt(`Message to ${r.owner} (optional)`) ?? null;
    if (message === null) return;
    try {
      await api("/requests", "POST", { resourceId: r.id, message });
      setMsg("Request sent successfully!");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) { setMsg(e.message); }
  };

  // client-side genre filter (genre is not a server query param)
  const visible = items.filter((r) =>
    genre === "All" || r.genre === genre
  );

  const books = visible.filter((r) => r.category === "Books");
  const others = visible.filter((r) => r.category !== "Books");
  const booksAvail = books.filter((r) => r.status === "available").length;

  return (
    <>
      {/* Hero */}
      <div className="books-hero">
        <h2>📚 Campus Book Exchange</h2>
        <p>Swap textbooks, save money. {booksAvail} books available right now.</p>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <input
          placeholder="Search by title, author, description…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setGenre("All"); }}>
          <option value="">All categories</option>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Genre chips — only shown when Books is selected or no filter */}
      {(category === "" || category === "Books") && (
        <div className="genre-chips">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              className={`chip${genre === g ? " active" : ""}`}
              onClick={() => setGenre(g)}
            >
              {GENRE_META[g]?.icon} {g}
            </button>
          ))}
        </div>
      )}

      {msg && <div className="notice">{msg}</div>}

      {/* Books section */}
      {books.length > 0 && (
        <>
          <div className="section-head">
            <h3>Books</h3>
            <span className="count">{books.length} listing{books.length !== 1 ? "s" : ""}</span>
          </div>
          {books.map((r) => (
            <BookCard key={r.id} r={r} user={user} onRequest={request} />
          ))}
        </>
      )}

      {/* Other resources section */}
      {others.length > 0 && (
        <>
          <div className="section-head">
            <h3>Other Resources</h3>
            <span className="count">{others.length}</span>
          </div>
          {others.map((r) => (
            <ResourceCard key={r.id} r={r} user={user} onRequest={request} />
          ))}
        </>
      )}

      {visible.length === 0 && (
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <p>No resources match your search.</p>
          <p className="muted" style={{ marginTop: 4 }}>Try a different keyword or category.</p>
        </div>
      )}
    </>
  );
}

// ---------- My posts ----------
function MyPosts({ user }) {
  const empty = { title: "", description: "", category: CATS[0] };
  const [mine, setMine] = useState([]);
  const [f, setF] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [err, setErr] = useState("");

  const load = () => api("/profile").then((d) => setMine(d.resources));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await (editId ? api(`/resources/${editId}`, "PUT", f) : api("/resources", "POST", f));
      setF(empty); setEditId(null); setErr(""); load();
    } catch (e) { setErr(e.message); }
  };
  const remove = async (id) => { if (confirm("Delete this listing?")) { await api(`/resources/${id}`, "DELETE"); load(); } };
  const edit = (r) => { setEditId(r.id); setF({ title: r.title, description: r.description, category: r.category }); };

  return (
    <>
      <div className="section-head" style={{ marginBottom: 16 }}>
        <h3>{editId ? "Edit listing" : "Post a resource"}</h3>
      </div>
      <form onSubmit={submit} style={{ flexDirection: "column", background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 1px 6px rgba(27,36,56,0.07)", marginBottom: 24 }}>
        <input placeholder="Title (e.g. CLRS Algorithms 4th Ed)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required style={{ marginBottom: 8 }} />
        <input placeholder="Description — condition, edition, highlights…" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} style={{ marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} style={{ flex: 1 }}>
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button type="submit">{editId ? "Save changes" : "Post resource"}</button>
          {editId && <button type="button" className="grey" onClick={() => { setEditId(null); setF(empty); }}>Cancel</button>}
        </div>
      </form>
      {err && <div className="err">{err}</div>}

      <div className="section-head">
        <h3>My listings</h3>
        <span className="count">{mine.length}</span>
      </div>
      {mine.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📦</div>
          <p>You haven't posted anything yet.</p>
        </div>
      )}
      {mine.map((r) => (
        <div className="card" key={r.id}>
          <h4>{r.title} <Tag s={r.status} /></h4>
          <div className="muted">{r.category}</div>
          <p style={{ marginTop: 6, marginBottom: 10 }}>{r.description}</p>
          <div className="row">
            <button className="grey" onClick={() => edit(r)}>Edit</button>
            <button className="red" onClick={() => remove(r.id)}>Delete</button>
          </div>
        </div>
      ))}
    </>
  );
}

// ---------- Requests ----------
function Requests() {
  const [data, setData] = useState({ incoming: [], outgoing: [] });
  const load = () => api("/requests").then(setData);
  useEffect(() => { load(); }, []);
  const act = async (id, status) => { await api(`/requests/${id}`, "PATCH", { status }); load(); };

  return (
    <>
      <div className="section-head">
        <h3>Received</h3>
        <span className="count">{data.incoming.length}</span>
      </div>
      {data.incoming.length === 0 && <div className="empty"><div className="empty-icon">📭</div><p>No requests received.</p></div>}
      {data.incoming.map((r) => (
        <div className="card" key={r.id}>
          <h4><b>{r.requester}</b> wants <b>{r.resource}</b> <Tag s={r.status} /></h4>
          {r.message && <p className="muted" style={{ marginTop: 4 }}>"{r.message}"</p>}
          {r.status === "pending" && (
            <div className="row" style={{ marginTop: 10 }}>
              <button className="green" onClick={() => act(r.id, "accepted")}>Accept</button>
              <button className="red" onClick={() => act(r.id, "rejected")}>Reject</button>
            </div>
          )}
        </div>
      ))}

      <div className="section-head" style={{ marginTop: 8 }}>
        <h3>Sent</h3>
        <span className="count">{data.outgoing.length}</span>
      </div>
      {data.outgoing.length === 0 && <div className="empty"><div className="empty-icon">📬</div><p>You haven't requested anything.</p></div>}
      {data.outgoing.map((r) => (
        <div className="card" key={r.id}>
          <h4><b>{r.resource}</b> from {r.owner} <Tag s={r.status} /></h4>
          {r.status === "pending" && (
            <div className="row" style={{ marginTop: 10 }}>
              <button className="grey" onClick={() => act(r.id, "cancelled")}>Cancel</button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

// ---------- Profile ----------
function Profile({ user, setUser }) {
  const [f, setF] = useState({ name: user.name, bio: user.bio || "" });
  const [saved, setSaved] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setUser(await api("/profile", "PUT", f));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  return (
    <form className="col" onSubmit={save} style={{ margin: "24px auto" }}>
      <h2 style={{ marginBottom: 4 }}>Profile</h2>
      <p className="subtitle">{user.email}</p>
      <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Name" />
      <textarea rows="3" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="Short bio (course, year…)" />
      <button>Save profile</button>
      {saved && <div className="notice">Profile saved!</div>}
    </form>
  );
}

// ---------- App ----------
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("browse");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) return setReady(true);
    api("/profile").then((d) => setUser(d.user)).catch(() => localStorage.removeItem("token")).finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  if (!user) return <Auth onAuth={setUser} />;

  const logout = () => { localStorage.removeItem("token"); setUser(null); };
  const tabs = { browse: "Browse", posts: "My Posts", requests: "Requests", profile: "Profile" };

  return (
    <>
      <nav>
        <div className="wrap">
          <span className="brand">Campus<span>Swap</span></span>
          {Object.entries(tabs).map(([k, v]) => (
            <button key={k} className={`ghost${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{v}</button>
          ))}
          <button className="ghost" onClick={logout} style={{ opacity: 0.7 }}>Log out ({user.name})</button>
        </div>
      </nav>
      <div className="wrap">
        {tab === "browse"   && <Browse user={user} />}
        {tab === "posts"    && <MyPosts user={user} />}
        {tab === "requests" && <Requests />}
        {tab === "profile"  && <Profile user={user} setUser={setUser} />}
      </div>
    </>
  );
}
