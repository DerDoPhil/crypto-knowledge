import { describe, expect, it } from "vitest";
import { encodeErrorResult, parseAbi } from "viem";
import { decodeRevert } from "../src/modules/simulate/simulate.js";

const ERR = parseAbi(["error Error(string)", "error Panic(uint256)"]);

describe("decodeRevert", () => {
  it("decodes a standard Error(string) revert from data", () => {
    const data = encodeErrorResult({ abi: ERR, errorName: "Error", args: ["insufficient balance"] });
    expect(decodeRevert(data, undefined)).toBe("insufficient balance");
  });

  it("decodes a Panic(uint256) revert", () => {
    const data = encodeErrorResult({ abi: ERR, errorName: "Panic", args: [17n] });
    expect(decodeRevert(data, undefined)).toBe("Panic(0x11)");
  });

  it("labels an unknown custom error by its selector", () => {
    const out = decodeRevert("0xdeadbeef", undefined);
    expect(out).toMatch(/custom error 0xdeadbeef/);
  });

  it("falls back to parsing the node message", () => {
    expect(decodeRevert(undefined, "execution reverted: ERC20: transfer amount exceeds balance")).toBe(
      "ERC20: transfer amount exceeds balance",
    );
  });

  it("returns null when there is nothing to decode", () => {
    expect(decodeRevert("0x", undefined)).toBeNull();
  });
});
