<script lang="ts">
import type { PageProps } from "./$types";

import { getWorkspace } from "./data.remote";

let { params }: PageProps = $props();

const workspace = $derived(await getWorkspace(params.slug));
</script>

{#if workspace}
	<h2>{workspace.name}</h2>
	<p>Slug: {workspace.slug}</p>
	<p>Plan: {workspace.plan}</p>
	<p>Created At: {workspace.createdAt}</p>
	<p>Updated At: {workspace.updatedAt}</p>
	{#if workspace.deletedAt}
		<p>Deleted At: {workspace.deletedAt}</p>
	{/if}
{:else}
	<p>Loading workspace...</p>
{/if}
