// Integration tests for /api/claims

const request = require('supertest');

jest.mock('../../backend/db', () => ({ query: jest.fn() }));

const app = require('../../backend/app');
const db  = require('../../backend/db');

const SAMPLE_CLAIM = {
    id: 1, report_id: 2, claimant: 'Nora Al-Qahtani',
    student_id: '1234567', email: 'nora@uj.edu.sa', phone: '0512345678',
    message: 'I can describe it precisely', status: 'pending',
    created_at: '2026-04-22T10:00:00.000Z',
    report_title: 'Blue Laptop', report_type: 'found'
};

beforeEach(() => jest.clearAllMocks());

// ── GET /api/claims ───────────────────────────────────────────────────────────
describe('GET /api/claims', () => {
    test('returns 200 with array of claims', async () => {
        db.query.mockResolvedValueOnce([[SAMPLE_CLAIM]]);
        const res = await request(app).get('/api/claims');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('returns 200 with empty array when no claims exist', async () => {
        db.query.mockResolvedValueOnce([[]]);
        const res = await request(app).get('/api/claims');
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    test('returns 500 when database throws', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).get('/api/claims');
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });
});

// ── POST /api/claims ──────────────────────────────────────────────────────────
describe('POST /api/claims', () => {
    test('creates a claim when report exists and returns 201', async () => {
        // First query: verify report exists. Second query: insert claim.
        db.query
            .mockResolvedValueOnce([[{ id: 2 }]])
            .mockResolvedValueOnce([{ insertId: 10, affectedRows: 1 }]);

        const res = await request(app)
            .post('/api/claims')
            .send({
                report_id: 2, claimant: 'Nora Al-Qahtani',
                student_id: '1234567', email: 'nora@uj.edu.sa',
                phone: '0512345678', message: 'I can describe the item exactly'
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.id).toBe(10);
    });

    test('returns 400 when report_id is missing', async () => {
        const res = await request(app)
            .post('/api/claims')
            .send({ claimant: 'Nora Al-Qahtani' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 when claimant is missing', async () => {
        const res = await request(app)
            .post('/api/claims')
            .send({ report_id: 2 });
        expect(res.status).toBe(400);
    });

    test('returns 404 when the referenced report does not exist', async () => {
        db.query.mockResolvedValueOnce([[]]); // report lookup returns empty
        const res = await request(app)
            .post('/api/claims')
            .send({ report_id: 999, claimant: 'Someone' });
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    test('works with optional fields omitted', async () => {
        db.query
            .mockResolvedValueOnce([[{ id: 3 }]])
            .mockResolvedValueOnce([{ insertId: 11, affectedRows: 1 }]);

        const res = await request(app)
            .post('/api/claims')
            .send({ report_id: 3, claimant: 'Ali' });
        expect(res.status).toBe(201);
    });

    test('returns 500 when database throws on insert', async () => {
        db.query
            .mockResolvedValueOnce([[{ id: 2 }]])
            .mockRejectedValueOnce(new Error('Constraint error'));
        const res = await request(app)
            .post('/api/claims')
            .send({ report_id: 2, claimant: 'Someone' });
        expect(res.status).toBe(500);
    });
});

// ── PUT /api/claims/:id/status ────────────────────────────────────────────────
describe('PUT /api/claims/:id/status', () => {
    test('updates status to "approved" and returns 200', async () => {
        db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const res = await request(app)
            .put('/api/claims/1/status')
            .send({ status: 'approved' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('updates status to "rejected" and returns 200', async () => {
        db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const res = await request(app)
            .put('/api/claims/1/status')
            .send({ status: 'rejected' });
        expect(res.status).toBe(200);
    });

    test('updates status to "pending" and returns 200', async () => {
        db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const res = await request(app)
            .put('/api/claims/1/status')
            .send({ status: 'pending' });
        expect(res.status).toBe(200);
    });

    test('returns 400 for invalid status value', async () => {
        const res = await request(app)
            .put('/api/claims/1/status')
            .send({ status: 'open' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 404 when claim does not exist', async () => {
        db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
        const res = await request(app)
            .put('/api/claims/999/status')
            .send({ status: 'approved' });
        expect(res.status).toBe(404);
    });

    test('returns 500 when database throws', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app)
            .put('/api/claims/1/status')
            .send({ status: 'approved' });
        expect(res.status).toBe(500);
    });
});
