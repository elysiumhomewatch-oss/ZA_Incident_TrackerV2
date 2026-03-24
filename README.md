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
5. Delete any existing code and paste the full `Code.gs`
6.
7. **content**


// =================================================================
//ZA Incident Tracker - Full Apps Script Code.gs
// All actions: get-alerts, submit-alert, update-status, camera management
// Photos: comma-separated URLs in column H of Sheet1
// Cameras: stored in separate "Cameras" sheet (ID, Name, URL, Added)
// =================================================================

function doGet(e) {
  const params = e.parameter || {};
  const action = (params.action || "").trim();

  Logger.log(`doGet called with action: "${action}" at ${new Date().toISOString()}`);
  Logger.log("All params: " + JSON.stringify(params));

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Sheet1");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Sheet1 not found"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ────────────────────────────────────────────────
  // 1. GET ALERTS – for public map and admin dashboard
  // ────────────────────────────────────────────────
  if (action === "get-alerts") {
    const filter = params.filter || "all";
    const data = sheet.getDataRange().getValues();
    let alerts = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = (row[8] || "").toString().trim().toLowerCase();

      if (filter === "approved" && status !== "approved") continue;

      alerts.push({
        timestamp: row[0] || "",
        type: row[1] || "",
        area: row[2] || "",
        reporter: row[3] || "",
        description: row[4] || "",
        lat: row[5] || "",
        lng: row[6] || "",
        photos: row[7] || "",
        status: row[8] || "",
        social: row[9] || "",
        row: i + 1
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      alerts: alerts
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ────────────────────────────────────────────────
  // 2. SUBMIT NEW REPORT – from public form
  // ────────────────────────────────────────────────
  if (action === "submit-alert") {
    const type        = params.type        || "other";
    const area        = params.area        || "Unknown";
    const description = params.description || "";
    const lat         = params.lat         || "";
    const lng         = params.lng         || "";
    const social      = params.social      || "";

    let photoUrls = [];
    if (params.photo1) photoUrls.push(params.photo1.trim());
    if (params.photo2) photoUrls.push(params.photo2.trim());
    if (params.photo3) photoUrls.push(params.photo3.trim());

    const photosCombined = photoUrls.join(",");

    sheet.appendRow([
      new Date(),
      type,
      area,
      "Anonymous",
      description,
      lat,
      lng,
      photosCombined,
      "pending",
      social,
      ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Report submitted successfully — awaiting moderation"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ────────────────────────────────────────────────
  // 3. UPDATE STATUS – approve / reject / etc.
  // ────────────────────────────────────────────────
  if (action === "update-status") {
    const rowNum = parseInt(params.row);
    const newStatus = params.status || "";

    if (isNaN(rowNum) || rowNum < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Invalid row number"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (!newStatus) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "No status provided"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    sheet.getRange(rowNum, 9).setValue(newStatus); // column I = 9 (1-based)

    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }

  // ────────────────────────────────────────────────
  // 4. GET ALL SAVED CAMERAS (for admin dashboard)
  // ────────────────────────────────────────────────
  if (action === "get-cameras") {
    let cameraSheet = ss.getSheetByName("Cameras");
    if (!cameraSheet) {
      cameraSheet = ss.insertSheet("Cameras");
      cameraSheet.appendRow(["ID", "Name", "URL", "Added"]);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        cameras: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = cameraSheet.getDataRange().getValues();
    let cameras = [];

    for (let i = 1; i < data.length; i++) {
      cameras.push({
        id: data[i][0],
        name: data[i][1],
        url: data[i][2]
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      cameras: cameras
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ────────────────────────────────────────────────
  // 5. ADD NEW CAMERA
  // ────────────────────────────────────────────────
  if (action === "add-camera") {
    let cameraSheet = ss.getSheetByName("Cameras");
    if (!cameraSheet) {
      cameraSheet = ss.insertSheet("Cameras");
      cameraSheet.appendRow(["ID", "Name", "URL", "Added"]);
    }

    const id = Utilities.getUuid();
    const name = params.name || "Unnamed";
    const url = params.url || "";

    if (!url) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "No URL provided"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    cameraSheet.appendRow([id, name, url, new Date()]);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }

  // ────────────────────────────────────────────────
  // 6. REMOVE CAMERA BY ID
  // ────────────────────────────────────────────────
  if (action === "remove-camera") {
    const cameraSheet = ss.getSheetByName("Cameras");
    if (!cameraSheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Cameras sheet not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const idToDelete = params.id;
    if (!idToDelete) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "No ID provided"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = cameraSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === idToDelete) {
        cameraSheet.deleteRow(i + 1);
        return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Camera not found"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ────────────────────────────────────────────────
  // 7. UPDATE PHOTOS (blur replacement)
  // ────────────────────────────────────────────────
  if (action === "update-photos") {
    const rowNum = parseInt(params.row);
    const newPhotos = params.photos || "";

    Logger.log(`Updating photos for row ${rowNum}: ${newPhotos}`);

    if (isNaN(rowNum) || rowNum < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Invalid row number"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    sheet.getRange(rowNum, 8).setValue(newPhotos); // column H = 8 (0-based index)

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Photos updated for row " + rowNum
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ────────────────────────────────────────────────
  // Fallback for unknown actions
  // ────────────────────────────────────────────────
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: `Unknown or missing action parameter. Received: "${action}"`
  })).setMimeType(ContentService.MimeType.JSON);
}




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
