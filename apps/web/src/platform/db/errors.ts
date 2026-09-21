export class MissingDatabaseUrlError extends Error {
  constructor() {
    super("DATABASE_URL is not set");
    this.name = "MissingDatabaseUrlError";
  }
}

export class DatabaseResetNotAllowedError extends Error {
  constructor(reason: string) {
    super(`Database reset refused: ${reason}`);
    this.name = "DatabaseResetNotAllowedError";
  }
}

export class DatabaseConnectionNotAllowedError extends Error {
  constructor(reason: string) {
    super(`Database connection refused: ${reason}`);
    this.name = "DatabaseConnectionNotAllowedError";
  }
}
