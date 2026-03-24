# ZA Incident Tracker – Community Safety Dashboard

A modern, mobile-friendly web application for reporting and monitoring incidents in South Africa, with a strong focus on Durban and KwaZulu-Natal.

Built for community safety groups, neighbourhood watches, and organisations like AfriForum to enable fast, anonymous reporting while maintaining moderation control.

### Key Features

**Public Page**
- Interactive Leaflet map showing only approved incidents
- Click-to-report feature (tap anywhere on map → modal → pre-filled coordinates)
- Anonymous submission form with up to 3 photos
- Mobile-optimized: separate "Take Photo" and "Choose from Gallery" buttons
- Automatic image resizing & compression before upload

**Admin Dashboard**
- Full moderation interface (approve, reject, change status)
- In-browser photo blurring tool (blur faces & number plates)
- Live traffic camera feeds from i-traffic.co.za (auto-refreshing)
- Pending reports counter and visual highlighting

### Tech Stack
- Frontend: HTML, CSS, JavaScript, Leaflet.js + MarkerCluster
- Backend: Google Apps Script + Google Sheets (free)
- Image hosting: ImgBB (free)
- Hosting: GitHub Pages

---

## Installation & Setup Instructions

### 1. Google Sheets & Apps Script Setup

1. Create a new Google Sheet and name it anything (e.g. `ZA-Incident-Tracker`).
2. Rename the default tab to **`Sheet1`**.
3. Add these exact column headers in Row 1:
)

Timestamp | Type | Area | Reporter | Description | Lat | Lng | PhotoURL | Status | Social


4. Go to **Extensions → Apps Script**.
5. Delete any existing code and paste the full `Code.gs` content (from our conversation or the latest version).
6. **Save** the project.
7. Click **Deploy → New deployment**:
- Type: **Web app**
- Execute as: **Me**
- Who has access: **Anyone**
8. Copy the **Web app URL** — this is your `SCRIPT_URL`.

### 2. GitHub Repository Setup

1. Create a new repository on GitHub (recommended name: `za-incident-tracker`).
2. Clone it locally or work directly in the GitHub web interface.
3. Create the following folder structure:

za-incident-tracker/
├── index.html
├── admin.html
├── css/
│   └── style.css
├── js/
│   ├── map.js
│   ├── public.js
│   └── admin.js
└── .nojekyll


4. Add the `.nojekyll` file (empty file) to enable GitHub Pages correctly.

### 3. Update SCRIPT_URL

In both `public.js` and `admin.js`, replace the `SCRIPT_URL` with the one you copied from Apps Script:

```js
const SCRIPT_URL = "https://script.google.com/macros/s/YOUR_NEW_URL/exec";
