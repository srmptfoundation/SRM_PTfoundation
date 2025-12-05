import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-in-prod';
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // Replace in Prod
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json() as any);

// --- Database Helpers ---
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

// Helper to read JSON
const readJson = (file: string) => {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
};

// Helper to write JSON
const writeJson = (file: string, data: any) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// --- Middleware ---

const verifyJWT = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            return res.sendStatus(403);
        }
        next();
    };
};

// --- Routes ---

// 1. Auth & Verify
app.post('/api/auth/verify', async (req: any, res: any) => {
    const { id_token } = req.body;
    
    let email = '';
    
    // DEV BYPASS: For prototype demonstration without GCP keys
    if (id_token && id_token.startsWith('dev-')) {
        if (id_token === 'dev-student-token') email = 'student1@example.com';
        else if (id_token === 'dev-staff-token') email = 'warden@ptf.org';
        else if (id_token === 'dev-admin-token') email = 'admin@ptf.org';
        else return res.status(403).json({ message: "Invalid dev token" });
    } else {
        // REAL GOOGLE AUTH
        try {
            const ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            email = payload?.email || '';
        } catch (error) {
            return res.status(401).json({ message: "Invalid Google Token" });
        }
    }

    // Check Whitelist
    const users = readJson(USERS_FILE);
    const user = users.find((u: any) => u.email === email);

    if (!user) {
        return res.status(403).json({ message: "Access Denied: Email not registered." });
    }

    // Sign JWT
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, user });
});

// 2. Submit Request (Student)
app.post('/api/request/submit', verifyJWT, requireRole(['student']), (req: any, res: any) => {
    const { reason, place, from_date, to_date } = req.body;
    const requests = readJson(REQUESTS_FILE);
    
    const newRequest = {
        id: `req-${Date.now()}`,
        student_roll_no: req.user.roll_no,
        student_name: req.user.name,
        department: req.user.dept,
        year: req.user.year,
        hostel_name: req.user.hostel_name,
        room_no: req.user.room_no,
        parent_mobile: req.user.parent_mobile,
        reason,
        place,
        from_date,
        to_date,
        status: 'Pending',
        created_at: new Date().toISOString()
    };

    requests.push(newRequest);
    writeJson(REQUESTS_FILE, requests);
    res.json(newRequest);
});

// 3. Get My Requests (Student)
app.get('/api/requests/my', verifyJWT, requireRole(['student']), (req: any, res: any) => {
    const requests = readJson(REQUESTS_FILE);
    const myRequests = requests
        .filter((r: any) => r.student_roll_no === req.user.roll_no)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(myRequests);
});

// 4. Get Pending Requests (Admin)
app.get('/api/requests/pending', verifyJWT, requireRole(['admin']), (req: any, res: any) => {
    const requests = readJson(REQUESTS_FILE);
    const pending = requests.filter((r: any) => r.status === 'Pending');
    res.json(pending);
});

// 5. Update Request Status (Admin)
app.post('/api/request/update/:id', verifyJWT, requireRole(['admin']), (req: any, res: any) => {
    const { id } = req.params;
    const { status, approved_by, rejection_reason } = req.body;
    
    const requests = readJson(REQUESTS_FILE);
    const reqIndex = requests.findIndex((r: any) => r.id === id);

    if (reqIndex === -1) return res.sendStatus(404);

    requests[reqIndex].status = status;
    
    if (status === 'Approved') {
        requests[reqIndex].approved_by = approved_by;
        requests[reqIndex].approval_date = new Date().toISOString().split('T')[0];
        requests[reqIndex].system_id = crypto.randomBytes(4).toString('hex');
        // Clear rejection reason if previously rejected
        delete requests[reqIndex].rejection_reason;
    } else if (status === 'Rejected') {
        requests[reqIndex].rejection_reason = rejection_reason || 'No reason provided';
    }

    writeJson(REQUESTS_FILE, requests);
    res.json(requests[reqIndex]);
});

// 6. Get Slip Data
app.get('/api/request/:id/slip', verifyJWT, (req: any, res: any) => {
    const { id } = req.params;
    const requests = readJson(REQUESTS_FILE);
    const request = requests.find((r: any) => r.id === id);

    if (!request) return res.sendStatus(404);

    // Security check: Only Admin or the owning Student can view
    const isOwner = req.user.role === 'student' && req.user.roll_no === request.student_roll_no;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) return res.sendStatus(403);
    if (request.status !== 'Approved' && !isAdmin) return res.status(400).send("Not approved yet");

    res.json(request);
});

// 7. Student Status List (Staff)
app.get('/api/students/status', verifyJWT, requireRole(['staff']), (req: any, res: any) => {
    const users = readJson(USERS_FILE);
    const requests = readJson(REQUESTS_FILE);
    const today = new Date().toISOString().split('T')[0];

    const studentList = users
        .filter((u: any) => u.role === 'student')
        .map((student: any) => {
            // Check if student has an approved leave overlapping today
            const activeLeave = requests.find((r: any) => 
                r.student_roll_no === student.roll_no &&
                r.status === 'Approved' &&
                r.from_date <= today &&
                r.to_date >= today
            );

            return {
                name: student.name,
                roll_no: student.roll_no,
                room_no: student.room_no,
                hostel_name: student.hostel_name,
                status: activeLeave ? 'On Leave' : 'In Hostel',
                leave_details: activeLeave ? {
                    from: activeLeave.from_date,
                    to: activeLeave.to_date,
                    place: activeLeave.place
                } : undefined
            };
        });
    
    res.json(studentList);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});