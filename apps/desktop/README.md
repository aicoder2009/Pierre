# Pierre Desktop App

A Tauri v2 desktop wrapper around the Pierre Next.js web application. This package produces a native macOS application that loads the web app in a lightweight WebView window, providing a desktop-native experience without bundling a full browser engine.

## Prerequisites

- **Rust** (stable toolchain) -- install via [rustup](https://rustup.rs/)
- **Node.js 18+** and npm
- **The Pierre web app** running on `http://localhost:3000` (required for dev mode)

### macOS-Specific Requirements

- **Xcode Command Line Tools** -- install with:
  ```
  xcode-select --install
  ```
- Minimum deployment target: macOS 10.15 (Catalina)

## Development

The desktop app connects to the Next.js dev server at `localhost:3000`, so the web app must be running first.

1. From the repository root, start the web app:
   ```
   npm run dev:web
   ```

2. In a separate terminal, start the desktop app:
   ```
   npm run dev:desktop
   ```
   Or from this directory directly:
   ```
   npm run dev
   ```

This launches the Tauri development window pointed at `http://localhost:3000` with hot-reload support from the web dev server.

## Building

To produce a distributable `.dmg` (and `.app` bundle) for macOS:

```
npm run build
```

Or from the repository root:

```
npm run build:desktop
```

The build compiles the Rust backend and bundles the frontend from `apps/web/.next`. Build artifacts are output to `src-tauri/target/release/bundle/`.

### Build Targets

The bundle configuration targets all available formats. On macOS this produces:

- `Pierre.app` -- application bundle
- `Pierre_0.1.0_aarch64.dmg` or `Pierre_0.1.0_x64.dmg` -- disk image

## Configuration

Window and app settings are defined in `src-tauri/tauri.conf.json`:

| Setting | Value |
|---|---|
| Product name | Pierre |
| Bundle identifier | `com.pierre.app` |
| Window title | Pierre |
| Window size | 1200 x 800 |
| Window centered | Yes |
| Window decorations | Yes (native title bar) |
| Dev URL | `http://localhost:3000` |
| Frontend dist | `../../web/.next` |
| Minimum macOS version | 10.15 |

The shell plugin is enabled with the `open` permission, allowing the app to open URLs in the system browser.

## Project Structure

```
apps/desktop/
  package.json              # npm scripts (dev, build)
  src-tauri/
    Cargo.toml              # Rust dependencies (tauri 2, serde, shell plugin)
    tauri.conf.json         # Tauri app configuration
    src/
      lib.rs                # Rust library entry point
      main.rs               # Rust binary entry point
    icons/                  # App icons (.icns, .ico, .png)
```

## Troubleshooting

**"Connection refused" or blank window in dev mode**
The web app is not running. Start it first with `npm run dev:web` from the repo root and confirm `http://localhost:3000` loads in a browser before launching the desktop app.

**Rust compilation errors**
Make sure the Rust toolchain is up to date:
```
rustup update stable
```

**`tauri` command not found**
The Tauri CLI is listed as a dev dependency. Run commands through npm scripts (`npm run dev`, `npm run build`) rather than invoking `tauri` directly. If you need the CLI globally:
```
npm install -g @tauri-apps/cli
```

**Build fails on macOS with code signing errors**
For local development builds, you can skip code signing by setting:
```
export APPLE_SIGNING_IDENTITY="-"
```
For distribution builds, configure a valid Apple Developer certificate.

**Xcode Command Line Tools missing**
If you see errors about missing SDKs or compilers, install the tools:
```
xcode-select --install
```

**Stale frontend assets in production build**
The build reads from `apps/web/.next`. Make sure you have run a production build of the web app (`npm run build` from the repo root) before building the desktop app.
