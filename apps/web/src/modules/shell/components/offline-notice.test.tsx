// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/", search: "", refresh: vi.fn() }));
const copies = vi.hoisted(() => ({
  clearOfflineCopies: vi.fn(() => Promise.resolve()),
  requestOfflineCopy: vi.fn(),
}));

const pushDevice = vi.hoisted(() => ({
  unsubscribeThisDevice: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/platform/pwa/push-device", () => pushDevice);
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
  useRouter: () => ({ refresh: navigation.refresh }),
}));
vi.mock("@/platform/pwa/offline-copies", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/platform/pwa/offline-copies")>()),
  clearOfflineCopies: copies.clearOfflineCopies,
  requestOfflineCopy: copies.requestOfflineCopy,
}));

import { blockWriteWhenOffline } from "@/lib/offline-writes";

import { OfflineNotice } from "./offline-notice";

const SCOPE_KEY = "feudo.offline-copies.scope";
const TIME_ZONE = "America/Sao_Paulo";
const FRESH = () => new Date(performance.timeOrigin + 1_000).toISOString();

let online = true;

function setOnline(next: boolean): void {
  online = next;
  act(() => {
    window.dispatchEvent(new Event(next ? "online" : "offline"));
  });
}

function renderNotice(props: { renderedAt?: string; scope?: string } = {}) {
  return render(
    <>
      <OfflineNotice
        renderedAt={props.renderedAt ?? FRESH()}
        timeZone={TIME_ZONE}
        scope={props.scope ?? "user-1:household-a"}
      />
      <form
        aria-label="categorizar"
        onSubmit={(event) => {
          event.preventDefault();
          submitted();
        }}
      >
        <button type="submit">Salvar</button>
      </form>
    </>,
  );
}

const submitted = vi.fn();

beforeEach(() => {
  online = true;
  Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => online });
  navigation.pathname = "/";
  navigation.search = "";
  navigation.refresh.mockReset();
  copies.clearOfflineCopies.mockClear();
  copies.requestOfflineCopy.mockClear();
  pushDevice.unsubscribeThisDevice.mockClear();
  submitted.mockReset();
  window.localStorage.setItem(SCOPE_KEY, "user-1:household-a");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("OfflineNotice", () => {
  it("shows nothing while online on a page the server just rendered", () => {
    const { container } = renderNotice();
    expect(container.querySelector("[data-offline-notice]")).toBeNull();
  });

  it("offline, says so and gives the time the screen's data was read", () => {
    renderNotice({ renderedAt: "2026-10-04T13:32:00.000Z" });
    setOnline(false);

    const notice = screen.getByRole("status");
    expect(notice.textContent).toContain(
      "Você está sem conexão. Nada pode ser alterado até a internet voltar.",
    );
    expect(notice.textContent).toMatch(
      /Última atualização: (hoje, |ontem, |04\/10\/2026, )10:32\./,
    );
  });

  it("offline, refuses a form submission, says nothing was saved and never reaches the form", () => {
    renderNotice();
    setOnline(false);

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(submitted).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Nada foi salvo: você está sem conexão.");
  });

  it("offline, shows the same message for a write refused outside a form", () => {
    renderNotice();
    setOnline(false);

    act(() => {
      expect(blockWriteWhenOffline()).toBe(true);
    });

    expect(screen.getByRole("alert").textContent).toBe("Nada foi salvo: você está sem conexão.");
  });

  it("offline, lets a search form through: it reads, it saves nothing", () => {
    const searched = vi.fn((event: SubmitEvent) => {
      event.preventDefault();
    });
    renderNotice();
    const search = document.createElement("form");
    search.setAttribute("data-offline-read", "");
    search.addEventListener("submit", searched);
    document.body.append(search);
    setOnline(false);

    fireEvent.submit(search);

    expect(searched).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).toBeNull();
    search.remove();
  });

  it("on a copy the service worker served offline, says so even when the browser claims to be online", () => {
    const marker = document.createElement("meta");
    marker.name = "feudo-offline-copy";
    document.head.append(marker);
    renderNotice({ renderedAt: "2026-10-04T13:32:00.000Z" });

    expect(screen.getByRole("status").textContent).toContain(
      "Você está sem conexão. Nada pode ser alterado até a internet voltar.",
    );
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(submitted).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Nada foi salvo: você está sem conexão.");

    setOnline(true);
    expect(screen.queryByText(/Você está sem conexão/)).toBeNull();
    expect(document.querySelector('meta[name="feudo-offline-copy"]')).toBeNull();
  });

  it("online, lets the form through", () => {
    renderNotice();
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(submitted).toHaveBeenCalledOnce();
  });

  it("online on a copy (the page was rendered long before it loaded), offers to update it", () => {
    const copyRenderedAt = new Date(performance.timeOrigin - 3 * 60 * 60 * 1000).toISOString();
    renderNotice({ renderedAt: copyRenderedAt });

    expect(screen.getByRole("status").textContent).toContain(
      "Esta tela é uma cópia guardada neste aparelho.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(navigation.refresh).toHaveBeenCalledOnce();
  });

  it("asks the service worker for a copy of each screen reached by an in-app navigation", () => {
    const { rerender } = renderNotice();
    expect(copies.requestOfflineCopy).not.toHaveBeenCalled();

    navigation.pathname = "/transacoes";
    navigation.search = "mes=2026-09";
    rerender(
      <OfflineNotice renderedAt={FRESH()} timeZone={TIME_ZONE} scope="user-1:household-a" />,
    );
    expect(copies.requestOfflineCopy).toHaveBeenCalledOnce();

    navigation.pathname = "/preferencias";
    navigation.search = "";
    rerender(
      <OfflineNotice renderedAt={FRESH()} timeZone={TIME_ZONE} scope="user-1:household-a" />,
    );
    expect(copies.requestOfflineCopy).toHaveBeenCalledOnce();
  });

  it("clears every copy when the person or the household changes, then keeps only the new scope", async () => {
    window.localStorage.setItem(SCOPE_KEY, "user-1:household-a");
    renderNotice({ scope: "user-1:household-b" });

    expect(copies.clearOfflineCopies).toHaveBeenCalledOnce();
    await act(async () => {
      await Promise.resolve();
    });
    expect(window.localStorage.getItem(SCOPE_KEY)).toBe("user-1:household-b");
  });

  it("stops this device's notifications when someone else signs in on it, not on a household switch", () => {
    window.localStorage.setItem(SCOPE_KEY, "user-1:household-a");
    renderNotice({ scope: "user-1:household-b" });
    expect(pushDevice.unsubscribeThisDevice).not.toHaveBeenCalled();
    cleanup();

    window.localStorage.setItem(SCOPE_KEY, "user-1:household-a");
    renderNotice({ scope: "user-2:household-a" });
    expect(pushDevice.unsubscribeThisDevice).toHaveBeenCalledOnce();
  });

  it("keeps the copies while the scope is unchanged", () => {
    renderNotice({ scope: "user-1:household-a" });
    expect(copies.clearOfflineCopies).not.toHaveBeenCalled();
  });
});
