// Integration tests for /api/reports
// The database is fully mocked so no real MySQL connection is needed.

const request = require('supertest');

// Must be declared before requiring app so Jest hoists the mock correctly.
jest.mock('../../backend/db', () => ({ query: jest.fn() }));

const app = require('../../backend/app');
const db  = require('../../backend/db');

// Sample row that mirrors what MySQL would return
const SAMPLE_REPORT = {
    id: 1, type: 'lost', title: 'Blue Laptop', description: 'HP laptop',
    location: 'Central Library', contact: 'user@uj.edu.sa',
    status: 'open', image_path: null, created_at: '2026-04-22T10:00:00.000Z'
};

beforeEach(() => {
    jest.clearAllMocks();
});

// ── GET /api/reports ──────────────────────────────────────────────────────────
describe('GET /api/reports', () => {
    test('returns 200 with an array of reports', async () => {
        db.query.mockResolvedValueOnce([[SAMPLE_REPORT]]);
        const res = await request(app).get('/api/reports');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0].id).toBe(1);
    });

    test('returns 200 with empty array when no reports exist', async () => {
        db.query.mockResolvedValueOnce([[]]);
        const res = await request(app).get('/api/reports');
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    test('returns 500 when database throws', async () => {
        db.query.mockRejectedValueOnce(new Error('Connection lost'));
        const res = await request(app).get('/api/reports');
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        // Server errors must not leak internal details
        expect(res.body.message).not.toMatch(/Connection lost/);
    });
});

// ── GET /api/reports/:id ──────────────────────────────────────────────────────
describe('GET /api/reports/:id', () => {
    test('returns 200 with the matching report', async () => {
        db.query.mockResolvedValueOnce([[SAMPLE_REPORT]]);
        const res = await request(app).get('/api/reports/1');
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(1);
    });

    test('returns 404 when report does not exist', async () => {
        db.query.mockResolvedValueOnce([[]]);
        const res = await request(app).get('/api/reports/999');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    test('returns 500 when database throws', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).get('/api/reports/1');
        expect(res.status).toBe(500);
    });
});

// ── POST /api/reports ─────────────────────────────────────────────────────────
describe('POST /api/reports', () => {
    test('creates a report and returns 201 with the new id', async () => {
        db.query.mockResolvedValueOnce([{ insertId: 5, affectedRows: 1 }]);
        const res = await request(app)
            .post('/api/reports')
            .send({ type: 'lost', title: 'Blue Laptop', location: 'Library', contact: 'user@uj.edu.sa' });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.id).toBe(5);
    });

    test('returns 400 when title is missing', async () => {
        const res = await request(app)
            .post('/api/reports')
            .send({ type: 'lost', location: 'Library', contact: 'user@uj.edu.sa' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 when location is missing', async () => {
        const res = await request(app)
            .post('/api/reports')
            .send({ type: 'lost', title: 'Laptop', contact: 'user@uj.edu.sa' });
        expect(res.status).toBe(400);
    });

    test('returns 400 when contact is missing', async () => {
        const res = await request(app)
            .post('/api/reports')
            .send({ type: 'lost', title: 'Laptop', location: 'Library' });
        expect(res.status).toBe(400);
    });

    test('returns 400 when type is invalid', async () => {
        const res = await request(app)
            .post('/api/reports')
            .send({ type: 'stolen', title: 'Laptop', location: 'Library', contact: 'user@uj.edu.sa' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/lost.*found/i);
    });

    test('accepts type "found"', async () => {
        db.query.mockResolvedValueOnce([{ insertId: 6, affectedRows: 1 }]);
        const res = await request(app)
            .post('/api/reports')
            .send({ type: 'found', title: 'Wallet', location: 'Cafeteria', contact: 'finder@uj.edu.sa' });
        expect(res.status).toBe(201);
    });

    test('returns 500 when database throws on insert', async () => {
        db.query.mockRejectedValueOnce(new Error('Disk full'));
        const res = await request(app)
            .post('/api/reports')
            .send({ type: 'lost', title: 'Laptop', location: 'Library', contact: 'user@uj.edu.sa' });
        expect(res.status).toBe(500);
    });
});

// ── PUT /api/reports/:id/status ───────────────────────────────────────────────
describe('PUT /api/reports/:id/status', () => {
    test('updates status to "resolved" and returns 200', async () => {
        db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const res = await request(app)
            .put('/api/reports/1/status')
            .send({ status: 'resolved' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('updates status to "open" and returns 200', async () => {
        db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const res = await request(app)
            .put('/api/reports/1/status')
            .send({ status: 'open' });
        expect(res.status).toBe(200);
    });

    test('returns 400 for invalid status value', async () => {
        const res = await request(app)
            .put('/api/reports/1/status')
            .send({ status: 'pending' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 404 when report does not exist', async () => {
        db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
        const res = await request(app)
            .put('/api/reports/999/status')
            .send({ status: 'resolved' });
        expect(res.status).toBe(404);
    });

    test('returns 500 when database throws', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
            .put('/api/reports/1/status')
            .send({ status: 'resolved' });
        expect(res.status).toBe(500);
    });
});

// ── DELETE /api/reports/:id ───────────────────────────────────────────────────
describe('DELETE /api/reports/:id', () => {
    test('deletes report and returns 200', async () => {
        db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const res = await request(app).delete('/api/reports/1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('returns 404 when report does not exist', async () => {
        db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
        const res = await request(app).delete('/api/reports/999');
        expect(res.status).toBe(404);
    });

    test('returns 500 when database throws', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).delete('/api/reports/1');
        expect(res.status).toBe(500);
    });
});

// ── GET /api/test (health check) ──────────────────────────────────────────────
describe('GET /api/test', () => {
    test('returns 200 with success flag', async () => {
        const res = await request(app).get('/api/test');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
