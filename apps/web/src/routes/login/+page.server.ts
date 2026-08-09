import { fail } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import type { Actions } from './$types';

const getLoginFormData = async (event: any) => {
    const formData = await event.request.formData();
    const name = formData.get('name')?.toString().trim() ?? '';
    const email = formData.get('email')?.toString().trim() ?? '';
    const password = formData.get('password')?.toString() ?? '';

    return { name, email, password };
}

export const actions = {
    login: async (event) => {
        const { email, password } = await getLoginFormData(event);
        console.log(`Login attempt for email: ${email}`);

        const fieldErrors: Record<string, string> = {};

        if (!email) {
            fieldErrors.email = 'Email is required';
        }

        if (!password) {
            fieldErrors.password = 'Password is required';
        }

        if (Object.keys(fieldErrors).length > 0) {
            return fail(400, {
                message: 'Please fix the highlighted fields',
                fieldErrors
            });
        }

        try {
            const response = await auth.api.signInEmail({
                body: {
                    email,
                    password,
                    callbackURL: '/'
                }
            });

            console.log('Login response:', response);
        } catch (error) {
            return fail(400, {
                message: error instanceof Error ? error.message : 'Login failed',
                fieldErrors: {}
            });
        }
        return {
            message: 'User logged in successfully'
        };
    }
} satisfies Actions;