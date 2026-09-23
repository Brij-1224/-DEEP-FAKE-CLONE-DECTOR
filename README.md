## 👥 Team

### Smart India Hackathon (SIH) Team

| Role              | Team Member              |
| ----------------- | ------------------------ |
| 👑 Team Leader    | **Atulya Vats**          |
| 👨‍💻 Team Member | **Brij Gopal Prajapati** |
| 👩‍💻 Team Member | **Bushra Ansari**        |
| 👩‍💻 Team Member | **Bhoomika Rawat**       |
| 👩‍💻 Team Member | **Bhumika**              |
| 👩‍💻 Team Member | **Divya Panday**         |

### 🚀 Team Mission

We are a student innovation team working on **TruthNet AI**, an AI-powered platform focused on real-time detection of voice cloning, replay attacks, deepfakes, digital impersonation, and scam-related threats.

**Smart India Hackathon (SIH) — Team TruthNet AI**

<img width="943" height="576" alt="image" src="https://github.com/user-attachments/assets/3f94b9f7-fb5e-41e9-8c14-b1ef414cde84" />


# 🛡️ TruthNet AI

### Real-Time AI-Powered Digital Impersonation & Deepfake Detection

TruthNet AI is an AI-powered digital forensics and threat-detection platform designed to identify **voice cloning, replay attacks, deepfake media, suspicious conversations, and digital impersonation threats** in real time.

The platform combines audio signal analysis, AI-based detection, speaker verification, scam-pattern analysis, and multimedia forensics to generate an explainable risk assessment.

> **Detect. Verify. Explain. Protect.**

---

## 🚀 Key Features

### 🎙️ Real-Time Voice Analysis

* Real-time microphone monitoring
* Voice activity detection (VAD)
* Audio signal analysis
* Pitch, jitter, shimmer and spectral analysis
* Replay-attack indicators
* Voice-cloning risk analysis
* Real-time risk scoring

### 🧑‍💻 Speaker Verification

* Speaker enrollment
* Voice similarity analysis
* Caller identity verification
* Active challenge-response verification
* Support for impersonation detection

### 🤖 AI-Powered Scam Detection

Detect suspicious conversation patterns such as:

* OTP requests
* Bank/payment requests
* Account suspension scams
* Impersonation
* Urgency and threats
* Remote-access requests
* Investment scams
* Family-emergency scams

### 🎬 Deepfake & Media Forensics

Analyze suspicious:

* Images
* Videos
* Audio recordings

The forensic pipeline can examine metadata, visual/audio characteristics, temporal inconsistencies and other available signals.

### 📊 Risk & Evidence Dashboard

* Real-time risk score
* Detection confidence
* Anomaly timeline
* Evidence summary
* Analysis history
* Case IDs
* Forensic reports
* Performance/latency monitoring

---

## 🧠 System Architecture

```text
                    ┌─────────────────────┐
                    │    TruthNet AI      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
       REAL-TIME MONITORING              FORENSIC ANALYSIS
              │                                 │
        Microphone / Call                 Audio / Image / Video
              │                                 │
             VAD                               Decode
              │                                 │
       Audio Processing                 ┌────────┼────────┐
              │                         │        │        │
       AI Anti-Spoofing               Audio    Image    Video
              │                         │        │        │
       Speaker Verification            ML       CV       ML
              │                         │        │        │
       Replay Detection                └────────┼────────┘
              │                                  │
              └──────────────┬───────────────────┘
                             │
                       Risk Fusion Engine
                             │
                    ┌────────┴────────┐
                    │                 │
               Risk Score       Evidence Engine
                    │                 │
                    └────────┬────────┘
                             │
                     Explanation Layer
                             │
                       TruthNet AI UI
```

---

## 🏗️ Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Web Audio API
* WebSocket

### Backend

* Node.js
* Express
* WebSocket
* REST APIs

### AI / ML

* Audio signal processing
* Anti-spoofing models
* Speaker verification
* NLP-based scam detection
* Computer vision
* Deepfake analysis

### Forensics

* FFmpeg
* OpenCV
* Audio feature extraction
* Metadata analysis
* Image/video processing

---

## ⚡ Real-Time Processing Pipeline

```text
Microphone
    ↓
Audio Capture
    ↓
Voice Activity Detection
    ↓
Sliding Audio Window
    ↓
Feature Extraction
    ↓
AI / Anti-Spoofing Analysis
    ↓
Speaker Verification
    ↓
Replay Detection
    ↓
Scam Conversation Analysis
    ↓
Risk Fusion
    ↓
Real-Time Alert
```

---

## 📈 Risk Assessment

TruthNet AI combines multiple signals instead of relying on a single indicator.

Example:

```text
Audio Authenticity       ──┐
Speaker Similarity       ──┤
Replay Indicators        ──┤
Conversation Risk         ──┤──> Risk Fusion ──> Final Risk
Deepfake Indicators      ──┤
Media Forensics          ──┘
```

Possible output:

```text
Risk Level: HIGH

Voice Clone Probability: 91%
Replay Probability: 84%
Speaker Match: 38%
Scam Conversation Risk: 87%

Recommended Action:
Verify caller identity before continuing.
```

---

## 🔐 Security & Privacy

TruthNet AI is designed with privacy and security in mind.

Principles include:

* Process only required data
* Avoid unnecessary storage of raw recordings
* Secure API communication
* Environment-based secrets
* Authentication for protected endpoints
* Input validation
* File-size and upload restrictions
* WebSocket security
* Audit logging

> **Never commit API keys, passwords, tokens or other secrets to GitHub.**

---

## 🖥️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/truthnet-ai.git
cd truthnet-ai
```

### 2. Install dependencies

```bash
npm install
```

If the project contains separate frontend and backend directories:

```bash
cd frontend
npm install

cd ../backend
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
PORT=8000
GEMINI_API_KEY=your_api_key_here
```

Do **not** commit `.env` to GitHub.

Add it to `.gitignore`:

```gitignore
.env
.env.local
node_modules/
dist/
build/
```

### 4. Start the application

```bash
npm run dev
```

Open the local development URL shown by Vite.

---

## 🧪 Testing

TruthNet AI should be evaluated using both genuine and attack samples.

### Audio

Test against:

* Genuine human speech
* AI-generated speech
* Voice cloning
* Replay attacks
* Noisy environments
* Different microphones
* Different accents/dialects

### Video

Test against:

* Genuine videos
* Face swaps
* Lip-sync manipulation
* Synthetic faces
* Compression artifacts
* Low-light recordings

### Image

Test against:

* Genuine photographs
* AI-generated images
* Face manipulation
* Edited images
* Metadata-stripped images

---

## 📊 Evaluation Metrics

For proper model evaluation, report:

### Classification

* Accuracy
* Precision
* Recall
* F1-score
* ROC-AUC

### Security

* False Acceptance Rate (FAR)
* False Rejection Rate (FRR)
* Equal Error Rate (EER)

### Real-Time Performance

* End-to-end latency
* Model inference latency
* Throughput
* CPU/GPU utilization
* Memory usage

---

## ⚠️ Current Limitations

TruthNet AI is currently a research/prototype project.

Some detection components may use:

* signal-processing heuristics
* benchmark/demo scenarios
* third-party AI services
* experimental models

Detection results should therefore **not be treated as definitive proof that a person or piece of media is genuine or fake**.

For production deployment, the system requires extensive testing on representative datasets and real-world conditions.

---

## 🗺️ Roadmap

### Phase 1 — Prototype

* [x] Real-time audio monitoring
* [x] Audio feature extraction
* [x] WebSocket communication
* [x] Risk dashboard
* [x] Forensic analysis interface

### Phase 2 — AI Integration

* [ ] Production anti-spoofing model
* [ ] Speaker embedding model
* [ ] Real replay-attack classifier
* [ ] Transformer-based scam classifier
* [ ] Real deepfake video model

### Phase 3 — Production Hardening

* [ ] Secure authentication
* [ ] Rate limiting
* [ ] WebSocket authentication
* [ ] Secure secret management
* [ ] Automated testing
* [ ] Model monitoring

### Phase 4 — Deployment

* [ ] GPU inference
* [ ] Docker deployment
* [ ] Cloud deployment
* [ ] Monitoring
* [ ] Scalable inference workers
* [ ] Mobile integration

---

## 📁 Project Structure

```text
truthnet-ai/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── utils/
│
├── backend/
│   ├── routes/
│   ├── services/
│   ├── websocket/
│   └── server/
│
├── models/
│   ├── audio/
│   ├── speaker/
│   ├── video/
│   └── image/
│
├── datasets/
├── benchmarks/
├── tests/
├── docs/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🎯 Use Cases

TruthNet AI can be applied to:

* Banking fraud prevention
* Customer-support call verification
* Voice-cloning detection
* Senior-citizen scam protection
* Digital identity verification
* Media forensics
* Cybersecurity investigations
* Social-engineering detection
* Call-center security

---

## 🏆 Project Goals

TruthNet AI aims to make digital communication safer by helping users answer three questions:

```text
Is this voice genuine?
        ↓
Is this person really who they claim to be?
        ↓
Is this conversation attempting to deceive me?
```

---

## 🤝 Contributing

Contributions are welcome.

```bash
git checkout -b feature/your-feature
git commit -m "Add: your feature"
git push origin feature/your-feature
```

Then open a Pull Request.

---

## 📜 License

This project is intended for research, educational and prototype purposes.

Add your chosen open-source license here, such as MIT, before publishing the repository.

---

## 👨‍💻 Project

**TruthNet AI**

Built for research and innovation in:

**AI × Cybersecurity × Digital Forensics × Deepfake Detection**

---

### ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.
