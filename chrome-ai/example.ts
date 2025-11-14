/**
 * Example usage of Chrome AI Translation and Language Detection APIs
 * This file demonstrates how to use the TypeScript types
 */

import './index';

// ============================================================================
// Example 1: Basic Translation
// ============================================================================

async function basicTranslation() {
  // Check availability
  const availability = await Translator.availability({
    sourceLanguage: 'en',
    targetLanguage: 'es'
  });

  if (availability === 'available' || availability === 'downloadable') {
    // Create translator
    const translator = await Translator.create({
      sourceLanguage: 'en',
      targetLanguage: 'es'
    });

    // Translate text
    const result = await translator.translate('Hello world');
    console.log(result); // "Hola mundo"

    // Check properties
    console.log('Source:', translator.sourceLanguage);
    console.log('Target:', translator.targetLanguage);
    console.log('Quota:', translator.inputQuota);

    // Cleanup
    translator.destroy();
  }
}

// ============================================================================
// Example 2: Translation with Progress Monitoring
// ============================================================================

async function translationWithProgress() {
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'ja',
    monitor: (monitor) => {
      monitor.addEventListener('downloadprogress', (event: ProgressEvent) => {
        // event.loaded ranges from 0 to 1
        const percentage = Math.round(event.loaded * 100);
        console.log(`Downloading translation model... ${percentage}%`);
      });
    }
  });

  const result = await translator.translate('Welcome!');
  console.log(result);

  translator.destroy();
}

// ============================================================================
// Example 3: Streaming Translation
// ============================================================================

async function streamingTranslation() {
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'fr'
  });

  const stream = translator.translateStreaming('This is a long text to translate...');
  const reader = stream.getReader();

  let fullTranslation = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullTranslation += value;
    console.log('Chunk:', value);
  }

  console.log('Complete:', fullTranslation);
  translator.destroy();
}

// ============================================================================
// Example 4: Language Detection
// ============================================================================

async function languageDetection() {
  const detector = await LanguageDetector.create();

  const results = await detector.detect('Bonjour le monde');

  // Results are sorted by confidence
  for (const result of results) {
    console.log(`${result.detectedLanguage}: ${(result.confidence * 100).toFixed(1)}%`);
  }
  // Output:
  // fr: 95.5%
  // und: 4.5%

  detector.destroy();
}

// ============================================================================
// Example 5: Language Detection with Expected Languages
// ============================================================================

async function optimizedLanguageDetection() {
  const detector = await LanguageDetector.create({
    expectedInputLanguages: ['en', 'es', 'fr', 'de']
  });

  console.log('Expected languages:', detector.expectedInputLanguages);

  const texts = [
    'Hello world',
    'Hola mundo',
    'Bonjour le monde',
    'Hallo Welt'
  ];

  for (const text of texts) {
    const results = await detector.detect(text);
    const topResult = results[0];
    console.log(`"${text}" → ${topResult.detectedLanguage} (${topResult.confidence.toFixed(2)})`);
  }

  detector.destroy();
}

// ============================================================================
// Example 6: Abort Signal Usage
// ============================================================================

async function translationWithAbort() {
  const controller = new AbortController();

  // Set up abort after 5 seconds
  setTimeout(() => controller.abort(), 5000);

  try {
    const translator = await Translator.create({
      sourceLanguage: 'en',
      targetLanguage: 'es',
      signal: controller.signal
    });

    const result = await translator.translate('Long text...', {
      signal: controller.signal
    });

    console.log(result);
    translator.destroy();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Translation was aborted');
    }
  }
}

// ============================================================================
// Example 7: Measure Input Usage
// ============================================================================

async function measureUsage() {
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'es'
  });

  const text = 'This is a sample text to measure';
  const tokens = await translator.measureInputUsage(text);

  console.log(`Text uses ${tokens} tokens`);
  console.log(`Quota: ${translator.inputQuota}`);

  if (tokens <= translator.inputQuota) {
    const result = await translator.translate(text);
    console.log('Translation:', result);
  }

  translator.destroy();
}

// ============================================================================
// Example 8: User Activation Handler
// ============================================================================

function setupTranslationButton() {
  const button = document.getElementById('translateBtn');

  button?.addEventListener('click', async () => {
    // User activation is present here, so this will work even if model
    // needs to be downloaded
    const availability = await Translator.availability({
      sourceLanguage: 'en',
      targetLanguage: 'es'
    });

    if (availability === 'downloadable') {
      console.log('Model needs download, but we have user activation!');
    }

    const translator = await Translator.create({
      sourceLanguage: 'en',
      targetLanguage: 'es',
      monitor: (m) => {
        m.addEventListener('downloadprogress', (event: ProgressEvent) => {
          const percentage = Math.round(event.loaded * 100);
          console.log(`Downloading... ${percentage}%`);
        });
      }
    });

    const input = (document.getElementById('input') as HTMLInputElement).value;
    const result = await translator.translate(input);

    (document.getElementById('output') as HTMLElement).textContent = result;

    translator.destroy();
  });
}

// ============================================================================
// Export examples for use
// ============================================================================

export {
  basicTranslation,
  translationWithProgress,
  streamingTranslation,
  languageDetection,
  optimizedLanguageDetection,
  translationWithAbort,
  measureUsage,
  setupTranslationButton
};
