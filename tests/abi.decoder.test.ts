import { describe, expect, it } from "vitest";
import { type Abi, parseAbi } from "viem";
import { decodeCalldata, describeFunction, encodeCall, listFunctions } from "../src/modules/abi/decoder.js";

// A small ERC-20-ish ABI for deterministic tests.
const ABI: Abi = [...parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
])];

describe("abi decoder", () => {
  it("lists all functions with selectors", () => {
    const fns = listFunctions(ABI);
    expect(fns.map((f) => f.name).sort()).toEqual(["approve", "balanceOf", "transfer"]);
    const transfer = fns.find((f) => f.name === "transfer")!;
    expect(transfer.selector).toBe("0xa9059cbb");
    expect(transfer.signature).toBe("transfer(address,uint256)");
  });

  it("describes a function's parameters precisely", () => {
    const [spec] = describeFunction(ABI, "transfer");
    expect(spec!.inputs).toEqual([
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ]);
    expect(spec!.stateMutability).toBe("nonpayable");
  });

  it("round-trips encode -> decode", () => {
    const to = "0x1111111111111111111111111111111111111111";
    const calldata = encodeCall(ABI, "transfer", [to, 1000000n]);
    expect(calldata.startsWith("0xa9059cbb")).toBe(true);

    const decoded = decodeCalldata(ABI, calldata);
    expect(decoded.function).toBe("transfer");
    expect(decoded.selector).toBe("0xa9059cbb");
    expect(decoded.args).toEqual([
      { name: "to", type: "address", value: to },
      { name: "amount", type: "uint256", value: "1000000" },
    ]);
  });

  it("returns empty for an unknown function name", () => {
    expect(describeFunction(ABI, "nope")).toEqual([]);
  });
});
