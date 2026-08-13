import { betterAuth } from 'better-auth/minimal';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { prisma } from '@bridgeops/database';
import { dash } from "@better-auth/infra";
import { magicLink } from "better-auth/plugins";

import { Resend } from 'resend';
import { ENV } from 'varlock/env';

const resend = new Resend(ENV.RESEND_KEY);
const normalizedOrigin = ENV.ORIGIN?.replace(/\/+$/, '');
const email = ENV.EMAIL_ADDRESS

export const auth = betterAuth({
	baseURL: {
		allowedHosts: ['localhost:5173', 'zeke-monohydroxy-unscrupulously.ngrok-free.dev'],
		fallback: normalizedOrigin,
		protocol: 'auto'
	},
	secret: ENV.BETTER_AUTH_SECRET,
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	emailAndPassword: {
		enabled: true, 
		sendResetPassword: async ({user, url}, request) => {
			resend.emails.send({
				from: email,
				to: user.email, 
				subject: 'BridgeOps - Reset Password',
				html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`
			})
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		sendVerificationEmail: async ({ user, url, token }, request) => {
			console.log('Sending verification email to:', user.email);

			const send = async () => {
				await resend.emails.send({
					from: email,
					to: user.email,
					subject: 'BridgeOps - Verify your email',
					html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`
				});
			}

			send();
		}
	},
	socialProviders: {
		github: {
			clientId: ENV.GITHUB_CLIENT_ID ?? '',
			clientSecret: ENV.GITHUB_CLIENT_SECRET ?? '',
		},
		google: {
			clientId: ENV.GOOGLE_CLIENT_ID ?? '',
			clientSecret: ENV.GOOGLE_CLIENT_SECRET ?? ''
		},
	},
	trustedOrigins: ['http://localhost:5173', 'https://zeke-monohydroxy-unscrupulously.ngrok-free.dev'],
	plugins: [
		dash({
			apiKey: ENV.BETTER_AUTH_API_KEY,
		}),
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				const send = async () => {
					await resend.emails.send({
						from: 'bridgeops@resend.dev',
						to: email,
						subject: 'BridgeOps - Magic Link',
						html: `<p>Click <a href="${url}">here</a> to sign in</p>`
					});
				}

				send();
			}
		}),
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
