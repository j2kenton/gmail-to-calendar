function getGeminiApiKey() {
  return PropertiesService.getUserProperties().getProperty("GEMINI_API_KEY");
}

function getContextualAddOn(e) {
  if (!getGeminiApiKey()) {
    return createSettingsCard("To get started, enter your Gemini API key.");
  }
  const accessToken = e.gmail.accessToken;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  const messageId = e.gmail.messageId;
  const message = GmailApp.getMessageById(messageId);
  const subject = message.getSubject();
  return createEventCard(subject, messageId);
}

function createEventCard(subject, messageId) {
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("EventGrabber")
        .setSubtitle("Use AI to create an event")
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph().setText("Subject: " + subject)
        )
        .addWidget(
          CardService.newTextButton()
            .setText("Send to Calendar")
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName("processEmailToCalendar")
                .setParameters({ messageId: messageId })
            )
        )
        .addWidget(
          CardService.newTextButton()
            .setText("⚙ Settings")
            .setOnClickAction(
              CardService.newAction().setFunctionName("showSettings")
            )
        )
    )
    .build();
}

function showSettings() {
  return CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation().pushCard(createSettingsCard("Update your Gemini API key below."))
    )
    .build();
}

function createSettingsCard(message) {
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("Settings")
        .setSubtitle("EventGrabber")
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText(message))
        .addWidget(
          CardService.newTextParagraph().setText(
            'Get a free API key at aistudio.google.com'
          )
        )
        .addWidget(
          CardService.newTextInput()
            .setFieldName("apiKey")
            .setTitle("Gemini API Key")
            .setHint("Paste your key here")
        )
        .addWidget(
          CardService.newTextButton()
            .setText("Save API Key")
            .setOnClickAction(
              CardService.newAction().setFunctionName("saveApiKey")
            )
        )
    )
    .build();
}

function saveApiKey(e) {
  const apiKey = e.commonEventObject.formInputs.apiKey.stringInputs.value[0];
  if (!apiKey || apiKey.trim() === "") {
    return notificationResponse("Please enter a valid API key.");
  }
  PropertiesService.getUserProperties().setProperty("GEMINI_API_KEY", apiKey.trim());
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().popCard())
    .setNotification(CardService.newNotification().setText("API key saved!"))
    .build();
}

function processEmailToCalendar(e) {
  const accessToken = e.gmail.accessToken;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  const messageId = e.commonEventObject.parameters.messageId;
  const message = GmailApp.getMessageById(messageId);
  const subject = message.getSubject();
  const body = message.getPlainBody();

  const tz = CalendarApp.getDefaultCalendar().getTimeZone();
  const now = new Date();
  const currentDateTime = Utilities.formatDate(now, tz, "yyyy-MM-dd HH:mm");

  const prompt = `Extract event details from the email below and return ONLY valid JSON with no markdown or code fences, in the following structure:
    {
        "title": "string",
        "date": "YYYY-MM-DD",
        "start_time": "HH:MM",
        "end_date": "YYYY-MM-DD",
        "end_time": "HH:MM",
        "location": "string",
        "summary": "string"
    }

    Rules:
    - The current date and time in the user's timezone (${tz}) is: ${currentDateTime}
    - All dates and times must be interpreted and returned in the ${tz} timezone.
    - All dates and times must be in the future relative to now.
    - Relative dates (e.g., "tomorrow", "next Tuesday") must be resolved to absolute YYYY-MM-DD dates.
    - "end_date" defaults to the same as "date" but must be set to the next day if the event ends after midnight.
    - If end_time is missing, leave it empty.
    - If location is missing, leave it empty.
    - "summary" should be a concise 2-3 sentence summary of the email relevant to the event.

    Email Content (likely to be in English or Hebrew or a mix of both):
      """
        ${body}
      """
    `;

  var eventData;
  try {
    eventData = callGemini(prompt);
  } catch (err) {
    Logger.log("Gemini call failed: " + err.message);
    return notificationResponse("Could not reach AI service. Please try again.");
  }

  if (!eventData) {
    return notificationResponse("No event details found.");
  }

  try {
    const event = JSON.parse(eventData);
    if (!event.date || !event.start_time) {
      return notificationResponse("No event details found.");
    }

    const endDate = event.end_date || event.date;
    const startLocal = parseDateTimeInTz(event.date, event.start_time, tz);
    const endLocal = event.end_time
      ? parseDateTimeInTz(endDate, event.end_time, tz)
      : new Date(startLocal.getTime() + 60 * 60 * 1000);

    if (isNaN(startLocal.getTime()) || isNaN(endLocal.getTime())) {
      return notificationResponse("Could not parse event times.");
    }
    if (endLocal <= startLocal) {
      return notificationResponse("Event end time is not after start time.");
    }
    if (startLocal <= now) {
      return notificationResponse("Event time is in the past.");
    }

    CalendarApp.getDefaultCalendar().createEvent(
      event.title || subject,
      startLocal,
      endLocal,
      { location: event.location || "", description: event.summary || "" }
    );
    return notificationResponse("Event created successfully!");
  } catch (err) {
    Logger.log("Event creation error: " + err.message);
    return notificationResponse("Error creating event. Please try again.");
  }
}

// Utilities.parseDate interprets the string in the given timezone, avoiding UTC offset ambiguity.
function parseDateTimeInTz(date, time, tz) {
  return Utilities.parseDate(date + "T" + time + ":00", tz, "yyyy-MM-dd'T'HH:mm:ss");
}

function callGemini(prompt) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("No Gemini API key set.");

  const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=" +
    apiKey;

  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(GEMINI_URL, options);
  const statusCode = response.getResponseCode();
  if (statusCode !== 200) {
    Logger.log("Gemini HTTP " + statusCode + ": " + response.getContentText());
    throw new Error("Gemini API returned HTTP " + statusCode + ".");
  }

  const parsed = JSON.parse(response.getContentText());
  const text =
    parsed.candidates &&
    parsed.candidates[0] &&
    parsed.candidates[0].content &&
    parsed.candidates[0].content.parts &&
    parsed.candidates[0].content.parts[0] &&
    parsed.candidates[0].content.parts[0].text;

  if (!text) throw new Error("Gemini returned no text content.");

  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  return jsonMatch ? jsonMatch[0] : null;
}

function notificationResponse(message) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(message))
    .build();
}
