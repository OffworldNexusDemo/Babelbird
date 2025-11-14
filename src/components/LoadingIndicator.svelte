<script lang="ts">
    import { fly } from "svelte/transition";

    interface Props {
        progress: number | null;
    }

    let { progress }: Props = $props();

    let show = $derived(progress !== null && progress < 1);
    let percentage = $derived(
        progress !== null ? Math.round(progress * 100) : 0,
    );
</script>

{#if show}
    <div class="loading-indicator" transition:fly={{ y: 20, duration: 300 }}>
        <div class="loading-content">
            <div class="loading-text">
                <span class="loading-label">Loading models</span>
                <span class="loading-percentage">{percentage}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: {percentage}%"></div>
            </div>
        </div>
    </div>
{/if}

<style>
    .loading-indicator {
        position: fixed;
        bottom: var(--space-xl);
        right: var(--space-xl);
        z-index: 9999;
        font-family: var(--font-sans);
    }

    .loading-content {
        background: var(--color-bg-overlay);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-md) var(--space-lg);
        box-shadow: var(--shadow-md);
        backdrop-filter: var(--backdrop-blur);
        min-width: 200px;
    }

    .loading-text {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-sm);
        gap: var(--space-lg);
    }

    .loading-label {
        font-size: var(--text-sm);
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
    }

    .loading-percentage {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        font-weight: var(--font-weight-semibold);
        font-variant-numeric: tabular-nums;
        font-family: var(--font-mono);
        min-width: 3ch;
        text-align: right;
    }

    .progress-bar {
        height: var(--space-xs);
        background: var(--color-surface-muted);
        border-radius: var(--radius-sm);
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(
            90deg,
            var(--color-accent-from),
            var(--color-accent-to)
        );
        border-radius: var(--radius-sm);
        transition: width 0.3s ease;
    }
</style>
