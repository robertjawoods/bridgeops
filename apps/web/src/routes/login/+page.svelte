<script lang="ts">
    import LoginForm from '../../components/loginForm.svelte';
    import type { ActionData } from './$types';

    let { form }: { form: ActionData | null } = $props();
</script>

<section class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
    <LoginForm
        {form}
        action="?/login"
        submitLabel="Log in"
        alternateHref="/signup"
        alternateLabel="Need an account? Sign up"
        heading="Log in to BridgeOps"
    />
</section>