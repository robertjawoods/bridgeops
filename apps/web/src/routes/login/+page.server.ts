import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ url }) => {
	return {
		redirectTo: url.searchParams.get("redirectTo") ?? "/",
	};
};
