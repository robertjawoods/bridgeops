<script lang="ts">
	import { createWorkspace } from "./data.remote";
</script>

<form {...createWorkspace} class="flex max-w-md flex-col gap-4">
	<label for="name">
		<h3>Workspace Name</h3>
		<input {...createWorkspace.fields.name.as("text")} />
	</label>

	<label for="slug">
		<h3>Workspace Slug</h3>
		<input {...createWorkspace.fields.slug.as("text")} />
	</label>

	<button type="submit">Create Workspace</button>
</form>
