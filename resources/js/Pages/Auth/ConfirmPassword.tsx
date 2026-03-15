import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import {
    Field,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10 relative">
            <Head title="Confirm Password" />

            <div className="w-full max-w-sm md:max-w-3xl flex flex-col gap-6">
                <Card className="overflow-hidden p-0 shadow-lg">
                    <CardContent className="grid p-0 md:grid-cols-2">
                        <form className="p-6 md:p-8" onSubmit={submit}>
                            <FieldGroup>
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <h1 className="text-2xl font-bold">Confirm Password</h1>
                                    <p className="text-balance text-muted-foreground text-sm">
                                        This is a secure area of the application. Please confirm your
                                        password before continuing.
                                    </p>
                                </div>

                                <Field>
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        disabled={processing}
                                        isFocused={true}
                                    />
                                    <InputError message={errors.password} className="mt-2 text-center" />
                                </Field>

                                <Field>
                                    <Button type="submit" disabled={processing} className="w-full">
                                        {processing ? 'Confirming...' : 'Confirm'}
                                    </Button>
                                </Field>
                            </FieldGroup>
                        </form>

                        <div className="relative hidden bg-muted md:block bg-black">
                            <img
                                src="/images/ConfirmPassword.png"
                                alt="Confirm Password background"
                                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="px-6 text-center text-sm text-balance text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
                    By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
                    and <a href="#">Privacy Policy</a>.
                </div>
            </div>
        </div>
    );
}
