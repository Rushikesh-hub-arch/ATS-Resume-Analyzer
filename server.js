// const mysql = require('mysql');
// const nodemailer = require('nodemailer');
// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const { spawn } = require('child_process');
// const cors = require('cors');
// const axios = require('axios');

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.json());

// // MySQL DATABASE CONNECTION (use env vars)
// const db = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME
// });

// // Directories
// const uploadDir = path.join(__dirname, 'uploads');
// const tempDir = path.join(__dirname, 'temp');
// [uploadDir, tempDir].forEach((dir) => {
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir);
// });

// // Multer setup
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     fs.readdir(uploadDir, (err, files) => {
//       if (err) return cb(err);
//       files.forEach((f) => fs.unlinkSync(path.join(uploadDir, f)));
//       cb(null, uploadDir);
//     });
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.originalname);
//   },
// });
// const upload = multer({
//   storage,
//   limits: { fileSize: 2 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (ext === '.pdf' || ext === '.doc' || ext === '.docx') cb(null, true);
//     else cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
//   },
// });

// // =================================== Authentication ===================================
// let currentOtp = null;
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// // Signup
// app.post("/signup", (req, res) => {
//   const { username, email, password } = req.body;
//   db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
//     if (results.length) return res.json({ exists: true });
//     db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
//       [username, email, password], (err) => {
//         if (err) return res.json({ success: false });
//         res.json({ success: true });
//       });
//   });
// });

// // Login
// app.post("/login", (req, res) => {
//   const { username, email, password } = req.body;
//   db.query("SELECT * FROM users WHERE email = ? AND username = ? AND password = ?",
//     [email, username, password], (err, results) => {
//       if (results.length) res.json({ success: true });
//       else res.json({ success: false, error: "Invalid credentials" });
//     });
// });

// // Forgot Password → Send OTP
// app.post("/Forgot-Password", (req, res) => {
//   const { email } = req.body;
//   db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
//     if (!results.length) return res.json({ success: false, error: "Email not found" });
//     currentOtp = Math.floor(100000 + Math.random() * 900000);
//     transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Your OTP Code",
//       text: `Your OTP code is ${currentOtp}`
//     }, (err) => {
//       if (err) return res.json({ success: false, error: "Email sending failed" });
//       res.json({ success: true });
//     });
//   });
// });

// // OTP Verification
// app.post("/OTP-Verification", (req, res) => {
//   const { otp } = req.body;
//   if (parseInt(otp) === currentOtp) res.json({ success: true });
//   else res.json({ success: false, error: "Invalid OTP" });
// });

// // Resend OTP
// app.post("/resend-otp", (req, res) => {
//   if (!currentOtp) return res.json({ success: false, error: "OTP not initialized" });
//   transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: req.body.email,
//     subject: "Resent OTP Code",
//     text: `Your OTP code is ${currentOtp}`
//   }, (err) => {
//     if (err) return res.json({ success: false, error: "Resend failed" });
//     res.json({ success: true });
//   });
// });

// // Reset Password
// app.post("/reset-password", (req, res) => {
//   const { email, newPassword } = req.body;
//   db.query("UPDATE users SET password = ? WHERE email = ?", [newPassword, email], (err) => {
//     if (err) return res.json({ success: false });
//     res.json({ success: true });
//   });
// });

// // =================================== Resume Analysis ===================================
// // Upload resume
// app.post('/upload', upload.single('resume'), (req, res) => {
//   if (!req.file) return res.status(400).send('No file uploaded');
//   res.status(200).send('File uploaded');
// });

// // Analyze job description with Python
// app.post('/analyze-text', (req, res) => {
//   const files = fs.readdirSync(uploadDir);
//   if (files.length === 0) return res.status(400).send('No resume found');
//   const resumePath = path.join(uploadDir, files[0]);
//   const jobDescription = req.body.jobDescription;
//   const tempFileName = `job_${Date.now()}.txt`;
//   const jobDescriptionPath = path.join(tempDir, tempFileName);
//   fs.writeFileSync(jobDescriptionPath, jobDescription, 'utf-8');

//   const python = spawn('python', ['ats.py', resumePath, jobDescriptionPath]);
//   let dataBuffer = '';
//   python.stdout.on('data', (data) => { dataBuffer += data.toString(); });
//   python.stderr.on('data', (err) => { console.error('Python error:', err.toString()); });
//   python.on('close', () => {
//     fs.unlink(jobDescriptionPath, () => {});
//     try {
//       const result = JSON.parse(dataBuffer);
//       res.json(result);
//     } catch (err) {
//       console.error('Failed to parse Python output:', err);
//       res.status(500).send('Analysis failed');
//     }
//   });
// });

// // Reset uploads and temp
// app.post('/reset', (req, res) => {
//   [uploadDir, tempDir].forEach((dir) => {
//     fs.readdir(dir, (err, files) => {
//       if (err) return res.status(500).send(`Error reading ${dir}`);
//       files.forEach((f) => fs.unlinkSync(path.join(dir, f)));
//     });
//   });
//   res.status(200).send('Reset complete');
// });

// // Start Server
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });



const { Pool } = require('pg');  
const nodemailer = require('nodemailer');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const PYTHON_CMD = process.env.PYTHON_CMD || 'python3';

function runAts(resumePath, jdPath, callback) {
  const py = spawn(
    PYTHON_CMD,
    ['ats.py', resumePath, jdPath],
    { cwd: __dirname, env: process.env }
  );

  let out = '';
  let err = '';

  py.stdout.on('data', (d) => out += d.toString());
  py.stderr.on('data', (d) => err += d.toString());

  py.on('close', (code) => {
    if (code !== 0) {
      console.error('Python exited:', code, err);
      return callback(new Error('Python failed'));
    }

    try {
      const parsed = JSON.parse(out);
      callback(null, parsed);
    } catch {
      console.error('Invalid JSON from Python');
      console.error(out);
      callback(new Error('Bad Python output'));
    }
  });
}

const cors = require('cors');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


const allowedOrigins = [
  "https://ats-resume-analyzer-pi.vercel.app",
  // "http://localhost:3000"
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
}));

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432
});

const uploadDir = path.join(__dirname, 'uploads');
const tempDir = path.join(__dirname, 'temp');
[uploadDir, tempDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});


async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const result = await pdfParse(dataBuffer);
    return result.text || '';
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  } else {
    return fs.readFileSync(filePath, 'utf8'); // may fail for .doc
  }
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || ext === '.doc' || ext === '.docx') cb(null, true);
    else cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
  },
});

let currentOtp = null;
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length) return res.json({ exists: true });

    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, password]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.post("/login", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND username = $2 AND password = $3",
      [email, username, password]
    );
    if (result.rows.length) res.json({ success: true });
    else res.json({ success: false, error: "Invalid credentials" });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.post("/Forgot-Password", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (!result.rows.length) return res.json({ success: false, error: "Email not found" });

    currentOtp = Math.floor(100000 + Math.random() * 900000);
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${currentOtp}`
    }, (err) => {
      if (err) return res.json({ success: false, error: "Email sending failed" });
      res.json({ success: true });
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// OTP Verification
app.post("/OTP-Verification", (req, res) => {
  const { otp } = req.body;
  if (parseInt(otp) === currentOtp) res.json({ success: true });
  else res.json({ success: false, error: "Invalid OTP" });
});

// Resend OTP
app.post("/resend-otp", (req, res) => {
  if (!currentOtp) return res.json({ success: false, error: "OTP not initialized" });
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: req.body.email,
    subject: "Resent OTP Code",
    text: `Your OTP code is ${currentOtp}`
  }, (err) => {
    if (err) return res.json({ success: false, error: "Resend failed" });
    res.json({ success: true });
  });
});

// Reset Password
app.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [newPassword, email]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// ================== Resume Analysis ==================
// Upload resume
app.post('/upload', upload.single('resume'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.status(200).send('File uploaded');
});

// Analyze job description with Python
app.post('/analyze-text', (req, res) => {
  const files = fs.readdirSync(uploadDir);
  if (files.length === 0) return res.status(400).send('No resume found');
  const resumePath = path.join(uploadDir, files[0]);
  const jobDescription = req.body.jobDescription;
  const tempFileName = `job_${Date.now()}.txt`;
  const jobDescriptionPath = path.join(tempDir, tempFileName);
  fs.writeFileSync(jobDescriptionPath, jobDescription, 'utf-8');


});

// Reset uploads and temp
app.post('/reset', (req, res) => {
  [uploadDir, tempDir].forEach((dir) => {
    fs.readdir(dir, (err, files) => {
      if (err) return res.status(500).send(`Error reading ${dir}`);
      files.forEach((f) => fs.unlinkSync(path.join(dir, f)));
    });
  });
  res.status(200).send('Reset complete');
});


// ===================== Container 2 Endpoint ========================

//Analyze resume and match jobs
app.post('/analyze-text', (req, res) => {
  const files = fs.readdirSync(uploadDir);
  if (files.length === 0) {
    return res.status(400).send('No resume found');
  }

  const resumePath = path.join(uploadDir, files[0]);
  const jdPath = path.join(tempDir, `job_${Date.now()}.txt`);

  fs.writeFileSync(jdPath, req.body.jobDescription, 'utf8');

  runAts(resumePath, jdPath, (err, result) => {
    fs.unlink(jdPath, () => {});

    if (err) {
      return res.status(500).json({ error: 'ATS analysis failed' });
    }

    res.json(result);
  });
});

// Keyword extraction
function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
}

// Added helper function to sanitize logo URLs
function sanitizeLogo(url) {
  const fallback = 'https://yourdomain.com/default-logo.png'; // Replace with your actual fallback logo URL
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `https://remoteok.com${trimmed}`;
  return fallback;
}

// Fetch jobs from APIs
async function fetchLiveJobs() {
  const arbeitnowURL = 'https://www.arbeitnow.com/api/job-board-api';
  const remoteOkURL = 'https://remoteok.com/api';

  // const [arbeitRes, remoteRes] = await Promise.all([
  //   axios.get(arbeitnowURL),
  //   axios.get(remoteOkURL),
  // ]);

   const [arbeitRes, remoteRes] = await Promise.all([
    axios.get(arbeitnowURL).catch(e => ({ data: { data: [] }, _err: e })),
    axios.get(remoteOkURL).catch(e => ({ data: [], _err: e }))
  ]);

  if (arbeitRes._err) console.error('Arbeitnow fetch error:', arbeitRes._err.message);
  if (remoteRes._err) console.error('RemoteOK fetch error:', remoteRes._err.message);

  const arbeitJobs = arbeitRes.data.data.map(job => ({
    role: job.title || 'N/A',
    company: job.company_name || 'N/A',
    location: job.location || 'Remote',
    posted: job.created_at || 'N/A',
    logo: sanitizeLogo(job.company_logo),
    description: job.description || '',
    requirements: job.tags?.join(', ') || '',
    email: job.contact_email || '',
    applyLink: job.url || '#',
  }));

  const remoteJobs = remoteRes.data
    .filter(job => job.position && job.description)
    .map(job => ({
      role: job.position || 'N/A',
      company: job.company || 'N/A',
      location: job.location || 'Remote',
      posted: job.date || 'N/A',
      logo: sanitizeLogo(job.logo),
      description: job.description || '',
      requirements: job.tags?.join(', ') || '',
      email: job.email || '',
      applyLink: job.url || '#',
    }));

  return [...arbeitJobs, ...remoteJobs];
}

// Score jobs
function scoreJobs(jobs, keywords) {
  return jobs
    .map(job => {
      const matchCount = keywords.filter(k =>
        job.description.toLowerCase().includes(k)
      ).length;
      const matchScore = Math.round((matchCount / keywords.length) * 100);
      return { ...job, matchScore };
    })
    .filter(job => job.matchScore > 0);
}

app.get('/healthz', (req, res) => res.status(200).send('OK'));
// const [arbeitRes, remoteRes] = await Promise.all([
//   axios.get(arbeitnowURL).catch(e => ({ data: { data: [] }, _err: e })),
//   axios.get(remoteOkURL).catch(e => ({ data: [], _err: e }))
// ]);
// if (arbeitRes._err) console.error('Arbeitnow fetch error:', arbeitRes._err.message);
// if (remoteRes._err) console.error('RemoteOK fetch error:', remoteRes._err.message);


// ===================== Start Server ========================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

