<script lang="ts">
    import LoginForm from '../../components/loginForm.svelte';
    import type { ActionData } from './$types';

    let { form }: { form: ActionData | null } = $props();
</script>

<section class="px-4 py-12">
    <LoginForm
        {form}
        action="?/register"
        submitLabel="Sign up"
        showName={true}
        alternateHref="/login"
        alternateLabel="Already have an account? Log in"
        heading="Create your BridgeOps account"
    />
</section>