import type { ExportDocument } from "./export";

// A year or more of transactions can push the document past Vercel's 4.5 MB
// cap on a non-streamed function response; batching keeps any single
// enqueued chunk small regardless of how many transactions the user has.
const TRANSACTION_BATCH_SIZE = 500;

function* exportDocumentJsonChunks(document: ExportDocument): Generator<string> {
  const { transactions, ...rest } = document;
  yield "{";
  for (const [key, value] of Object.entries(rest)) {
    yield `${JSON.stringify(key)}:${JSON.stringify(value)},`;
  }
  yield '"transactions":[';
  for (let index = 0; index < transactions.length; index += TRANSACTION_BATCH_SIZE) {
    const batch = transactions.slice(index, index + TRANSACTION_BATCH_SIZE);
    const serialized = batch.map((transaction) => JSON.stringify(transaction)).join(",");
    yield `${index > 0 ? "," : ""}${serialized}`;
  }
  yield "]}";
}

// Returns a streamed body instead of one buffered string, so a household
// with years of transactions never hits Vercel's cap on a non-streamed
// function response. Still valid JSON end to end: each chunk is a complete
// run of whole tokens, never a value split mid-string.
export function streamExportDocument(document: ExportDocument): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = exportDocumentJsonChunks(document);
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      const next = chunks.next();
      if (next.done) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(next.value));
    },
  });
}
