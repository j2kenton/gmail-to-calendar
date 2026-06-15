function getGeminiApiKey() {
  return PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
}

function getContextualAddOn(e) {
  const message = GmailApp.getMessageById(e.messageMetadata.messageId);
  const subject = message.getSubject();
  const body = message.getPlainBody();
  return createEventCard(subject, body);
}

function createEventCard(subject, body) {
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("Gmail → Calendar AI")
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
                .setParameters({ subject: subject, body: body })
            )
        )
    )
    .build();
}

function processEmailToCalendar(e) {
  const subject = e.parameters.subject;
  const body = e.parameters.body;

  const prompt = `Extract event details from the email below and return ONLY valid JSON in the following structure:
    {
        "title": "string",
        "date": "YYYY-MM-DD",
        "start_time": "HH:MM",
        "end_time": "HH:MM",
        "location": "string"
    }

    Date and time should not be in the past. Input date and time may be relative (e.g., "tomorrow at 3 PM") or absolute (e.g., "2023-10-01 15:00").
    If a field is missing, leave it empty.
    You can assume that there is at least one event in the email and don't need to check this.

    Email Content (likely to be in English or Hebrew or a mix of both):
      """ 
        ${body}
      """
    `;

  const eventData = callGemini(prompt);

  if (eventData) {
    try {
      const event = JSON.parse(eventData);
      if (event.date && event.start_time) {
        const start = new Date(event.date + " " + event.start_time);
        const end = event.end_time
          ? new Date(event.date + " " + event.end_time)
          : new Date(start.getTime() + 60 * 60 * 1000);

        CalendarApp.getDefaultCalendar().createEvent(
          event.title || subject,
          start,
          end,
          { location: event.location || "", description: body }
        );
        return CardService.newActionResponseBuilder()
          .setNotification(
            CardService.newNotification().setText("Event created successfully!")
          )
          .build();
      }
    } catch (err) {
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification().setText("Error parsing event details.")
        )
        .build();
    }
  }

  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification().setText("No event details found.")
    )
    .build();
}

function callGemini(prompt) {
  const apiKey = getGeminiApiKey();

  const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=" +
    apiKey;

  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
  };

  const response = UrlFetchApp.fetch(GEMINI_URL, options);
  const text = JSON.parse(response.getContentText()).candidates[0].content
    .parts[0].text;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
}
