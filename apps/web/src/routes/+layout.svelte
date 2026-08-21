<script lang="ts">
import "./layout.css";

import Navbar from "../components/navbar.svelte";

let { children, data } = $props();
</script>

<svelte:head>
	<title>BridgeOps</title>
</svelte:head>
<Navbar session={data.session} user={data.user} />
<main class="mx-auto w-full max-w-[1200px] px-4 pt-10 pb-20 sm:px-6 lg:px-8">
	{@render children()}
</main>
