document.querySelectorAll('.faq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const filter = tab.dataset.filter;
    document.querySelectorAll('.portfolio-item').forEach(item => {
      const categories = (item.dataset.category || '').split(' ');
      const matches = filter === 'all' || categories.includes(filter);
      item.style.display = matches ? '' : 'none';
    });
  });
});

// Contact / estimate request form
//
// ACTIVE: mailto fallback (no backend needed) — opens the visitor's email app
// pre-filled with their request. Can't attach files automatically; the visitor
// has to add those themselves once the email opens.
document.querySelectorAll('.contact-form').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const get = (selector) => {
      const el = form.querySelector(selector);
      return el ? el.value.trim() : '';
    };

    const name = get('[name="name"]');
    const type = get('[name="type"]');
    const phone = get('[name="phone"]');
    const email = get('[name="email"]');
    const description = get('[name="description"]');

    const fileInput = form.querySelector('input[type="file"]');
    const fileNames = fileInput && fileInput.files.length
      ? Array.from(fileInput.files).map(f => f.name).join(', ')
      : null;

    const subject = `Estimate Request — ${name}`;
    let body =
`Name/Organization: ${name}
Category: ${type}
Phone: ${phone}
Email: ${email}

Project Description:
${description}`;

    if (fileNames) {
      body += `\n\nDon't forget to attach: ${fileNames}`;
    }

    const mailtoUrl = `mailto:hello@kzfoundations.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    const btn = form.querySelector('.btn-submit');
    const originalText = btn.textContent;
    btn.textContent = 'Opening your email app...';
    setTimeout(() => {
      btn.textContent = "Didn't open? Email us directly at hello@kzfoundations.com";
      btn.disabled = false;
    }, 2500);
  });
});

/* ----------------------------------------------------------------------
   BACKUP: Vercel + Resend version (handles attachments, sends server-side)
   Swap this back in once RESEND_API_KEY is set in Vercel and the domain
   is verified — just comment out the block above and uncomment this one.

const MAX_TOTAL_UPLOAD_BYTES = 4 * 1024 * 1024; // keep under Vercel's 4.5MB request limit

document.querySelectorAll('.contact-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('.btn-submit');
    const originalText = btn.textContent;
    const fileInput = form.querySelector('input[type="file"]');

    if (fileInput && fileInput.files.length) {
      let total = 0;
      for (const file of fileInput.files) total += file.size;
      if (total > MAX_TOTAL_UPLOAD_BYTES) {
        alert("Attached files are too large (4MB total max). Please remove a file or compress your photos — or email them directly to hello@kzfoundations.com.");
        return;
      }
    }

    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const response = await fetch('/api/send-estimate', {
        method: 'POST',
        body: new FormData(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong.');
      }

      btn.textContent = "✓ Sent! We'll be in touch within 1 business day.";
      btn.style.background = '#2B5741';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = originalText;
      btn.disabled = false;
      alert(err.message || "We couldn't send your request — please try again, or call us at (412) 608-9544.");
    }
  });
});
---------------------------------------------------------------------- */

// Scroll-triggered reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.service-card, .testi-card, .blog-card, .portfolio-item, .faq-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(22px)';
  el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
  observer.observe(el);
});
