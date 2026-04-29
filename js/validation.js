// UJ Campus Finder — Form Validation

/** Returns true if value is non-empty after trimming. */
function isRequired(value) {
    return value !== null && value.trim().length > 0;
}

/** Standard email format. */
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** UJ-specific email — must end with @uj.edu.sa */
function isValidUJEmail(value) {
    return /^[^\s@]+@uj\.edu\.sa$/i.test(value.trim());
}

/**
 * Human name: Arabic or English letters only, single spaces between words.
 * 2–60 characters (after trimming).
 */
function isValidName(value) {
    const v = value.trim();
    if (v.length < 2 || v.length > 60) return false;
    return /^[a-zA-Z؀-ۿ]+( [a-zA-Z؀-ۿ]+)*$/.test(v);
}

/** Saudi mobile number: starts with 05, exactly 10 digits. */
function isValidPhone(value) {
    return /^05[0-9]{8}$/.test(value.trim());
}

/**
 * Report ID: a positive integer (the auto-increment id from the database).
 * Example: 1, 2, 17 …
 */
function isValidReportId(value) {
    return /^[1-9][0-9]*$/.test(value.trim());
}

/** UJ student/staff ID: exactly 7 numeric digits. */
function isValidStudentId(value) {
    return /^[0-9]{7}$/.test(value.trim());
}

function isMinLength(value, min) {
    return value.trim().length >= min;
}

function isMaxLength(value, max) {
    return value.trim().length <= max;
}
