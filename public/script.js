document.addEventListener('DOMContentLoaded', () => {
 

  const forms = [
    "signup-form", "login-form",
    "Forgot-Password-form", "OTP-Verification-form",
    "New-Password-form"
  ];
  const history = [];

  function hideAll() {
    forms.forEach(id => document.getElementById(id).style.display = "none");
  }

  function show(id) {
    hideAll();
    document.getElementById(id).style.display = "block";
    history.push(id);
  }

  function back() {
    if (history.length > 1) {
      history.pop();
      show(history.pop());
    }
  }

  function bindToggle(trigger, target) {
    const el = document.getElementById(trigger);
    if (el) el.addEventListener("click", e => {
      e.preventDefault();
      show(target);
    });
  }

  forms.forEach(id => {
    const close = document.getElementById("close-" + id.replace("-form", ""));
    if (close) close.addEventListener("click", () => document.getElementById(id).style.display = "none");
  });

  document.querySelectorAll(".back-button").forEach(btn => btn.addEventListener("click", back));

  bindToggle("show-login", "login-form");
  bindToggle("show-signup", "signup-form");
  bindToggle("switch-to-login", "login-form");
  bindToggle("switch-to-signup", "signup-form");
  bindToggle("show-Forgot-Password", "Forgot-Password-form");
  bindToggle("show-OTP-Verification", "OTP-Verification-form");

  // Signup
  document.getElementById("signup-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const body = {
      username: this.username.value,
      email: this.email.value,
      password: this.password.value
    };
    fetch(`${BACKEND_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(res => res.json()).then(data => {
      if (data.exists) alert("Data is already existed");
      else if (data.success) window.location.href = "home.html";
      else alert("Signup failed");
    });
  });

  // Login
  document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const body = {
      username: this.username.value,
      email: this.email.value,
      password: this.password.value
    };
    fetch(`${BACKEND_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(res => res.json()).then(data => {
      if (data.success) {
        alert("Login successful");
        window.location.href = "home.html";
      } else alert(data.error || "Login failed");
    });
  });

  // Forgot Password
  
 document.getElementById("Forgot-Password-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = this.email.value;

  // ✅ Save email for later
  localStorage.setItem("resetEmail", email);

  fetch(`${BACKEND_URL}/Forgot-Password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) show("OTP-Verification-form");
    else alert(data.error);
  });
});


  // OTP Verification
  document.getElementById("verify-otp").addEventListener("click", function (e) {
    e.preventDefault();
    const otp = document.getElementById("otp").value;
    fetch(`${BACKEND_URL}/OTP-Verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp })
    }).then(res => res.json()).then(data => {
      if (data.success) show("New-Password-form");
      else alert(data.error);
    });
  });

  // Resend OTP
  document.getElementById("resend-otp").addEventListener("click", function (e) {
    e.preventDefault();
    fetch(`${BACKEND_URL}/resend-otp`, { method: "POST" })
      .then(res => res.json())
      .then(data => alert(data.success ? "OTP resent" : data.error));
  });

    // New Password
 document.getElementById("New-Password-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const newPassword = this["new-password"].value;
  const email = localStorage.getItem("resetEmail"); // ✅ Pull stored email

  fetch(`${BACKEND_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword, email })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("Password updated successfully");
      localStorage.removeItem("resetEmail"); // 🧹 Optional cleanup
      window.location.href = "home.html";
    } else {
      alert(data.error);
    }
  });
});
 });

//  ==============================authentication-end======================================================
//  const BACKEND_URL = "https://ats-resume-analyzer-qqw1.onrender.com";
const BACKEND_URL = "https://ats-resume-analyzer-1-9g6t.onrender.com";
// ===================== container 1 code start ========================  
const uploadBox = document.getElementById('uploadBox');
const resumeInput = document.getElementById('resumeInput');
const uploadLabel = document.getElementById('uploadLabel');
const generateBtn = document.getElementById('generateBtn');
const resetBtn = document.getElementById('resetBtn');
const jobDescription = document.getElementById('jobDescription');
const feedbackList = document.getElementById('feedbackList');
const resultSection = document.getElementById('resultSection'); // Target result container

let selectedFile = null;

// Resume upload trigger
uploadBox.addEventListener('click', () => resumeInput.click());

// Resume validation and upload
resumeInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
    alert('Invalid file type. Please upload PDF, DOC, or DOCX.');
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert('File too large. Max size is 2MB.');
    return;
  }

  uploadLabel.textContent = file.name;
  selectedFile = file;

  const formData = new FormData();
  formData.append('resume', file);

  try {
    await fetch(`${BACKEND_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.error('Upload failed:', err);
  }
});

// Generate analysis
generateBtn.addEventListener('click', async () => {
  if (!selectedFile) {
    alert('Please upload a resume first.');
    return;
  }

  const jdText = jobDescription.value.trim();
  if (!jdText) {
    alert('Please paste a job description.');
    return;
  }

  const payload = { jobDescription: jdText };

  try {
    const res = await fetch(`${BACKEND_URL}/analyze-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    const score = result.score || 0;
    const feedback = Array.isArray(result.feedback) ? result.feedback : [];

    // 🧪 Optional: Add a slight delay before showing (for dramatic effect)
    setTimeout(() => {
      resultSection.classList.add('show');
    }, 300); // Delay in milliseconds

    setCircularScore(score);
    injectFeedback(feedback);
  } catch (err) {
    console.error('Analysis failed:', err);
  }
});

// Inject feedback items
function injectFeedback(feedbackArray) {
  feedbackList.innerHTML = '';
  feedbackArray.reverse().forEach((text, index) => {
    const li = document.createElement('li');
    li.textContent = text;
    li.style.opacity = '0';
    li.style.transform = 'translateY(20px)';
    feedbackList.appendChild(li);

    setTimeout(() => {
      li.style.transform = 'translateY(0)';
      li.style.opacity = '1';
    }, index * 300);
  });
}

// Animate circular score meter
function setCircularScore(percent) {
  const circle = document.querySelector('.ring-fill');
  const text = document.getElementById('scoreText');

  percent = Math.max(0, Math.min(100, percent));
  const radius = 65;
  const circumference = 2 * Math.PI * radius;

  let current = 0;
  const duration = 2000;
  const steps = 60;
  const interval = duration / steps;
  const increment = percent / steps;

  const animation = setInterval(() => {
    current += increment;
    if (current >= percent) {
      current = percent;
      clearInterval(animation);
    }

    const offset = circumference * (1 - current / 100);
    const hue = (current / 100) * 120;

    circle.style.strokeDashoffset = offset;
    circle.style.stroke = `hsl(${hue}, 100%, 50%)`;
    text.textContent = `${Math.round(current)}%`;
  }, interval);
}

// Reset everything
resetBtn.addEventListener('click', async () => {
  try {
    await fetch(`${BACKEND_URL}/reset`, { method: 'POST' });
  } catch (err) {
    console.error('Reset failed:', err);
  }

  resumeInput.value = '';
  uploadLabel.textContent = 'Click to upload your resume';
  jobDescription.value = '';
  feedbackList.innerHTML = '';
  setCircularScore(0);

  // Hide result section with animation reset
  resultSection.classList.remove('show');
});

// ===================== container 1 code end ========================
// // ===================== container 2 code start ========================
const uploadBox2 = document.getElementById('uploadBox2');
const resumeInput2 = document.getElementById('resumeInput2');
const uploadLabel2 = document.getElementById('uploadLabel2');
const findBtn = document.getElementById('findBtn');
const jobPostsList = document.getElementById('jobPostsList');
const filterSelect = document.getElementById('filterSelect');
const resetBtn2 = document.getElementById('resetBtn2');
const matchCount = document.querySelector('.total-job-post-match');
const filterSection = document.getElementById('filterSection'); // Updated to use ID

let allJobs = [];

uploadBox2.addEventListener('click', () => resumeInput2.click());

resumeInput2.addEventListener('change', () => {
  const file = resumeInput2.files[0];
  uploadLabel2.textContent = file ? file.name : 'Click to upload your resume';
});

findBtn.addEventListener('click', async () => {
  const file = resumeInput2.files[0];
  if (!file) return alert('Please upload a resume first.');

  const formData = new FormData();
  formData.append('resume', file);

  try {
    const res = await fetch(`${BACKEND_URL}/analyze-resume`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    allJobs = data.jobs || [];
    renderJobs(allJobs);

    // ✅ Smooth reveal of filter section with delay
    if (allJobs.length > 0) {
      setTimeout(() => {
        filterSection.classList.add('show');
      }, 300); // Delay for animation effect
    }
  } catch (err) {
    console.error('Error fetching jobs:', err);
    alert('Something went wrong. Try again.');
  }
});

function renderJobs(jobs) {
  jobPostsList.innerHTML = '';
  matchCount.textContent = `${jobs.length} Matching Jobs`;

  jobs.forEach((job) => {
    const li = document.createElement('li');
    li.className = 'job-post';
    li.innerHTML = `
      <div class="job-post-cont1">
        <div class="a1a">
         <img class="company-logo" src="${job.logo || ''}" onerror="this.onerror=null; this.src='https://yourdomain.com/default-logo.png';" />
          <div class="job-post-1"> 
            <span class="job-post-role-name">${job.role || 'N/A'}</span>
            <div class="job-post-1-1">
              <span class="Company-name">${job.company || 'N/A'}</span>
              <span class="location-job">${job.location || 'Remote'}</span>
              <span class="job-posted-time">${job.posted || 'N/A'}</span>
            </div>                           
          </div>
        </div> 
        <div class="a2a"> 
          <span class="match-score-job-post">${job.matchScore || 0}% Match</span>
          <span class="down"><i class="fa-solid fa-caret-down" id="fa-solid-8"></i></span>
        </div>                     
      </div>

      <div class="job-details hidden">
        <div class="sec8-1"> 
          <div class="sec8-1-1"> 
            <label class="sec8-1-1-label">Job Description</label>
            <div class="job-description">${job.description || 'Not available'}</div>
          </div>
          <hr class="hr">
          <div class="sec8-1-2"> 
            <label class="sec8-1-1-label">Job Requirements</label>
            <div class="job-post-requirements">${job.requirements || 'Not specified'}</div>
          </div>
        </div>
        <div class="sec8-2">           
          <label class="sec8-2-1 sec8-1-1-label">Contact Information</label>
          <div class="sec8-2-2">
            <span class="email-of-hiring-person"><i class="fa-solid fa-envelope"></i>${job.email || 'Not provided'}</span>
            <div class="sec8-2-3">
              <a class="job-post-apply-link" href="${job.applyLink || '#'}" target="_blank">Apply</a>
            </div>
          </div>
        </div>
      </div>
    `;

    const downArrow = li.querySelector('.down');
    const details = li.querySelector('.job-details');
    downArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      details.classList.toggle('hidden');
      li.classList.toggle('expanded');
    });

    jobPostsList.appendChild(li);
  });
}

filterSelect.addEventListener('change', () => {
  const value = filterSelect.value;
  let filtered = [];

  if (value === 'high') {
    filtered = allJobs.filter(job => job.matchScore >= 75);
  } else if (value === 'medium') {
    filtered = allJobs.filter(job => job.matchScore >= 35 && job.matchScore < 75);
  } else if (value === 'low') {
    filtered = allJobs.filter(job => job.matchScore < 35);
  }

  renderJobs(filtered);
});

resetBtn2.addEventListener('click', () => {
  resumeInput2.value = '';
  uploadLabel2.textContent = 'Click to upload your resume';
  jobPostsList.innerHTML = '';
  matchCount.textContent = '0 Matching Jobs';
  filterSelect.value = '';
  allJobs = [];

  // ✅ Smooth hide of filter section
  filterSection.classList.remove('show');
});

// ===================== container 2 code end ========================