# 🏏 SportsIn - Backend (Updated)

A Node.js + Express + MongoDB backend enabling players, academies, clubs, and scouts to connect, share posts, chat, apply to tournaments, follow each other, and receive real‑time notifications.

This backend is now live-ready with strict CORS + Helmet security, Cloudinary upload integration for profile pictures, and all notification/profile missing APIs implemented.

---

## 🚀 Features

* JWT Auth (Access + Refresh)
* Role-based: Player / Academy / Scout / Admin
* Feed: Create, like, comment, personalized feed
* Real-time chat + notifications via Socket.IO
* Media uploads (Cloudinary + fallback)
* Follow system
* Tournament module
* Applications / Invites
* Reports & moderation (admin)
* Profile picture upload endpoint
* Get profile posts endpoint
* Notification unread-count endpoint
* Mark-all-read endpoint
* Enhanced User Model with gender and sport fields **(New)**
* Sport-specific roles (e.g., Cricket roles) **(New)**
* Improved validation for sport-specific fields **(New)**

---

## 🔧 Environment Variables

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/project1db
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
JWT_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
BASE_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

---

## ✅ New API Endpoints

### 📌 Profile

#### Upload Profile Picture

```bash
curl -X POST http://localhost:3000/api/profile/<userId>/picture \
  -H "Authorization: Bearer <access_token>" \
  -F "profilePic=@/path/to/image.jpg"
```

#### Get Posts by User (Profile Posts)

```bash
curl -X GET "http://localhost:3000/api/profile/<userId>/posts?page=1&limit=10" \
  -H "Authorization: Bearer <access_token>"
```

---

### 🔔 Notifications

#### Get Unread Count

```bash
curl -X GET http://localhost:3000/api/notifications/unread-count \
  -H "Authorization: Bearer <access_token>"
```

#### Mark All as Read

```bash
curl -X PATCH http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer <access_token>"
```

---

(Full README continues...)


## ⚡ Setup Instructions

### 1. Clone Repository

```bash
git clone git@github.com:VALX-GALAXY/project-1.git
cd day2-auth
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file at the root:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/project1db

# CORS: comma-separated allowed origins (frontend dev address)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# JWT secrets (already present)
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Base URL (used for local upload fallback)
BASE_URL=http://localhost:3000

# (Optional) Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

```

### 4. Start MongoDB

```bash
mongod --dbpath ~/data/db
# or
sudo systemctl start mongod
```

### 5. Start Server

```bash
npm start
# or during development
npm run dev
```

**Runs at:** `http://localhost:3000`

**Socket.IO:** same host (`/socket.io`)

---

## 🧾 Admin Setup (Safe Way)

### 1. Remove incorrect admin if any:

```bash
mongosh
use project1db
db.users.deleteOne({ email: "admin@test.com" })
exit
```

### 2. Create secure admin (auto-hashed):

```bash
curl -X POST http://localhost:3000/api/auth/admin/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"123456"}'
```

After that you can log in via `/api/auth/login`.

---

## 🧪 API Endpoints & Examples

### Authentication

#### Regular Signup (Cricket Player)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ashu",
    "email": "ashu@test.com",
    "password": "123456",
    "role": "player",
    "age": 21,
    "playingRole": "batsman",
    "sport": "Cricket",
    "gender": "Male",
    "cricketRole": "Batsman"
  }'
```

#### Regular Signup (Other Sports)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "john@test.com",
    "password": "123456",
    "role": "player",
    "age": 23,
    "playingRole": "Forward",
    "sport": "Football",
    "gender": "Male"
  }'
```

#### Admin Signup

```bash
curl -X POST http://localhost:3000/api/auth/admin/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"123456"}'
```

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ashu@test.com","password":"123456"}'
```

---

### Search API

```bash
curl -X GET "http://localhost:3000/api/search?role=player&name=ashu&ageMin=18&ageMax=25&location=pune&page=1&limit=10" \
  -H "Authorization: Bearer <access_token>"
```

---

### Player Stats

```bash
curl -X GET http://localhost:3000/api/users/<user_id>/stats \
  -H "Authorization: Bearer <access_token>"
```

---

### Applications / Invites

#### Create

```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"toUserId":"<target_user_id>"}'
```

#### Sent / Received

```bash
curl -X GET http://localhost:3000/api/applications/sent \
  -H "Authorization: Bearer <access_token>"

curl -X GET http://localhost:3000/api/applications/received \
  -H "Authorization: Bearer <access_token>"
```

#### Update Status

```bash
curl -X PUT http://localhost:3000/api/applications/<application_id> \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"accepted"}'
```

---

### Reports

#### Report Post

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"postId":"<post_id>","reason":"spam"}'
```

#### List Reports (Admin)

```bash
curl -X GET http://localhost:3000/api/reports \
  -H "Authorization: Bearer <admin_access_token>"
```

---

### Feed

#### Upload Media

```bash
curl -X POST http://localhost:3000/api/feed/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@/path/to/image.jpg"
```

---

## 💬 Messaging

### Send Message

```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"receiverId":"<user_id>","text":"Hello!"}'
```

### Fetch Conversation (Paginated)

```bash
curl -X GET "http://localhost:3000/api/messages/<user_id>?page=1" \
  -H "Authorization: Bearer <access_token>"
```

### Mark Message as Read

```bash
curl -X PUT http://localhost:3000/api/messages/read/<message_id> \
  -H "Authorization: Bearer <access_token>"
```

**Response:**

```json
{
  "success": true,
  "data": { "_id": "<message_id>", "read": true },
  "message": "Message marked as read"
}
```

---

## 🏆 Tournaments (Day 8 Updates)

### Create Tournament (Admin Only)

```bash
curl -X POST http://localhost:3000/api/tournaments \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Local League Cup",
    "entryFee": 100,
    "location": "Pune",
    "type": "Knockout",
    "vacancies": 8
  }'
```

### List All Tournaments

```bash
curl -X GET "http://localhost:3000/api/tournaments"
```

### Apply to Tournament

```bash
curl -X POST http://localhost:3000/api/tournaments/apply/<tournament_id> \
  -H "Authorization: Bearer <player_access_token>"
```

---

## 🔔 Notifications (Day 8 Updates)

### Get Notifications (Paginated)

```bash
curl -X GET "http://localhost:3000/api/notifications?page=1&limit=10" \
  -H "Authorization: Bearer <access_token>"
```

### Mark Notification as Read

```bash
curl -X PUT http://localhost:3000/api/notifications/read/<notification_id> \
  -H "Authorization: Bearer <access_token>"
```

---

## 🔌 Socket.IO Quick Test

```javascript
const socket = io('http://localhost:3000', { auth: { token: '<access_token>' } });
socket.on('connect', () => console.log('connected', socket.id));
socket.on('notification:new', n => console.log('notif', n));
socket.on('message:new', m => console.log('message', m));
socket.on('feed:new', p => console.log('new post', p));
```

---

## 🔒 Notes

- Always use signup APIs for bcrypt-hashed passwords
- `isAdmin` flag + `role: "admin"` handled automatically
- Pagination: use `page` & `limit`
- Cloudinary fallback → `uploads/` folder
- Socket authentication: `{ auth: { token } }`
- Rate limiter applied to sensitive routes

---

## 🧪 Debug Tips

- Test with multiple accounts (player/academy/scout/admin)
- Save `accessToken` & `refreshToken` from login responses
- If socket fails, check you're sending JWT in auth
- For local images, confirm `uploads/` is writable

---

## 📄 License

MIT © 2025 Cricket Social Platform API