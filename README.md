# CampusSwap – Student-to-Student Resource Exchange

React (Vite) frontend + Express backend. Data is stored in `server/db.json`.

## Run
```bash
# terminal 1
cd server && npm install && npm start      # http://localhost:5000

# terminal 2
cd client && npm install && npm run dev    # http://localhost:5173
```

## Feature -> where it lives
| Requirement | Server | Client |
|---|---|---|
| Resource posts (CRUD) | `/api/resources` GET/POST/PUT/DELETE | `MyPosts` |
| Search / filter | `GET /api/resources?q=&category=` | `Browse` |
| Request exchange | `POST /api/requests` | `Browse` |
| Request status | `PATCH /api/requests/:id` (accept/reject/cancel) | `Requests` |
| User profile | `/api/profile` GET/PUT | `Profile` |
| Authentication | JWT + bcrypt, `auth` middleware protects all write routes | `Auth`, `api.js` |
| CORS / JSON | `cors()` + `express.json()` | `api.js` |
| Props / State | | `useState`/`useEffect`, props between components |
