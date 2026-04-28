// UJ Campus Finder — Main JS

document.addEventListener("DOMContentLoaded", () => {

    // ---- Mobile nav toggle ----
    const toggle = document.getElementById("navToggle");
    const links  = document.getElementById("navLinks");

    if (toggle && links) {
        toggle.addEventListener("click", () => {
            const isOpen = links.classList.toggle("open");
            toggle.innerHTML = isOpen
                ? '<i class="fa-solid fa-xmark"></i>'
                : '<i class="fa-solid fa-bars"></i>';
        });

        links.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                links.classList.remove("open");
                toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
            });
        });
    }

    // ---- Mobile filter toggle ----
    const filterHd = document.querySelector('.rpt-sidebar__hd');
    const rptSidebar = document.querySelector('.rpt-sidebar');
    if (filterHd && rptSidebar) {
        filterHd.addEventListener('click', (e) => {
            if (window.innerWidth <= 900 && e.target.id !== 'clearFilters') {
                rptSidebar.classList.toggle('is-open');
            }
        });
    }

    initClaimForm();
    initContactForm();
});

/* ================================================
   SHARED FORM UX UTILITIES
   ================================================ */

/** Validate one field silently; returns error message or '' for valid. */
function validateField({ id, label, validate, minLen }) {
    const el = document.getElementById(id);
    if (!el) return '';
    const v = el.value.trim();
    if (!v)                          return `${label} is required.`;
    if (minLen && v.length < minLen) return `${label} must be at least ${minLen} characters.`;
    if (validate)                    return validate(v);
    return '';
}

/** Apply error / success / neutral visual state to one field. */
function applyFieldState(field, msg) {
    const el  = document.getElementById(field.id);
    const err = document.getElementById(field.errId);
    if (!el || !err) return;
    if (msg) {
        err.textContent = msg;
        el.classList.add('is-err');
        el.classList.remove('is-ok');
    } else if (el.value.trim()) {
        err.textContent = '';
        el.classList.remove('is-err');
        el.classList.add('is-ok');
    } else {
        err.textContent = '';
        el.classList.remove('is-err', 'is-ok');
    }
}

/** Validate all fields and apply states. Returns true if all pass. */
function runFormValidation(fields) {
    let firstInvalid = null;
    let allValid = true;
    fields.forEach(field => {
        const msg = validateField(field);
        applyFieldState(field, msg);
        if (msg && !firstInvalid) firstInvalid = document.getElementById(field.id);
        if (msg) allValid = false;
    });
    if (firstInvalid) firstInvalid.focus();
    return allValid;
}

/** Keep the submit button enabled only when every field currently passes. */
function syncSubmitBtn(fields, btn) {
    if (!btn) return;
    btn.disabled = !fields.every(f => validateField(f) === '');
}

/**
 * Attach real-time per-field validation:
 *   blur  → validate after the first meaningful interaction
 *   input → re-validate once the field has been touched or carries an error
 * Both events also re-evaluate the submit button state.
 */
function attachLiveValidation(fields, btn) {
    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (!el) return;
        let touched = false;

        el.addEventListener('blur', () => {
            const hasValue = el.value.trim().length > 0;
            const wasOk    = el.classList.contains('is-ok');
            // Skip showing "required" on a first-ever empty blur
            if (!hasValue && !wasOk && !touched) return;
            touched = true;
            applyFieldState(field, validateField(field));
            syncSubmitBtn(fields, btn);
        });

        el.addEventListener('input', () => {
            if (touched || el.classList.contains('is-err')) {
                applyFieldState(field, validateField(field));
            }
            syncSubmitBtn(fields, btn);
        });
    });
}

/** Strip any non-digit characters as the user types. */
function restrictToDigits(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
        const clean = el.value.replace(/\D/g, '');
        if (el.value !== clean) el.value = clean;
    });
}

/** Auto-convert input to uppercase as the user types. */
function autoUppercase(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
        const up = el.value.toUpperCase();
        if (el.value !== up) el.value = up;
    });
}

/** Toggle the submit button into a loading / restored state. */
function setLoading(btn, loading, originalLabel) {
    if (loading) {
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting…';
        btn.disabled  = true;
    } else {
        btn.innerHTML = originalLabel;
    }
}

/** Show a page-level toast notification (reuses the .rpt-toast style). */
function showPageToast(toastId, msg) {
    const toast = document.getElementById(toastId);
    if (!toast) return;
    const span = toast.querySelector('.toast-msg');
    if (span) span.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4200);
}

/* ---- Claim form ---- */
function initClaimForm() {
    const form      = document.getElementById('claimForm');
    const submitBtn = document.getElementById('claimSubmitBtn');
    const successEl = document.getElementById('claimSuccessMsg');
    if (!form || !submitBtn) return;

    autoUppercase('cReportId');
    restrictToDigits('cStudentId');
    restrictToDigits('cPhone');

    const FIELDS = [
        {
            id: 'cReportId', errId: 'errCReportId', label: 'Report ID',
            validate: v => isValidReportId(v) ? '' : 'Report ID must follow this format: RPT-2026-001.'
        },
        {
            id: 'cName', errId: 'errCName', label: 'Full name',
            validate: v => isValidName(v) ? '' : 'Name must contain letters only and be between 2 and 60 characters.'
        },
        {
            id: 'cStudentId', errId: 'errCStudentId', label: 'Student/Staff ID',
            validate: v => isValidStudentId(v) ? '' : 'Student/Staff ID must be exactly 7 digits.'
        },
        {
            id: 'cEmail', errId: 'errCEmail', label: 'University email',
            validate: v => isValidUJEmail(v) ? '' : 'Please use your University of Jeddah email address (@uj.edu.sa).'
        },
        {
            id: 'cPhone', errId: 'errCPhone', label: 'Phone number',
            validate: v => isValidPhone(v) ? '' : 'Phone number must start with 05 and contain exactly 10 digits.'
        },
        { id: 'cProof', errId: 'errCProof', label: 'Proof of ownership', minLen: 20 }
    ];

    submitBtn.disabled = true;
    attachLiveValidation(FIELDS, submitBtn);

    const originalLabel = submitBtn.innerHTML;

    submitBtn.addEventListener('click', () => {
        if (!runFormValidation(FIELDS)) return;

        setLoading(submitBtn, true, originalLabel);

        setTimeout(() => {
            form.hidden = true;
            if (successEl) successEl.hidden = false;
        }, 900);
    });
}

/* ---- Contact form ---- */
function initContactForm() {
    const form      = document.getElementById('contactForm');
    const submitBtn = document.getElementById('contactSubmitBtn');
    if (!form || !submitBtn) return;

    const FIELDS = [
        {
            id: 'ctName', errId: 'errCtName', label: 'Full name',
            validate: v => isValidName(v) ? '' : 'Name must contain letters only and be between 2 and 60 characters.'
        },
        {
            id: 'ctEmail', errId: 'errCtEmail', label: 'Email address',
            validate: v => isValidEmail(v) ? '' : 'Enter a valid email address.'
        },
        { id: 'ctSubject', errId: 'errCtSubject', label: 'Subject', minLen: 3 },
        { id: 'ctMessage', errId: 'errCtMessage', label: 'Message', minLen: 10 }
    ];

    submitBtn.disabled = true;
    attachLiveValidation(FIELDS, submitBtn);

    const originalLabel = submitBtn.innerHTML;

    submitBtn.addEventListener('click', () => {
        if (!runFormValidation(FIELDS)) return;

        setLoading(submitBtn, true, originalLabel);

        setTimeout(() => {
            form.reset();
            FIELDS.forEach(({ id, errId }) => {
                const el  = document.getElementById(id);
                const err = document.getElementById(errId);
                if (el)  el.classList.remove('is-err', 'is-ok');
                if (err) err.textContent = '';
            });
            setLoading(submitBtn, false, originalLabel);
            submitBtn.disabled = true;
            showPageToast('contactToast', "Message sent! We’ll get back to you soon.");
        }, 900);
    });
}

// =====================================================
// REPORTS PAGE — mock data + interactive UI
// =====================================================
(function () {

    /* ---- Mock report data ---- */
    const MOCK_REPORTS = [
        {
            id: 'RPT-2026-001',
            type: 'lost',
            title: 'HP Laptop — Blue Cover',
            category: 'Electronics',
            location: 'Central Library',
            date: '2026-04-22',
            desc: 'Lost my HP laptop (15-inch, blue cover) on the 2nd floor of the library. It has a UJ sticker on the lid and a small scratch on the left corner.',
            reporter: 'Abdullah Al-Zahrani',
            status: 'active'
        },
        {
            id: 'RPT-2026-002',
            type: 'found',
            title: 'Black Leather Wallet',
            category: 'Bags & Wallets',
            location: 'Cafeteria',
            date: '2026-04-21',
            desc: 'Found a black leather wallet near the cafeteria main entrance. Contains student cards and some cash. Currently with campus security.',
            reporter: 'Sara Al-Otaibi',
            status: 'active'
        },
        {
            id: 'RPT-2026-003',
            type: 'lost',
            title: 'AirPods Pro — White Case',
            category: 'Electronics',
            location: 'Science Building',
            date: '2026-04-20',
            desc: 'Lost my AirPods Pro in a white MagSafe charging case. Last seen in the Science Building ground floor area near the vending machines.',
            reporter: 'Khalid Al-Harbi',
            status: 'active'
        },
        {
            id: 'RPT-2026-004',
            type: 'found',
            title: 'UJ Student ID Card',
            category: 'Keys & Cards',
            location: 'Parking Area',
            date: '2026-04-19',
            desc: 'Found a UJ student ID card in the main parking lot near Building C entrance. Name is visible on the card.',
            reporter: 'Nora Al-Qahtani',
            status: 'active'
        },
        {
            id: 'RPT-2026-005',
            type: 'lost',
            title: 'Green Hydro Flask (750ml)',
            category: 'Other',
            location: 'Sports Complex',
            date: '2026-04-18',
            desc: 'Lost a green 750ml Hydro Flask bottle with several stickers on the side. Left it in the changing room after basketball practice.',
            reporter: 'Faisal Al-Ghamdi',
            status: 'claimed'
        },
        {
            id: 'RPT-2026-006',
            type: 'found',
            title: 'Gray Hoodie — UJ Logo',
            category: 'Clothing & Accessories',
            location: 'Engineering Building',
            date: '2026-04-17',
            desc: 'Found a gray hoodie with the UJ logo left on a chair in classroom 204. Still in very good condition. Stored at the building reception.',
            reporter: 'Leen Al-Shamrani',
            status: 'active'
        },
        {
            id: 'RPT-2026-007',
            type: 'lost',
            title: 'Calculus Textbook (Stewart)',
            category: 'Books & Stationery',
            location: 'Central Library',
            date: '2026-04-16',
            desc: 'Lost Calculus textbook by Stewart (8th edition, blue cover) with extensive handwritten notes throughout the chapters.',
            reporter: 'Omar Al-Dosari',
            status: 'active'
        },
        {
            id: 'RPT-2026-008',
            type: 'found',
            title: 'Toyota Car Keys',
            category: 'Keys & Cards',
            location: 'Admin Block',
            date: '2026-04-15',
            desc: 'Found Toyota car keys with a distinctive red fabric keychain near the admin block reception desk. Handed to the security office.',
            reporter: 'Hana Al-Rashidi',
            status: 'active'
        }
    ];

    /* ---- Format date as "22 Apr 2026" ---- */
    function fmtDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    /* ---- Build a single card HTML string ---- */
    function buildCard(r) {
        const isLost = r.type === 'lost';

        const typePill = isLost
            ? `<span class="rcard__type"><i class="fa-solid fa-triangle-exclamation"></i> Lost</span>`
            : `<span class="rcard__type"><i class="fa-solid fa-circle-dot"></i> Found</span>`;

        const statusLabels = { active: 'Active', claimed: 'Claimed', resolved: 'Resolved' };
        const statusPill = `<span class="rcard__status rcard__status--${r.status}">${statusLabels[r.status] || r.status}</span>`;

        const claimBtn = !isLost
            ? `<a href="claim.html?id=${r.id}" class="rcard-btn rcard-btn--claim"><i class="fa-solid fa-hand"></i> Claim Item</a>`
            : '';

        return `
<div class="report-card report-card--${r.type}"
     data-type="${r.type}"
     data-loc="${r.location}"
     data-status="${r.status}"
     data-date="${r.date}"
     data-search="${(r.title + ' ' + r.desc + ' ' + r.location + ' ' + r.reporter).toLowerCase()}">
    <div class="rcard__strip"></div>
    <div class="rcard__inner">
        <div class="rcard__head">
            <div class="rcard__badges">${typePill}${statusPill}</div>
            <span class="rcard__id">${r.id}</span>
        </div>
        <div class="rcard__body">
            <h3 class="rcard__title">${r.title}</h3>
            <div class="rcard__meta">
                <span class="rcard__mi"><i class="fa-solid fa-location-dot"></i> ${r.location}</span>
                <span class="rcard__mi"><i class="fa-regular fa-calendar"></i> ${fmtDate(r.date)}</span>
            </div>
            <p class="rcard__desc">${r.desc}</p>
        </div>
        <div class="rcard__foot">
            <span class="rcard__reporter"><i class="fa-solid fa-circle-user"></i> ${r.reporter}</span>
            <div class="rcard__actions">
                <button class="rcard-btn rcard-btn--view" type="button" data-id="${r.id}">
                    <i class="fa-solid fa-eye"></i> View Details
                </button>
                ${claimBtn}
            </div>
        </div>
    </div>
</div>`;
    }

    /* ---- Collect active filter values ---- */
    function getFilters() {
        const typeEl = document.querySelector('input[name="filterType"]:checked');
        const locEls = [...document.querySelectorAll('input[name="filterLoc"]:checked')];
        const stEls  = [...document.querySelectorAll('input[name="filterStatus"]:checked')];
        const searchEl = document.getElementById('searchInput');
        const sortEl   = document.getElementById('sortSelect');
        return {
            type:   typeEl ? typeEl.value : 'all',
            locs:   locEls.map(el => el.value),
            statuses: stEls.map(el => el.value),
            search: searchEl ? searchEl.value.toLowerCase().trim() : '',
            sort:   sortEl ? sortEl.value : 'newest'
        };
    }

    /* ---- Filter + sort reports ---- */
    function filterReports() {
        const f = getFilters();
        let list = [...MOCK_REPORTS];

        if (f.type !== 'all')      list = list.filter(r => r.type === f.type);
        if (f.locs.length)         list = list.filter(r => f.locs.includes(r.location));
        if (f.statuses.length)     list = list.filter(r => f.statuses.includes(r.status));
        if (f.search) {
            list = list.filter(r => {
                const hay = (r.title + ' ' + r.desc + ' ' + r.location + ' ' + r.reporter).toLowerCase();
                return hay.includes(f.search);
            });
        }

        switch (f.sort) {
            case 'oldest': list.sort((a, b) => a.date.localeCompare(b.date)); break;
            case 'az':     list.sort((a, b) => a.title.localeCompare(b.title)); break;
            case 'za':     list.sort((a, b) => b.title.localeCompare(a.title)); break;
            default:       list.sort((a, b) => b.date.localeCompare(a.date)); break;
        }
        return list;
    }

    /* ---- Render report cards ---- */
    function renderReports() {
        const grid    = document.getElementById('reportsGrid');
        const countEl = document.getElementById('rptCount');
        const emptyEl = document.getElementById('rptEmpty');
        if (!grid) return;

        const list = filterReports();

        if (list.length === 0) {
            grid.innerHTML = '';
            grid.style.display = 'none';
            if (emptyEl) emptyEl.style.display = '';
            if (countEl) countEl.innerHTML = 'No reports found';
        } else {
            grid.style.display = '';
            if (emptyEl) emptyEl.style.display = 'none';
            grid.innerHTML = list.map(buildCard).join('');
            if (countEl) {
                countEl.innerHTML = `Showing <strong>${list.length}</strong> report${list.length !== 1 ? 's' : ''}`;
            }
        }
    }

    /* ---- Show success toast ---- */
    function showToast(msg) {
        const toast = document.getElementById('rptToast');
        const msgEl = document.getElementById('toastMsg');
        if (!toast) return;
        if (msgEl) msgEl.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3600);
    }

    /* ---- Reset all filters to defaults ---- */
    function resetFilters() {
        const allRadio = document.querySelector('input[name="filterType"][value="all"]');
        if (allRadio) allRadio.checked = true;
        document.querySelectorAll('input[name="filterLoc"]')
            .forEach(el => { el.checked = false; });
        document.querySelectorAll('input[name="filterStatus"]')
            .forEach(el => { el.checked = el.value === 'active'; });
        const searchEl = document.getElementById('searchInput');
        if (searchEl) searchEl.value = '';
        renderReports();
    }

    /* ---- Modal logic ---- */
    function initModal() {
        const overlay    = document.getElementById('reportModal');
        const closeBtn   = document.getElementById('modalClose');
        const cancelBtn  = document.getElementById('modalCancel');
        const submitBtn  = document.getElementById('submitReport');
        const btnLost    = document.getElementById('btnReportLost');
        const btnFound   = document.getElementById('btnReportFound');
        const typeSel    = document.getElementById('typeSelector');
        const typeHidden = document.getElementById('reportType');
        const photoPickBtn = document.getElementById('photoPickBtn');
        const photoInput   = document.getElementById('fItemPhoto');
        const photoName    = document.getElementById('photoFileName');
        const photoPreview = document.getElementById('photoPreview');
        const dateInput    = document.getElementById('fItemDate');

        if (!overlay) return;

        /* Set default date to today */
        if (dateInput) {
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');
            dateInput.value = `${y}-${m}-${d}`;
            dateInput.max   = `${y}-${m}-${d}`;
        }

        const openModal = (type) => {
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            if (type && typeSel && typeHidden) {
                typeHidden.value = type;
                typeSel.querySelectorAll('.type-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.type === type);
                });
                const title = document.getElementById('modalTitle');
                if (title) title.textContent = type === 'lost' ? 'Report a Lost Item' : 'Report a Found Item';
            }
        };

        const closeModal = () => {
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        };

        btnLost?.addEventListener('click', () => openModal('lost'));
        btnFound?.addEventListener('click', () => openModal('found'));
        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

        /* Escape key */
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
        });

        /* In-modal type toggle */
        typeSel?.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                typeSel.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (typeHidden) typeHidden.value = btn.dataset.type;
            });
        });

        /* Photo upload */
        photoPickBtn?.addEventListener('click', () => photoInput?.click());
        photoInput?.addEventListener('change', () => {
            const file = photoInput.files[0];
            if (file) {
                if (photoName) photoName.textContent = file.name;
                if (photoPreview) {
                    photoPreview.src = URL.createObjectURL(file);
                    photoPreview.hidden = false;
                }
            }
        });

        /* Validation fields config */
        const FIELDS = [
            { id: 'fItemTitle',   errId: 'errItemTitle',   label: 'Item name' },
            { id: 'fItemLoc',     errId: 'errItemLoc',     label: 'Location' },
            { id: 'fItemDate',    errId: 'errItemDate',    label: 'Date' },
            { id: 'fItemDesc',    errId: 'errItemDesc',    label: 'Description' },
            { id: 'fRepName',     errId: 'errRepName',     label: 'Your name' },
            { id: 'fRepContact',  errId: 'errRepContact',  label: 'Contact info' }
        ];

        /* Clear form helper */
        function clearForm() {
            FIELDS.forEach(({ id, errId }) => {
                const el  = document.getElementById(id);
                const err = document.getElementById(errId);
                if (el)  { el.value = ''; el.classList.remove('is-err'); }
                if (err) err.textContent = '';
            });
            if (photoPreview) { photoPreview.src = ''; photoPreview.hidden = true; }
            if (photoName) photoName.textContent = 'No file selected';
            if (photoInput) photoInput.value = '';
            /* Reset date */
            if (dateInput) {
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const d2 = String(today.getDate()).padStart(2, '0');
                dateInput.value = `${y}-${m}-${d2}`;
            }
        }

        /* Submit */
        submitBtn?.addEventListener('click', () => {
            let valid = true;
            FIELDS.forEach(({ id, errId, label }) => {
                const el  = document.getElementById(id);
                const err = document.getElementById(errId);
                if (!el || !err) return;
                if (!el.value.trim()) {
                    err.textContent = `${label} is required.`;
                    el.classList.add('is-err');
                    valid = false;
                } else {
                    err.textContent = '';
                    el.classList.remove('is-err');
                }
            });
            if (!valid) return;

            /* Build new report and prepend to mock data */
            const newReport = {
                id:       `RPT-2026-${String(MOCK_REPORTS.length + 1).padStart(3, '0')}`,
                type:     typeHidden ? typeHidden.value : 'lost',
                title:    document.getElementById('fItemTitle').value.trim(),
                location: document.getElementById('fItemLoc').value,
                date:     document.getElementById('fItemDate').value,
                desc:     document.getElementById('fItemDesc').value.trim(),
                reporter: document.getElementById('fRepName').value.trim(),
                status:   'active'
            };
            MOCK_REPORTS.unshift(newReport);

            closeModal();
            clearForm();
            renderReports();
            showToast('Report submitted successfully!');
        });

        /* Live validation: clear error as user types */
        FIELDS.forEach(({ id, errId }) => {
            const el  = document.getElementById(id);
            const err = document.getElementById(errId);
            if (!el || !err) return;
            el.addEventListener('input', () => {
                if (el.value.trim()) {
                    err.textContent = '';
                    el.classList.remove('is-err');
                }
            });
        });
    }

    /* ---- View Details Modal Logic ---- */
    function initDetailsModal() {
        const overlay = document.getElementById('detailsModal');
        const closeBtn = document.getElementById('detailsModalClose');
        const cancelBtn = document.getElementById('detailsModalCancel');
        const bodyEl = document.getElementById('detailsModalBody');
        const grid = document.getElementById('reportsGrid');

        if (!overlay || !grid) return;

        const closeModal = () => {
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        };

        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
        });

        grid.addEventListener('click', (e) => {
            const btn = e.target.closest('.rcard-btn--view');
            if (!btn) return;
            
            const rId = btn.dataset.id;
            const report = MOCK_REPORTS.find(r => r.id === rId);
            if (!report) return;

            // Populate body
            bodyEl.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <strong style="color: var(--color-text);"><i class="fa-solid fa-tag"></i> Item Name:</strong> ${report.title}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong style="color: var(--color-text);"><i class="fa-solid fa-location-dot"></i> Location:</strong> ${report.location}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong style="color: var(--color-text);"><i class="fa-regular fa-calendar"></i> Date:</strong> ${fmtDate(report.date)}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong style="color: var(--color-text);"><i class="fa-solid fa-circle-info"></i> Status:</strong> <span style="text-transform: capitalize;">${report.status}</span>
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong style="color: var(--color-text);"><i class="fa-solid fa-align-left"></i> Description:</strong>
                    <p style="margin-top: 0.5rem; color: var(--color-text-muted);">${report.desc || 'No description provided.'}</p>
                </div>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
                    <strong style="color: var(--color-text);"><i class="fa-solid fa-user"></i> Reported by:</strong> ${report.reporter}
                </div>
            `;

            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    }

    /* ---- Wire up the reports page ---- */
    function initReportsPage() {
        if (!document.getElementById('reportsGrid')) return;

        /* Initial render */
        renderReports();

        /* Filters */
        document.querySelectorAll(
            'input[name="filterType"], input[name="filterLoc"], input[name="filterStatus"]'
        ).forEach(el => el.addEventListener('change', renderReports));

        /* Search */
        document.getElementById('searchInput')?.addEventListener('input', renderReports);

        /* Sort */
        document.getElementById('sortSelect')?.addEventListener('change', renderReports);

        /* View toggle */
        const grid    = document.getElementById('reportsGrid');
        const btnGrid = document.getElementById('btnGrid');
        const btnList = document.getElementById('btnList');
        btnGrid?.addEventListener('click', () => {
            grid.classList.remove('list-view');
            btnGrid.classList.add('active');
            btnList.classList.remove('active');
        });
        btnList?.addEventListener('click', () => {
            grid.classList.add('list-view');
            btnList.classList.add('active');
            btnGrid.classList.remove('active');
        });

        /* Clear / reset filters */
        document.getElementById('clearFilters')?.addEventListener('click', resetFilters);
        document.getElementById('resetFiltersBtn')?.addEventListener('click', resetFilters);

        /* Modal */
        initModal();
        initDetailsModal();
    }

    /* ---- Wire up the claim page ---- */
    function initClaimPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const reportId = urlParams.get('id');
        if (reportId) {
            const inputEl = document.getElementById('cReportId');
            if (inputEl) {
                inputEl.value = reportId;
                inputEl.setAttribute('readonly', true);
                inputEl.style.backgroundColor = 'var(--color-bg)';
                inputEl.style.color = 'var(--color-text-muted)';
                inputEl.style.cursor = 'not-allowed';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initReportsPage();
        initClaimPage();
    });

})();
