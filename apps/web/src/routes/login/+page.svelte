<script lang="ts">
	import LoginForm from '../../components/loginForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData | null } = $props();
</script>

<section class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
	<LoginForm
		{form}
		action="?/login"
		magicLinkAction="?/magicLink"
		submitLabel="Log in"
		alternateHref="/signup"
		alternateLabel="Need an account? Sign up"
		heading="Log in to BridgeOps"
		redirectTo={data.redirectTo}
	/>
</section>
