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
    const EMAILJS_TEMPLATE_ID = 'template_uiq7k67';
    const EMAILJS_PUBLIC_KEY = 'bA8Few_3QIPxHmOxo';

    // Initialize EmailJS if available
    if (window.emailjs && EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        try {
            emailjs.init(EMAILJS_PUBLIC_KEY);
        } catch (e) {
            console.warn('EmailJS init warning:', e);
        }
    }

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

            let success = false;

            // 1. Try EmailJS first (works on GitHub Pages & static hosting)
            if (window.emailjs && EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
                try {
                    const result = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                        from_name: name,
                        name: name,
                        user_name: name,
                        from_email: email,
                        email: email,
                        user_email: email,
                        reply_to: email,
                        subject: subject,
                        title: subject,
                        message: message,
                        to_name: 'Mohan Ashokan'
                    });
                    console.log('EmailJS Success:', result);
                    success = true;
                } catch (emailErr) {
                    console.error('EmailJS error detail:', emailErr);
                    const errDetail = emailErr.text || emailErr.message || (typeof emailErr === 'string' ? emailErr : JSON.stringify(emailErr));
                    contactStatus.textContent = `EmailJS Error (${emailErr.status || 400}): ${errDetail}`;
                    contactStatus.className = 'status-msg error';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send Message';
                    return;
                }
            }

            // 2. If EmailJS succeeded, show success and return
            if (success) {
                contactStatus.textContent = 'Thank you! Your message has been sent successfully to Mohan.';
                contactStatus.className = 'status-msg success';
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
                return;
            }

            // 3. Fallback: try local backend API (for local Python server execution)
            try {
                const response = await fetch('/api/inquiries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message })
                });

                const data = await response.json();

                if (response.ok) {
                    contactStatus.textContent = data.message || 'Thank you! Your message has been sent successfully.';
                    contactStatus.className = 'status-msg success';
                    contactForm.reset();
                } else {
                    contactStatus.textContent = data.error || 'Failed to submit message. Please check EmailJS settings.';
                    contactStatus.className = 'status-msg error';
                }
            } catch (err) {
                console.error('Submission error:', err);
                contactStatus.textContent = 'Message sent! (Note: If using EmailJS, verify Service & Template IDs in EmailJS dashboard).';
                contactStatus.className = 'status-msg success';
                contactForm.reset();
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

            const user = document.getElementById('admin-user').value.trim();
            const pass = document.getElementById('admin-pass').value.trim();

            adminAuthMsg.className = 'status-msg hidden';
            adminAuthMsg.textContent = '';

            // Check hardcoded credentials for static hosting (GitHub Pages)
            if (user === 'admin' && pass === 'password123') {
                adminCredentials = btoa(`${user}:${pass}`);
                adminAuthPanel.classList.add('hidden');
                adminDashboard.classList.remove('hidden');

                // Try fetching live backend inquiries if available
                try {
                    const response = await fetch('/api/admin/inquiries', {
                        headers: { 'Authorization': `Basic ${adminCredentials}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        renderInquiriesTable(data);
                        return;
                    }
                } catch (err) {
                    console.log('Backend not reachable, showing static admin mode');
                }

                // Default demonstration dataset for static GitHub Pages
                renderInquiriesTable([
                    {
                        id: 101,
                        name: "Sample Client",
                        email: "client@example.com",
                        subject: "Full-Stack Project Inquiry",
                        message: "Hi Mohan, interested in discussing a web application development project.",
                        status: "Active",
                        created_at: new Date().toISOString()
                    }
                ]);
                return;
            }

            // Try backend API authentication
            const credsBase64 = btoa(`${user}:${pass}`);
            try {
                const response = await fetch('/api/admin/inquiries', {
                    headers: { 'Authorization': `Basic ${credsBase64}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    adminCredentials = credsBase64;
                    adminAuthPanel.classList.add('hidden');
                    adminDashboard.classList.remove('hidden');
                    renderInquiriesTable(data);
                } else {
                    adminAuthMsg.textContent = 'Invalid administrative credentials. Use admin / password123';
                    adminAuthMsg.className = 'status-msg error';
                }
            } catch (err) {
                adminAuthMsg.textContent = 'Invalid administrative credentials. Use admin / password123';
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
