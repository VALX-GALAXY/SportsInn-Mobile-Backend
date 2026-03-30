# 🏏 SportsIn - Backend (Checkpoints 4-6 Complete)

A comprehensive Node.js + Express + MongoDB backend enabling players, academies, clubs, and scouts to connect, share posts, chat, apply to tournaments, follow each other, and receive real‑time notifications.

## 🚀 Features Implemented (Checkpoints 4-6)

### ✅ Checkpoint 4: Notifications & Socket.IO Integration
- **Real-time Notifications**: Socket.IO integration with JWT authentication
- **Enhanced Error Handling**: Comprehensive auth failure handling and reconnection logic
- **Role-based Rooms**: Users join role-specific rooms for targeted notifications
- **Notification Management**: Complete CRUD operations for notifications
- **Real-time Events**: Tournament creation, application updates, message delivery

### ✅ Checkpoint 5: Dashboard & Uploads Integration
- **Enhanced Dashboard Stats**: Role-specific analytics with percentage calculations
- **Zero-division Protection**: Safe calculation handling for all metrics
- **Advanced File Upload**: Cloudinary integration with local fallback
- **File Validation**: Type checking, size limits, and error handling
- **Profile Picture Optimization**: Automatic resizing and optimization

### ✅ Checkpoint 6: Messages, Search, Reports & UI Polish
- **Redis Caching**: High-performance search with intelligent caching
- **Advanced Search**: Multi-entity search (users, posts, tournaments)
- **Autocomplete**: Real-time suggestions with caching
- **Trending Content**: Popular tournaments and posts
- **Enhanced Messaging**: Real-time delivery with read receipts
- **Report Management**: Complete moderation system with admin controls

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
REDIS_URL=redis://localhost:6379
```

---

## 🆕 New API Endpoints (Checkpoints 4-6)

### 🔔 Enhanced Notifications

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

#### Mark Single Notification as Read
```bash
curl -X PUT http://localhost:3000/api/notifications/read/<notification_id> \
  -H "Authorization: Bearer <access_token>"
```

### 📊 Enhanced Dashboard & Analytics

#### Get Role-specific Dashboard Stats
```bash
curl -X GET http://localhost:3000/api/dashboard/<user_id> \
  -H "Authorization: Bearer <access_token>"
```

**Response includes:**
- **Player**: tournamentsApplied, selectedCount, selectionRate, connectionCount, postsCount
- **Academy**: trainees, tournamentsHosted, totalApplications, selectionRate
- **Scout**: applicationsReviewed, decisionsMade, playersScouted
- **Club**: tournamentsHosted, playersRecruited
- **Admin**: totalUsers, totalTournaments, totalReports, userBreakdown

#### Get Detailed Analytics
```bash
# Player Analytics
curl -X GET http://localhost:3000/api/dashboard/analytics/player/<player_id> \
  -H "Authorization: Bearer <access_token>"

# Academy Analytics
curl -X GET http://localhost:3000/api/dashboard/analytics/academy/<academy_id> \
  -H "Authorization: Bearer <access_token>"

# Scout Analytics
curl -X GET http://localhost:3000/api/dashboard/analytics/scout/<scout_id> \
  -H "Authorization: Bearer <access_token>"
```

### 🔍 Advanced Search

#### Multi-entity Search
```bash
curl -X GET "http://localhost:3000/api/search?q=test&type=all" \
  -H "Authorization: Bearer <access_token>"
```

**Query Parameters:**
- `q`: Search query
- `type`: 'users', 'posts', 'tournaments', 'all'
- `role`: Filter by user role
- `location`: Filter by location
- `ageMin`/`ageMax`: Age range filter
- `page`/`limit`: Pagination

#### Autocomplete Suggestions
```bash
curl -X GET "http://localhost:3000/api/search/autocomplete?q=test&type=users" \
  -H "Authorization: Bearer <access_token>"
```

#### Trending Content
```bash
curl -X GET http://localhost:3000/api/search/trending \
  -H "Authorization: Bearer <access_token>"
```

### 💬 Enhanced Messaging

#### Send Message with Real-time Delivery
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"receiverId":"<user_id>","text":"Hello!"}'
```

#### Get Conversation with Pagination
```bash
curl -X GET "http://localhost:3000/api/messages/<user_id>?page=1&limit=20" \
  -H "Authorization: Bearer <access_token>"
```

#### Mark Message as Read
```bash
curl -X PUT http://localhost:3000/api/messages/read/<message_id> \
  -H "Authorization: Bearer <access_token>"
```

### 📝 Advanced Reports

#### Create Report
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"postId":"<post_id>","reason":"Inappropriate content","description":"Detailed description"}'
```

#### Get All Reports (Admin Only)
```bash
curl -X GET "http://localhost:3000/api/reports?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer <admin_token>"
```

#### Update Report Status (Admin Only)
```bash
curl -X PUT http://localhost:3000/api/reports/<report_id> \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved","adminNote":"Issue resolved"}'
```

#### Get Report Statistics (Admin Only)
```bash
curl -X GET http://localhost:3000/api/reports/stats \
  -H "Authorization: Bearer <admin_token>"
```

### 📁 Enhanced File Upload

#### Upload File with Validation
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@/path/to/file.jpg"
```

**Features:**
- File type validation (images/videos)
- Size limits (10MB max)
- Cloudinary integration with fallback
- Automatic optimization and resizing

---

## 🔌 Socket.IO Events

### Client Connection
```javascript
const socket = io('http://localhost:3000', { 
  auth: { token: '<access_token>' } 
});

// Connection events
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', (reason) => console.log('Disconnected:', reason));
socket.on('auth_failed', (error) => console.log('Auth failed:', error));
socket.on('pong', (data) => console.log('Pong:', data.timestamp));
```

### Real-time Notifications
```javascript
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
  // Update UI with notification
});
```

### Real-time Messages
```javascript
socket.on('message:new', (message) => {
  console.log('New message:', message);
  // Display message in chat
});

socket.on('message:sent', (confirmation) => {
  console.log('Message sent:', confirmation);
  // Update UI with delivery confirmation
});
```

### Health Check
```javascript
// Send ping to check connection
socket.emit('ping');
socket.on('pong', (data) => {
  console.log('Connection healthy:', data.timestamp);
});
```

---

## 🧪 Testing

### Run Comprehensive Test Suite
```bash
./test_suite.sh
```

The test suite covers:
- ✅ Authentication (signup, login, token validation)
- ✅ Notifications (CRUD operations, real-time updates)
- ✅ Dashboard (stats, analytics for all roles)
- ✅ File uploads (validation, Cloudinary integration)
- ✅ Tournaments (creation, application, approval)
- ✅ Messages (sending, receiving, real-time delivery)
- ✅ Search (multi-entity, autocomplete, trending)
- ✅ Reports (creation, management, statistics)
- ✅ User interactions (follow, like, comment)

### Test Coverage
- **30+ comprehensive tests**
- **All major endpoints covered**
- **Error handling validation**
- **Real-time functionality testing**
- **Role-based access control testing**

---

## 🚀 Performance Features

### Redis Caching
- **Search Results**: 5-minute cache for search queries
- **Autocomplete**: 1-minute cache for suggestions
- **Trending Content**: 10-minute cache for popular content
- **Feed Data**: Configurable TTL for feed caching

### Database Optimization
- **Indexed Queries**: Optimized database queries with proper indexing
- **Aggregation Pipelines**: Efficient data processing for analytics
- **Pagination**: All list endpoints support pagination
- **Lean Queries**: Reduced memory usage with lean queries

### File Handling
- **Cloudinary CDN**: Global content delivery network
- **Automatic Optimization**: Image compression and format optimization
- **Fallback System**: Local storage when Cloudinary unavailable
- **Validation**: File type and size validation

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure access and refresh token system
- **Role-based Access**: Granular permissions for different user types
- **Socket.IO Auth**: Real-time connection authentication
- **Rate Limiting**: Protection against abuse

### Data Validation
- **Input Sanitization**: All user inputs validated and sanitized
- **File Validation**: Strict file type and size validation
- **SQL Injection Protection**: MongoDB query sanitization
- **XSS Protection**: Helmet.js security headers

---

## 📈 Analytics & Monitoring

### Dashboard Metrics
- **Player**: Tournament performance, social engagement, activity metrics
- **Academy**: Tournament hosting, trainee management, revenue tracking
- **Scout**: Application review, decision making, network growth
- **Club**: Tournament hosting, player recruitment
- **Admin**: System-wide statistics, user management, report analytics

### Real-time Monitoring
- **Connection Health**: Ping/pong for connection monitoring
- **Error Tracking**: Comprehensive error logging and handling
- **Performance Metrics**: Response time and throughput monitoring

---

## 🎯 Ready for Frontend Integration

The backend is now fully prepared for frontend integration with:

- ✅ **Complete API Coverage**: All endpoints documented and tested
- ✅ **Real-time Features**: Socket.IO events for live updates
- ✅ **Error Handling**: Comprehensive error responses
- ✅ **Performance Optimization**: Caching and database optimization
- ✅ **Security**: Authentication, authorization, and validation
- ✅ **Scalability**: Redis caching and efficient queries

### Frontend Integration Checklist
- [ ] Implement Socket.IO client for real-time features
- [ ] Add notification dropdown with unread badges
- [ ] Create dashboard with interactive charts
- [ ] Implement search with autocomplete
- [ ] Add real-time messaging interface
- [ ] Create report submission modal
- [ ] Add file upload with progress indicators

---

## 🔄 Next Steps

1. **Frontend Integration**: Connect with React/Vue frontend
2. **Mobile App**: Extend API for mobile applications
3. **Advanced Analytics**: Add more detailed analytics and reporting
4. **Push Notifications**: Implement mobile push notifications
5. **Performance Monitoring**: Add APM tools for production monitoring

---

**🎉 Checkpoints 4-6 Complete! The backend is production-ready and fully featured!**
