<script lang="ts">
import { getWorkspaces } from "./data.remote";
</script>

<div class="flex justify-between items-center mb-4">
	<h2>Workspaces</h2>
	<a href="/workspace/create">Create Workspace</a>
</div>

<ul>
	{#each await getWorkspaces() as { id, name, slug }}
		<li><a href="/workspace/{slug}">{name}</a></li>
	{:else}
		<li>No workspaces found.</li>
	{/each}
</ul>
