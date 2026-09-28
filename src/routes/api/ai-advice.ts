import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  commodity: z.string().trim().min(1).max(80),
  storage: z.string().trim().min(1).max(600),
  results: z.string().trim().min(1).max(4000),
});

const SYSTEM = `You are a senior food packaging technologist. Given a commodity, storage/transport conditions and rule-based analysis results, write a tailored packaging recommendation in Markdown with exactly these sections:
## Recommendation
(2-4 sentences: material/structure, format, MAP or not)
## Key tradeoffs
(3-5 bullets: barrier vs cost, sustainability vs performance, etc.)
## Cautions
(3-5 bullets: food safety, condensation, seal integrity, regulatory/validation needs)
## Next validation steps
(2-3 bullets)
Be specific and concise (under 350 words). Values are indicative; never claim certainty.`;

export const Route = createFileRoute("/api/ai-advice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: z.infer<typeof schema>;
        try {
          body = schema.parse(await request.json());
        } catch {
          return Response.json({ error: "Please provide a commodity, storage conditions and results (within length limits)." }, { status: 400 });
        }
        const apiKey = process.env['LOVABLE_API_KEY'];
        if (!apiKey) return Response.json({ error: "AI is not configured." }, { status: 500 });

        const { createOpenAI } = await import("@ai-sdk/openai");
        const { streamText } = await import("ai");
        const { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } = await import("@/lib/ai/run-id.server");

        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        // Probe the first chunk so gateway errors (402/429/403) surface as proper statuses.
        let upstreamError: { status: number; message: string } | null = null;
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system: SYSTEM,
          prompt: `Commodity: ${body.commodity}\n\nStorage & transport conditions:\n${body.storage}\n\nAnalysis results:\n${body.results}`,
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
          onError: ({ error }) => {
            const e = error as { statusCode?: number; message?: string };
            upstreamError = { status: e.statusCode ?? 500, message: e.message ?? "AI request failed" };
          },
        });

        const res = result.toTextStreamResponse();
        const reader = res.body!.getReader();
        const first = await reader.read();
        if (upstreamError || (first.done && !first.value)) {
          const err = upstreamError as { status: number; message: string } | null;
          const status = err?.status ?? 502;
          const msg =
            status === 402 ? "AI credits are exhausted. Add credits to the workspace to continue."
            : status === 429 ? "Too many AI requests right now. Please wait a moment and try again."
            : status === 403 ? "AI access is currently blocked for this workspace."
            : err?.message ?? "The AI returned no answer.";
          return Response.json({ error: msg }, { status });
        }
        const stream = new ReadableStream({
          async start(c) {
            if (first.value) c.enqueue(first.value);
            try {
              for (;;) { const r = await reader.read(); if (r.done) break; c.enqueue(r.value); }
              c.close();
            } catch (e) { c.error(e); }
          },
          cancel: (r) => reader.cancel(r),
        });
        return withLovableAiGatewayRunIdHeader(new Response(stream, { headers: res.headers }), runIdFetch);
      },
    },
  },
});
