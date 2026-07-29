import { describe, expect, test } from "bun:test"
import {
  COMMAND_AGENT_MAP,
  VALID_SUBAGENTS,
  INTENT_PATTERNS,
  COMMAND_PHASE_MAP,
  PHASE_SUGGESTIONS,
  AGENT_MENTION_PATTERNS,
  DESTRUCTIVE_PATTERNS,
  DEFAULTS,
} from "../defaults"

describe("defaults.ts — all 6 named exports exist and are non-empty", () => {
  test("COMMAND_AGENT_MAP is a non-empty Record<string, string>", () => {
    expect(COMMAND_AGENT_MAP).toBeDefined()
    expect(Object.keys(COMMAND_AGENT_MAP).length).toBeGreaterThan(0)
  })

  test("VALID_SUBAGENTS is a non-empty Set<string>", () => {
    expect(VALID_SUBAGENTS).toBeDefined()
    expect(VALID_SUBAGENTS.size).toBeGreaterThan(0)
  })

  test("INTENT_PATTERNS is a non-empty Record<string, string[]>", () => {
    expect(INTENT_PATTERNS).toBeDefined()
    expect(Object.keys(INTENT_PATTERNS).length).toBeGreaterThan(0)
  })

  test("COMMAND_PHASE_MAP is a non-empty Record<string, string>", () => {
    expect(COMMAND_PHASE_MAP).toBeDefined()
    expect(Object.keys(COMMAND_PHASE_MAP).length).toBeGreaterThan(0)
  })

  test("PHASE_SUGGESTIONS is a non-empty Record<string, Record<string, string>>", () => {
    expect(PHASE_SUGGESTIONS).toBeDefined()
    expect(Object.keys(PHASE_SUGGESTIONS).length).toBeGreaterThan(0)
  })

  test("AGENT_MENTION_PATTERNS is a non-empty Record<string, RegExp[]>", () => {
    expect(AGENT_MENTION_PATTERNS).toBeDefined()
    expect(Object.keys(AGENT_MENTION_PATTERNS).length).toBeGreaterThan(0)
  })
})

describe("defaults.ts — DESTRUCTIVE_PATTERNS is exported separately (not in DEFAULTS)", () => {
  test("DESTRUCTIVE_PATTERNS is a non-empty readonly RegExp[]", () => {
    expect(DESTRUCTIVE_PATTERNS).toBeDefined()
    expect(DESTRUCTIVE_PATTERNS.length).toBeGreaterThan(0)
    // Verify all entries are RegExp instances
    for (const pattern of DESTRUCTIVE_PATTERNS) {
      expect(pattern).toBeInstanceOf(RegExp)
    }
  })

  test("DESTRUCTIVE_PATTERNS is NOT part of DEFAULTS", () => {
    const keys = Object.keys(DEFAULTS) as Array<keyof typeof DEFAULTS>
    expect(keys).not.toContain("DESTRUCTIVE_PATTERNS")
  })
})

describe("defaults.ts — DEFAULTS object contains all 6 maps", () => {
  test("DEFAULTS is defined", () => {
    expect(DEFAULTS).toBeDefined()
  })

  test("DEFAULTS contains COMMAND_AGENT_MAP", () => {
    expect(DEFAULTS).toHaveProperty("COMMAND_AGENT_MAP")
    expect(Object.keys(DEFAULTS.COMMAND_AGENT_MAP).length).toBeGreaterThan(0)
  })

  test("DEFAULTS contains VALID_SUBAGENTS", () => {
    expect(DEFAULTS).toHaveProperty("VALID_SUBAGENTS")
    expect(DEFAULTS.VALID_SUBAGENTS.size).toBeGreaterThan(0)
  })

  test("DEFAULTS contains INTENT_PATTERNS", () => {
    expect(DEFAULTS).toHaveProperty("INTENT_PATTERNS")
    expect(Object.keys(DEFAULTS.INTENT_PATTERNS).length).toBeGreaterThan(0)
  })

  test("DEFAULTS contains COMMAND_PHASE_MAP", () => {
    expect(DEFAULTS).toHaveProperty("COMMAND_PHASE_MAP")
    expect(Object.keys(DEFAULTS.COMMAND_PHASE_MAP).length).toBeGreaterThan(0)
  })

  test("DEFAULTS contains PHASE_SUGGESTIONS", () => {
    expect(DEFAULTS).toHaveProperty("PHASE_SUGGESTIONS")
    expect(Object.keys(DEFAULTS.PHASE_SUGGESTIONS).length).toBeGreaterThan(0)
  })

  test("DEFAULTS contains AGENT_MENTION_PATTERNS", () => {
    expect(DEFAULTS).toHaveProperty("AGENT_MENTION_PATTERNS")
    expect(Object.keys(DEFAULTS.AGENT_MENTION_PATTERNS).length).toBeGreaterThan(0)
  })
})

describe("defaults.ts — spot-check known keys", () => {
  test("COMMAND_AGENT_MAP has expected commands", () => {
    expect(COMMAND_AGENT_MAP["/spec"]).toBe("quetzalcoatl")
    expect(COMMAND_AGENT_MAP["/build"]).toBe("tlaloc")
    expect(COMMAND_AGENT_MAP["/ship"]).toBe("mictlantecuhtli")
  })

  test("COMMAND_PHASE_MAP has expected phase mappings", () => {
    expect(COMMAND_PHASE_MAP["/spec"]).toBe("define")
    expect(COMMAND_PHASE_MAP["/build"]).toBe("build")
    expect(COMMAND_PHASE_MAP["/ship"]).toBe("ship")
  })

  test("VALID_SUBAGENTS contains primary agents", () => {
    expect(VALID_SUBAGENTS.has("huitzilopochtli")).toBe(true)
    expect(VALID_SUBAGENTS.has("quetzalcoatl")).toBe(true)
    expect(VALID_SUBAGENTS.has("tlaloc")).toBe(true)
  })

  test("INTENT_PATTERNS contains expected commands", () => {
    expect(INTENT_PATTERNS["/build"]).toBeDefined()
    expect(INTENT_PATTERNS["/build"].length).toBeGreaterThan(0)
    expect(INTENT_PATTERNS["/build"].includes("build")).toBe(true)
    expect(INTENT_PATTERNS["/test"].includes("test")).toBe(true)
  })

  test("AGENT_MENTION_PATTERNS contains expected agent keys", () => {
    expect(AGENT_MENTION_PATTERNS).toHaveProperty("huitzilopochtli")
    expect(AGENT_MENTION_PATTERNS).toHaveProperty("tezcatlipoca")
  })

  test("PHASE_SUGGESTIONS contains expected phase keys", () => {
    expect(PHASE_SUGGESTIONS).toHaveProperty("idle")
    expect(PHASE_SUGGESTIONS).toHaveProperty("define")
    expect(PHASE_SUGGESTIONS).toHaveProperty("build")
    expect(PHASE_SUGGESTIONS).toHaveProperty("ship")
  })
})

describe("defaults.ts — DESTRUCTIVE_PATTERNS spot-check", () => {
  test("contains critical destructive patterns", () => {
    const patterns = DESTRUCTIVE_PATTERNS.map((p) => p.source)
    expect(patterns.some((s) => s.includes("rm"))).toBe(true)
    expect(patterns.some((s) => s.includes("shred"))).toBe(true)
    expect(patterns.some((s) => s.includes("git push"))).toBe(true)
    expect(patterns.some((s) => s.includes("drop table"))).toBe(true)
  })
})
