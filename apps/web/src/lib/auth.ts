import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { prisma } from '@bridgeops/database';
import { dash } from "@better-auth/infra";

import { Resend } from 'resend';

const resend = new Resend(env.RESEND_KEY);

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	emailAndPassword: { enabled: true },
	emailVerification: {
		sendVerificationEmail: async ({ user, url, token }, request) => {
			resend.emails.send({
				from: 'onboarding@resend.dev',
				to: user.email,
				subject: 'Hello World',
				html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
			});
		}
	},

	trustedOrigins: ['http://localhost:5173', 'https://zeke-monohydroxy-unscrupulously.ngrok-free.dev'],
	plugins: [
		dash({
			apiKey: env.BETTER_AUTH_API_KEY,
		}),
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
