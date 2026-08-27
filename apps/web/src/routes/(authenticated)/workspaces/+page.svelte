<script lang="ts">
	import { resolve } from "$app/paths";

	import { getWorkspaces } from "./data.remote";
</script>

<div class="mb-4 flex items-center justify-between">
	<h2>Workspaces</h2>
	<a href={resolve("/(authenticated)/workspaces/create")}>Create Workspace</a>
</div>

<ul>
	{#each await getWorkspaces() as { id, name, slug } (id)}
		<li>
			<a href={resolve("/(authenticated)/workspaces/[slug]", { slug })}
				>{name}</a
			>
		</li>
	{:else}
		<li>No workspaces found.</li>
	{/each}
</ul>
