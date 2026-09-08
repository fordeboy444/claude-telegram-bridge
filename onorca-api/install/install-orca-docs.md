# Install — Orca Docs

- **URL:** https://www.onorca.dev/docs/install
- **Summary:** Download Orca for macOS, Windows, or Linux, and opt into RC builds.

Search docs⌘K

Download
--------

Orca is a desktop app. Email yourself a link to open on macOS, Windows, or Linux:

Send download link

*   **macOS:** [Apple Silicon](https://github.com/stablyai/orca/releases/latest/download/orca-macos-arm64.dmg)
     · [Intel](https://github.com/stablyai/orca/releases/latest/download/orca-macos-x64.dmg)
    
*   **Windows:** [installer](https://github.com/stablyai/orca/releases/latest/download/orca-windows-setup.exe)
    
*   **Linux:** [AppImage](https://github.com/stablyai/orca/releases/latest/download/orca-linux.AppImage)
     · [.deb](https://github.com/stablyai/orca/releases)
    
*   Older versions: [GitHub Releases](https://github.com/stablyai/orca/releases)
    .
    

### Homebrew (macOS)

Orca is also published as a Homebrew cask, auto-bumped on every stable release:

    brew install --cask stablyai/orca/orca

`brew upgrade --cask orca` picks up new stable builds. The cask tracks the stable channel — for RC builds, use the GitHub Releases links above or the in-app **Check for Updates** flow described under [Updates](https://www.onorca.dev/docs/install#updates)
.

First launch
------------

On first launch Orca will:

*   Ask for access to your home directory so it can add repos.
*   Offer to import `~/.claude`, `~/.codex`, and Ghostty terminal settings if present.
*   Drop you on an empty landing screen where you add your first repo.

Updates
-------

Orca auto-updates by default, tracking the **stable** channel. Stable releases are vetted; **RC (release candidate)** builds ship new features first, often daily.

There is no permanent in-app opt-in for the RC channel. Modifier clicks on **Check for Updates** ([Settings → General → Updates](https://www.onorca.dev/docs/settings)
, or the app / Help menu):

| Modifier | Effect |
| --- | --- |
| **Shift+click** | Include the latest **RC** prerelease |
| **Cmd+click** (macOS) / **Ctrl+click** (Windows/Linux) | Latest **perf**\-tagged prerelease |
| **Option+click** (macOS only) | Pick a **validated local macOS build** that passes Orca’s compatibility checks |

You can still download any build directly from the [GitHub Releases page](https://github.com/stablyai/orca/releases)
.

Platform notes
--------------

### macOS

Signed and notarized. On first launch, macOS may still ask you to confirm — that's normal for Electron-based apps.

### Windows

The default shell can be set to PowerShell or CMD under [Settings → Terminal](https://www.onorca.dev/docs/settings)
. Most users want PowerShell.

### Linux

AppImage and `.deb` builds are available. See the Releases page for details.
