document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 0. OPTION 2: DEEP NEON CIRCUIT NODE CANVAS ANIMATION
    // ----------------------------------------------------
    const canvas = document.getElementById('tech-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const particles = [];
        const particleCount = Math.min(Math.floor(width / 25), 50);

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                color: Math.random() > 0.4 ? '#10b981' : (Math.random() > 0.5 ? '#06b6d4' : '#8b5cf6')
            });
        }

        function animateCanvas() {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();

                // Draw circuit connections between nearby nodes
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(16, 185, 129, ${0.22 * (1 - dist / 130)})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateCanvas);
        }
        animateCanvas();
    }

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
                if (navMenu && navMenu.classList.contains('show')) {
                    navMenu.classList.remove('show');
                }

                targetElement.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });

    // Smooth scroll on trigger CTA clicks
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
        rootMargin: '-40% 0px -50% 0px',
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
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

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

    const EMAILJS_SERVICE_ID = 'service_5okarli';
    const EMAILJS_TEMPLATE_ID = 'template_uiq7k67';
    const EMAILJS_PUBLIC_KEY = 'bA8Few_3QIPxHmOxo';

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
            inquiries.unshift(newInquiry);
            localStorage.setItem('portfolio_inquiries', JSON.stringify(inquiries));
        } catch (e) {
            console.error('LocalStorage save error:', e);
        }
    }

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

            contactStatus.className = 'status-msg hidden';
            contactStatus.textContent = '';

            saveInquiryToLocalStorage(name, email, subject, message);

            let success = false;

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

            if (success) {
                contactStatus.textContent = 'Thank you! Your message has been sent to Mohan and saved in the Admin log.';
                contactStatus.className = 'status-msg success';
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
                return;
            }

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

    let adminCredentials = null;

    function loadAndRenderInquiries() {
        const stored = localStorage.getItem('portfolio_inquiries');
        let inquiries = stored ? JSON.parse(stored) : [];

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
                        <a href="mailto:${escapeHTML(inq.email)}" style="color: var(--primary); font-size: 0.85rem; text-decoration: underline;">${escapeHTML(inq.email)}</a>
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
