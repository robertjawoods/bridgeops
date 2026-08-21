<script lang="ts">
	import { enhance } from '$app/forms';
	import { authClient } from '$lib/auth/client/authClient';

	type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>;
	type LoginFormData = {
		fieldErrors?: FieldErrors;
		message?: string;
	};

	let {
		form,
		action,
		submitLabel,
		showName = false,
		alternateHref,
		alternateLabel,
		heading,
		magicLinkAction,
		redirectTo = '/dashboard'
	}: {
		form: LoginFormData | null;
		action: string;
		submitLabel: string;
		showName?: boolean;
		alternateHref: string;
		alternateLabel: string;
		heading?: string;
		magicLinkAction?: string;
		redirectTo?: string;
	} = $props();

	const fieldErrors = $derived((form?.fieldErrors ?? {}) as FieldErrors);
	const _hasFieldErrors = $derived(Object.keys(fieldErrors).length > 0);

	const _handleGitHubClick = async () => {
		await authClient.signIn.social({
			provider: 'github',
			callbackURL: redirectTo
		});
	};

	const _handleGoogleClick = async () => {
		await authClient.signIn.social({
			provider: 'google',
			callbackURL: redirectTo
		});
	};
</script>

<div class="mx-auto max-w-md space-y-4">
	{#if heading}
		<h1 class="text-center text-4xl text-white">{heading}</h1>
	{/if}

	<form
		method="POST"
		{action}
		use:enhance
		class="flex flex-col gap-5 rounded-[16px] border border-[#1f2433] bg-[#151621] p-5"
	>
		{#if showName}
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium text-[#c9d3ee]">Name</span>
				<input
					type="text"
					name="name"
					placeholder="Name"
					class={`rounded-[10px] border bg-[#0f101a] px-4 py-3 text-white placeholder:text-[#646e87] focus:ring-2 focus:ring-[#98a4f7]/40 focus:outline-none ${fieldErrors.name ? 'border-red-500' : 'border-[#1f2433]'}`}
				/>
				{#if fieldErrors.name}
					<span class="text-sm text-red-400">{fieldErrors.name}</span>
				{/if}
			</label>
		{/if}

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-[#c9d3ee]">Email</span>
			<input
				type="email"
				name="email"
				placeholder="Email"
				required
				class={`rounded-[10px] border bg-[#0f101a] px-4 py-3 text-white placeholder:text-[#646e87] focus:ring-2 focus:ring-[#98a4f7]/40 focus:outline-none ${fieldErrors.email ? 'border-red-500' : 'border-[#1f2433]'}`}
			/>
			{#if fieldErrors.email}
				<span class="text-sm text-red-400">{fieldErrors.email}</span>
			{/if}
		</label>

		<div class="flex flex-col gap-1">
			<div class="flex items-center justify-between gap-3">
				<label for="password" class="text-sm font-medium text-[#c9d3ee]">Password</label>
				{#if action.includes('login')}
					<button
						type="submit"
						formaction="?/forgotPassword"
						formnovalidate
						class="bg-transparent p-0 text-sm font-medium text-[#98a4f7] underline-offset-4 hover:underline"
					>
						Forgotten password?
					</button>
				{/if}
			</div>
			<input
				id="password"
				type="password"
				name="password"
				placeholder="Password"
				required
				class={`w-full rounded-[10px] border bg-[#0f101a] px-4 py-3 text-white placeholder:text-[#646e87] focus:ring-2 focus:ring-[#98a4f7]/40 focus:outline-none ${fieldErrors.password ? 'border-red-500' : 'border-[#1f2433]'}`}
			/>
			{#if fieldErrors.password}
				<span class="text-sm text-red-400">{fieldErrors.password}</span>
			{/if}
		</div>

		<button
			type="submit"
			class="rounded-[9999px] bg-[linear-gradient(353deg,rgb(91,99,211)_17.51%,rgb(124,135,247)_183.08%)] px-5 py-3 text-base font-medium text-white shadow-[rgba(255,255,255,0.25)_0_1px_3px_0_inset] transition hover:brightness-110"
		>
			{submitLabel}
		</button>

		<div class="flex items-center gap-3 text-sm text-[#646e87]">
			<div class="h-px flex-1 bg-[#1f2433]"></div>
			<span>or</span>
			<div class="h-px flex-1 bg-[#1f2433]"></div>
		</div>

		{#if magicLinkAction}
			<button
				type="submit"
				formaction={magicLinkAction}
				formnovalidate
				class="flex items-center justify-center gap-3 rounded-[10px] border border-[#1f2433] bg-[#0f101a] px-4 py-3 font-medium text-[#c9d3ee] transition hover:border-[#939db8] hover:text-white focus:ring-2 focus:ring-[#98a4f7]/40 focus:outline-none"
			>
				<span>Generate Magic Link</span>
			</button>
		{/if}

		<button
			type="button"
			onclick={_handleGitHubClick}
			class="flex items-center justify-center gap-3 rounded-[10px] border border-[#1f2433] bg-[#0f101a] px-4 py-3 font-medium text-[#c9d3ee] transition hover:border-[#939db8] hover:text-white focus:ring-2 focus:ring-[#98a4f7]/40 focus:outline-none"
		>
			<svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5 fill-current">
				<path
					d="M12 0.5C5.37 0.5 0 5.87 0 12.5C0 17.8 3.44 22.29 8.21 23.88C8.81 23.99 9.03 23.62 9.03 23.3C9.03 23.01 9.02 22.05 9.01 20.77C5.67 21.5 4.97 19.16 4.97 19.16C4.42 17.76 3.63 17.39 3.63 17.39C2.55 16.65 3.71 16.67 3.71 16.67C4.91 16.75 5.54 17.91 5.54 17.91C6.6 19.73 8.32 19.21 9 18.9C9.11 18.13 9.42 17.61 9.76 17.32C7.09 17.02 4.29 15.98 4.29 11.34C4.29 10.02 4.76 8.94 5.53 8.08C5.41 7.78 4.99 6.56 5.65 4.91C5.65 4.91 6.66 4.59 8.97 6.15C9.93 5.88 10.96 5.75 12 5.75C13.04 5.75 14.07 5.88 15.03 6.15C17.34 4.59 18.35 4.91 18.35 4.91C19.01 6.56 18.59 7.78 18.47 8.08C19.24 8.94 19.71 10.02 19.71 11.34C19.71 16 16.9 17.01 14.22 17.31C14.65 17.68 15.04 18.42 15.04 19.56C15.04 21.19 15.03 22.84 15.03 23.3C15.03 23.62 15.25 24 15.86 23.88C20.63 22.29 24 17.8 24 12.5C24 5.87 18.63 0.5 12 0.5Z"
				/>
			</svg>
			<span>Continue with GitHub</span>
		</button>

		<button
			type="button"
			onclick={_handleGoogleClick}
			class="flex items-center justify-center gap-3 rounded-[10px] border border-[#1f2433] bg-[#0f101a] px-4 py-3 font-medium text-[#c9d3ee] transition hover:border-[#939db8] hover:text-white focus:ring-2 focus:ring-[#98a4f7]/40 focus:outline-none"
		>
			<svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5">
				<path
					fill="#EA4335"
					d="M12 10.2V14.1H17.45C17.21 15.35 16.49 16.41 15.41 17.12L18.68 19.66C20.59 17.9 21.7 15.31 21.7 12.25C21.7 11.54 21.64 10.86 21.52 10.2H12Z"
				/>
				<path
					fill="#34A853"
					d="M12 21.5C14.7 21.5 16.97 20.6 18.68 19.66L15.41 17.12C14.51 17.72 13.36 18.08 12 18.08C9.4 18.08 7.19 16.32 6.39 13.95L3.01 16.56C4.71 19.94 8.1 21.5 12 21.5Z"
				/>
				<path
					fill="#FBBC05"
					d="M6.39 13.95C6.18 13.35 6.06 12.7 6.06 12C6.06 11.3 6.18 10.65 6.39 10.05L3.01 7.44C2.31 8.82 1.91 10.38 1.91 12C1.91 13.62 2.31 15.18 3.01 16.56L6.39 13.95Z"
				/>
				<path
					fill="#4285F4"
					d="M12 5.92C13.49 5.92 14.83 6.43 15.89 7.44L18.75 4.58C16.97 2.96 14.7 2 12 2C8.1 2 4.71 3.56 3.01 6.94L6.39 9.55C7.19 7.18 9.4 5.92 12 5.92Z"
				/>
			</svg>
			<span>Continue with Google</span>
		</button>
		<input type="hidden" name="redirectTo" value={redirectTo} />
	</form>

	<p class="text-center text-sm text-[#646e87]">
		<a href={alternateHref} class="font-medium text-[#98a4f7] underline underline-offset-4">
			{alternateLabel}
		</a>
	</p>

	{#if form?.message}
		<p class={`min-h-6 text-center text-sm ${_hasFieldErrors ? 'text-red-400' : 'text-[#c9d3ee]'}`}>
			{form.message}
		</p>
	{/if}
</div>
