<script lang="ts">
    import LoginForm from '../../components/loginForm.svelte';
    import type { ActionData } from './$types';

    let { form }: { form: ActionData | null } = $props();
</script>

<section class="px-4 py-12">
    <LoginForm
        {form}
        action="?/login"
        submitLabel="Log in"
        alternateHref="/signup"
        alternateLabel="Need an account? Sign up"
        heading="Log in to BridgeOps"
    />
</section>