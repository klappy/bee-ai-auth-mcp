import { describe, expect, it, vi } from "vitest";

vi.mock("@cloudflare/containers", () => ({ getContainer: () => ({}) }));

const { isActionsReadPath } = await import("../src/actions-read");

describe("isActionsReadPath", () => {
  it("allows /v1/changes", () => {
    expect(isActionsReadPath("/v1/changes")).toBe(true);
  });

  it("allows /v1/conversations/:id", () => {
    expect(isActionsReadPath("/v1/conversations/10189141")).toBe(true);
  });

  it("rejects list and nested conversation paths", () => {
    expect(isActionsReadPath("/v1/conversations")).toBe(false);
    expect(isActionsReadPath("/v1/conversations/1/related")).toBe(false);
  });

  it("rejects other Bee paths", () => {
    expect(isActionsReadPath("/v1/me")).toBe(false);
    expect(isActionsReadPath("/mcp")).toBe(false);
  });
});
