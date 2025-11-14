/**
 * Chrome AI Translation and Language Detection APIs
 * TypeScript type definitions for Chromium's on-device Translation and Language Detection APIs
 *
 * Based on: https://github.com/webmachinelearning/translation-api
 * Chromium implementation: third_party/blink/renderer/modules/ai/on_device_translation/
 */

// ============================================================================
// Shared Types
// ============================================================================

/**
 * Availability status for AI models
 * - "unavailable": The model is not available and cannot be downloaded
 * - "downloadable": The model can be downloaded with user activation
 * - "downloading": The model is currently being downloaded
 * - "available": The model is ready to use
 */
export type Availability =
    | "unavailable"
    | "downloadable"
    | "downloading"
    | "available";

/**
 * Monitor for tracking model download progress
 * Fires 'downloadprogress' events (ProgressEvent) during model download
 * The ProgressEvent contains:
 * - loaded: normalized download progress (0 to 1)
 * - total: always 1
 */
export interface CreateMonitor extends EventTarget {
    ondownloadprogress: ((this: CreateMonitor, ev: ProgressEvent) => any) | null;
    addEventListener(type: 'downloadprogress', listener: (ev: ProgressEvent) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

/**
 * Callback for monitoring creation/download progress
 */
export type CreateMonitorCallback = (monitor: CreateMonitor) => void;

// ============================================================================
// Translator API
// ============================================================================

/**
 * Core options required for creating a translator
 */
export interface TranslatorCreateCoreOptions {
    /** Source language in BCP-47 format (e.g., "en", "es", "zh") */
    sourceLanguage: string;
    /** Target language in BCP-47 format (e.g., "en", "es", "zh") */
    targetLanguage: string;
}

/**
 * Options for creating a translator with optional abort and monitoring
 */
export interface TranslatorCreateOptions extends TranslatorCreateCoreOptions {
    /** AbortSignal to cancel the creation/download */
    signal?: AbortSignal;
    /** Callback to monitor download progress */
    monitor?: CreateMonitorCallback;
}

/**
 * Options for translation operations
 */
export interface TranslatorTranslateOptions {
    /** AbortSignal to cancel the translation */
    signal?: AbortSignal;
}

/**
 * On-device translation API
 * Translates text between languages using locally-downloaded models
 *
 * @example
 * // Check availability
 * const availability = await Translator.availability({
 *   sourceLanguage: 'en',
 *   targetLanguage: 'es'
 * });
 *
 * if (availability === 'available' || availability === 'downloadable') {
 *   // Create translator (may trigger download with user activation)
 *   const translator = await Translator.create({
 *     sourceLanguage: 'en',
 *     targetLanguage: 'es',
 *     monitor: (m) => {
 *       m.addEventListener('downloadprogress', (e) => {
 *         console.log('Download progress:', e);
 *       });
 *     }
 *   });
 *
 *   // Translate text
 *   const result = await translator.translate('Hello world');
 *   console.log(result); // "Hola mundo"
 *
 *   // Don't forget to clean up
 *   translator.destroy();
 * }
 */
export interface Translator {
    /**
     * Check if translation between two languages is available
     * @param options Source and target language options
     * @returns Promise resolving to availability status
     */
    availability(options: TranslatorCreateCoreOptions): Promise<Availability>;

    /**
     * Create a new translator instance
     * Requires user activation if availability is "downloadable"
     * @param options Creation options including languages, abort signal, and monitor
     * @returns Promise resolving to a Translator instance
     * @throws {DOMException} NotAllowedError - User activation required but not present
     * @throws {DOMException} AbortError - Aborted via signal
     * @throws {DOMException} NotSupportedError - Language pair not supported
     * @throws {Error} Network or download errors during model download
     */
    create(options: TranslatorCreateOptions): Promise<Translator>;

    /**
     * Translate text from source to target language
     * @param input Text to translate
     * @param options Optional abort signal
     * @returns Promise resolving to translated text
     * @throws AbortError if aborted via signal
     * @throws InvalidStateError if called after destroy()
     */
    translate(
        input: string,
        options?: TranslatorTranslateOptions,
    ): Promise<string>;

    /**
     * Translate text with streaming results
     * Returns chunks of translated text as they become available
     * @param input Text to translate
     * @param options Optional abort signal
     * @returns ReadableStream of translated text chunks
     * @throws AbortError if aborted via signal
     * @throws InvalidStateError if called after destroy()
     */
    translateStreaming(
        input: string,
        options?: TranslatorTranslateOptions,
    ): ReadableStream<string>;

    /**
     * Measure input token usage without performing translation
     * Useful for checking quotas before translation
     * @param input Text to measure
     * @param options Optional abort signal
     * @returns Promise resolving to token count
     */
    measureInputUsage(
        input: string,
        options?: TranslatorTranslateOptions,
    ): Promise<number>;

    /**
     * Destroy the translator and free resources
     * After calling this, all other methods will throw InvalidStateError
     */
    destroy(): void;

    /** Maximum input quota (typically Infinity for unlimited) */
    readonly inputQuota: number;

    /** Source language code in BCP-47 format */
    readonly sourceLanguage: string;

    /** Target language code in BCP-47 format */
    readonly targetLanguage: string;
}

/**
 * Type alias for Translator instances (use this for type annotations)
 */
export type TranslatorInstance = Translator;

/**
 * Global Translator namespace
 */
export declare const Translator: {
    /**
     * Check if translation between two languages is available
     */
    availability(options: TranslatorCreateCoreOptions): Promise<Availability>;

    /**
     * Create a new translator instance
     */
    create(options: TranslatorCreateOptions): Promise<Translator>;
};

// ============================================================================
// Language Detection API
// ============================================================================

/**
 * Core options for creating a language detector
 */
export interface LanguageDetectorCreateCoreOptions {
    /**
     * Expected input languages to optimize detection for
     * If provided, detection will be optimized for these languages
     * Array of BCP-47 language codes
     */
    expectedInputLanguages?: string[];
}

/**
 * Options for creating a language detector with optional abort and monitoring
 */
export interface LanguageDetectorCreateOptions
    extends LanguageDetectorCreateCoreOptions {
    /** AbortSignal to cancel the creation/download */
    signal?: AbortSignal;
    /** Callback to monitor download progress */
    monitor?: CreateMonitorCallback;
}

/**
 * Options for language detection operations
 */
export interface LanguageDetectorDetectOptions {
    /** AbortSignal to cancel the detection */
    signal?: AbortSignal;
}

/**
 * Result from language detection
 */
export interface LanguageDetectionResult {
    /** Detected language in BCP-47 format (or "und" for unknown) */
    detectedLanguage: string;
    /** Confidence score between 0 and 1 */
    confidence: number;
}

/**
 * On-device language detection API
 * Detects the language of input text using locally-downloaded models
 *
 * Supports 95+ languages including:
 * af, am, ar, ar-Latn, az, be, bg, bn, bn-Latn, bs, ca, ceb, co, cs, cy, da,
 * de, el, el-Latn, en, eo, es, et, eu, fa, fi, fil, fr, fy, ga, gd, gl, gu,
 * ha, haw, he, hi, hi-Latn, hmn, hr, ht, hu, hy, id, ig, is, it, ja, ja-Latn,
 * jv, ka, kk, km, kn, ko, ku, ky, la, lb, lo, lt, lv, mg, mi, mk, ml, mn, mr,
 * ms, mt, my, ne, nl, no, ny, pa, pl, ps, pt, ro, ru, ru-Latn, sd, si, sk,
 * sl, sm, sn, so, sq, sr, st, su, sv, sw, ta, te, tg, th, tr, uk, und, ur,
 * uz, vi, xh, yi, yo, zh, zh-Latn, zu
 *
 * @example
 * // Check availability
 * const availability = await LanguageDetector.availability();
 *
 * if (availability === 'available' || availability === 'downloadable') {
 *   // Create detector
 *   const detector = await LanguageDetector.create({
 *     expectedInputLanguages: ['en', 'es', 'fr']
 *   });
 *
 *   // Detect language
 *   const results = await detector.detect('Hello world');
 *
 *   // Results are sorted by confidence (highest first), with 'und' last
 *   for (const result of results) {
 *     console.log(`${result.detectedLanguage}: ${result.confidence}`);
 *   }
 *   // Output: en: 0.95, und: 0.05
 *
 *   // Clean up
 *   detector.destroy();
 * }
 */
export interface LanguageDetector {
    /**
     * Check if language detection is available
     * @param options Optional expected input languages
     * @returns Promise resolving to availability status
     */
    availability(
        options?: LanguageDetectorCreateCoreOptions,
    ): Promise<Availability>;

    /**
     * Create a new language detector instance
     * Requires user activation if availability is "downloadable"
     * @param options Optional creation options
     * @returns Promise resolving to a LanguageDetector instance
     * @throws {DOMException} NotAllowedError - User activation required but not present
     * @throws {DOMException} AbortError - Aborted via signal
     * @throws {Error} Network or download errors during model download
     */
    create(options?: LanguageDetectorCreateOptions): Promise<LanguageDetector>;

    /**
     * Detect the language(s) of input text
     * Returns results sorted by confidence (highest first), with "und" (unknown) always last
     * Confidence scores are normalized and sum to approximately 1.0
     *
     * @param input Text to detect language for
     * @param options Optional abort signal
     * @returns Promise resolving to array of detection results
     * @throws AbortError if aborted via signal
     * @throws InvalidStateError if called after destroy()
     */
    detect(
        input: string,
        options?: LanguageDetectorDetectOptions,
    ): Promise<LanguageDetectionResult[]>;

    /**
     * Measure input token usage without performing detection
     * @param input Text to measure
     * @param options Optional abort signal
     * @returns Promise resolving to token count
     */
    measureInputUsage(
        input: string,
        options?: LanguageDetectorDetectOptions,
    ): Promise<number>;

    /**
     * Destroy the detector and free resources
     * After calling this, all other methods will throw InvalidStateError
     */
    destroy(): void;

    /**
     * Expected input languages that detection is optimized for
     * Null if not specified during creation
     */
    readonly expectedInputLanguages: readonly string[] | null;

    /** Maximum input quota (typically Infinity for unlimited) */
    readonly inputQuota: number;
}

/**
 * Type alias for LanguageDetector instances (use this for type annotations)
 */
export type LanguageDetectorInstance = LanguageDetector;

/**
 * Global LanguageDetector namespace
 */
export declare const LanguageDetector: {
    /**
     * Check if language detection is available
     */
    availability(
        options?: LanguageDetectorCreateCoreOptions,
    ): Promise<Availability>;

    /**
     * Create a new language detector instance
     */
    create(options?: LanguageDetectorCreateOptions): Promise<LanguageDetector>;
};

// ============================================================================
// Window/Worker Global Extensions
// ============================================================================

declare global {
    const Translator: typeof import("./index").Translator;
    const LanguageDetector: typeof import("./index").LanguageDetector;

    // Type aliases for instance types (use these for variable annotations)
    type TranslatorInstance = import("./index").TranslatorInstance;
    type LanguageDetectorInstance = import("./index").LanguageDetectorInstance;
}
