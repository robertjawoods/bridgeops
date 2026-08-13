<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	import { page } from '$app/state';

	const token = page.url.searchParams.get('token');

	let { form }: { form: ActionData | null } = $props();
</script>

<section class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
	<div class="mx-auto max-w-md space-y-4">
		<h1 class="text-center text-4xl text-white">Reset your password</h1>

		<form
			method="POST"
			action={`?/reset`}
			use:enhance
			class="flex flex-col gap-5 rounded-[16px] border border-[#1f2433] bg-[#151621] p-5"
		>
			<input type="hidden" value={token} name="token"/>
			<label class="flex flex-col gap-1" for="password">
				<span class="text-sm font-medium text-[#c9d3ee]">Password</span>
				<input
					id="password"
					type="password"
					name="password"
					placeholder="Password"
					required
					class="w-full rounded-[10px] border border-[#1f2433] bg-[#0f101a] px-4 py-3 text-white placeholder:text-[#646e87] focus:ring-2 focus:ring-[#98a4f7]/40 focus:outline-none"
				/>
			</label>

			<label class="flex flex-col gap-1" for="confirmation">
				<span class="text-sm font-medium text-[#c9d3ee]">Confirm password</span>
				<input
					id="confirmation"
					type="password"
					name="confirmation"
					placeholder="Confirm password"
					required
					class="w-full rounded-[10px] border border-[#1f2433] bg-[#0f101a] px-4 py-3 text-white placeholder:text-[#646e87] focus:ring-2 focus:ring-[#98a4f7]/40 focus:outline-none"
				/>
			</label>

			<button
				type="submit"
				class="rounded-[9999px] bg-[linear-gradient(353deg,rgb(91,99,211)_17.51%,rgb(124,135,247)_183.08%)] px-5 py-3 text-base font-medium text-white shadow-[rgba(255,255,255,0.25)_0_1px_3px_0_inset] transition hover:brightness-110"
			>
				Change Password
			</button>
		</form>

		<p class="text-center text-sm text-[#646e87]">
			<a href="/login" class="font-medium text-[#98a4f7] underline underline-offset-4">
				Back to log in
			</a>
		</p>

		{#if form}
			<p class="min-h-6 text-center text-sm text-[#c9d3ee]">
				{form}
			</p>
		{/if}
	</div>
</section>
