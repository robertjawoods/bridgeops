<script lang="ts">
import LoginForm from "../../components/loginForm.svelte";
import type { ActionData } from "./$types";

let { form }: { form: ActionData | null } = $props();
</script>

<section class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
    <LoginForm
        form={form}
        action="?/register"
        submitLabel="Sign up"
        showName={true}
        alternateHref="/login"
        alternateLabel="Already have an account? Log in"
        heading="Create your BridgeOps account"
    />
</section>