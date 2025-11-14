# Chrome AI Translation & Language Detection APIs

TypeScript type definitions for Chromium's on-device **Translator** and **LanguageDetector** APIs.

These APIs enable privacy-preserving, on-device translation and language detection in Chrome using locally-downloaded machine learning models.

## Overview

### Translator API

The Translator API provides on-device translation between language pairs. Text is translated locally without sending data to external servers, ensuring privacy.

**Key Features:**
- On-device translation (no data sent to servers)
- 100+ language support
- Streaming and batch translation
- Model download with progress tracking
- Abort signal support for cancellation
- Quota management

### LanguageDetector API

The LanguageDetector API identifies the language(s) in text input, returning confidence scores for detected languages.

**Key Features:**
- Supports 95+ languages
- Returns ranked results with confidence scores
- On-device processing (privacy-preserving)
- Optional language optimization hints
- Model download with progress tracking

## Installation

This module is part of the babelbird project and can be referenced as a local TypeScript module:

```typescript
// In your TypeScript files, the global types will be available
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es'
});
```

## Download Progress Monitoring

Both APIs support monitoring model download progress via the `monitor` callback. The callback receives a `CreateMonitor` object that fires `downloadprogress` events:

```typescript
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'ja',
  monitor: (monitor) => {
    monitor.addEventListener('downloadprogress', (event: ProgressEvent) => {
      // event.loaded: Progress from 0 to 1 (normalized)
      // event.total: Always 1
      const percentage = Math.round(event.loaded * 100);
      console.log(`Downloading model: ${percentage}%`);

      // Update a progress bar
      progressBar.value = event.loaded;
      progressBar.textContent = `${percentage}%`;
    });
  }
});
```

**Key Points:**
- The event is a **`ProgressEvent`** (not a plain `Event`)
- `event.loaded` ranges from 0 to 1 (normalized progress)
- `event.total` is always 1
- Events only fire when `availability` is `"downloadable"` and a download occurs
- If the model is already cached (`"available"`), no events fire

## API Reference

### Translator API

#### Checking Availability

Before creating a translator, check if the language pair is supported:

```typescript
const availability = await Translator.availability({
  sourceLanguage: 'en',
  targetLanguage: 'es'
});

console.log(availability);
// "unavailable"   - Language pair not supported
// "downloadable"  - Supported, but model needs download (requires user activation)
// "downloading"   - Model currently downloading
// "available"     - Ready to use
```

#### Creating a Translator

```typescript
// Basic creation
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es'
});

// With download progress monitoring
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  monitor: (m) => {
    m.addEventListener('downloadprogress', (event: ProgressEvent) => {
      // event.loaded: progress from 0 to 1
      // event.total: always 1
      console.log(`Download progress: ${(event.loaded * 100).toFixed(1)}%`);
    });
  }
});

// With abort support
const controller = new AbortController();
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'de',
  signal: controller.signal
});
// Later: controller.abort() to cancel
```

**Important:** If availability is `"downloadable"`, creating a translator requires user activation (e.g., click event). Otherwise, it throws `NotAllowedError`.

#### Translating Text

```typescript
// Simple translation
const result = await translator.translate('Hello world');
console.log(result); // "Hola mundo"

// With abort support
const controller = new AbortController();
const result = await translator.translate('Hello', {
  signal: controller.signal
});
```

#### Streaming Translation

For long texts, use streaming to get incremental results:

```typescript
const stream = translator.translateStreaming('This is a long text to translate...');

const reader = stream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log('Chunk:', value); // Incremental translation chunks
}
```

#### Measuring Input Usage

Check token usage before translation:

```typescript
const tokens = await translator.measureInputUsage('Some text to translate');
console.log(`This text uses ${tokens} tokens`);

// Check against quota
if (tokens <= translator.inputQuota) {
  const result = await translator.translate('Some text to translate');
}
```

#### Cleanup

Always destroy the translator when done to free resources:

```typescript
translator.destroy();
// After destroy(), all methods throw InvalidStateError
```

#### Properties

```typescript
translator.sourceLanguage  // "en" (readonly)
translator.targetLanguage  // "es" (readonly)
translator.inputQuota      // Infinity (readonly) - maximum token limit
```

### LanguageDetector API

#### Checking Availability

```typescript
const availability = await LanguageDetector.availability();
// Or with expected languages hint:
const availability = await LanguageDetector.availability({
  expectedInputLanguages: ['en', 'es', 'fr']
});

console.log(availability);
// Same values as Translator: "unavailable", "downloadable", "downloading", "available"
```

#### Creating a Language Detector

```typescript
// Basic creation
const detector = await LanguageDetector.create();

// With expected languages (optimizes detection for these languages)
const detector = await LanguageDetector.create({
  expectedInputLanguages: ['en', 'es', 'fr', 'de']
});

// With download progress monitoring
const detector = await LanguageDetector.create({
  monitor: (m) => {
    m.addEventListener('downloadprogress', (event: ProgressEvent) => {
      // event.loaded: progress from 0 to 1
      // event.total: always 1
      console.log(`Model download progress: ${(event.loaded * 100).toFixed(1)}%`);
    });
  }
});

// With abort support
const controller = new AbortController();
const detector = await LanguageDetector.create({
  signal: controller.signal
});
```

**Important:** Like Translator, if availability is `"downloadable"`, creating requires user activation.

#### Detecting Language

```typescript
const results = await detector.detect('Hello world');

// Results are sorted by confidence (highest first)
for (const result of results) {
  console.log(`${result.detectedLanguage}: ${result.confidence}`);
}
// Example output:
// en: 0.95
// und: 0.05  ("und" = unknown, always included)

// With abort support
const controller = new AbortController();
const results = await detector.detect('Bonjour le monde', {
  signal: controller.signal
});
```

**Result Properties:**
- `detectedLanguage`: BCP-47 language code (e.g., "en", "es", "zh") or "und" for unknown
- `confidence`: Score between 0 and 1 (all scores sum to ≈1.0)
- Results are **sorted by confidence** (highest first), with "und" always last

#### Measuring Input Usage

```typescript
const tokens = await detector.measureInputUsage('Some text to analyze');
console.log(`This text uses ${tokens} tokens`);
```

#### Cleanup

```typescript
detector.destroy();
// After destroy(), all methods throw InvalidStateError
```

#### Properties

```typescript
detector.expectedInputLanguages  // ["en", "es"] or null (readonly)
detector.inputQuota              // Infinity (readonly)
```

## Supported Languages

### Translator
The Translator API supports 100+ languages. Common pairs include:
- English ↔ Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, Hindi, etc.

### LanguageDetector
Supports 95+ languages including:

`af` (Afrikaans), `am` (Amharic), `ar` (Arabic), `ar-Latn` (Arabic-Latin), `az` (Azerbaijani), `be` (Belarusian), `bg` (Bulgarian), `bn` (Bengali), `bn-Latn` (Bengali-Latin), `bs` (Bosnian), `ca` (Catalan), `ceb` (Cebuano), `co` (Corsican), `cs` (Czech), `cy` (Welsh), `da` (Danish), `de` (German), `el` (Greek), `el-Latn` (Greek-Latin), `en` (English), `eo` (Esperanto), `es` (Spanish), `et` (Estonian), `eu` (Basque), `fa` (Persian), `fi` (Finnish), `fil` (Filipino), `fr` (French), `fy` (Frisian), `ga` (Irish), `gd` (Scottish Gaelic), `gl` (Galician), `gu` (Gujarati), `ha` (Hausa), `haw` (Hawaiian), `he` (Hebrew), `hi` (Hindi), `hi-Latn` (Hindi-Latin), `hmn` (Hmong), `hr` (Croatian), `ht` (Haitian Creole), `hu` (Hungarian), `hy` (Armenian), `id` (Indonesian), `ig` (Igbo), `is` (Icelandic), `it` (Italian), `ja` (Japanese), `ja-Latn` (Japanese-Latin), `jv` (Javanese), `ka` (Georgian), `kk` (Kazakh), `km` (Khmer), `kn` (Kannada), `ko` (Korean), `ku` (Kurdish), `ky` (Kyrgyz), `la` (Latin), `lb` (Luxembourgish), `lo` (Lao), `lt` (Lithuanian), `lv` (Latvian), `mg` (Malagasy), `mi` (Maori), `mk` (Macedonian), `ml` (Malayalam), `mn` (Mongolian), `mr` (Marathi), `ms` (Malay), `mt` (Maltese), `my` (Myanmar), `ne` (Nepali), `nl` (Dutch), `no` (Norwegian), `ny` (Chichewa), `pa` (Punjabi), `pl` (Polish), `ps` (Pashto), `pt` (Portuguese), `ro` (Romanian), `ru` (Russian), `ru-Latn` (Russian-Latin), `sd` (Sindhi), `si` (Sinhala), `sk` (Slovak), `sl` (Slovenian), `sm` (Samoan), `sn` (Shona), `so` (Somali), `sq` (Albanian), `sr` (Serbian), `st` (Sesotho), `su` (Sundanese), `sv` (Swedish), `sw` (Swahili), `ta` (Tamil), `te` (Telugu), `tg` (Tajik), `th` (Thai), `tr` (Turkish), `uk` (Ukrainian), `und` (Unknown), `ur` (Urdu), `uz` (Uzbek), `vi` (Vietnamese), `xh` (Xhosa), `yi` (Yiddish), `yo` (Yoruba), `zh` (Chinese), `zh-Latn` (Chinese-Latin), `zu` (Zulu)

All language codes follow [BCP-47](https://www.rfc-editor.org/info/bcp47) format.

## Complete Examples

### Example 1: Simple Translation

```typescript
// Check if en→es translation is available
const availability = await Translator.availability({
  sourceLanguage: 'en',
  targetLanguage: 'es'
});

if (availability === 'available') {
  // Create translator
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'es'
  });

  // Translate
  const spanish = await translator.translate('Hello, how are you?');
  console.log(spanish); // "Hola, ¿cómo estás?"

  // Cleanup
  translator.destroy();
}
```

### Example 2: Language Detection with Confidence Scores

```typescript
const detector = await LanguageDetector.create();

const text = "Bonjour! Comment allez-vous?";
const results = await detector.detect(text);

console.log('Detected languages:');
results.forEach(({ detectedLanguage, confidence }) => {
  console.log(`  ${detectedLanguage}: ${(confidence * 100).toFixed(1)}%`);
});
// Output:
//   fr: 95.5%
//   und: 4.5%

detector.destroy();
```

### Example 3: Translation with Download Progress

```typescript
button.addEventListener('click', async () => {
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'ja',
    monitor: (monitor) => {
      monitor.addEventListener('downloadprogress', (event: ProgressEvent) => {
        // Update UI with download progress
        const progress = Math.round(event.loaded * 100);
        console.log(`Downloading translation model... ${progress}%`);
        progressBar.value = event.loaded; // 0 to 1
        progressBar.style.display = 'block';
      });
    }
  });

  const result = await translator.translate('Welcome to our application!');
  console.log(result); // "私たちのアプリケーションへようこそ！"

  translator.destroy();
});
```

### Example 4: Multi-language Detection

```typescript
const detector = await LanguageDetector.create({
  expectedInputLanguages: ['en', 'es', 'fr', 'de', 'it']
});

const texts = [
  "Hello world",
  "Hola mundo",
  "Bonjour le monde",
  "Hallo Welt",
  "Ciao mondo"
];

for (const text of texts) {
  const results = await detector.detect(text);
  const topResult = results[0];
  console.log(`"${text}" → ${topResult.detectedLanguage} (${topResult.confidence.toFixed(2)})`);
}

detector.destroy();
```

### Example 5: Streaming Translation for Long Text

```typescript
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es'
});

const longText = `
  This is a very long document that we want to translate.
  Using streaming allows us to show partial results to the user
  as the translation progresses, improving perceived performance.
`;

const stream = translator.translateStreaming(longText);
const reader = stream.getReader();
const decoder = new TextDecoder();

let translatedText = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  translatedText += value;
  // Update UI with partial translation
  document.getElementById('output').textContent = translatedText;
}

console.log('Translation complete!');
translator.destroy();
```

### Example 6: Abort Translation

```typescript
const controller = new AbortController();

// Start translation
const translationPromise = (async () => {
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'fr',
    signal: controller.signal
  });

  const result = await translator.translate('This is a long text...', {
    signal: controller.signal
  });

  translator.destroy();
  return result;
})();

// User cancels after 2 seconds
setTimeout(() => {
  controller.abort();
  console.log('Translation cancelled');
}, 2000);

try {
  const result = await translationPromise;
  console.log('Result:', result);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Translation was cancelled');
  }
}
```

## Error Handling

The `create()` methods return Promises that **reject** if model loading fails. Always wrap them in try-catch:

```typescript
// Check availability first
const availability = await LanguageDetector.availability();

if (availability === 'unavailable') {
  console.error('Language detection is not supported on this device');
  return;
}

// Wrap create() in try-catch
try {
  const detector = await LanguageDetector.create({
    monitor: (m) => {
      m.addEventListener('downloadprogress', (event: ProgressEvent) => {
        const progress = Math.round(event.loaded * 100);
        console.log(`Downloading language detection model... ${progress}%`);
      });
    }
  });

  // Success - use the detector
  const results = await detector.detect('Hello world');
  console.log('Detected:', results[0].detectedLanguage);
  detector.destroy();

} catch (error) {
  // Handle errors
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        console.error('User activation required - call from a click handler');
        break;
      case 'AbortError':
        console.error('Model download was cancelled');
        break;
      case 'NotSupportedError':
        console.error('Language pair not supported (Translator only)');
        break;
      default:
        console.error('Failed to load model:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Common Error Types

| Error Name | When It Occurs | How to Handle |
|------------|----------------|---------------|
| `NotAllowedError` | User activation required but not present (when availability is `"downloadable"`) | Call `create()` from a user gesture handler (click, etc.) |
| `AbortError` | Operation cancelled via `AbortSignal` | Expected when user cancels - handle gracefully |
| `NotSupportedError` | Language pair not supported (Translator only) | Check availability first or show error to user |
| `InvalidStateError` | Called methods after `destroy()` | Don't use the instance after destroying it |
| Network/Download errors | Model download failed | Retry with exponential backoff or show error |

### Robust Creation Pattern

```typescript
async function createTranslatorSafely(source: string, target: string) {
  // 1. Check availability
  const availability = await Translator.availability({
    sourceLanguage: source,
    targetLanguage: target
  });

  if (availability === 'unavailable') {
    throw new Error(`Translation from ${source} to ${target} is not available`);
  }

  // 2. Create with error handling
  try {
    return await Translator.create({
      sourceLanguage: source,
      targetLanguage: target,
      monitor: (m) => {
        m.addEventListener('downloadprogress', (event: ProgressEvent) => {
          const progress = Math.round(event.loaded * 100);
          console.log(`Downloading translation model... ${progress}%`);
        });
      }
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new Error('Please click a button to initiate translation (user activation required)');
    }
    throw error; // Re-throw other errors
  }
}

// Usage
try {
  const translator = await createTranslatorSafely('en', 'es');
  const result = await translator.translate('Hello');
  console.log(result);
  translator.destroy();
} catch (error) {
  console.error('Translation failed:', error.message);
}
```

## API Requirements

### Secure Context
Both APIs require a **secure context** (HTTPS or localhost).

### User Activation
When model availability is `"downloadable"`, creating a Translator or LanguageDetector requires **user activation** (e.g., must be called within a click handler). This prevents unwanted automatic downloads.

```typescript
// This will throw NotAllowedError if called without user activation
button.addEventListener('click', async () => {
  // ✓ Has user activation
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'es'
  });
});

// ✗ Will fail if availability is "downloadable"
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es'
});
```

### Permission Policy
These APIs can be controlled via [Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Permissions_Policy):
- `translator` - Controls Translator API access
- `language-detector` - Controls LanguageDetector API access

## Browser Support

These APIs are available in:
- **Chrome/Chromium** 130+ (with appropriate flags enabled during development)
- Requires `TranslationAPI` and `LanguageDetectionAPI` runtime flags

To test in Chrome:
1. Enable flags: `chrome://flags/#translation-api` and `chrome://flags/#language-detection-api`
2. Restart browser
3. Use in secure context (HTTPS or localhost)

## Resources

- **Specification**: [WebML Translation API](https://github.com/webmachinelearning/translation-api)
- **Chromium Implementation**: `third_party/blink/renderer/modules/ai/on_device_translation/`
- **Web Platform Tests**: `third_party/blink/web_tests/external/wpt/ai/`

## Implementation Details

### Architecture

Both APIs use Chromium's on-device ML infrastructure:

1. **Renderer Process** (Blink): TypeScript/JavaScript APIs exposed to web content
2. **Mojo IPC**: Communication between renderer and browser process
3. **Browser Process**: Model management, downloading, and coordination
4. **ML Service**: TensorFlow Lite models for actual translation/detection

### Model Management

- Models are downloaded on-demand via Chrome's component updater
- Models are cached locally for offline use
- Download requires user activation to prevent bandwidth abuse
- Progress can be monitored via `CreateMonitorCallback`

### Language Code Handling

- All language codes follow BCP-47 format (e.g., `en`, `es`, `zh-CN`)
- Codes are canonicalized (e.g., `iw` → `he` for Hebrew)
- Script variants are supported (e.g., `ar-Latn` for Arabic written in Latin script)

## License

This TypeScript definitions module is MIT licensed. The underlying Chromium implementation is governed by a BSD-style license.
