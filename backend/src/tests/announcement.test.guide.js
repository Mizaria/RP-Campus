// Test file for Announcement API endpoints
// You can use this with tools like Postman or REST Client

/*
=== ANNOUNCEMENT API ENDPOINTS ===

Base URL: http://localhost:3000/api/announcements

REQUIRED HEADERS for all requests:
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

=== 1. CREATE ANNOUNCEMENT (Admin Only) ===
POST /api/announcements
Body:
{
    "title": "Important System Maintenance",
    "description": "The system will be under maintenance on Friday from 2 PM to 4 PM. Please save your work accordingly."
}

=== 2. GET ALL ACTIVE ANNOUNCEMENTS (All Users) ===
GET /api/announcements
Optional Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10)

Example: GET /api/announcements?page=1&limit=5

=== 3. GET MY ANNOUNCEMENTS (Admin Only) ===
GET /api/announcements/my-announcements
Optional Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10)

=== 4. GET ANNOUNCEMENT BY ID (All Users) ===
GET /api/announcements/:id
Example: GET /api/announcements/60f7b1234567890abcdef123

=== 5. UPDATE ANNOUNCEMENT (Creator Admin Only) ===
PUT /api/announcements/:id
Body:
{
    "title": "Updated: System Maintenance Postponed",
    "description": "The maintenance has been postponed to next Monday from 2 PM to 4 PM."
}

=== 6. DELETE ANNOUNCEMENT (Creator Admin Only) ===
DELETE /api/announcements/:id

=== 7. GET ANNOUNCEMENT STATISTICS (Admin Only) ===
GET /api/announcements/stats

Response:
{
    "stats": {
        "total": 15,
        "active": 12,
        "expired": 3,
        "myAnnouncements": 5,
        "recentAnnouncements": 8
    }
}

=== ERROR RESPONSES ===

403 - Access Denied:
{
    "message": "Access denied. Only administrators can create announcements."
}

404 - Not Found:
{
    "message": "Announcement not found"
}

400 - Validation Error:
{
    "message": "Title and description are required."
}

=== AUTOMATIC FEATURES ===

1. Announcements automatically expire after 2 weeks from creation
2. MongoDB TTL index automatically deletes expired announcements
3. Only admins can create announcements
4. Only the creator admin can update/delete their announcements
5. All user types can view active announcements

=== TESTING FLOW ===

1. Login as admin to get JWT token
2. Create an announcement
3. View all announcements
4. Update the announcement (same admin)
5. Try to update with different admin (should fail)
6. Delete the announcement
7. Check statistics

*/

module.exports = {
    endpoints: {
        create: 'POST /api/announcements',
        getAll: 'GET /api/announcements',
        getMy: 'GET /api/announcements/my-announcements',
        getById: 'GET /api/announcements/:id',
        update: 'PUT /api/announcements/:id',
        delete: 'DELETE /api/announcements/:id',
        stats: 'GET /api/announcements/stats'
    }
};
