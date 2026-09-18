export const SgsSeriesCode = {
  CdiDaily: "12",
  SelicTarget: "432",
  SelicDaily: "11",
  IpcaMonthly: "433",
  Ipca12MonthAccumulated: "13522",
} as const;

export type SgsSeriesCode = (typeof SgsSeriesCode)[keyof typeof SgsSeriesCode];
