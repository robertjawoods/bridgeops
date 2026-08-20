<script lang="ts">
import type { Session, User } from "better-auth";

import { invalidateAll } from "$app/navigation";

let {
	session = null,
	user = null,
}: { session?: Session | null; user?: User | null } = $props();

import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient();

const _handleSignOut = async () => {
	// Implement sign-out logic here
	var { data } = await authClient.signOut();

	if (data?.success) {
		await invalidateAll();
	}

	console.log("Sign out clicked");
};
</script>

<nav
	class="border-b border-[#1f2433] bg-[#0f101a]/95 shadow-[rgba(255,255,255,0.25)_0_1px_3px_0_inset] backdrop-blur"
>
	<div class="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
		<a href="/" class="text-lg font-medium text-white">BridgeOps</a>

		{#if session}
			<a href="/dashboard">Dashboard</a>
		{/if}

		{#if session && user}
			<div class="flex items-center gap-3">
				<div class="hidden text-right sm:block">
					<div class="text-sm font-medium text-[#c9d3ee]">{user.name ?? user.email}</div>
					<div class="text-xs text-[#646e87]">Signed in</div>
				</div>
				<button
					type="button"
					class="rounded-[9999px] border border-[#939db8] px-5 py-2 text-sm font-medium text-[#c9d3ee] transition hover:border-[#c9d3ee] hover:text-white"
					onclick={_handleSignOut}
				>
					Sign out
				</button>
			</div>
		{:else}
			<div class="flex items-center gap-3">
				<a
					href="/login"
					class="rounded-[9999px] border border-[#939db8] px-5 py-2 text-sm font-medium text-[#c9d3ee] transition hover:border-[#c9d3ee] hover:text-white"
				>
					Log in
				</a>
				<a
					href="/signup"
					class="rounded-[9999px] bg-[linear-gradient(353deg,rgb(91,99,211)_17.51%,rgb(124,135,247)_183.08%)] px-5 py-2 text-sm font-medium text-white shadow-[rgba(255,255,255,0.25)_0_1px_3px_0_inset] transition hover:brightness-110"
				>
					Sign up
				</a>
			</div>
		{/if}
	</div>
</nav>
