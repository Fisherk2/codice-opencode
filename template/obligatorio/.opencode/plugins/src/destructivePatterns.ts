// ---------------------------------------------------------------------------
// DESTRUCTIVE_PATTERNS — Safety boundary for bash command execution
//
// SAFETY BOUNDARY — NOT configurable per OQ-4.
// These patterns block destructive commands (rm -rf, git push --force,
// DROP TABLE, etc.) from being executed via the Bash tool. They are
// hardcoded and NOT part of the SddPipelineConfig to prevent accidental
// bypass of the safety net.
//
// NOTE: This is a safety net, not a security boundary. Advanced bypasses
// (variable expansion, command substitution) are not covered. Use proper
// sandboxing for untrusted code.
// ---------------------------------------------------------------------------

export const DESTRUCTIVE_PATTERNS: readonly RegExp[] = [
	// ─── Filesystem ─────────────────────────────────────
	/rm\s+-[a-z]*r[a-z]*f\b/i, // [existing] rm -r -f, rm -rf, rm -fir
	/rm\s+-[a-z]*f[a-z]*r\b/i, // [existing] rm -f -r (reversed flags)
	/shred\s+/i, // shred — secure file deletion
	/find\s+.*-exec(dir)?\b/i, // find -exec / find -execdir — blocks both variants
	/find\s+.*-delete\b/i, // find -delete

	// ─── Git ────────────────────────────────────────────
	/git\s+push\s+(-f|--force)\b/i, // [existing] git push --force
	/git\s+reset\s+--hard\b/i, // git reset --hard
	/git\s+clean\s+-fd\b/i, // git clean -fd
	/git\s+filter-repo\b/i, // git filter-repo
	/git\s+branch\s+-D\b/i, // git branch -D
	/git\s+stash\s+(drop|clear)\b/i, // git stash drop / clear

	// ─── SQL ────────────────────────────────────────────
	/drop\s+table\b/i, // [existing] DROP TABLE
	/drop\s+database\b/i, // [existing] DROP DATABASE
	/drop\s+schema\b/i, // DROP SCHEMA
	/truncate\s+(table\s+)?\w+/i, // TRUNCATE TABLE
	/delete\s+from\s+\w+\s*;?\s*$/i, // DELETE FROM (no WHERE clause)

	// ─── Docker ─────────────────────────────────────────
	/docker\s+(rm|rmi|container\s+rm|image\s+rm)\s+.*-f/i, // docker rm / rmi -f
	/docker\s+system\s+prune\s+.*-a/i, // docker system prune -a
	/docker\s+volume\s+(rm|prune)\b/i, // docker volume rm / prune

	// ─── Kubernetes ─────────────────────────────────────
	/kubectl\s+delete\s+.*--all\b/i, // kubectl delete --all
	/kubectl\s+drain\b/i, // kubectl drain

	// ─── Permissions ────────────────────────────────────
	/chmod\s+(-R\s+)?0*777\b/i, // chmod 777 / chmod 0777 any path (octal prefix optional)
	/chown\s+-R\b/i, // chown -R

	// ─── Process ────────────────────────────────────────
	/kill\s+-(9|SIGKILL)\s+0\b/i, // kill -9 0 (all processes)
	/kill\s+-(9|SIGKILL)\s+1\b/i, // kill -9 1 (init)
	/shutdown\s+(-h|-r|now)\b/i, // shutdown
	/\b(reboot|halt|poweroff)\b/i, // reboot, halt, poweroff

	// ─── Network ────────────────────────────────────────
	/iptables\s+-F\b/i, // iptables -F (flush all rules)
	/(ufw|firewalld)\s+disable\b/i, // ufw / firewalld disable

	// ─── Package Managers ──────────────────────────────
	/npm\s+publish\b/i, // npm publish
	/pip\s+install\s+.*--force-reinstall\b/i, // pip --force-reinstall
	/(apt|apt-get|yum|dnf)\s+(remove|purge)\b/i, // apt / yum / dnf remove

	// ─── Environment ────────────────────────────────────
	/unset\s+PATH\b/i, // unset PATH
	/export\s+PATH\s*=\s*[^$]/i, // export PATH= (without $PATH — total replacement)
	/echo\s+.*>>?\s*~\/\.(bash|zsh|profile)rc/i, // append to shell config

	// ─── Disk ───────────────────────────────────────────
	/mkfs\b/i, // [existing] mkfs variants
	/dd\s+if=/i, // [existing] dd if= (disk destruction)
	/fdisk\s+\/dev\//i, // fdisk /dev/sdX
	/wipefs\s+/i, // wipefs
	/parted\s+.*mklabel\b/i, // parted mklabel

	// ─── IaC ────────────────────────────────────────────
	/terraform\s+destroy\s+.*-auto-approve\b/i, // terraform destroy -auto-approve
	/pulumi\s+destroy\s+.*--yes\b/i, // pulumi destroy --yes

	// ─── Cloud ──────────────────────────────────────────
	/aws\s+s3\s+rm\s+.*--recursive\b/i, // aws s3 rm --recursive
	/aws\s+(ec2|rds)\s+terminate-/i, // aws ec2 / rds terminate
	/az\s+(vm|group)\s+delete\b/i, // az vm / group delete
	/gcloud\s+compute\s+instances\s+delete\b/i, // gcloud compute instances delete

	// ─── Databases (generic) ────────────────────────────
	/(mongo|mongosh)\s+.*\bdropDatabase\b/i, // mongo / mongosh dropDatabase
	/redis-cli\s+.*(FLUSHALL|FLUSHDB)\b/i, // redis-cli FLUSHALL / FLUSHDB
	/mysqladmin\s+drop\b/i, // mysqladmin drop

	// ─── PostgreSQL CLI ──────────────────────────────────
	/psql\s+.*-c\s+.*(?:drop|alter\s+system|truncate)/i, // psql -c destructive
] as const;
