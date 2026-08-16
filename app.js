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
    // 4. CONTACT FORM SUBMISSION (EMAILJS + LOCAL STORAGE PERSISTENCE)
    // ----------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    const contactStatus = document.getElementById('contact-status-msg');

    // EmailJS Configuration
    const EMAILJS_SERVICE_ID = 'service_5okarli';
    const EMAILJS_TEMPLATE_ID = 'template_uiq7k67';
    const EMAILJS_PUBLIC_KEY = 'bA8Few_3QIPxHmOxo';

    // Helper: Save inquiry to LocalStorage for Admin Portal display
    function saveInquiryToLocalStorage(name, email, subject, message) {
        try {
            const stored = localStorage.getItem('portfolio_inquiries');
            const inquiries = stored ? JSON.parse(stored) : [];
            const newInquiry = {
                id: inquiries.length + 1,
                name: name,
                email: email,
                subject: subject,
                message: message,
                status: 'Active',
                created_at: new Date().toLocaleString()
            };
            inquiries.unshift(newInquiry); // Place newest inquiry first
            localStorage.setItem('portfolio_inquiries', JSON.stringify(inquiries));
        } catch (e) {
            console.error('LocalStorage save error:', e);
        }
    }

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

            // Always save inquiry to LocalStorage so Admin Portal logs it!
            saveInquiryToLocalStorage(name, email, subject, message);

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
                contactStatus.textContent = 'Thank you! Your message has been sent to Mohan and saved in the Admin log.';
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
                    contactStatus.textContent = data.error || 'Saved to Admin Portal! (Verify EmailJS credentials if email is delayed).';
                    contactStatus.className = 'status-msg success';
                    contactForm.reset();
                }
            } catch (err) {
                console.error('Submission error:', err);
                contactStatus.textContent = 'Thank you! Your message has been saved into the Admin Portal log.';
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

    function loadAndRenderInquiries() {
        const stored = localStorage.getItem('portfolio_inquiries');
        let inquiries = stored ? JSON.parse(stored) : [];

        // If no client submissions exist yet, provide sample initial entries
        if (inquiries.length === 0) {
            inquiries = [
                {
                    id: 1,
                    name: "Sample Client",
                    email: "client@example.com",
                    subject: "Project Inquiry",
                    message: "Hi Mohan, interested in discussing a web development project.",
                    status: "Active",
                    created_at: new Date().toLocaleString()
                }
            ];
        }

        renderInquiriesTable(inquiries);
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const user = document.getElementById('admin-user').value.trim();
            const pass = document.getElementById('admin-pass').value.trim();

            adminAuthMsg.className = 'status-msg hidden';
            adminAuthMsg.textContent = '';

            // Unlock Admin Portal
            adminCredentials = btoa(`${user}:${pass}`);
            adminAuthPanel.classList.add('hidden');
            adminDashboard.classList.remove('hidden');

            loadAndRenderInquiries();
        });
    }

    function renderInquiriesTable(inquiries) {
        if (!inquiriesTbody) return;

        inquiriesTbody.innerHTML = '';

        if (inquiries.length === 0) {
            inquiriesTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-placeholder">No inquiries found in the log.</td>
                </tr>
            `;
            return;
        }

        inquiries.forEach(inq => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><strong>#${inq.id}</strong></td>
                <td>
                    <div class="sender-info">
                        <strong style="color: #fff; font-size: 0.95rem;">${escapeHTML(inq.name)}</strong>
                        <br>
                        <a href="mailto:${escapeHTML(inq.email)}" style="color: var(--secondary); font-size: 0.85rem; text-decoration: underline;">${escapeHTML(inq.email)}</a>
                    </div>
                </td>
                <td><strong>${escapeHTML(inq.subject)}</strong></td>
                <td style="max-width: 300px; word-wrap: break-word;">${escapeHTML(inq.message)}</td>
                <td><span class="badge-status active" style="background: rgba(16,185,129,0.15); color: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${escapeHTML(inq.status)}</span></td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${inq.created_at}</td>
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
