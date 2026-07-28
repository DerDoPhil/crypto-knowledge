import {
  type Abi,
  type AbiFunction,
  decodeFunctionData,
  encodeFunctionData,
  getAbiItem,
  toFunctionSelector,
} from "viem";

export interface ParamSpec {
  name: string;
  type: string;
  components?: ParamSpec[];
}

export interface FunctionSpec {
  name: string;
  selector: string;
  stateMutability: string;
  payable: boolean;
  inputs: ParamSpec[];
  outputs: ParamSpec[];
  signature: string;
}

function toParamSpecs(params: readonly { name?: string; type: string; components?: readonly any[] }[]): ParamSpec[] {
  return params.map((p, i) => ({
    name: p.name && p.name !== "" ? p.name : `arg${i}`,
    type: p.type,
    ...(p.components ? { components: toParamSpecs(p.components) } : {}),
  }));
}

function humanSignature(fn: AbiFunction): string {
  const args = fn.inputs.map((i) => i.type).join(",");
  return `${fn.name}(${args})`;
}

export function describeFunctionItem(fn: AbiFunction): FunctionSpec {
  return {
    name: fn.name,
    selector: toFunctionSelector(fn),
    stateMutability: fn.stateMutability,
    payable: fn.stateMutability === "payable",
    inputs: toParamSpecs(fn.inputs),
    outputs: toParamSpecs(fn.outputs ?? []),
    signature: humanSignature(fn),
  };
}

/** List every function in an ABI (read + write), as agent-friendly specs. */
export function listFunctions(abi: Abi): FunctionSpec[] {
  return abi.filter((i): i is AbiFunction => i.type === "function").map(describeFunctionItem);
}

/** Describe one function by name. Returns all overloads sharing the name. */
export function describeFunction(abi: Abi, name: string): FunctionSpec[] {
  const matches = abi.filter((i): i is AbiFunction => i.type === "function" && i.name === name);
  return matches.map(describeFunctionItem);
}

export interface DecodedCall {
  function: string;
  selector: string;
  args: Array<{ name: string; type: string; value: string }>;
}

function stringifyArg(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return JSON.stringify(value.map((v) => (typeof v === "bigint" ? v.toString() : v)));
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  }
  return String(value);
}

/** Decode raw calldata against an ABI into named, typed arguments. */
export function decodeCalldata(abi: Abi, data: `0x${string}`): DecodedCall {
  const { functionName, args } = decodeFunctionData({ abi, data });
  const item = getAbiItem({ abi, name: functionName }) as AbiFunction | undefined;
  const inputs = item?.inputs ?? [];
  const argList = (args ?? []) as readonly unknown[];
  return {
    function: functionName,
    selector: data.slice(0, 10),
    args: inputs.map((inp, i) => ({
      name: inp.name && inp.name !== "" ? inp.name : `arg${i}`,
      type: inp.type,
      value: stringifyArg(argList[i]),
    })),
  };
}

/** Encode a function call into calldata ready to drop into a transaction. */
export function encodeCall(abi: Abi, functionName: string, args: readonly unknown[]): `0x${string}` {
  return encodeFunctionData({ abi, functionName, args });
}
