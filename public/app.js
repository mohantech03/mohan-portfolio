document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. SCROLL NAVIGATION & SCROLL SPY
    // ----------------------------------------------------
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.page-section');
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    const navMenu = document.querySelector('.nav-links');
    const navToggle = document.querySelector('.nav-toggle');

    // Smooth scroll on navbar click
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-tab');
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                // If mobile nav is open, close it
                if (navMenu && navMenu.classList.contains('show')) {
                    navMenu.classList.remove('show');
                }

                targetElement.scrollIntoView({ behavior: 'smooth' });
                // Push hash state without scrolling jump
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });

    // Smooth scroll on trigger CTA clicks (e.g. "Explore Projects")
    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = trigger.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });

    // Scroll Spy using IntersectionObserver
    const observerOptions = {
        root: null,
        rootMargin: '-40% 0px -50% 0px', // check if section is in middle of viewport
        threshold: 0
    };

    const scrollSpyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    if (link.getAttribute('data-tab') === sectId) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        scrollSpyObserver.observe(section);
    });

    // Initial check on load for hash navigation
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        setTimeout(() => {
            const targetElement = document.getElementById(initialHash);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }

    // ----------------------------------------------------
    // 2. MOBILE MENU INTERACTION
    // ----------------------------------------------------
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
            navToggle.classList.toggle('open');
        });
    }

    // ----------------------------------------------------
    // 3. PROJECT FILTERING
    // ----------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button styling
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            // Toggle project card visibility
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // ----------------------------------------------------
    // 4. CONTACT FORM SUBMISSION (EMAILJS + BACKEND AJAX)
    // ----------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    const contactStatus = document.getElementById('contact-status-msg');

    // EmailJS Configuration
    const EMAILJS_SERVICE_ID = 'service_5okarli';
    const EMAILJS_TEMPLATE_ID = 'template_359pybl';
    const EMAILJS_PUBLIC_KEY = 'bA8Few_3QIPxHmOxo';

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('form-submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            const name = document.getElementById('form-name').value;
            const email = document.getElementById('form-email').value;
            const subject = document.getElementById('form-subject').value;
            const message = document.getElementById('form-message').value;

            // Clear previous message
            contactStatus.className = 'status-msg hidden';
            contactStatus.textContent = '';

            let sentViaEmailJS = false;

            // Attempt EmailJS dispatch if SDK loaded
            if (window.emailjs && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
                try {
                    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                        from_name: name,
                        from_email: email,
                        subject: subject,
                        message: message,
                        to_name: 'Mohan Ashokan'
                    }, EMAILJS_PUBLIC_KEY);

                    sentViaEmailJS = true;
                } catch (emailErr) {
                    console.warn('EmailJS error, falling back to local backend API:', emailErr);
                }
            }

            // Always save to local database API as well
            try {
                const response = await fetch('/api/inquiries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message })
                });

                const data = await response.json();

                if (response.ok || sentViaEmailJS) {
                    contactStatus.textContent = 'Thank you! Your message has been sent successfully.';
                    contactStatus.className = 'status-msg success';
                    contactForm.reset();
                } else {
                    contactStatus.textContent = data.error || 'Failed to submit message. Please try again.';
                    contactStatus.className = 'status-msg error';
                }
            } catch (err) {
                if (sentViaEmailJS) {
                    contactStatus.textContent = 'Thank you! Your message has been sent via EmailJS.';
                    contactStatus.className = 'status-msg success';
                    contactForm.reset();
                } else {
                    console.error('Submission error:', err);
                    contactStatus.textContent = 'Network error. Please try again later.';
                    contactStatus.className = 'status-msg error';
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
        });
    }

    // ----------------------------------------------------
    // 5. SECURE ADMIN COMMS PANEL
    // ----------------------------------------------------
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminAuthPanel = document.getElementById('admin-auth-panel');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminAuthMsg = document.getElementById('admin-auth-msg');
    const inquiriesTbody = document.getElementById('inquiries-tbody');
    const logoutBtn = document.getElementById('admin-logout-btn');

    let adminCredentials = null; // Store base64 authentication string in memory

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user = document.getElementById('admin-user').value;
            const pass = document.getElementById('admin-pass').value;

            adminAuthMsg.className = 'status-msg hidden';
            adminAuthMsg.textContent = '';

            // Construct Basic Auth Header string
            const credsBase64 = btoa(`${user}:${pass}`);

            try {
                const response = await fetch('/api/admin/inquiries', {
                    headers: {
                        'Authorization': `Basic ${credsBase64}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    adminCredentials = credsBase64; // Save successful authorization

                    // Show dashboard
                    adminAuthPanel.classList.add('hidden');
                    adminDashboard.classList.remove('hidden');

                    renderInquiriesTable(data);
                } else {
                    adminAuthMsg.textContent = 'Invalid administrative credentials.';
                    adminAuthMsg.className = 'status-msg error';
                }
            } catch (err) {
                console.error('Admin fetch error:', err);
                adminAuthMsg.textContent = 'Error connecting to database. Is backend server running?';
                adminAuthMsg.className = 'status-msg error';
            }
        });
    }

    function renderInquiriesTable(inquiries) {
        if (!inquiriesTbody) return;

        inquiriesTbody.innerHTML = '';

        if (inquiries.length === 0) {
            inquiriesTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-placeholder">No inquiries found in the database.</td>
                </tr>
            `;
            return;
        }

        inquiries.forEach(inq => {
            const tr = document.createElement('tr');

            // Format date nicely
            const dateStr = new Date(inq.created_at).toLocaleString();

            tr.innerHTML = `
                <td><strong>#${inq.id}</strong></td>
                <td>
                    <div class="sender-info">
                        <strong>${escapeHTML(inq.name)}</strong>
                        <span>${escapeHTML(inq.email)}</span>
                    </div>
                </td>
                <td><strong>${escapeHTML(inq.subject)}</strong></td>
                <td>${escapeHTML(inq.message)}</td>
                <td><span class="badge-status active">${escapeHTML(inq.status)}</span></td>
                <td>${dateStr}</td>
            `;
            inquiriesTbody.appendChild(tr);
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            adminCredentials = null;
            adminLoginForm.reset();

            // Reset to Auth panel
            adminDashboard.classList.add('hidden');
            adminAuthPanel.classList.remove('hidden');
        });
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
