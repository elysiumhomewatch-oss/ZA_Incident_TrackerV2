# ZA_Incident_TrackerV2
ZA Incident Tracker – Community Safety Dashboard A modern, mobile-friendly web application designed to help communities in South Africa (with a focus on Durban and KwaZulu-Natal) report, monitor, and respond to incidents such as crime, protests, mass actions, riots, looting, and other public safety events.
Key Features
Public Side (Community Reporting)

Interactive map centered on Durban/KZN showing only moderator-approved incidents
Click anywhere on the map to drop a pin and quickly submit a report with coordinates
Anonymous submission form with support for up to 3 photos (take photo or choose from gallery)
Client-side image resizing and compression for faster uploads
Reports are submitted as pending and only appear publicly after admin approval

Admin Dashboard (Moderation & Intelligence)

Full overview of all reports (pending, approved, rejected, etc.)
Visual photo thumbnails for quick review
In-browser photo blurring tool — admins can draw rectangles over faces and number plates, apply blur, and save a new anonymized version
One-click Approve / Reject / Status change
Live camera feeds section (i-traffic.co.za snapshots with auto-refresh)
Pending reports counter with clear highlighting

Technical Highlights

Built with Leaflet.js + MarkerCluster for smooth mapping
Photo uploads via ImgBB (free, reliable)
All data stored in Google Sheets via Apps Script (no server costs)
Fully responsive and optimized for mobile (Android/Chrome)
Clean AfriForum-inspired design (orange/green/red color scheme)

Purpose
This tool empowers communities and neighbourhood watch groups to:

Report incidents quickly and anonymously
Provide visual evidence with photos
Allow trusted admins to review, blur sensitive information, and publish verified alerts
Monitor emerging situations using live cameras and social signals

Tech Stack

Frontend: HTML, CSS, JavaScript, Leaflet.js
Backend: Google Apps Script + Google Sheets
Image hosting: ImgBB (free tier)
Hosting: GitHub Pages (static + client-side)
