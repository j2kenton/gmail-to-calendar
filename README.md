# Gmail to Calendar AI

A Gmail Add-on that uses Gemini AI to extract event details from emails and create Google Calendar events with one click.

## How it works

When you open an email in Gmail, the add-on appears in the sidebar. Click **Send to Calendar** and it uses Gemini to parse the email for event details (date, time, location) and creates a Calendar event automatically. Supports English and Hebrew emails.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (for clasp CLI)
- A Google account
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Install dependencies

```bash
npm install
```

### 2. Log in to clasp

```bash
npx clasp login
```

### 3. Create a new Apps Script project

```bash
npx clasp create --type standalone --title "Gmail to Calendar AI"
```

This creates a `.clasp.json` file locally (gitignored — don't commit it).

### 4. Push the code

```bash
npx clasp push
```

### 5. Set your Gemini API key

Open the Apps Script editor:

```bash
npx clasp open
```

Go to **Project Settings → Script Properties** and add:

| Property | Value |
|---|---|
| `GEMINI_API_KEY` | your Gemini API key |

### 6. Install the add-on for testing

In the Apps Script editor: **Deploy → Test deployments → Install**.

Open Gmail and the add-on will appear when you open any email.

## Deploying to others (optional)

To publish on the Google Workspace Marketplace:
1. **Deploy → New deployment → Add-on**
2. Submit to the [Google Workspace Marketplace](https://workspace.google.com/marketplace) (requires a one-time $5 developer fee)

## Project structure

```
src/Code.js          # Main add-on logic
appsscript.json      # Apps Script manifest (scopes, triggers)
package.json         # clasp dev dependency
.claspignore         # Tells clasp which files to push
.gitignore           # Excludes .clasp.json and node_modules
```

## Privacy

No email data is stored. Email content is sent directly to the Gemini API for processing and discarded. Your API key is stored in Google Apps Script's encrypted Script Properties, never in source code.
