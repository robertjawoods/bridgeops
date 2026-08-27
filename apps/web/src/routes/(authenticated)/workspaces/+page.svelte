<script lang="ts">
	import { getWorkspaces } from "./data.remote";
</script>

<div class="mb-4 flex items-center justify-between">
	<h2>Workspaces</h2>
	<a href="/workspaces/create">Create Workspace</a>
</div>

<ul>
	{#each await getWorkspaces() as { id, name, slug } (id)}
		<li><a href="/workspaces/{slug}">{name}</a></li>
	{:else}
		<li>No workspaces found.</li>
	{/each}
</ul>
