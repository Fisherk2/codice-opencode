import type { VersionDisplayInfo } from "../../application/ports/IUserPrompt";

/** Note titles keyed by detected installation status. */
const STATUS_TITLES: Record<VersionDisplayInfo["status"], string> = {
	missing: "ℹ️  No Installation Detected",
	"pre-1.2.0": "⚠️  Pre-1.2.0 Installation Detected",
	"pre-2.0.0": "⚠️  Pre-2.0.0 Installation Detected",
	"v2.0+": "✅ v2.0+ Installation Detected",
};

/**
 * Build the title/message pair shown by ClackPromptsAdapter.showVersionInfo().
 * Centralized here so the copy is unit-testable without mocking the TUI.
 *
 * @param info - Detected local installation state.
 * @returns Note title and body for the given status.
 */
export function buildVersionInfoMessages(info: VersionDisplayInfo): {
	title: string;
	message: string;
} {
	const version = info.version ?? "?";
	switch (info.status) {
		case "missing":
			return {
				title: STATUS_TITLES.missing,
				message: [
					"No previous Códice installation found.",
					"Update is not available — use Clean Install or Project Install.",
				].join("\n"),
			};
		case "pre-1.2.0":
			return {
				title: STATUS_TITLES["pre-1.2.0"],
				message: [
					`Detected pre-1.2.0 installation (v${version}).`,
					"We recommend deleting references/ and .devin/ directories before reinstalling.",
					"Update is not available — use Clean Install or Project Install.",
				].join("\n"),
			};
		case "pre-2.0.0":
			return {
				title: STATUS_TITLES["pre-2.0.0"],
				message: [
					`Detected v1.x installation (v${version}).`,
					"The update system has changed in v2.0.0. Please reinstall using Clean Install or Project Install to adopt the new pack system.",
				].join("\n"),
			};
		case "v2.0+":
			return {
				title: STATUS_TITLES["v2.0+"],
				message: [
					`Current installation: v${info.version}`,
					`Packs: ${info.installedPacks.length > 0 ? info.installedPacks.join(", ") : "(none)"}`,
				].join("\n"),
			};
	}
}
