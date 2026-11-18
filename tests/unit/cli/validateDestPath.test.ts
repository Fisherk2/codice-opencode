/**
 * validateDestPath — CLI destination validation unit tests.
 *
 * Covers the Linux-reachable branches directly. The win32 branches
 * (SYSTEM_DIRS selection and drive-root detection) depend on
 * process.platform AND on node:path resolving to the win32 variant at
 * module load — neither is patchable in-process — so they run in a
 * child bun process on a copy of the module whose path import points
 * at node:path/win32.
 */

import { describe, expect, test } from "bun:test";
import { validateDestPath } from "../../../src/cli/validateDestPath";

describe("validateDestPath (posix)", () => {
	test("rejects empty and whitespace-only destinations", () => {
		expect(validateDestPath("")).toBe("Destination path is empty");
		expect(validateDestPath("   ")).toBe("Destination path is empty");
	});

	test("rejects path traversal segments", () => {
		expect(validateDestPath("../outside")).toBe(
			'Invalid destination path: "../outside" contains path traversal segments',
		);
		expect(validateDestPath("./../outside")).toContain("contains path traversal segments");
	});

	test("rejects NUL bytes", () => {
		expect(validateDestPath("my\0project")).toBe("Destination path contains NUL bytes");
	});

	test("strips control chars before echoing the arg into error messages", () => {
		// Raw ANSI escapes must never reach the terminal via the error text.
		const error = validateDestPath("\u001b[31mabc/../../../etc");
		expect(error).toContain("contains path traversal segments");
		expect(error).not.toContain("\u001b");
		// Printable remainder stays visible for diagnosis.
		expect(error).toContain("[31mabc/../../../etc");
	});

	test("accepts doubled dots inside a segment name (my..project)", () => {
		// ".." only matters as a whole path segment, not inside a name.
		expect(validateDestPath("my..project")).toBeNull();
		expect(validateDestPath("./my..project")).toBeNull();
	});

	test("rejects the filesystem root", () => {
		expect(validateDestPath("/")).toBe('Invalid destination path: "/" is the filesystem root');
	});

	test("rejects system directories and their sub-paths", () => {
		expect(validateDestPath("/etc")).toContain('is inside a system directory "/etc"');
		expect(validateDestPath("/etc/cron.d")).toContain('is inside a system directory "/etc"');
		expect(validateDestPath("/usr/local")).toContain('is inside a system directory "/usr"');
		expect(validateDestPath("/root")).toContain('is inside a system directory "/root"');
		// Prefix collision is NOT a violation — the separator check requires
		// an exact dir boundary ("/etcfoo" is a valid project dir name).
		expect(validateDestPath("/etcfoo")).toBeNull();
	});

	test("accepts relative and non-system absolute paths", () => {
		expect(validateDestPath("./my-project")).toBeNull();
		expect(validateDestPath("my-project")).toBeNull();
		expect(validateDestPath("/home/user/project")).toBeNull();
		expect(validateDestPath("/home/etcfoo")).toBeNull();
	});

	test("trims surrounding whitespace before validating", () => {
		expect(validateDestPath("  ../..  ")).toContain("contains path traversal segments");
		expect(validateDestPath("  my-project  ")).toBeNull();
	});
});

describe("validateDestPath (win32 branches)", () => {
	/**
	 * Child script: platform override must happen before the module import
	 * (line 20 reads process.platform at evaluation time), and the path
	 * import is rewritten to the win32 variant so isAbsolute works as on
	 * a real Windows host. The module copy lives in /tmp/opencode.
	 */
	const CHILD_SCRIPT = `
		const source = await Bun.file(process.env.MODULE_PATH).text();
		const copy = process.env.TMP_COPY;
		await Bun.write(copy, source.replace('from "node:path"', 'from "node:path/win32"'));
		Object.defineProperty(process, "platform", { value: "win32" });
		const { validateDestPath } = await import(copy);
		console.log(JSON.stringify({
			windows: validateDestPath("C:\\\\Windows"),
			system32: validateDestPath("C:\\\\Windows\\\\System32"),
			programFiles: validateDestPath("C:\\\\Program Files"),
			programData: validateDestPath("C:\\\\ProgramData"),
			driveRoot: validateDestPath("D:\\\\"),
			normal: validateDestPath("C:\\\\Users\\\\me\\\\project"),
		}));
	`;

	test("rejects windows system directories, drive roots, accepts normal paths", () => {
		const proc = Bun.spawnSync({
			cmd: ["bun", "-e", CHILD_SCRIPT],
			env: {
				...process.env,
				MODULE_PATH: new URL("../../../src/cli/validateDestPath.ts", import.meta.url).pathname,
				TMP_COPY: "/tmp/opencode/validateDestPath.win32-copy.ts",
			},
		});

		expect(proc.exitCode).toBe(0);
		const results = JSON.parse(proc.stdout.toString().trim()) as Record<string, string | null>;

		expect(results.windows).toContain('is inside a system directory "C:\\Windows"');
		// System32 matches the "C:\Windows" prefix rule (SYSTEM_DIRS loop order).
		expect(results.system32).toContain("is inside a system directory");
		expect(results.programFiles).toContain('is inside a system directory "C:\\Program Files"');
		expect(results.programData).toContain('is inside a system directory "C:\\ProgramData"');
		expect(results.driveRoot).toBe('Invalid destination path: "D:\\" is a drive root');
		expect(results.normal).toBeNull();
	});
});
