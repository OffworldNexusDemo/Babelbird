<script lang="ts">
    import { Dialog } from "@ark-ui/svelte/dialog";
    import { Portal } from "@ark-ui/svelte/portal";
    import { XIcon } from "lucide-svelte";
    import { createListCollection, Select } from "@ark-ui/svelte/select";
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
        value = [defaultLang];

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
            resolve(value[0]);
        }
    }

    interface Item {
        label: string;
        value: string;
    }

    const collection = createListCollection<Item>({
        items: [...languages]
            .sort(([codeA], [codeB]) => codeA.localeCompare(codeB))
            .map(([code, lang]) => ({
                label: `${code} - ${lang}`,
                value: code,
            })),
    });

    let value = $state<string[]>([]);
    let selectEl = $state<HTMLElement | null>(null);
</script>

<Dialog.Root
    bind:open
    initialFocusEl={() => selectEl}
    onExitComplete={() => attemptReject("Dialog got closed")}
>
    <Portal container={portalRoot}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
            <Dialog.Content>
                <Dialog.Title>Pick Target Language</Dialog.Title>
                <Dialog.Description
                    >Please select the language into which you would like to
                    translate the selected text</Dialog.Description
                >

                <form action="" onsubmit={nextStep} class="language-form">
                    <Select.Root {collection} bind:value>
                        <Select.Label>Language</Select.Label>
                        <Select.Control>
                            <Select.Trigger bind:ref={selectEl}>
                                <Select.ValueText
                                    placeholder="Pick a language"
                                />
                                <Select.Indicator>
                                    <ChevronDownIcon />
                                </Select.Indicator>
                            </Select.Trigger>
                        </Select.Control>
                        <Portal container={portalRoot}>
                            <Select.Positioner>
                                <Select.Content>
                                    <Select.ItemGroup>
                                        <Select.ItemGroupLabel
                                            >Languages</Select.ItemGroupLabel
                                        >
                                        {#each collection.items as item (item.value)}
                                            <Select.Item {item}>
                                                <Select.ItemText
                                                    >{item.label}</Select.ItemText
                                                >
                                                <Select.ItemIndicator
                                                    >✓</Select.ItemIndicator
                                                >
                                            </Select.Item>
                                        {/each}
                                    </Select.ItemGroup>
                                </Select.Content>
                            </Select.Positioner>
                        </Portal>
                        <Select.HiddenSelect />
                    </Select.Root>

                    <button type="submit" class="submit-button"
                        >Translate</button
                    >
                </form>

                <Dialog.CloseTrigger>
                    <XIcon />
                </Dialog.CloseTrigger>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog.Root>
<style>
    .language-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-xl);
    }

    .language-form :global([data-scope="select"][data-part="label"]) {
        margin-bottom: var(--space-md);
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

