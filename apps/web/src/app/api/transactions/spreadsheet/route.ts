import { handleTransactionsSpreadsheetRequest } from "@/modules/ledger";

export async function GET(request: Request): Promise<Response> {
  return handleTransactionsSpreadsheetRequest(request);
}
