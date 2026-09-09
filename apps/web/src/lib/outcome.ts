export type SimpleOutcome<Status extends string> = { status: Status };

export type Outcome<OkData extends Record<string, unknown>, ErrorStatus extends string> =
  ({ status: "ok" } & OkData) | SimpleOutcome<ErrorStatus>;
