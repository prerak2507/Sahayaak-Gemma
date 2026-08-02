# Gemma 4 Integration & Jury Demonstration Guide — Sahaayak

> **Sahaayak** is an AI-powered municipal & civic response platform built for Rajkot Municipal Corporation (RMC). Every triage, routing, dispatch, vision cross-verification, and predictive risk analysis decision in Sahaayak is powered directly by **Gemma 4** (`gemma4:e4b-it-qat` running locally, or `gemma4:cloud`).

---

## 1. How Gemma 4 is Used in Sahaayak (The 6 AI Core Engines)

```
Resident Report (Gujarati / Hindi / English + Photo)
                     │
                     ▼
          Gemma 4 Inference Engine
   ┌─────────────────┼─────────────────┐
   ▼                 ▼                 ▼
Civic Triage     Vision Anti-Fraud  Native Dispatch
(Category/Score) (Photo Match)      (Function Tools)
```

### Engine 1: Multilingual Civic Triage
- **Source**: [`lib/gemma/civic.ts`](file:///d:/sahaayak-gemma/lib/gemma/civic.ts)
- **Input**: Raw, unstructured resident complaints in Gujarati (*"ગોંડલ રોડ પર ખાડા છે"*), Romanized Gujarati (*"gondal road par mota khadda chhe"*), Hindi, or English.
- **Output**: 
  - Auto-generated concise English title.
  - Dual-language summaries (English & resident's native language).
  - Municipal department routing (`pwd`, `water_works`, `drainage`, `health_sanitation`, etc.).
  - Urgency scoring from `1` (minor) to `10` (emergency hazard).
  - Crew size requirements and skill prerequisites.

### Engine 2: Native Function Calling for Autonomous Dispatch
- **Source**: [`lib/gemma/dispatch.ts`](file:///d:/sahaayak-gemma/lib/gemma/dispatch.ts)
- **Native Tools Available to Gemma**:
  - `dispatch_municipal_crew(department, crew_size, skills_required, target_hours)`
  - `escalate_emergency(department, hazard, notify_control_room)`
  - `refer_to_ngo(focus_area, volunteers_needed, time_sensitive)`
- **Behavior**: Gemma evaluates the triaged ticket and directly invokes one of these typed programmatic tools.

### Engine 3: Multimodal Photo & Anti-Fraud Verification
- **Source**: [`lib/gemma/vision.ts`](file:///d:/sahaayak-gemma/lib/gemma/vision.ts)
- **Functions**:
  - `screenPhoto`: Validates whether an uploaded image actually depicts a real civic problem.
  - `crossVerifyPhoto`: **Anti-Fraud Check** — cross-checks the visual content of the image against the resident's text description.
  - `verifySolutionPhoto`: **Resolution Check** — compares the field crew's repair photo against the original problem report before closing a ticket.

### Engine 4: Predictive Intelligence & City Operations
- **Sources**: [`lib/gemma/analytics.ts`](file:///d:/sahaayak-gemma/lib/gemma/analytics.ts), [`lib/gemma/ops.ts`](file:///d:/sahaayak-gemma/lib/gemma/ops.ts), [`lib/gemma/policy.ts`](file:///d:/sahaayak-gemma/lib/gemma/policy.ts)
- **Capabilities**:
  - Monsoon & weather-driven infrastructure load forecasting.
  - Ward-level predictive risk degradation scoring.
  - Government scheme coverage gap analysis.
  - Automated volunteer skill matching & deployment scouting.

### Engine 5: Schema-Constrained Generation (Zero Regex Scraping)
- **Source**: [`lib/gemma/structured.ts`](file:///d:/sahaayak-gemma/lib/gemma/structured.ts)
- **Implementation**: Derived directly from Zod schemas. Enforces decoding-level constraints at inference time, ensuring **100% valid JSON responses** without regex scraping or markdown fence stripping.

### Engine 6: Local-First Privacy Client
- **Source**: [`lib/gemma/client.ts`](file:///d:/sahaayak-gemma/lib/gemma/client.ts)
- **Protocol**: Speaks Ollama's `/api/chat` protocol (`http://localhost:11434`).
- **Privacy Guarantee**: 100% local execution — resident complaints, personal notes, and media stay strictly on municipal hardware.

---

## 2. Step-by-Step Jury Demonstration Walkthrough

### Step A: Show the AI Control Center & Telemetry Panel
- Open **`/admin/ai-monitor`** or **`/admin/super/telemetry`** in your browser.
- **What to show the jury**:
  - Point out active inference metrics: Active Model (`gemma4:e4b-it-qat`), Active Host (`local`), Latency in seconds, and token usage streams.

### Step B: Demonstrate Live Multilingual Triage & Photo Verification
1. Navigate to **`/report`** (Report an Issue).
2. Enter a complaint in Romanized Gujarati:
   > *"Mavdi main road par paani ni pipe footi chhe ane aaju baaju rasto dubaai gayo chhe"*
3. Upload an issue photo or select a category.
4. Click **Submit**.
5. **What to show the jury**:
   - Show how Gemma instantly detects language (`Romanized Gujarati`), translates dual summaries, assigns `Water Works` (`water_supply`), calculates urgency score (`8/10`), and automatically routes the ticket to the nearest field worker.

### Step C: Run the Live Terminal Health & Inference Probe
- In your terminal, run:
  ```bash
  npm run gemma:health
  ```
- Or open in browser: `http://localhost:3000/api/gemma/health?probe=1`
- **What to show the jury**: The JSON response proving live local inference, model version string (`gemma4:e4b-it-qat`), host status (`local`), execution latency, and validated schema outputs.

---

## 3. Key Differentiators: Why Gemma 4 & Why It Matters

| Capability | Generic Cloud LLMs | Gemma 4 in Sahaayak |
| :--- | :--- | :--- |
| **Privacy & Sovereignty** | Sends citizen data & images to commercial cloud | **100% Local Inference** — data remains on municipal hardware |
| **Multimodal Architecture** | Requires separate OCR & Vision API pipelines | **Native Vision + Text** — single model checks text & images together |
| **Code-Mixed Language Support** | Struggles on non-English code-mixed dialects | **Native Romanized Indic understanding** (Gujlish, Hinglish) |
| **Function Calling** | Outputs unstructured prose | **Native Structured Tool Invocation** for dispatch |
| **Operational Resilience** | Subject to API outages, per-token billing, latency | **Zero per-request cost**, low latency (~6.1GB model), works offline |

---

## 4. Architectural Boundaries

1. **Deterministic Gazetteer Placement**: Gemma extracts named landmarks; [`lib/geo/rajkot.ts`](file:///d:/sahaayak-gemma/lib/geo/rajkot.ts) resolves them against a fixed gazetteer. Coordinates are never hallucinated by the LLM.
2. **Deterministic Crew Scoring**: Gemma chooses which department owns a problem; [`lib/data/rmc-workers.ts`](file:///d:/sahaayak-gemma/lib/data/rmc-workers.ts) scores worker availability arithmetically to ensure fair, transparent roster assignment.
