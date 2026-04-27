// VSCode appends a bracketed suffix to workspace.name when the workspace lives
// in a remote (SSH, WSL, Codespace) or container environment, e.g.
//   "zenigame [SSH: mini]"
//   "myproject [WSL: Ubuntu]"
//   "workspace [Dev Container: aigenba @ desktop-linux]"
//
// VSCode's own status bar already shows that suffix in its remote indicator on
// the bottom-left, so we strip it here to avoid printing the same information
// twice across the status bar.
export function cleanWorkspaceName(name: string): string {
  const m = name.match(/^(.*?)\s+\[([^\]]+)\]\s*$/);
  if (!m) {
    return stripGenericPrefix(name.trim());
  }
  const prefix = (m[1] ?? "").trim();
  const suffix = (m[2] ?? "").trim();

  const dc = suffix.match(/^Dev Container:\s*(.*)$/);
  if (dc) {
    // For dev containers the prefix is often the generic mount-point name
    // "workspace", which adds nothing — drop it and use the container name
    // (the part of the suffix before "@" or "(") instead.
    const container = (dc[1] ?? "")
      .split(/\s*[@(]/)[0]!
      .trim();
    if (!prefix || prefix === "workspace") {
      return container || "(devcontainer)";
    }
    return stripGenericPrefix(prefix);
  }

  // SSH / WSL / Codespaces / generic remote: the prefix is the project, the
  // suffix is just an environment label that we do not need to repeat.
  return stripGenericPrefix(prefix) || suffix;
}

function stripGenericPrefix(name: string): string {
  // "workspace" appears as a generic mount-point name in several remote
  // setups; treat it as no information.
  if (name === "workspace") {
    return "";
  }
  return name;
}

// Emoji badge(s) that signal at a glance which remote environment this window
// is attached to. Returns "" for the local case. For chained setups (e.g. a
// dev container running on an SSH host) it returns multiple badges so both
// layers are visible.
//
// rawWorkspaceName is the un-cleaned workspace.name; the dev-container suffix
// "Dev Container: <name> @ <host>" is the only signal we have for the
// SSH-then-container chain, since vscode.env.remoteName only reports the
// innermost remote.
export function getEnvironmentBadge(
  remoteName: string | undefined,
  rawWorkspaceName?: string,
): string {
  if (!remoteName) {
    return "";
  }
  if (remoteName.startsWith("ssh-remote")) return "🔗";
  if (remoteName === "wsl") return "🐧";
  if (
    remoteName.startsWith("dev-container") ||
    remoteName.startsWith("attached-container")
  ) {
    if (rawWorkspaceName && isContainerOnRemoteHost(rawWorkspaceName)) {
      return "🔗📦";
    }
    return "📦";
  }
  if (remoteName === "codespaces") return "☁";
  return "🌐";
}

function isContainerOnRemoteHost(rawWorkspaceName: string): boolean {
  const m = rawWorkspaceName.match(
    /\[Dev Container:[^@\]]*@\s*([^\]]+?)\s*\]/,
  );
  if (!m) {
    return false;
  }
  const host = (m[1] ?? "").trim().toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return false;
  }
  return true;
}
