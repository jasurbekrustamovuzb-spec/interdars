# InterDars AI test setup

## What is stored and where

- PDF, DOC, DOCX, PPT, and PPTX files are parsed in the browser. The original file is never uploaded to Supabase.
- Only the extracted text is sent to Gemini for generation. The app does not write the document or extracted text to Supabase, local storage, or disk.
- Supabase stores only small AI quota counters: the authenticated user ID, time bucket, and number of requests. The table has RLS enabled and no client table permissions. Counters are automatically pruned after 35 days (daily buckets) or 2 hours (minute buckets).
- Gemini free-tier limits are shared by everyone using this project's API key and can change. Free-tier content may be used by Google to improve its products; show the consent notice before sending extracted text.

## Abuse controls and default limits

- 5 AI test generations per user per day.
- 20 seconds between generations from the same user.
- 10 generations per minute and 100 per day across the whole app.
- Quota reservation is atomic and happens before the Gemini request. Failed provider attempts still consume one app quota slot to prevent retry abuse.
- Limits reset according to America/Los_Angeles time, aligned with Google's daily quota reset.
- Quota counters are in `public.ai_test_usage`, which has no client access. `public.consume_ai_test_quota(uuid)` is executable only by `service_role`.
- The Vercel function logs generation outcome, duration, question count, and token usage, without document text, API keys, or user IDs. Review these in Vercel Runtime Logs.

Adjust the constants in `supabase/ai-test-quota.sql` after reviewing Gemini's current project limits in Google AI Studio. Keep the global app caps below the provider quota if the app must remain on the free tier.

## Deploy setup

1. In Supabase SQL Editor, run the contents of `supabase/ai-test-quota.sql` once.
2. In Vercel Project Settings → Environment Variables, configure these for Production, Preview, and Development:
   - `SUPABASE_URL` — the Supabase project URL.
   - `SUPABASE_ANON_KEY` — the project's publishable key (or legacy anon key).
   - `SUPABASE_SECRET_KEY` — a Supabase secret key (or legacy service_role key). Store it as **Secret**. It is used only by the server function and must never be added to browser code.
   - `GEMINI_API_KEY` — the Gemini API key, stored as **Secret**.
3. Redeploy after the SQL and environment variables are configured.

## Upload limits

- Upload size: 3 MB.
- Extracted text: 120,000 characters.
- PDFs: maximum 160 pages. Scanned PDFs need OCR before upload.
- PDF, DOC, DOCX, PPT, and PPTX extraction libraries load in the browser from public CDNs.

Generated tests are stored with the user's existing local lesson data on that device so they can be edited and played later. The original document is not saved with the test.

