import { strict as assert } from "node:assert";
import { describe, it } from "mocha";
import {
  cleanWorkspaceName,
  getEnvironmentBadge,
} from "../src/workspaceName";

describe("cleanWorkspaceName", () => {
  it("returns plain names unchanged", () => {
    assert.equal(cleanWorkspaceName("zenigame"), "zenigame");
  });

  it("strips an SSH suffix", () => {
    assert.equal(cleanWorkspaceName("zenigame [SSH: mini]"), "zenigame");
  });

  it("strips a WSL suffix", () => {
    assert.equal(cleanWorkspaceName("myproj [WSL: Ubuntu-22.04]"), "myproj");
  });

  it("strips a Codespaces suffix", () => {
    assert.equal(cleanWorkspaceName("repo [Codespaces: orange-tree]"), "repo");
  });

  it("uses the container name for a generic-prefixed dev container", () => {
    assert.equal(
      cleanWorkspaceName("workspace [Dev Container: aigenba @ desktop-linux]"),
      "aigenba",
    );
  });

  it("keeps a meaningful prefix even for dev containers", () => {
    assert.equal(
      cleanWorkspaceName("myapp [Dev Container: foo @ bar]"),
      "myapp",
    );
  });

  it("falls back to a placeholder when both prefix and container are empty", () => {
    // Pathological / malformed: VSCode normally provides a container name, but
    // we should not crash on the empty case.
    assert.equal(cleanWorkspaceName("workspace [Dev Container: ]"), "(devcontainer)");
  });

  it("strips parenthesised qualifiers from the dev container name", () => {
    assert.equal(
      cleanWorkspaceName("workspace [Dev Container: aigenba (Recovery)]"),
      "aigenba",
    );
  });

  it("treats a bare 'workspace' as no name", () => {
    assert.equal(cleanWorkspaceName("workspace"), "");
  });

  it("handles surrounding whitespace", () => {
    assert.equal(cleanWorkspaceName("  zenigame  "), "zenigame");
  });
});

describe("getEnvironmentBadge", () => {
  it("returns empty for the local case", () => {
    assert.equal(getEnvironmentBadge(undefined), "");
  });

  it("returns a chain for SSH", () => {
    assert.equal(getEnvironmentBadge("ssh-remote"), "🔗");
    assert.equal(getEnvironmentBadge("ssh-remote+host"), "🔗");
  });

  it("returns a penguin for WSL", () => {
    assert.equal(getEnvironmentBadge("wsl"), "🐧");
  });

  it("returns a box for dev containers", () => {
    assert.equal(getEnvironmentBadge("dev-container"), "📦");
    assert.equal(getEnvironmentBadge("dev-container+abc"), "📦");
    assert.equal(getEnvironmentBadge("attached-container"), "📦");
  });

  it("returns a cloud for Codespaces", () => {
    assert.equal(getEnvironmentBadge("codespaces"), "☁");
  });

  it("returns a fallback globe for unknown remotes", () => {
    assert.equal(getEnvironmentBadge("brand-new-remote-2030"), "🌐");
  });

  it("returns chain+box for a dev container on an SSH host", () => {
    assert.equal(
      getEnvironmentBadge(
        "dev-container",
        "workspace [Dev Container: aigenba @ desktop-linux]",
      ),
      "🔗📦",
    );
  });

  it("returns just box for a dev container on localhost", () => {
    assert.equal(
      getEnvironmentBadge(
        "dev-container",
        "workspace [Dev Container: foo @ localhost]",
      ),
      "📦",
    );
  });

  it("returns just box when the dev container suffix has no @ host", () => {
    assert.equal(
      getEnvironmentBadge("dev-container", "workspace [Dev Container: foo]"),
      "📦",
    );
  });
});
