// Update all_labels.json with missing label keys
const fs = require('fs');
const path = require('path');

const labelsFile = path.join(__dirname, '..', 'all_labels.json');
const existing = JSON.parse(fs.readFileSync(labelsFile, 'utf8'));

// Add missing labels
const newLabels = {
  "title_debts": {
    "default": "\ud83d\udcd2 \u0e9a\u0eb1\u0e99\u0e8a\u0eb5\u0e95\u0eb4\u0e94\u0edc\u0eb5\u0ec9\u0ea5\u0eb9\u0e81\u0e84\u0ec9\u0eb2 (Customer Credit Ledger)",
    "file": "Debts.jsx"
  },
  "title_hrm": {
    "default": "\ud83d\udc65 \u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0e88\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0e9a\u0eb8\u0e81\u0e84\u0eb0\u0ea5\u0eb2\u0e81\u0ead\u0e99 & \u0ec0\u0e87\u0eb4\u0e99\u0ec0\u0e94\u0eb7\u0ead\u0e99 (HRM)",
    "file": "HRM.jsx"
  },
  "hrm_sub_desc": {
    "default": "\u0e88\u0eb1\u0e94\u0e81\u0eb2\u0e99\u0e9a\u0eb1\u0e99\u0e8a\u0eb5\u0e9e\u0eb0\u0e99\u0eb1\u0e81\u0e87\u0eb2\u0e99, \u0e95\u0eb2\u0e95\u0eb0\u0ea5\u0eb2\u0e87\u0e81\u0eb0\u0ec0\u0eae\u0eb1\u0e94\u0ea7\u0ebd\u0e81, \u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0e87\u0eb2\u0e99, \u0e81\u0eb2\u0e99\u0e82\u0ecd\u0ea5\u0eb2\u0e9e\u0eb1\u0e81 \u0ec1\u0ea5\u0eb0 \u0e9a\u0eb1\u0e99\u0e8a\u0eb5\u0ec0\u0e87\u0eb4\u0e99\u0ec0\u0e94\u0eb7\u0ead\u0e99.",
    "file": "HRM.jsx"
  },
  "hrm_tab_employees": {
    "default": "\ud83d\udc65 \u0e9e\u0eb0\u0e99\u0eb1\u0e81\u0e87\u0eb2\u0e99",
    "file": "HRM.jsx"
  },
  "hrm_tab_shifts": {
    "default": "\ud83d\udcc5 \u0e95\u0eb2\u0e95\u0eb0\u0ea5\u0eb2\u0e87\u0e81\u0eb0",
    "file": "HRM.jsx"
  },
  "hrm_tab_attendance": {
    "default": "\ud83d\udd52 \u0ea5\u0eb0\u0e9a\u0ebb\u0e9a\u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0e87\u0eb2\u0e99",
    "file": "HRM.jsx"
  },
  "hrm_tab_leaves": {
    "default": "\ud83d\udcdd \u0e81\u0eb2\u0e99\u0ea5\u0eb2\u0e9e\u0eb1\u0e81",
    "file": "HRM.jsx"
  },
  "hrm_tab_payroll": {
    "default": "\ud83d\udcb5 \u0e9a\u0eb1\u0e99\u0e8a\u0eb5\u0ec0\u0e87\u0eb4\u0e99\u0ec0\u0e94\u0eb7\u0ead\u0e99",
    "file": "HRM.jsx"
  },
  "login_error_invalid": {
    "default": "\u0ead\u0eb5\u0ec0\u0ea1\u0ea5 \u0eab\u0ebc\u0eb7 \u0ea5\u0eb0\u0eab\u0eb1\u0e94\u0e9c\u0ec8\u0eb2\u0e99\u0e9a\u0ecd\u0ec8\u0e96\u0eb7\u0e81\u0e95\u0ec9\u0ead\u0e87!",
    "file": "Login.jsx"
  },
  "login_email_label": {
    "default": "Gmail / Email",
    "file": "Login.jsx"
  },
  "login_password_label": {
    "default": "\u0ea5\u0eb0\u0eab\u0eb1\u0e94\u0e9c\u0ec8\u0eb2\u0e99 (Password)",
    "file": "Login.jsx"
  },
  "login_btn_text": {
    "default": "\ud83d\ude80 \u0ec0\u0e82\u0ebb\u0ec9\u0eb2\u0eaa\u0eb9\u0ec8\u0ea5\u0eb0\u0e9a\u0ebb\u0e9a",
    "file": "Login.jsx"
  }
};

const merged = { ...existing, ...newLabels };
fs.writeFileSync(labelsFile, JSON.stringify(merged, null, 2), 'utf8');

console.log('all_labels.json updated successfully');
console.log('Total labels:', Object.keys(merged).length);
console.log('New labels added:', Object.keys(newLabels).length);
