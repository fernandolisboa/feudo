CREATE TABLE "market_data" (
	"series_code" text NOT NULL,
	"reference_date" date NOT NULL,
	"value" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_data_series_code_reference_date_pk" PRIMARY KEY("series_code","reference_date")
);
