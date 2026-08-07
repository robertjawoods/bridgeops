<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData } from './$types';

    type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>;
    type PageForm = ActionData & {
        fieldErrors?: FieldErrors;
        message?: string;
    };

    let { form }: { form: PageForm | null } = $props();

    const fieldErrors = $derived((form?.fieldErrors ?? {}) as FieldErrors);
    const hasFieldErrors = $derived(Object.keys(fieldErrors).length > 0);
</script>

<h1 class="mb-8 text-center text-3xl font-bold">Welcome to BridgeOps</h1>

<form
    method="POST"
    action="?/login"
    use:enhance
    class="mx-auto flex max-w-md flex-col gap-4 rounded-md border p-4 shadow-md"
>
    <label class="flex flex-col gap-1">
        <span class="text-sm font-medium text-slate-700">Name</span>
        <input
            type="text"
            name="name"
            placeholder="Name"
            class={`rounded border px-3 py-2 ${fieldErrors.name ? 'border-red-500' : 'border-slate-300'}`}
        />
        {#if fieldErrors.name}
            <span class="text-sm text-red-600">{fieldErrors.name}</span>
        {/if}
    </label>

    <label class="flex flex-col gap-1">
        <span class="text-sm font-medium text-slate-700">Email</span>
        <input
            type="email"
            name="email"
            placeholder="Email"
            required
            class={`rounded border px-3 py-2 ${fieldErrors.email ? 'border-red-500' : 'border-slate-300'}`}
        />
        {#if fieldErrors.email}
            <span class="text-sm text-red-600">{fieldErrors.email}</span>
        {/if}
    </label>

    <label class="flex flex-col gap-1">
        <span class="text-sm font-medium text-slate-700">Password</span>
        <input
            type="password"
            name="password"
            placeholder="Password"
            required
            class={`rounded border px-3 py-2 ${fieldErrors.password ? 'border-red-500' : 'border-slate-300'}`}
        />
        {#if fieldErrors.password}
            <span class="text-sm text-red-600">{fieldErrors.password}</span>
        {/if}
    </label>

    <button type="submit" class="bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">
        Login
    </button>
    <button
        formaction="?/register"
        type="submit"
        class="bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700"
    >
        Register
    </button>
</form>

<div class="mx-auto mt-4 max-w-md space-y-2">
    {#if form?.message}
        <p class={`min-h-6 text-center text-sm ${hasFieldErrors ? 'text-red-600' : 'text-emerald-700'}`}>
            {form.message}
        </p>
    {/if}
</div>