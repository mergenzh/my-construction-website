// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close menu after tapping any link inside it
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu automatically if window is resized back to desktop width
  window.addEventListener('resize', () => {
    if (window.innerWidth > 960 && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

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

// File upload area — list files, validate size, drag-and-drop, clear
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

document.querySelectorAll('.upload-area').forEach(area => {
  const input     = area.querySelector('input[type="file"]');
  const label     = area.querySelector('.upload-label');
  const fileList  = area.querySelector('.upload-file-list');
  const errorDiv  = area.querySelector('.upload-error');
  const clearBtn  = area.querySelector('.upload-clear');

  function render(files) {
    fileList.innerHTML = '';
    errorDiv.textContent = '';
    errorDiv.hidden = true;
    area.classList.remove('has-files', 'has-error');

    if (!files || files.length === 0) {
      fileList.hidden = true;
      clearBtn.hidden = true;
      label.hidden = false;
      return;
    }

    // Validate total size
    let total = 0;
    for (const f of files) total += f.size;

    // Render file rows
    label.hidden = true;
    fileList.hidden = false;
    clearBtn.hidden = false;
    area.classList.add('has-files');

    for (const f of files) {
      const li = document.createElement('li');
      li.innerHTML = `<span>${f.name}</span><span class="file-size">${formatBytes(f.size)}</span>`;
      fileList.appendChild(li);
    }

    // Show total and error if over limit
    const totalLi = document.createElement('li');
    totalLi.style.cssText = 'border-top:1px solid rgba(255,255,255,0.08);margin-top:0.25rem;padding-top:0.5rem;color:rgba(255,255,255,0.45);font-size:0.72rem;';
    totalLi.innerHTML = `<span>Total</span><span class="file-size">${formatBytes(total)} / 4 MB</span>`;
    fileList.appendChild(totalLi);

    if (total > MAX_UPLOAD_BYTES) {
      errorDiv.textContent = 'Total exceeds 4MB — please remove a file or compress your photos before submitting.';
      errorDiv.hidden = false;
      area.classList.add('has-error');
    }
  }

  // Native file picker
  input.addEventListener('change', () => render(input.files));

  // Clear button — reset input and restore placeholder
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    input.value = '';
    render(null);
  });

  // Drag and drop
  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('drag-over');
  });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
      // Assign dropped files to the input so FormData picks them up
      const dt = new DataTransfer();
      for (const f of e.dataTransfer.files) dt.items.add(f);
      input.files = dt.files;
      render(input.files);
    }
  });
});

// Contact / estimate request form — sends to /api/send-estimate (Vercel → Resend)
//
/* ----------------------------------------------------------------------
   BACKUP: mailto fallback (no backend) — uncomment this and comment out
   the fetch block below if you ever need to disable the Vercel function.

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
---------------------------------------------------------------------- */

document.querySelectorAll('.contact-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('.btn-submit');
    const originalText = btn.textContent;
    const fileInput = form.querySelector('input[type="file"]');

    // Block submit if upload area is showing a size error
    const uploadArea = form.querySelector('.upload-area');
    if (uploadArea && uploadArea.classList.contains('has-error')) {
      uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
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
