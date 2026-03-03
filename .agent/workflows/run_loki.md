---
description: Automated End-to-End Ice Cream R&D Mission (Loki)
---
// turbo-all

1. **Initialize Mission**:
   - Status: Active (Loki-Master Formulator).

2. **Market Scout**:
   - Target: `mission_payload.json` (Default: Salted Caramel).
   - Action: Research target flavor profile if undefined.

3. **Master Formulator**:
   - Trigger N8N Ice Cream R&D (Exec ID ~1397):
   ```bash
   curl.exe -X POST -H "Content-Type: application/json" -d "@mission_payload.json" "https://humanresource.app.n8n.cloud/webhook/formulate"
   ```

4. **Regulatory Shield**:
   - Action: Audit recipe against 2026 Compliance Database.

5. **Presentation Architect**:
   - Action: Call ReciPal API (via N8N/HTTP).
   - Action: Synthesize `Final_Formulation_Report.md`.

6. **Output**:
   - Open `Final_Formulation_Report.md`.
