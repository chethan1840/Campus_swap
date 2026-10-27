import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const categories = ["All", "Books", "Lab Accessories", "Study Materials"];
const blankListing = {
  title: "",
  category: "Books",
  courseCode: "",
  semester: "Sem 1",
  condition: "Good",
  exchangeType: "Temporary Borrow",
  maxDuration: "14 Days",
  location: "",
  description: "",
  imageUrl: "",
};
const Icon = ({ name }) => (
  <span className="icon" aria-hidden="true">
    {name === "search"
      ? "⌕"
      : name === "plus"
        ? "+"
        : name === "close"
          ? "×"
          : "·"}
  </span>
);
const human = (s = "") =>
  s.replaceAll("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());

function Toast({ toast }) {
  return (
    toast && <div className={`toast ${toast.type || ""}`}>{toast.text}</div>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <section
        className={`modal ${wide ? "wide" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function Status({ value }) {
  return <span className={`status ${value}`}>{human(value)}</span>;
}
function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Auth({ onAuth, showToast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = await api(
        `/${mode === "login" ? "login" : "register"}`,
        "POST",
        form,
      );
      localStorage.setItem("token", data.token);
      onAuth(data.user);
    } catch (err) {
      showToast(err.message, "error");
    }
  };
  const demo = async (email) => {
    try {
      const data = await api("/login", "POST", { email, password: "demo123" });
      localStorage.setItem("token", data.token);
      onAuth(data.user);
    } catch {
      showToast("Demo credentials are unavailable in this data set", "error");
    }
  };
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand large">
          Campus<span>Swap</span>
        </div>
        <p>Campus resources, managed with care.</p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <Field label="Full name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
          )}
          <Field label="College email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Password">
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <button>{mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <button
          className="text-button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already registered? Sign in"}
        </button>
        <div className="demo">
          <span>Quick demo access</span>
          <div>
            <button
              className="secondary"
              onClick={() => demo("priya.sharma@campus.edu")}
            >
              Priya · owner
            </button>
            <button
              className="secondary"
              onClick={() => demo("arjun.mehta@campus.edu")}
            >
              Arjun · requester
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResourceCover({ resource, detail = false }) {
  const [failed, setFailed] = useState(false);
  const fallback =
    resource.category === "Books"
      ? "BOOK"
      : resource.category === "Lab Accessories"
        ? "LAB"
        : "NOTES";
  return (
    <div
      className={`resource-art ${detail ? "detail-cover" : ""} ${resource.category.replaceAll(" ", "-").toLowerCase()}`}
    >
      {resource.imageUrl && !failed && (
        <img
          src={resource.imageUrl}
          alt={`Cover of ${resource.title}`}
          onError={() => setFailed(true)}
        />
      )}
      {(failed || !resource.imageUrl) && (
        <div
          className="cover-fallback"
          aria-label={`Cover placeholder for ${resource.title}`}
        >
          <span>{fallback}</span>
          <strong>{resource.title}</strong>
          <small>{resource.author || resource.courseCode}</small>
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource, user, onSelect, onRequest }) {
  return (
    <article className="resource-card" onClick={() => onSelect(resource)}>
      <ResourceCover resource={resource} />
      <div className="resource-info">
        <div className="card-top">
          <div>
            <span className="category">{resource.category}</span>
            <code>{resource.courseCode}</code>
          </div>
          <Status value={resource.status} />
        </div>
        <h3>{resource.title}</h3>
        <div className="metadata">
          <span>{resource.condition}</span>
          <span>{resource.exchangeType}</span>
          <span>Up to {resource.maxDuration}</span>
        </div>
        <p>{resource.description || "No description provided."}</p>
        <div className="card-footer">
          <span>
            <b>{resource.owner}</b> · {resource.ownerDepartment}
          </span>
          <span>{resource.location}</span>
        </div>
      </div>
      {user &&
        resource.ownerId !== user.id &&
        resource.status === "available" && (
          <button
            className="request-button"
            onClick={(e) => {
              e.stopPropagation();
              onRequest(resource);
            }}
          >
            Request
          </button>
        )}
    </article>
  );
}

function ListingForm({ initial = blankListing, onSave, onCancel }) {
  const [f, setF] = useState(initial);
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });
  return (
    <form
      className="form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
    >
      <Field label="Title">
        <input
          required
          value={f.title}
          onChange={set("title")}
          placeholder="e.g. Database Systems"
        />
      </Field>
      <Field label="Category">
        <select value={f.category} onChange={set("category")}>
          <option>Books</option>
          <option>Lab Accessories</option>
          <option>Study Materials</option>
        </select>
      </Field>
      <Field label="Course code">
        <input
          required
          value={f.courseCode}
          onChange={set("courseCode")}
          placeholder="BCA-402"
        />
      </Field>
      <Field label="Semester">
        <select value={f.semester} onChange={set("semester")}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n}>Sem {n}</option>
          ))}
        </select>
      </Field>
      <Field label="Condition">
        <select value={f.condition} onChange={set("condition")}>
          <option>Like New</option>
          <option>Good</option>
          <option>Fair</option>
        </select>
      </Field>
      <Field label="Exchange type">
        <select value={f.exchangeType} onChange={set("exchangeType")}>
          <option>Temporary Borrow</option>
          <option>Item-for-Item Swap</option>
        </select>
      </Field>
      <Field label="Max loan duration">
        <input
          value={f.maxDuration}
          onChange={set("maxDuration")}
          placeholder="14 Days"
        />
      </Field>
      <Field label="Campus pickup spot">
        <input
          required
          value={f.location}
          onChange={set("location")}
          placeholder="CS Block Lab 2"
        />
      </Field>
      <Field label="Image URL (optional)">
        <input
          value={f.imageUrl}
          onChange={set("imageUrl")}
          placeholder="https://…"
        />
      </Field>
      <Field label="Description">
        <textarea
          value={f.description}
          onChange={set("description")}
          rows="3"
        />
      </Field>
      <div className="form-actions">
        <button className="secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button>{initial.id ? "Save changes" : "Post resource"}</button>
      </div>
    </form>
  );
}

function RequestModal({ resource, mine, onClose, onSave }) {
  const [f, setF] = useState({
    duration: "1 week",
    handover: "Central Library",
    note: "",
    offeredResourceId: "",
    customOffer: "",
  });
  return (
    <Modal title={`Request ${resource.title}`} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(f);
        }}
      >
        <p className="form-note">
          Coordinate a clear, respectful handover with {resource.owner}.
        </p>
        <Field label="Requested duration">
          <select
            value={f.duration}
            onChange={(e) => setF({ ...f, duration: e.target.value })}
          >
            {["3 days", "1 week", "2 weeks", "End of Semester"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        {resource.exchangeType === "Item-for-Item Swap" && (
          <>
            <Field label="Offer one of your listings">
              <select
                value={f.offeredResourceId}
                onChange={(e) =>
                  setF({ ...f, offeredResourceId: e.target.value })
                }
              >
                <option value="">Choose a listing</option>
                {mine
                  .filter((r) => r.status === "available")
                  .map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.title}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Or describe an offer">
              <input
                value={f.customOffer}
                onChange={(e) => setF({ ...f, customOffer: e.target.value })}
              />
            </Field>
          </>
        )}
        <Field label="Preferred handover time / place">
          <input
            required
            value={f.handover}
            onChange={(e) => setF({ ...f, handover: e.target.value })}
          />
        </Field>
        <Field label="A short note">
          <textarea
            value={f.note}
            onChange={(e) => setF({ ...f, note: e.target.value })}
            rows="3"
          />
        </Field>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button>Send request</button>
        </div>
      </form>
    </Modal>
  );
}

function Explore({ user, openLogin, showToast, triggerPost }) {
  const [resources, setResources] = useState([]),
    [profile, setProfile] = useState({ resources: [] }),
    [selected, setSelected] = useState(null),
    [requesting, setRequesting] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    category: "All",
    semester: "",
    condition: "",
    exchangeType: "",
    availableOnly: false,
    sort: "newest",
  });
  const load = () => {
    const q = new URLSearchParams({
      q: filters.q,
      category: filters.category === "All" ? "" : filters.category,
      semester: filters.semester,
      condition: filters.condition,
      exchangeType: filters.exchangeType,
      availableOnly: String(filters.availableOnly),
      sort: filters.sort,
    });
    api(`/resources?${q}`)
      .then(setResources)
      .catch((e) => showToast(e.message, "error"));
    if (user) api("/profile").then(setProfile);
  };
  useEffect(() => {
    const t = setTimeout(load, 180);
    return () => clearTimeout(t);
  }, [filters, user]);
  const count = (cat) =>
    cat === "All"
      ? resources.length
      : resources.filter((r) => r.category === cat).length;
  const send = async (data) => {
    try {
      await api("/requests", "POST", { ...data, resourceId: requesting.id });
      setRequesting(null);
      showToast("Exchange request sent");
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  return (
    <>
      <div className="workspace-head">
        <div>
          <p className="eyebrow">RESOURCE MARKETPLACE</p>
          <h1>Explore resources</h1>
          <p>Find what you need from students on campus.</p>
        </div>
        <button onClick={user ? triggerPost : openLogin}>
          <Icon name="plus" /> Post resource
        </button>
      </div>
      <section className="filter-panel">
        <div className="search">
          <Icon name="search" />
          <input
            placeholder="Search title, course code, author or pickup spot"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
        </div>
        <div className="segmented">
          {categories.map((c) => (
            <button
              key={c}
              className={filters.category === c ? "active" : ""}
              onClick={() => setFilters({ ...filters, category: c })}
            >
              {c} <span>{count(c)}</span>
            </button>
          ))}
        </div>
        <div className="filter-row">
          <select
            value={filters.semester}
            onChange={(e) =>
              setFilters({ ...filters, semester: e.target.value })
            }
          >
            <option value="">All semesters</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n}>Sem {n}</option>
            ))}
          </select>
          <select
            value={filters.condition}
            onChange={(e) =>
              setFilters({ ...filters, condition: e.target.value })
            }
          >
            <option value="">Any condition</option>
            <option>Like New</option>
            <option>Good</option>
            <option>Fair</option>
          </select>
          <select
            value={filters.exchangeType}
            onChange={(e) =>
              setFilters({ ...filters, exchangeType: e.target.value })
            }
          >
            <option value="">Any exchange type</option>
            <option>Temporary Borrow</option>
            <option>Item-for-Item Swap</option>
          </select>
          <label className="toggle">
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(e) =>
                setFilters({ ...filters, availableOnly: e.target.checked })
              }
            />{" "}
            Available only
          </label>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="newest">Newest first</option>
            <option value="available">Available first</option>
            <option value="course">Course code A–Z</option>
          </select>
        </div>
      </section>
      <div className="results-bar">
        <span>{resources.length} resources shown</span>
      </div>
      <section className="resource-list">
        {resources.map((r) => (
          <ResourceCard
            key={r.id}
            resource={r}
            user={user}
            onSelect={setSelected}
            onRequest={(resource) =>
              user ? setRequesting(resource) : openLogin()
            }
          />
        ))}
      </section>
      {!resources.length && (
        <section className="empty-state">
          <h2>No matching resources</h2>
          <p>Try adjusting your filters or search terms.</p>
          <button
            className="secondary"
            onClick={() =>
              setFilters({
                q: "",
                category: "All",
                semester: "",
                condition: "",
                exchangeType: "",
                availableOnly: false,
                sort: "newest",
              })
            }
          >
            Reset all filters
          </button>
        </section>
      )}
      {selected && (
        <Modal title="Resource details" onClose={() => setSelected(null)}>
          <div className="detail">
            <ResourceCover resource={selected} detail />
            <Status value={selected.status} />
            <h1>{selected.title}</h1>
            <p>{selected.description}</p>
            <dl>
              <dt>Course</dt>
              <dd>
                <code>{selected.courseCode}</code> · {selected.semester}
              </dd>
              <dt>Exchange</dt>
              <dd>
                {selected.exchangeType} · up to {selected.maxDuration}
              </dd>
              <dt>Pickup</dt>
              <dd>{selected.location}</dd>
              <dt>Owner</dt>
              <dd>
                {selected.owner}, {selected.ownerDepartment}
              </dd>
            </dl>
            {user &&
              selected.ownerId !== user.id &&
              selected.status === "available" && (
                <button
                  onClick={() => {
                    setSelected(null);
                    setRequesting(selected);
                  }}
                >
                  Request exchange
                </button>
              )}
          </div>
        </Modal>
      )}
      {requesting && (
        <RequestModal
          resource={requesting}
          mine={profile.resources}
          onClose={() => setRequesting(null)}
          onSave={send}
        />
      )}
    </>
  );
}

function Requests({ showToast }) {
  const [data, setData] = useState({ incoming: [], outgoing: [] });
  const [tab, setTab] = useState("incoming");
  const load = () => api("/requests").then(setData);
  useEffect(() => {
    load();
  }, []);
  const act = async (id, status) => {
    try {
      await api(`/requests/${id}`, "PATCH", { status });
      showToast(`Request ${human(status)}`);
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const items = data[tab];
  const next = {
    pending: ["approved", "declined"],
    approved: ["on-loan"],
    "on-loan": ["returned"],
  };
  return (
    <>
      <div className="workspace-head">
        <div>
          <p className="eyebrow">EXCHANGE OPERATIONS</p>
          <h1>Request center</h1>
          <p>Keep every handover transparent and on track.</p>
        </div>
      </div>
      <div className="request-tabs">
        <button
          className={tab === "incoming" ? "active" : ""}
          onClick={() => setTab("incoming")}
        >
          Incoming <span>{data.incoming.length}</span>
        </button>
        <button
          className={tab === "outgoing" ? "active" : ""}
          onClick={() => setTab("outgoing")}
        >
          Outgoing <span>{data.outgoing.length}</span>
        </button>
      </div>
      <section className="request-list">
        {items.map((r) => (
          <article className="request-card" key={r.id}>
            <div>
              <Status value={r.status} />
              <h3>{r.resource.title}</h3>
              <p>
                {tab === "incoming"
                  ? `${r.requester.name} · ${r.requester.department}`
                  : `Owner: ${r.owner.name}`}
              </p>
              <p className="request-note">
                {r.duration} · {r.handover}
                {r.note ? ` · “${r.note}”` : ""}
              </p>
              {r.offeredResource && (
                <p className="offer">Offer: {r.offeredResource.title}</p>
              )}
            </div>
            <div className="request-actions">
              {tab === "incoming" &&
                next[r.status]?.map((s) => (
                  <button
                    key={s}
                    className={s === "declined" ? "danger" : ""}
                    onClick={() => act(r.id, s)}
                  >
                    {s === "approved"
                      ? "Approve"
                      : s === "on-loan"
                        ? "Mark handed over"
                        : s === "returned"
                          ? "Mark returned"
                          : "Decline"}
                  </button>
                ))}
              {tab === "outgoing" && r.status === "pending" && (
                <button
                  className="secondary"
                  onClick={() => act(r.id, "cancelled")}
                >
                  Cancel request
                </button>
              )}
            </div>
          </article>
        ))}
        {!items.length && (
          <div className="empty-state">
            <h2>No {tab} requests</h2>
            <p>Requests will appear here when exchange activity starts.</p>
          </div>
        )}
      </section>
    </>
  );
}

function Listings({ showToast }) {
  const [data, setData] = useState({ resources: [] });
  const [editor, setEditor] = useState(null),
    [remove, setRemove] = useState(null);
  const load = () => api("/profile").then(setData);
  useEffect(() => {
    load();
  }, []);
  const save = async (f) => {
    try {
      await api(
        editor?.id ? `/resources/${editor.id}` : "/resources",
        editor?.id ? "PUT" : "POST",
        f,
      );
      showToast(editor?.id ? "Listing updated" : "Resource posted");
      setEditor(null);
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  };
  const toggle = async (r) => {
    await api(`/resources/${r.id}`, "PUT", {
      ...r,
      status: r.status === "available" ? "reserved" : "available",
    });
    load();
  };
  return (
    <>
      <div className="workspace-head">
        <div>
          <p className="eyebrow">YOUR INVENTORY</p>
          <h1>My listings</h1>
          <p>Manage each resource and its availability.</p>
        </div>
        <button onClick={() => setEditor(blankListing)}>
          <Icon name="plus" /> Post resource
        </button>
      </div>
      <section className="resource-list">
        {data.resources.map((r) => (
          <article className="listing-row" key={r.id}>
            <div>
              <Status value={r.status} />
              <h3>{r.title}</h3>
              <code>{r.courseCode}</code>
            </div>
            <div>
              <button className="secondary" onClick={() => toggle(r)}>
                {r.status === "available" ? "Pause" : "Make available"}
              </button>
              <button className="secondary" onClick={() => setEditor(r)}>
                Edit
              </button>
              <button className="danger" onClick={() => setRemove(r)}>
                Delete
              </button>
            </div>
          </article>
        ))}
        {!data.resources.length && (
          <div className="empty-state">
            <h2>No listings yet</h2>
            <p>Post something useful to your campus community.</p>
          </div>
        )}
      </section>
      {editor && (
        <Modal
          title={editor.id ? "Edit resource" : "Post a resource"}
          onClose={() => setEditor(null)}
          wide
        >
          <ListingForm
            initial={editor}
            onSave={save}
            onCancel={() => setEditor(null)}
          />
        </Modal>
      )}
      {remove && (
        <Modal title="Delete this listing?" onClose={() => setRemove(null)}>
          <p className="form-note">
            This cannot be undone. Active requests must be resolved first.
          </p>
          <div className="form-actions">
            <button className="secondary" onClick={() => setRemove(null)}>
              Keep listing
            </button>
            <button
              className="danger"
              onClick={async () => {
                try {
                  await api(`/resources/${remove.id}`, "DELETE");
                  setRemove(null);
                  load();
                  showToast("Listing deleted");
                } catch (e) {
                  showToast(e.message, "error");
                }
              }}
            >
              Delete listing
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Profile({ user, onUser, showToast }) {
  const [form, setForm] = useState(user);
  const [data, setData] = useState({ resources: [], requests: [] });
  useEffect(() => {
    api("/profile").then(setData);
  }, []);
  const active = data.requests.filter((r) =>
      ["approved", "on-loan"].includes(r.status),
    ).length,
    complete = data.requests.filter((r) => r.status === "returned").length;
  const save = async (e) => {
    e.preventDefault();
    try {
      const next = await api("/profile", "PUT", form);
      onUser(next);
      showToast("Profile saved");
    } catch (err) {
      showToast(err.message, "error");
    }
  };
  return (
    <>
      <div className="workspace-head">
        <div>
          <p className="eyebrow">STUDENT CREDIBILITY</p>
          <h1>Profile</h1>
          <p>Keep your exchange details current.</p>
        </div>
      </div>
      <div className="metrics">
        <div>
          <b>{data.resources.length}</b>
          <span>Resources listed</span>
        </div>
        <div>
          <b>{active}</b>
          <span>Active loans</span>
        </div>
        <div>
          <b>{complete}</b>
          <span>Completed exchanges</span>
        </div>
      </div>
      <form className="profile-form" onSubmit={save}>
        <div className="profile-photo-field">
          {form.photoUrl ? (
            <img
              src={form.photoUrl}
              alt={`${form.name || "Student"}'s profile`}
            />
          ) : (
            <span>{(form.name || "C").slice(0, 1).toUpperCase()}</span>
          )}
          <Field label="Profile photo URL">
            <input
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={form.photoUrl || ""}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Full name">
          <input
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="College roll number / USN">
          <input
            className="mono"
            value={form.rollNumber || ""}
            onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
          />
        </Field>
        <Field label="Department">
          <input
            value={form.department || ""}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
        </Field>
        <Field label="Current semester">
          <select
            value={form.semester || "Sem 1"}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n}>Sem {n}</option>
            ))}
          </select>
        </Field>
        <Field label="Default pickup preference">
          <input
            value={form.pickupPreference || ""}
            onChange={(e) =>
              setForm({ ...form, pickupPreference: e.target.value })
            }
          />
        </Field>
        <Field label="Bio">
          <textarea
            rows="3"
            value={form.bio || ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </Field>
        <button>Save profile</button>
      </form>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [tab, setTab] = useState("explore"),
    [toast, setToast] = useState(null),
    [authOpen, setAuthOpen] = useState(false);
  const showToast = (text, type) => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };
  useEffect(() => {
    if (!localStorage.getItem("token")) return setReady(true);
    api("/profile")
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setReady(true));
  }, []);
  if (!ready) return <div className="loading">Loading CampusSwap…</div>;
  if (!user)
    return (
      <>
        <header>
          <div className="topbar">
            <button className="brand">
              Campus<span>Swap</span>
            </button>
            <div className="user-menu">
              <button className="secondary" onClick={() => setAuthOpen(true)}>
                Sign in
              </button>
            </div>
          </div>
        </header>
        <main className="app-shell">
          <Explore
            user={null}
            openLogin={() => setAuthOpen(true)}
            showToast={showToast}
            triggerPost={() => setAuthOpen(true)}
          />
        </main>
        {authOpen && (
          <Modal
            title="Welcome to CampusSwap"
            onClose={() => setAuthOpen(false)}
          >
            <Auth
              onAuth={(next) => {
                setUser(next);
                setAuthOpen(false);
              }}
              showToast={showToast}
            />
          </Modal>
        )}
        <Toast toast={toast} />
      </>
    );
  const nav = [
    ["explore", "Explore resources"],
    ["requests", "Request center"],
    ["listings", "My listings"],
    ["profile", "Profile"],
  ];
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setTab("explore");
  };
  return (
    <>
      <header>
        <div className="topbar">
          <button className="brand" onClick={() => setTab("explore")}>
            Campus<span>Swap</span>
          </button>
          <nav>
            {nav.map(([id, label]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="user-menu">
            {user.photoUrl ? (
              <img className="nav-avatar" src={user.photoUrl} alt="" />
            ) : (
              <span className="nav-avatar initial">
                {user.name.slice(0, 1)}
              </span>
            )}
            <span>{user.name}</span>
            <button className="secondary" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="app-shell">
        {tab === "explore" && (
          <Explore
            user={user}
            openLogin={() => setAuthOpen(true)}
            showToast={showToast}
            triggerPost={() => setTab("listings")}
          />
        )}
        {tab === "requests" && <Requests showToast={showToast} />}
        {tab === "listings" && <Listings showToast={showToast} />}
        {tab === "profile" && (
          <Profile user={user} onUser={setUser} showToast={showToast} />
        )}
      </main>
      <Toast toast={toast} />
    </>
  );
}
