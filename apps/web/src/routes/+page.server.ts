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
        const { name, email, password } = await getLoginFormData(event);
        console.log(`Login attempt for user: ${name}, email: ${email}`);

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
    },
    register: async (event) => {
        const { name, email, password } = await getLoginFormData(event);
        console.log(`Register attempt for user: ${name}, email: ${email}`);

        const fieldErrors: Record<string, string> = {};

        if (!name) {
            fieldErrors.name = 'Name is required';
        }

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
            await auth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name,
                    callbackURL: '/'
                }
            });
        } catch (error) {
            return fail(400, {
                message: error instanceof Error ? error.message : 'Registration failed',
                fieldErrors: {}
            });
        }

        return {
            message: 'User registered successfully'
        };
    }
} satisfies Actions;