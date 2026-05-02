// Unit tests for js/validation.js
// These tests cover every exported function with success, empty, boundary, and invalid cases.

const {
    isRequired,
    isValidEmail,
    isValidUJEmail,
    isValidName,
    isValidPhone,
    isValidReportId,
    isValidStudentId,
    isMinLength,
    isMaxLength
} = require('../../js/validation');

// ── isRequired ────────────────────────────────────────────────────────────────
describe('isRequired', () => {
    test('returns true for a normal string',        () => expect(isRequired('hello')).toBe(true));
    test('returns true for a string with spaces',   () => expect(isRequired('  hi  ')).toBe(true));
    test('returns false for empty string',          () => expect(isRequired('')).toBe(false));
    test('returns false for whitespace-only string',() => expect(isRequired('   ')).toBe(false));
    test('returns false for null',                  () => expect(isRequired(null)).toBe(false));
});

// ── isValidEmail ─────────────────────────────────────────────────────────────
describe('isValidEmail', () => {
    test('accepts standard email',            () => expect(isValidEmail('user@example.com')).toBe(true));
    test('accepts email with subdomain',      () => expect(isValidEmail('u@mail.example.com')).toBe(true));
    test('accepts email with plus tag',       () => expect(isValidEmail('user+tag@example.com')).toBe(true));
    test('rejects missing @',                 () => expect(isValidEmail('userexample.com')).toBe(false));
    test('rejects missing domain',            () => expect(isValidEmail('user@')).toBe(false));
    test('rejects missing local part',        () => expect(isValidEmail('@example.com')).toBe(false));
    test('rejects empty string',              () => expect(isValidEmail('')).toBe(false));
    test('rejects spaces inside email',       () => expect(isValidEmail('user @example.com')).toBe(false));
});

// ── isValidUJEmail ────────────────────────────────────────────────────────────
describe('isValidUJEmail', () => {
    test('accepts @uj.edu.sa address',              () => expect(isValidUJEmail('student@uj.edu.sa')).toBe(true));
    test('accepts mixed-case domain (case-insensitive)', () => expect(isValidUJEmail('s@UJ.EDU.SA')).toBe(true));
    test('rejects gmail address',                   () => expect(isValidUJEmail('user@gmail.com')).toBe(false));
    test('rejects partial domain match',            () => expect(isValidUJEmail('user@notuj.edu.sa')).toBe(false));
    test('rejects empty string',                    () => expect(isValidUJEmail('')).toBe(false));
    test('rejects missing local part',              () => expect(isValidUJEmail('@uj.edu.sa')).toBe(false));
});

// ── isValidName ───────────────────────────────────────────────────────────────
describe('isValidName', () => {
    test('accepts simple English name',           () => expect(isValidName('John Doe')).toBe(true));
    test('accepts single-word name',              () => expect(isValidName('Omar')).toBe(true));
    test('accepts Arabic name',                   () => expect(isValidName('محمد علي')).toBe(true));
    test('rejects single character',              () => expect(isValidName('A')).toBe(false));
    test('rejects name with digits',              () => expect(isValidName('John2 Doe')).toBe(false));
    test('rejects name with special characters',  () => expect(isValidName('John_Doe')).toBe(false));
    test('rejects empty string',                  () => expect(isValidName('')).toBe(false));
    test('rejects name longer than 60 chars',     () => expect(isValidName('A'.repeat(61))).toBe(false));
    test('accepts exactly 2-char name',           () => expect(isValidName('Jo')).toBe(true));
    test('accepts exactly 60-char name',          () => expect(isValidName('A'.repeat(30) + ' ' + 'B'.repeat(29))).toBe(true));
});

// ── isValidPhone ─────────────────────────────────────────────────────────────
describe('isValidPhone', () => {
    test('accepts valid Saudi mobile number',  () => expect(isValidPhone('0512345678')).toBe(true));
    test('accepts 059x numbers',               () => expect(isValidPhone('0591234567')).toBe(true));
    test('rejects number not starting with 05',() => expect(isValidPhone('0612345678')).toBe(false));
    test('rejects 9-digit number',             () => expect(isValidPhone('051234567')).toBe(false));
    test('rejects 11-digit number',            () => expect(isValidPhone('05123456789')).toBe(false));
    test('rejects number with spaces',         () => expect(isValidPhone('05 1234 5678')).toBe(false));
    test('rejects empty string',               () => expect(isValidPhone('')).toBe(false));
    test('rejects letters',                    () => expect(isValidPhone('05abcd1234')).toBe(false));
});

// ── isValidReportId ───────────────────────────────────────────────────────────
describe('isValidReportId', () => {
    test('accepts positive integer 1',          () => expect(isValidReportId('1')).toBe(true));
    test('accepts multi-digit integer',         () => expect(isValidReportId('123')).toBe(true));
    test('rejects zero',                        () => expect(isValidReportId('0')).toBe(false));
    test('rejects negative number',             () => expect(isValidReportId('-5')).toBe(false));
    test('rejects string with letters',         () => expect(isValidReportId('abc')).toBe(false));
    test('rejects RPT-style mock ID',           () => expect(isValidReportId('RPT-2026-001')).toBe(false));
    test('rejects empty string',                () => expect(isValidReportId('')).toBe(false));
    test('rejects float',                       () => expect(isValidReportId('1.5')).toBe(false));
});

// ── isValidStudentId ──────────────────────────────────────────────────────────
describe('isValidStudentId', () => {
    test('accepts exactly 7 digits',             () => expect(isValidStudentId('1234567')).toBe(true));
    test('rejects 6 digits',                     () => expect(isValidStudentId('123456')).toBe(false));
    test('rejects 8 digits',                     () => expect(isValidStudentId('12345678')).toBe(false));
    test('rejects digits with letters',          () => expect(isValidStudentId('123456a')).toBe(false));
    test('rejects empty string',                 () => expect(isValidStudentId('')).toBe(false));
    test('accepts all-zero 7-digit ID',          () => expect(isValidStudentId('0000000')).toBe(true));
});

// ── isMinLength ───────────────────────────────────────────────────────────────
describe('isMinLength', () => {
    test('passes when length equals minimum',    () => expect(isMinLength('abc', 3)).toBe(true));
    test('passes when length exceeds minimum',   () => expect(isMinLength('abcd', 3)).toBe(true));
    test('fails when length is below minimum',   () => expect(isMinLength('ab', 3)).toBe(false));
    test('trims whitespace before checking',     () => expect(isMinLength('  a  ', 3)).toBe(false));
});

// ── isMaxLength ───────────────────────────────────────────────────────────────
describe('isMaxLength', () => {
    test('passes when length equals maximum',    () => expect(isMaxLength('abc', 3)).toBe(true));
    test('passes when length is below maximum',  () => expect(isMaxLength('ab', 3)).toBe(true));
    test('fails when length exceeds maximum',    () => expect(isMaxLength('abcd', 3)).toBe(false));
    test('trims whitespace before checking',     () => expect(isMaxLength('  abcd  ', 3)).toBe(false));
});
