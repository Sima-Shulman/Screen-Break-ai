# 💪 Posture Guardian AI

> Your intelligent wellness companion for healthier screen time habits

![Demo](demo.gif)

## 🎯 Features

### 🤖 **AI-Powered Break Recommendations**
- Personalized suggestions using Google Gemini AI
- Analyzes your activity patterns (clicks, typing, scrolling)
- Contextual exercises based on your behavior

### 📊 **Comprehensive Analytics**
- Real-time activity tracking
- Weekly health score visualization
- Interactive charts and graphs (Recharts)
- Historical data analysis

### 🎮 **Gamification System**
- 8 unique achievements to unlock
- Daily streak tracking
- Points and rewards system
- Motivating notifications

### ⏰ **Smart Break Scheduling**
- 20-20-20 rule for eye health (every 20 min)
- Stretch breaks (customizable interval)
- Non-intrusive notifications
- Pause/snooze functionality

### ⚙️ **Fully Customizable**
- Adjust break intervals
- Notification preferences
- Dark/Light/Auto themes
- Export reports (TXT, CSV, JSON)

---

## 🏗️ Architecture

```
Screen-Break-ai/
├── extension/           # Chrome Extension (React)
│   ├── src/
│   │   ├── background/  # Service worker
│   │   ├── content/     # Activity tracker
│   │   ├── popup/       # React UI
│   │   └── utils/       # Storage, Gamification, Export
│   └── manifest.json
│
├── backend/             # Node.js + Express
│   └── src/
│       └── server.js    # Gemini AI integration
│
├── tests/               # Jest tests
└── docker-compose.yml   # Docker setup
```

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- Chrome browser
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### 1️⃣ Clone & Install

```bash
git clone https://github.com/yourusername/posture-guardian.git
cd posture-guardian

# Install backend dependencies
cd backend
npm install

# Install extension dependencies
cd ../extension
npm install
```

### 2️⃣ Set up Environment

Create `.env` file in `backend/`:

```env
GEMINI_API_KEY=your_api_key_here
PORT=3001
```

### 3️⃣ Run with Docker (Recommended)

```bash
docker-compose up -d
```

Or run manually:

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Extension (dev mode)
cd extension
npm run dev
```

### 4️⃣ Load Extension in Chrome

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Pin the extension to toolbar

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test
npm test gamification

# Coverage report
npm test -- --coverage
```

---

## 📊 Usage Examples

### Track Your Activity
The extension automatically monitors:
- Mouse clicks
- Keyboard strokes
- Scroll distance
- Active screen time

### Get AI Recommendations
When a break is due, Gemini AI suggests personalized exercises:

```
🎯 Neck Relief Recommended

You've been looking down a lot today.

Exercise: Neck Rolls
Duration: 30 seconds
Steps:
1. Sit up straight
2. Slowly roll head clockwise 5 times
3. Repeat counter-clockwise
```

### View Analytics
Dashboard shows:
- Daily/weekly screen time trends
- Break compliance rate
- Health score (0-100)
- Activity distribution pie chart

### Export Reports
Generate reports in multiple formats:
- **TXT**: Human-readable weekly summary
- **CSV**: Import to Excel/Google Sheets
- **JSON**: Raw data for analysis

---

## 🎨 Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Break Notification
![Break](screenshots/break.png)

### Settings
![Settings](screenshots/settings.png)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express |
| AI | Google Gemini 2.5 |
| Storage | Chrome Storage API |
| Testing | Jest |(?????????????????????????????????????????????)
| DevOps | Docker, Docker Compose |

---

## 📈 Roadmap

- [ ] Mobile app (React)
- [ ] Integration with fitness trackers
- [ ] Team leaderboards (shared storage)
- [ ] Voice-guided exercises
- [ ] Calendar integration
- [ ] ML-based posture detection (future)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
---

## 🙏 Acknowledgments

- Google Gemini AI team
- Recharts library
- Chrome Extension community
- All contributors

---

## 📞 Support

- 🐛 Found a bug? [Open an issue](https://github.com/sima-shulman//issues)
- 💡 Have a feature request? [Start a discussion](https://github.com/sima-shulman/posture-guardian/discussions)
- 📧 Email: your.email@example.com

---

<div align="center">

**⭐ Star this repo if it helped you!**

Made with ❤️ and lots of ☕

</div>