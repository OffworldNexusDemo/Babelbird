# Babelbird

A browser extension that translates your current text input with a simple keyboard shortcut.

## What is this?

Babelbird lets you translate text as you type in any input field on any website. Just press `Alt+T` to translate your current input. All translations are performed locally in your browser using the browser's built-in translation API.

## Building

Install dependencies:
```bash
pnpm install
```

Build the extension:
```bash
pnpm build
```

The built extension will be in the `dist` folder. Load it as an unpacked extension in your browser.

## Privacy

This extension is privacy-first: all translations are performed locally in your browser. No data is sent to external servers. See [PRIVACY.md](PRIVACY.md) for details.

## License

WTFPL - See [LICENSE](LICENSE) file.
