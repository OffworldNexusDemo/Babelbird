<script lang="ts">
    import { Dialog } from "bits-ui";
    import { Select } from "bits-ui";
    import { XIcon } from "lucide-svelte";
    import { ChevronDownIcon } from "lucide-svelte";
    import { languages } from "./languages";

    const {
        portalRoot,
    }: {
        portalRoot: HTMLElement | undefined;
    } = $props();

    let open = $state(false);
    let resolve = $state<
        ((value: string | PromiseLike<string>) => void) | null
    >(null);
    let reject = $state<((reason?: any) => void) | null>(null);

    export function askForLanguage(defaultLang: string) {
        attemptReject("askForLanguage() got called again");
        open = true;
        value = defaultLang;

        return new Promise<string>((res, rej) => {
            resolve = res;
            reject = rej;
        });
    }

    function attemptReject(reason: string) {
        if (reject) {
            reject(new Error(reason));
        }
    }

    function nextStep(e: SubmitEvent) {
        e.preventDefault();
        open = false;

        if (resolve) {
            resolve(value);
        }
    }

    interface Item {
        label: string;
        value: string;
    }

    const items: Item[] = [...languages]
        .sort(([codeA], [codeB]) => codeA.localeCompare(codeB))
        .map(([code, lang]) => ({
            label: `${code} - ${lang}`,
            value: code,
        }));

    let value = $state<string>("");
    let selectEl = $state<HTMLElement | null>(null);
</script>

<Dialog.Root
    bind:open
    onOpenChange={(isOpen) => {
        if (!isOpen) {
            attemptReject("Dialog got closed");
        }
    }}
>
    <Dialog.Portal to={portalRoot}>
        <Dialog.Overlay />
        <Dialog.Content
            onOpenAutoFocus={(e: Event) => {
                e.preventDefault();
                selectEl?.focus();
            }}
        >
            <Dialog.Title>Pick Target Language</Dialog.Title>
            <Dialog.Description
                >Please select the language into which you would like to
                translate the selected text</Dialog.Description
            >

            <form action="" onsubmit={nextStep} class="language-form">
                <label for="language-select">Language</label>
                <Select.Root type="single" bind:value {items} name="language">
                    <Select.Trigger bind:ref={selectEl} id="language-select">
                        {#if value}
                            {items.find((i) => i.value === value)?.label ||
                                value}
                        {:else}
                            Pick a language
                        {/if}
                        <ChevronDownIcon />
                    </Select.Trigger>
                    <Select.Portal to={portalRoot}>
                        <Select.Content>
                            {#each items as item (item.value)}
                                <Select.Item
                                    value={item.value}
                                    label={item.label}
                                >
                                    {#snippet children({ selected })}
                                        <span class="item-label"
                                            >{item.label}</span
                                        >
                                        {#if selected}
                                            <span class="item-indicator">✓</span
                                            >
                                        {/if}
                                    {/snippet}
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Portal>
                </Select.Root>

                <button type="submit" class="submit-button">Translate</button>
            </form>

            <Dialog.Close>
                <XIcon />
            </Dialog.Close>
        </Dialog.Content>
    </Dialog.Portal>
</Dialog.Root>

<style>
    .language-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-xl);
    }

    .language-form label {
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
        margin-bottom: var(--space-md);
        display: block;
    }

    .item-label {
        flex: 1;
    }

    .item-indicator {
        margin-left: var(--space-sm);
    }

    .submit-button {
        padding: var(--space-sm) var(--space-lg);
        background: linear-gradient(
            90deg,
            var(--color-accent-from),
            var(--color-accent-to)
        );
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition: all 0.15s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .submit-button:hover {
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        transform: translateY(-1px);
    }

    .submit-button:active {
        transform: translateY(0);
    }

    .submit-button:focus {
        outline: 2px solid var(--color-accent-from);
        outline-offset: 2px;
    }
</style>
