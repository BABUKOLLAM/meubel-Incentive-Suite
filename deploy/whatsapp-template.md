# WhatsApp message template for Meta approval

WhatsApp only lets a business start a conversation with an approved template. The board sends its full message as
plain text when the person has written to the number in the last 24 hours; otherwise it sends this template with
the headline, and the person replies to receive the full update. Submit it in Meta Business Manager →
WhatsApp Manager → Message templates → Create template. Approval usually takes one to three days.

| Field | Value |
|---|---|
| Category | Utility |
| Name | `incentive_update` |
| Language | English (`en`) |
| Header | none |
| Footer | `Meubel Grande · Royal Group incentive board` |
| Buttons | Quick reply: `Send full update` |

**Body** (one variable):

```
Your incentive update is ready: {{1}}

Reply to this message to receive today's full figures, or open the board to see your page.
```

**Sample for the variable** (Meta asks for one):

```
Kollam sales team, 18 Nov · ₹7,554 expected this month
```

## Also needed from Meta

- A WhatsApp Business account and a registered phone number. Copy its **Phone number ID** into `WHATSAPP_PHONE_ID`.
- A **permanent token** from a system user with `whatsapp_business_messaging` permission, into `WHATSAPP_TOKEN`.
- The business display name approved for the number.

## Optional Malayalam template

Submit a second template with the same name and language `ml` if staff should receive the headline in Malayalam;
set `WHATSAPP_TEMPLATE_LANG=ml`. The board's own message bodies are English in this release.
