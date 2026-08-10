<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '../components/navbar.svelte';

	let { children, data } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Navbar session={data.session} user={data.user} />
<main class="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-10 sm:px-6 lg:px-8">{@render children()}</main>
