// Integration tests for /api/contact

const request = require('supertest');

// `var` is fully hoisted so it is accessible inside jest.mock's factory function,
// which runs before any import/require in the test file.
var mockEmailSend;

// Mock resend BEFORE requiring app so the module-level `new Resend()` uses the mock.
jest.mock('resend', () => {
    // Capture the send mock so individual tests can override its behaviour.
    mockEmailSend = jest.fn().mockResolvedValue({ id: 'mock-email-id' });
    return {
        Resend: jest.fn().mockImplementation(() => ({
            emails: { send: mockEmailSend }
        }))
    };
});

jest.mock('../../backend/db', () => ({ query: jest.fn() }));

const app = require('../../backend/app');
const db  = require('../../backend/db');

const SAMPLE_MESSAGE = {
    id: 1, first_name: 'Ahmad', last_name: 'Ali', gender: 'male',
    mobile: '0512345678', date_of_birth: '2000-01-15', language: 'english',
    email: 'ahmad@uj.edu.sa', subject: 'Lost item inquiry', message: 'I lost my bag',
    created_at: '2026-04-22T10:00:00.000Z'
};

// A valid payload satisfying all required fields.
const VALID_BODY = {
    first_name: 'Ahmad', last_name: 'Ali', gender: 'male',
    mobile: '0512345678', date_of_birth: '2000-01-15', language: 'english',
    email: 'ahmad@example.com', subject: 'Lost item inquiry', message: 'I need help finding my item'
};

// Suppress the RESEND vars during most tests so the email block is skipped.
const origContactEmail = process.env.CONTACT_TO_EMAIL;
const origResendKey    = process.env.RESEND_API_KEY;

beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CONTACT_TO_EMAIL;
    delete process.env.RESEND_API_KEY;
});

afterAll(() => {
    process.env.CONTACT_TO_EMAIL = origContactEmail;
    process.env.RESEND_API_KEY   = origResendKey;
});

// ── GET /api/contact ──────────────────────────────────────────────────────────
describe('GET /api/contact', () => {
    test('returns 200 with array of messages', async () => {
        db.query.mockResolvedValueOnce([[SAMPLE_MESSAGE]]);
        const res = await request(app).get('/api/contact');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('returns 200 with empty array when no messages', async () => {
        db.query.mockResolvedValueOnce([[]]);
        const res = await request(app).get('/api/contact');
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    test('returns 500 when database throws', async () => {
        db.query.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).get('/api/contact');
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });
});

// ── POST /api/contact ─────────────────────────────────────────────────────────
describe('POST /api/contact (no email configured)', () => {
    test('saves message and returns 201', async () => {
        db.query.mockResolvedValueOnce([{ insertId: 7, affectedRows: 1 }]);
        const res = await request(app)
            .post('/api/contact')
            .send(VALID_BODY);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.id).toBe(7);
    });

    test('returns 400 when first_name is missing', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({ ...VALID_BODY, first_name: '' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 when last_name is missing', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({ ...VALID_BODY, last_name: '' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 when email is missing', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({ ...VALID_BODY, email: '' });
        expect(res.status).toBe(400);
    });

    test('returns 400 when message is missing', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({ ...VALID_BODY, message: '' });
        expect(res.status).toBe(400);
    });

    test('returns 400 when gender is missing', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({ ...VALID_BODY, gender: '' });
        expect(res.status).toBe(400);
    });

    test('returns 400 when language is missing', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({ ...VALID_BODY, language: '' });
        expect(res.status).toBe(400);
    });

    test('returns 400 for invalid email format', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({ ...VALID_BODY, email: 'not-an-email' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 for invalid gender value', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({ ...VALID_BODY, gender: 'unknown' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 for invalid language value', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({ ...VALID_BODY, language: 'klingon' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('accepts message without subject (subject is optional)', async () => {
        db.query.mockResolvedValueOnce([{ insertId: 8, affectedRows: 1 }]);
        const { subject, ...bodyWithoutSubject } = VALID_BODY;
        const res = await request(app)
            .post('/api/contact')
            .send(bodyWithoutSubject);
        expect(res.status).toBe(201);
    });

    test('trims whitespace from first_name and email before storage', async () => {
        db.query.mockResolvedValueOnce([{ insertId: 9, affectedRows: 1 }]);
        const res = await request(app)
            .post('/api/contact')
            .send({ ...VALID_BODY, first_name: '  Ahmad  ', email: '  ahmad@example.com  ' });
        expect(res.status).toBe(201);
        // params order: first_name, last_name, gender, mobile, date_of_birth, language, email, subject, message
        const [, params] = db.query.mock.calls[0];
        expect(params[0]).toBe('Ahmad');              // first_name trimmed
        expect(params[6]).toBe('ahmad@example.com');  // email trimmed
    });

    test('returns 500 when database throws on insert', async () => {
        db.query.mockRejectedValueOnce(new Error('Table locked'));
        const res = await request(app)
            .post('/api/contact')
            .send(VALID_BODY);
        expect(res.status).toBe(500);
        // Error response must not expose internal DB message
        expect(res.body.message).not.toMatch(/Table locked/);
    });
});

// ── POST /api/contact with email configured ───────────────────────────────────
describe('POST /api/contact (email configured)', () => {
    beforeEach(() => {
        process.env.CONTACT_TO_EMAIL = 'admin@uj.edu.sa';
        process.env.RESEND_API_KEY   = 'test-key';
    });

    test('sends email and returns 201 on success', async () => {
        db.query.mockResolvedValueOnce([{ insertId: 10, affectedRows: 1 }]);
        const res = await request(app)
            .post('/api/contact')
            .send({ ...VALID_BODY, subject: 'Test' });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    test('returns 201 with emailError flag when email sending fails', async () => {
        db.query.mockResolvedValueOnce([{ insertId: 11, affectedRows: 1 }]);
        // Override only this one call to simulate an SMTP failure.
        mockEmailSend.mockRejectedValueOnce(new Error('SMTP error'));

        const res = await request(app)
            .post('/api/contact')
            .send(VALID_BODY);
        // DB save succeeded — response is still 201 but flags the email problem.
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.emailError).toBe(true);
    });
});
