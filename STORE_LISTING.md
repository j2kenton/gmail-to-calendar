# Google Workspace Marketplace — Store Listing Content

## App name
Gmail to Calendar AI

## Short description (up to 100 characters)
Turn emails into calendar events instantly using Gemini AI.

## Full description (up to 10,000 characters)
Gmail to Calendar AI automatically extracts event details from your emails and adds them to Google Calendar — with one click.

Open any email containing an event, meeting, or appointment. The add-on appears in the Gmail sidebar and shows you the email subject. Click "Send to Calendar" and Gemini AI reads the email, extracts the title, date, time, and location, and creates the calendar event for you.

**Features:**
- Works with English and Hebrew emails
- Handles relative dates ("tomorrow", "next Tuesday")
- Handles overnight events
- Stores a short AI-generated summary in the event description
- Uses your own Gemini API key — no data stored by the developer
- Free to use (requires a free Gemini API key from Google AI Studio)

**Setup:**
1. Install the add-on
2. Open any email in Gmail
3. Click the Gmail to Calendar AI icon in the sidebar
4. Enter your free Gemini API key when prompted (get one at aistudio.google.com)
5. Click "Send to Calendar" on any email with an event

**Privacy:**
Email content is sent to the Google Gemini API only when you click "Send to Calendar." Your API key is stored securely in your own Google account. The developer does not collect or store any data.

## Category
Productivity

## Support URL
https://github.com/j2kenton/gmail-to-calendar/issues

## Privacy policy URL
https://raw.githubusercontent.com/j2kenton/gmail-to-calendar/master/PRIVACY.md

## OAuth scopes justification
(You will need to paste these into the OAuth verification form)

- `https://www.googleapis.com/auth/gmail.addons.execute` — Required to run the add-on within Gmail.
- `https://www.googleapis.com/auth/gmail.addons.current.message.readonly` — Required to read the content of the email the user is currently viewing, in order to extract event details.
- `https://www.googleapis.com/auth/calendar` — Required to create calendar events on the user's behalf.
- `https://www.googleapis.com/auth/script.external_request` — Required to call the Gemini API.
