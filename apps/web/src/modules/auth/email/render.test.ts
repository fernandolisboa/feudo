import { describe, expect, it } from "vitest";

import { renderEmail } from "./render";

describe("renderEmail", () => {
  it("substitutes every placeholder into text as-is and into html escaped", () => {
    const result = renderEmail(
      { subject: "Subject", text: "Hello {name}: {url}", html: "<p>{name}: {url}</p>" },
      { name: '<a href="https://evil.example">Eve</a>', url: "https://feudo.vercel.app?a=1&b=2" },
    );

    expect(result.subject).toBe("Subject");
    expect(result.text).toBe(
      'Hello <a href="https://evil.example">Eve</a>: https://feudo.vercel.app?a=1&b=2',
    );
    expect(result.html).toBe(
      "<p>&lt;a href=&quot;https://evil.example&quot;&gt;Eve&lt;/a&gt;: https://feudo.vercel.app?a=1&amp;b=2</p>",
    );
  });

  it("inserts a value containing $' literally instead of as a replacement pattern", () => {
    const result = renderEmail(
      { subject: "{name}", text: "Hi {name}", html: "<p>{name}</p>" },
      { name: "Household $' Corp" },
    );

    expect(result.subject).toBe("Household $' Corp");
    expect(result.text).toBe("Hi Household $' Corp");
    expect(result.html).toBe("<p>Household $&#39; Corp</p>");
  });

  it("leaves the copy untouched when no replacement key appears in it", () => {
    const result = renderEmail(
      { subject: "Subject", text: "No placeholders here", html: "<p>No placeholders here</p>" },
      { url: "https://feudo.vercel.app" },
    );

    expect(result.text).toBe("No placeholders here");
    expect(result.html).toBe("<p>No placeholders here</p>");
  });
});
