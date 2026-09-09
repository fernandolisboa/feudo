import { describe, expect, it, vi } from "vitest";

import { fetchSgsSeries, SgsFetchError, SgsResponseShapeError } from "./sgs-client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("fetchSgsSeries", () => {
  it("requests the documented SGS URL format", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    await fetchSgsSeries("12", { fromISODate: "2026-08-01", toISODate: "2026-09-09" }, fetchMock);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=01/08/2026&dataFinal=09/09/2026",
    );
  });

  it("parses SGS-shaped observations into reference date and raw value", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        { data: "01/09/2026", valor: "13.65" },
        { data: "02/09/2026", valor: "13.66" },
      ]),
    );

    const observations = await fetchSgsSeries(
      "12",
      { fromISODate: "2026-09-01", toISODate: "2026-09-02" },
      fetchMock,
    );

    expect(observations).toEqual([
      { referenceDate: "2026-09-01", value: "13.65" },
      { referenceDate: "2026-09-02", value: "13.66" },
    ]);
  });

  it("preserves the exact decimal text, including trailing zeros", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse([{ data: "01/09/2026", valor: "0.053680" }]));

    const observations = await fetchSgsSeries(
      "12",
      { fromISODate: "2026-09-01", toISODate: "2026-09-01" },
      fetchMock,
    );

    expect(observations[0]?.value).toBe("0.053680");
  });

  it("throws SgsFetchError with the status when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: "not found" }, 404));

    await expect(
      fetchSgsSeries("13522", { fromISODate: "2026-09-01", toISODate: "2026-09-09" }, fetchMock),
    ).rejects.toMatchObject({ seriesCode: "13522", status: 404 });
    await expect(
      fetchSgsSeries("13522", { fromISODate: "2026-09-01", toISODate: "2026-09-09" }, fetchMock),
    ).rejects.toBeInstanceOf(SgsFetchError);
  });

  it("throws SgsFetchError when the network request itself fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      fetchSgsSeries("12", { fromISODate: "2026-09-01", toISODate: "2026-09-09" }, fetchMock),
    ).rejects.toBeInstanceOf(SgsFetchError);
  });

  it("throws SgsResponseShapeError when the response is not an array of observations", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ unexpected: "shape" }));

    await expect(
      fetchSgsSeries("13522", { fromISODate: "2026-09-01", toISODate: "2026-09-09" }, fetchMock),
    ).rejects.toBeInstanceOf(SgsResponseShapeError);
  });

  it("throws SgsResponseShapeError when an observation is missing a field", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ data: "01/09/2026" }]));

    await expect(
      fetchSgsSeries("12", { fromISODate: "2026-09-01", toISODate: "2026-09-09" }, fetchMock),
    ).rejects.toBeInstanceOf(SgsResponseShapeError);
  });

  it("returns an empty array when SGS has no observations for the window", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));

    const observations = await fetchSgsSeries(
      "433",
      { fromISODate: "2026-09-01", toISODate: "2026-09-01" },
      fetchMock,
    );

    expect(observations).toEqual([]);
  });
});
