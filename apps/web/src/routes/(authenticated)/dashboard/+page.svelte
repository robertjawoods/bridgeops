<script lang="ts">
	import { authClient } from '$lib/authClient';
	import { getWorkspaces } from './data.remote';

	const { data, error } = await authClient.token();

    console.log('data', data);
    console.log('error', error);

	if (data) {
		const workspaces = getWorkspaces(data.token);
	}
</script>

<h2>Dashboard</h2>
