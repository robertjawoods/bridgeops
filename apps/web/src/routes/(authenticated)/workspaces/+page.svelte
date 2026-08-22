<script lang="ts">
import { getWorkspaces } from "./data.remote";
</script>

<h2>Workspaces</h2>

<ul>
	{#each await getWorkspaces() as { id, name, slug }}
		<li><a href="/workspace/{slug}">{name}</a></li>
	{:else}
		<li>No workspaces found.</li>
	{/each}
</ul>
